import type { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { NuevaVentaFormData } from "@/lib/nueva-venta-types";
import { calculateCartTotals, resolveVentaLineItems } from "@/lib/nueva-venta-types";
import { empresaEmisor } from "@/lib/nueva-venta-mock-data";
import type { EmpresaConfig, EmpresaEmisor } from "@/lib/parametros/empresa-service";
import {
  DEFAULT_COMPROBANTE_GIRO,
  DEFAULT_CUENTAS_BANCARIAS,
  DEFAULT_PROVEEDOR_FACTURACION,
  DEFAULT_RESOLUCION_SUNAT,
  type ComprobantePdfEmisor,
  type CuentaBancariaPdf,
} from "@/lib/pdf/comprobante-emisor";
import { createPdfDocument, downloadPdf } from "@/lib/pdf/pdf-utils";
import {
  currencySymbol,
  monedaLabelDisplay,
  numeroALetras,
} from "@/lib/pdf/numero-a-letras";

export type { ComprobantePdfEmisor, CuentaBancariaPdf } from "@/lib/pdf/comprobante-emisor";

/** Layout calibrado al comprobante HAITECH / RAPIFAC (A4). */
const PAGE_W = 210;
const MARGIN = 12;
const CONTENT_W = PAGE_W - MARGIN * 2;
const INK = { r: 0, g: 0, b: 0 };
const HEADER_BG = { r: 52, g: 52, b: 52 };

export type ComprobantePdfItem = {
  cantidad: number;
  unidad: string;
  descripcion: string;
  precio: number;
  importe: number;
};

export type ComprobantePdfInput = {
  titulo: string;
  numero: string;
  fecha: string;
  cliente: string;
  clienteRuc: string;
  direccion: string;
  formaPago: string;
  vendedor: string;
  medioPago: string;
  moneda: "PEN" | "USD" | string;
  items: ComprobantePdfItem[];
  subtotal: number;
  igv: number;
  total: number;
  observaciones?: string;
  emisor: ComprobantePdfEmisor;
};

function money(amount: number, moneda: string, withSymbol = false): string {
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!withSymbol) return formatted;
  return `${currencySymbol(moneda)} ${formatted}`;
}

function normalizeUnidad(unidad: string): string {
  const u = unidad.trim().toUpperCase();
  if (!u || u === "UND" || u === "UN" || u === "UNI") return "UNIDAD";
  return u;
}

function getComprobanteTitle(tipo: string): string {
  const value = tipo.toLowerCase();
  if (value.includes("boleta")) return "BOLETA DE VENTA\nELECTRÓNICA";
  if (value.includes("nota de venta") || value.includes("nota_venta")) return "NOTA DE VENTA";
  if (value.includes("nota de crédito") || value.includes("nota_credito") || value.includes("crédito")) {
    return "NOTA DE CRÉDITO\nELECTRÓNICA";
  }
  if (value.includes("guía") || value.includes("guia")) return "GUÍA DE REMISIÓN";
  if (value.includes("cotiz") || value.includes("proforma")) return "COTIZACIÓN";
  return "FACTURA ELECTRÓNICA";
}

function buildComprobanteNumber(serie: string): string {
  const cleaned = serie.trim() || "F001";
  if (cleaned.includes("-") && /\d{2,}$/.test(cleaned)) return cleaned;
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${cleaned}-${seq}`;
}

function resolveMedioPago(formaPago: string, moneda: string, total: number): string {
  const forma = formaPago.trim().toLowerCase();
  const symbol = currencySymbol(moneda);
  const amount = money(total, moneda);
  if (!forma || forma.includes("contado") || forma.includes("efectivo")) {
    return `EFECTIVO ${symbol} ${amount}`;
  }
  if (forma.includes("transfer")) return `TRANSFERENCIA ${symbol} ${amount}`;
  if (forma.includes("yape") || forma.includes("plin")) return `${formaPago.toUpperCase()} ${symbol} ${amount}`;
  return `${formaPago.toUpperCase()} ${symbol} ${amount}`;
}

async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

async function tryLoadImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function ink(doc: jsPDF) {
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setDrawColor(INK.r, INK.g, INK.b);
}

/** Logo cuadrado negro estilo HAITECH. */
function drawBrandLogo(doc: jsPDF, x: number, y: number, size: number, brand: string) {
  doc.setFillColor(0, 0, 0);
  doc.rect(x, y, size, size, "F");

  // Marco interior sutil
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.rect(x + 1.2, y + 1.2, size - 2.4, size - 2.4);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  const label = brand.slice(0, 10).toUpperCase() || "HAITECH";
  doc.setFontSize(label.length > 8 ? 7 : 8.5);
  doc.text(label, x + size / 2, y + size / 2 - 1.2, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.4);
  const sub = doc.splitTextToSize("Distribuidor Autorizado RICOH", size - 4) as string[];
  doc.text(sub, x + size / 2, y + size / 2 + 3.8, { align: "center" });
  ink(doc);
}

async function drawHeader(doc: jsPDF, input: ComprobantePdfInput): Promise<number> {
  const logoSize = 32;
  const logoX = MARGIN;
  const logoY = 8;
  const boxW = 52;
  const boxH = 32;
  const boxX = PAGE_W - MARGIN - boxW;
  const centerX = logoX + logoSize + 3;
  const centerW = boxX - centerX - 3;
  const brand =
    input.emisor.nombreComercial?.trim() ||
    input.emisor.razonSocial.split(/\s+/)[0] ||
    "HAITECH";

  const logoUrl = input.emisor.logoUrl?.trim();
  let drewLogo = false;
  if (logoUrl) {
    const dataUrl = await tryLoadImageDataUrl(logoUrl);
    if (dataUrl) {
      try {
        const format = dataUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(dataUrl, format, logoX, logoY, logoSize, logoSize);
        drewLogo = true;
      } catch {
        drewLogo = false;
      }
    }
  }
  if (!drewLogo) drawBrandLogo(doc, logoX, logoY, logoSize, brand);

  const giro = input.emisor.giro?.trim() || DEFAULT_COMPROBANTE_GIRO;
  const web = input.emisor.web?.trim() || "https://haitech.pe/";
  const phonesRaw = input.emisor.telefono?.trim() || "Ventas: 915149290 / Soporte: 965805873 / Ventas 2: 926224243";
  const phones = /ventas\s*:/i.test(phonesRaw) ? phonesRaw : `Ventas: ${phonesRaw}`;

  let cy = logoY + 2.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  ink(doc);
  doc.text(brand.toUpperCase(), centerX + centerW / 2, cy, { align: "center" });
  cy += 5.2;

  doc.setFontSize(8.5);
  doc.text((input.emisor.razonSocial || "NBN TECNOLOGIA TOTAL S.A.C.").toUpperCase(), centerX + centerW / 2, cy, {
    align: "center",
  });
  cy += 3.8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.1);
  const giroLines = doc.splitTextToSize(giro, centerW - 2) as string[];
  doc.text(giroLines.slice(0, 2), centerX + centerW / 2, cy, { align: "center" });
  cy += Math.min(2, giroLines.length) * 2.9 + 0.6;

  doc.setFontSize(6.4);
  doc.text(phones, centerX + centerW / 2, cy, { align: "center" });
  cy += 3.1;

  // URL en negro (como la imagen impresa; sin azul)
  doc.setFontSize(6.4);
  doc.text(web, centerX + centerW / 2, cy, { align: "center" });
  cy += 3.1;

  doc.setFontSize(6.2);
  doc.text(input.emisor.direccion || "Av. Petit Thouars Nro - LINCE - LIMA - LIMA", centerX + centerW / 2, cy, {
    align: "center",
  });

  // Caja RUC / tipo / serie (borde grueso)
  doc.setLineWidth(0.9);
  ink(doc);
  doc.rect(boxX, logoY, boxW, boxH);
  doc.setLineWidth(0.25);
  doc.rect(boxX + 1.1, logoY + 1.1, boxW - 2.2, boxH - 2.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(`RUC: ${input.emisor.ruc || "20612146561"}`, boxX + boxW / 2, logoY + 8, {
    align: "center",
  });

  const titleLines = input.titulo.split("\n");
  doc.setFontSize(titleLines.length > 1 ? 8.2 : 9.2);
  const titleY = logoY + (titleLines.length > 1 ? 15.2 : 17);
  titleLines.forEach((line, i) => {
    doc.text(line, boxX + boxW / 2, titleY + i * 3.8, { align: "center" });
  });

  doc.setFontSize(12);
  doc.text(input.numero, boxX + boxW / 2, logoY + boxH - 5.5, { align: "center" });

  return Math.max(logoY + logoSize, logoY + boxH) + 7;
}

function drawLabeledRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelW: number,
  valueMaxW: number,
  lineH = 3.7,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  ink(doc);
  doc.text(`${label}:`, x, y);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(value || "—", valueMaxW) as string[];
  doc.text(lines, x + labelW, y);
  return y + Math.max(1, lines.length) * lineH;
}

function drawClientBlock(doc: jsPDF, y: number, input: ComprobantePdfInput): number {
  const leftX = MARGIN;
  const rightX = 132;
  let leftY = y;
  let rightY = y;

  leftY = drawLabeledRow(doc, "CLIENTE", input.cliente.toUpperCase(), leftX, leftY, 22, 92);
  leftY = drawLabeledRow(doc, "DIRECCIÓN", input.direccion.toUpperCase(), leftX, leftY, 24, 90);
  leftY = drawLabeledRow(doc, "FORMA PAGO", input.formaPago.toUpperCase(), leftX, leftY, 26, 88);
  leftY = drawLabeledRow(doc, "VENDEDOR", input.vendedor.toUpperCase(), leftX, leftY, 24, 90);
  leftY = drawLabeledRow(doc, "MEDIO DE PAGO", input.medioPago.toUpperCase(), leftX, leftY, 30, 84);

  rightY = drawLabeledRow(doc, "RUC", input.clienteRuc, rightX, rightY, 12, 50);
  rightY = drawLabeledRow(doc, "FECHA", input.fecha, rightX, rightY, 16, 46);
  rightY = drawLabeledRow(doc, "MONEDA", monedaLabelDisplay(input.moneda), rightX, rightY, 18, 44);

  return Math.max(leftY, rightY) + 3.5;
}

function drawItemsTable(
  doc: jsPDF,
  startY: number,
  items: ComprobantePdfItem[],
  moneda: string,
): number {
  // Anchos columna (mm) calibrados a la imagen
  const x0 = MARGIN;
  const wCant = 14;
  const wUm = 20;
  const wPu = 24;
  const wImp = 28;
  const wDesc = CONTENT_W - wCant - wUm - wPu - wImp;
  const xUm = x0 + wCant;
  const xDesc = xUm + wUm;
  const xPu = xDesc + wDesc;
  const xImp = xPu + wPu;
  const headerH = 6.2;
  const minBodyH = 48;

  doc.setFillColor(HEADER_BG.r, HEADER_BG.g, HEADER_BG.b);
  doc.rect(x0, startY, CONTENT_W, headerH, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.text("CANT.", x0 + wCant / 2, startY + 4.2, { align: "center" });
  doc.text("U.M.", xUm + 1.5, startY + 4.2);
  doc.text("DESCRIPCIÓN", xDesc + 1.5, startY + 4.2);
  doc.text("P.U.", xPu + wPu - 1.5, startY + 4.2, { align: "right" });
  doc.text("IMPORTE", xImp + wImp - 1.5, startY + 4.2, { align: "right" });

  let y = startY + headerH;
  const bodyStart = y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  ink(doc);

  for (const item of items) {
    const descLines = doc.splitTextToSize(item.descripcion || "—", wDesc - 3) as string[];
    const rowH = Math.max(7, descLines.length * 3.35 + 2.8);
    doc.text(String(item.cantidad), x0 + wCant / 2, y + 4.2, { align: "center" });
    doc.text(normalizeUnidad(item.unidad), xUm + 1.5, y + 4.2);
    doc.text(descLines, xDesc + 1.5, y + 4.2);
    doc.text(money(item.precio, moneda), xPu + wPu - 1.5, y + 4.2, { align: "right" });
    doc.text(money(item.importe, moneda), xImp + wImp - 1.5, y + 4.2, { align: "right" });
    y += rowH;
  }

  const bodyH = Math.max(minBodyH, y - bodyStart);
  const bottom = bodyStart + bodyH;

  doc.setLineWidth(0.45);
  ink(doc);
  doc.rect(x0, startY, CONTENT_W, headerH + bodyH);
  doc.line(xUm, startY, xUm, bottom);
  doc.line(xDesc, startY, xDesc, bottom);
  doc.line(xPu, startY, xPu, bottom);
  doc.line(xImp, startY, xImp, bottom);
  doc.line(x0, startY + headerH, x0 + CONTENT_W, startY + headerH);

  return bottom + 3.5;
}

function drawSonAndTotals(doc: jsPDF, y: number, input: ComprobantePdfInput): number {
  const son = `SON: ${numeroALetras(input.total, input.moneda)}`;
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(7.4);
  ink(doc);
  const sonLines = doc.splitTextToSize(son, 112) as string[];
  doc.text(sonLines, MARGIN, y + 3.2);

  const boxX = 136;
  const boxW = PAGE_W - MARGIN - boxX;
  const rows: Array<[string, string]> = [
    ["OP. GRAVADA", money(input.subtotal, input.moneda)],
    ["I.G.V", money(input.igv, input.moneda)],
    ["IMPORTE TOTAL", money(input.total, input.moneda, true)],
  ];
  const rowH = 5.6;
  const boxH = rows.length * rowH;

  doc.setLineWidth(0.4);
  doc.rect(boxX, y, boxW, boxH);
  const midX = boxX + boxW * 0.52;
  doc.line(midX, y, midX, y + boxH);

  rows.forEach(([label, value], index) => {
    const rowY = y + index * rowH;
    if (index > 0) doc.line(boxX, rowY, boxX + boxW, rowY);
    const isTotal = index === rows.length - 1;
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(7.3);
    doc.text(label, boxX + 2, rowY + 3.9);
    doc.setFont("helvetica", "bold");
    doc.text(value, boxX + boxW - 2, rowY + 3.9, { align: "right" });
  });

  return y + Math.max(sonLines.length * 3.8 + 2, boxH) + 4;
}

async function drawObservacionesQr(
  doc: jsPDF,
  y: number,
  input: ComprobantePdfInput,
): Promise<number> {
  const boxH = 36;
  const qrSize = 30;
  const qrPad = 2.5;
  const textW = CONTENT_W - qrSize - qrPad * 3 - 2;

  doc.setLineWidth(0.45);
  ink(doc);
  doc.rect(MARGIN, y, CONTENT_W, boxH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("OBSERVACIONES:", MARGIN + 2.5, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  let ty = y + 9;
  const obs = input.observaciones?.trim();
  if (obs) {
    const obsLines = doc.splitTextToSize(obs, textW) as string[];
    doc.text(obsLines.slice(0, 2), MARGIN + 2.5, ty);
    ty += obsLines.slice(0, 2).length * 3 + 1.2;
  }

  const resolucion = input.emisor.resolucionSunat || DEFAULT_RESOLUCION_SUNAT;
  const proveedor = input.emisor.proveedorFacturacion || DEFAULT_PROVEEDOR_FACTURACION;
  const tituloPlain = input.titulo.replace(/\n/g, " ");
  const legal =
    `Representación impresa de la ${tituloPlain}. ` +
    `Autorizado mediante Resolución de Intendencia N° ${resolucion}. ` +
    `Emitido a través de ${proveedor} Proveedor Autorizado por SUNAT, ` +
    `descarga el documento en WWW.RAPIFAC.COM`;
  const legalLines = doc.splitTextToSize(legal, textW) as string[];
  doc.text(legalLines.slice(0, 6), MARGIN + 2.5, ty);

  const qrPayload = [
    input.emisor.ruc,
    input.numero,
    input.fecha,
    input.total.toFixed(2),
    input.clienteRuc,
  ].join("|");
  const qrDataUrl = await generateQrDataUrl(qrPayload);
  const qrX = PAGE_W - MARGIN - qrSize - qrPad;
  const qrY = y + (boxH - qrSize) / 2;
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  doc.setLineWidth(0.3);
  doc.rect(qrX - 0.4, qrY - 0.4, qrSize + 0.8, qrSize + 0.8);

  return y + boxH + 4;
}

function drawCuentasBancarias(doc: jsPDF, y: number, cuentas: CuentaBancariaPdf[]): number {
  const rows = cuentas.length > 0 ? cuentas : DEFAULT_CUENTAS_BANCARIAS;
  const titleH = 6.2;
  const colH = 5;
  const rowH = 4.8;
  const tableH = titleH + colH + rows.length * rowH;

  // Título oscuro a todo el ancho
  doc.setFillColor(HEADER_BG.r, HEADER_BG.g, HEADER_BG.b);
  doc.rect(MARGIN, y, CONTENT_W, titleH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CUENTAS BANCARIAS", MARGIN + CONTENT_W / 2, y + 4.3, { align: "center" });

  const colBanco = MARGIN + 2;
  const colMoneda = MARGIN + 28;
  const colCuenta = MARGIN + 55;
  const colCci = MARGIN + 115;

  // Encabezados de columna (primera fila blanca)
  let rowY = y + titleH;
  ink(doc);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.6);
  doc.text("BANCO", colBanco, rowY + 3.5);
  doc.text("MONEDA", colMoneda, rowY + 3.5);
  doc.text("NRO. CUENTA", colCuenta, rowY + 3.5);
  doc.text("NRO. CUENTA CCI", colCci, rowY + 3.5);
  rowY += colH;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  for (const cuenta of rows) {
    doc.text(cuenta.banco, colBanco, rowY + 3.4);
    doc.text(cuenta.moneda, colMoneda, rowY + 3.4);
    doc.text(cuenta.cuenta, colCuenta, rowY + 3.4);
    doc.text(cuenta.cci, colCci, rowY + 3.4);
    rowY += rowH;
  }

  doc.setLineWidth(0.4);
  doc.rect(MARGIN, y, CONTENT_W, tableH);
  doc.line(MARGIN, y + titleH, MARGIN + CONTENT_W, y + titleH);
  doc.line(MARGIN, y + titleH + colH, MARGIN + CONTENT_W, y + titleH + colH);
  // Separadores verticales
  const v1 = MARGIN + 26;
  const v2 = MARGIN + 53;
  const v3 = MARGIN + 113;
  doc.line(v1, y + titleH, v1, y + tableH);
  doc.line(v2, y + titleH, v2, y + tableH);
  doc.line(v3, y + titleH, v3, y + tableH);

  return y + tableH + 5;
}

export async function renderComprobantePdf(input: ComprobantePdfInput): Promise<jsPDF> {
  const doc = await createPdfDocument();
  let y = await drawHeader(doc, input);
  y = drawClientBlock(doc, y, input);
  y = drawItemsTable(doc, y, input.items, input.moneda);
  y = drawSonAndTotals(doc, y, input);
  y = await drawObservacionesQr(doc, y, input);
  y = drawCuentasBancarias(doc, y, input.emisor.cuentasBancarias ?? DEFAULT_CUENTAS_BANCARIAS);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  ink(doc);
  doc.text("GRACIAS POR SU PREFERENCIA...", MARGIN, Math.min(y + 1, 288));

  return doc;
}

export function toComprobantePdfEmisor(
  emisor: EmpresaEmisor | ComprobantePdfEmisor | EmpresaConfig,
): ComprobantePdfEmisor {
  const anyEmisor = emisor as ComprobantePdfEmisor &
    EmpresaEmisor &
    Partial<EmpresaConfig> & {
      web?: string;
      giro?: string;
      resolucionSunat?: string;
      proveedorFacturacion?: string;
      cuentasBancarias?: CuentaBancariaPdf[];
    };

  const telefono =
    typeof anyEmisor.telefonoPrefijo === "string"
      ? `${anyEmisor.telefonoPrefijo} ${anyEmisor.telefono ?? ""}`.trim()
      : anyEmisor.telefono;

  return {
    razonSocial: anyEmisor.razonSocial || "NBN TECNOLOGIA TOTAL S.A.C.",
    nombreComercial: anyEmisor.nombreComercial || "HAITECH",
    ruc: anyEmisor.ruc || "20612146561",
    direccion: anyEmisor.direccion || "Av. Petit Thouars Nro - LINCE - LIMA - LIMA",
    telefono:
      telefono || "Ventas: 915149290 / Soporte: 965805873 / Ventas 2: 926224243",
    email: anyEmisor.email || "—",
    web: anyEmisor.web || "https://haitech.pe/",
    giro: anyEmisor.giro || DEFAULT_COMPROBANTE_GIRO,
    logoUrl: anyEmisor.logoUrl,
    resolucionSunat: anyEmisor.resolucionSunat || DEFAULT_RESOLUCION_SUNAT,
    proveedorFacturacion: anyEmisor.proveedorFacturacion || DEFAULT_PROVEEDOR_FACTURACION,
    cuentasBancarias: anyEmisor.cuentasBancarias || DEFAULT_CUENTAS_BANCARIAS,
  };
}

export async function generateComprobantePdf(
  data: NuevaVentaFormData,
  emisor: EmpresaEmisor | ComprobantePdfEmisor = empresaEmisor,
): Promise<void> {
  const lineItems = resolveVentaLineItems(data);
  const { subtotal, igv, total } = calculateCartTotals(lineItems);
  const number = buildComprobanteNumber(data.serie);
  const titulo = getComprobanteTitle(data.tipoComprobante);
  const pdfEmisor = toComprobantePdfEmisor(emisor);

  const doc = await renderComprobantePdf({
    titulo,
    numero: number,
    fecha: data.fechaEmision,
    cliente: data.cliente,
    clienteRuc: data.clienteRuc,
    direccion: data.direccion || "—",
    formaPago: data.formaPago || "Contado",
    vendedor: data.vendedor || "—",
    medioPago: resolveMedioPago(data.formaPago || "Contado", data.moneda, total),
    moneda: data.moneda,
    items: lineItems.map((line) => {
      const parts = [line.producto];
      if (line.observaciones?.trim()) parts.push(line.observaciones.trim());
      return {
        cantidad: line.cantidad,
        unidad: line.unidad,
        descripcion: parts.join("\n"),
        precio: line.precioUnitario,
        importe: line.cantidad * line.precioUnitario,
      };
    }),
    subtotal,
    igv,
    total,
    observaciones: data.observacionGeneral,
    emisor: pdfEmisor,
  });

  downloadPdf(doc, `${number}.pdf`);
}
