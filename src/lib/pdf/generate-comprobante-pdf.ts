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

export type { ComprobantePdfEmisor, CuentaBancariaPdf } from "@/lib/pdf/comprobante-emisor";
import {
  createPdfDocument,
  downloadPdf,
} from "@/lib/pdf/pdf-utils";
import {
  currencySymbol,
  monedaLabelDisplay,
  numeroALetras,
} from "@/lib/pdf/numero-a-letras";

const PAGE_W = 210;
const MARGIN = 10;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BLACK = { r: 20, g: 20, b: 20 };
const GRAY = { r: 55, g: 55, b: 55 };

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
  if (value.includes("boleta")) return "BOLETA DE VENTA ELECTRÓNICA";
  if (value.includes("nota de venta") || value.includes("nota_venta")) return "NOTA DE VENTA";
  if (value.includes("nota de crédito") || value.includes("nota_credito") || value.includes("crédito")) {
    return "NOTA DE CRÉDITO ELECTRÓNICA";
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

async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 0,
    width: 280,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
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

function setBlack(doc: jsPDF) {
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.setDrawColor(BLACK.r, BLACK.g, BLACK.b);
}

function drawLogoFallback(doc: jsPDF, x: number, y: number, size: number, brand: string) {
  doc.setFillColor(0, 0, 0);
  doc.rect(x, y, size, size, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(brand.length > 8 ? 6.5 : 7.5);
  doc.text(brand.slice(0, 12).toUpperCase(), x + size / 2, y + size / 2 - 1.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.6);
  const lines = doc.splitTextToSize("Distribuidor Autorizado RICOH", size - 3) as string[];
  doc.text(lines, x + size / 2, y + size / 2 + 3.2, { align: "center" });
  setBlack(doc);
}

async function drawHeader(doc: jsPDF, input: ComprobantePdfInput): Promise<number> {
  const logoSize = 28;
  const logoX = MARGIN;
  const logoY = 8;
  const boxW = 48;
  const boxX = PAGE_W - MARGIN - boxW;
  const centerX = logoX + logoSize + 4;
  const centerW = boxX - centerX - 4;

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
  if (!drewLogo) {
    const brand =
      input.emisor.nombreComercial?.trim() ||
      input.emisor.razonSocial.split(/\s+/)[0] ||
      "HAITECH";
    drawLogoFallback(doc, logoX, logoY, logoSize, brand);
  }

  const comercial =
    input.emisor.nombreComercial?.trim() ||
    input.emisor.razonSocial.split(/\s+/)[0]?.toUpperCase() ||
    "EMPRESA";
  const giro = input.emisor.giro?.trim() || DEFAULT_COMPROBANTE_GIRO;
  const web = input.emisor.web?.trim() || "https://haitech.pe/";
  const phones = input.emisor.telefono?.trim() || "—";

  let cy = logoY + 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setBlack(doc);
  doc.text(comercial.toUpperCase(), centerX + centerW / 2, cy, { align: "center" });
  cy += 5;

  doc.setFontSize(8);
  doc.text(input.emisor.razonSocial.toUpperCase(), centerX + centerW / 2, cy, { align: "center" });
  cy += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  const giroLines = doc.splitTextToSize(giro, centerW) as string[];
  doc.text(giroLines.slice(0, 2), centerX + centerW / 2, cy, { align: "center" });
  cy += giroLines.slice(0, 2).length * 3 + 0.5;

  doc.setFontSize(6.5);
  doc.text(`Ventas: ${phones}`, centerX + centerW / 2, cy, { align: "center" });
  cy += 3.2;
  doc.setTextColor(0, 70, 160);
  doc.text(web, centerX + centerW / 2, cy, { align: "center" });
  cy += 3.2;
  setBlack(doc);
  doc.setFontSize(6.2);
  doc.text(input.emisor.direccion || "—", centerX + centerW / 2, cy, { align: "center" });

  const boxH = 28;
  doc.setLineWidth(0.6);
  doc.rect(boxX, logoY, boxW, boxH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`RUC: ${input.emisor.ruc || "—"}`, boxX + boxW / 2, logoY + 7, { align: "center" });
  doc.setFontSize(8.5);
  const titleLines = doc.splitTextToSize(input.titulo, boxW - 4) as string[];
  doc.text(titleLines, boxX + boxW / 2, logoY + 14, { align: "center" });
  doc.setFontSize(11);
  doc.text(input.numero, boxX + boxW / 2, logoY + boxH - 5, { align: "center" });

  return Math.max(logoY + logoSize, logoY + boxH) + 6;
}

function drawKeyValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelW: number,
  valueW: number,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setBlack(doc);
  doc.text(`${label}:`, x, y);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(value || "—", valueW) as string[];
  doc.text(lines, x + labelW, y);
  return y + Math.max(1, lines.length) * 3.6;
}

function drawClientBlock(doc: jsPDF, y: number, input: ComprobantePdfInput): number {
  const leftX = MARGIN;
  const rightX = 128;
  const labelW = 24;
  let leftY = y;
  let rightY = y;

  leftY = drawKeyValue(doc, "CLIENTE", input.cliente, leftX, leftY, labelW, 88);
  leftY = drawKeyValue(doc, "DIRECCIÓN", input.direccion, leftX, leftY, labelW, 88);
  leftY = drawKeyValue(doc, "FORMA PAGO", input.formaPago.toUpperCase(), leftX, leftY, labelW, 88);
  leftY = drawKeyValue(doc, "VENDEDOR", input.vendedor.toUpperCase(), leftX, leftY, labelW, 88);
  leftY = drawKeyValue(doc, "MEDIO DE PAGO", input.medioPago.toUpperCase(), leftX, leftY, 28, 84);

  rightY = drawKeyValue(doc, "RUC", input.clienteRuc, rightX, rightY, 16, 52);
  rightY = drawKeyValue(doc, "FECHA", input.fecha, rightX, rightY, 16, 52);
  rightY = drawKeyValue(doc, "MONEDA", monedaLabelDisplay(input.moneda), rightX, rightY, 18, 50);

  return Math.max(leftY, rightY) + 4;
}

function drawItemsTable(doc: jsPDF, startY: number, items: ComprobantePdfItem[]): number {
  const cols = {
    cant: MARGIN,
    um: MARGIN + 14,
    desc: MARGIN + 30,
    pu: MARGIN + 148,
    importe: MARGIN + CONTENT_W,
  };
  const headerH = 6.5;
  const descWidth = 110;

  doc.setFillColor(45, 45, 45);
  doc.rect(MARGIN, startY, CONTENT_W, headerH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CANT.", cols.cant + 1, startY + 4.4);
  doc.text("U.M.", cols.um + 1, startY + 4.4);
  doc.text("DESCRIPCIÓN", cols.desc + 1, startY + 4.4);
  doc.text("P.U.", cols.pu, startY + 4.4, { align: "right" });
  doc.text("IMPORTE", cols.importe - 1, startY + 4.4, { align: "right" });

  let y = startY + headerH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  setBlack(doc);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, startY, CONTENT_W, headerH);

  const minBody = 42;
  const bodyStart = y;

  for (const item of items) {
    const descLines = doc.splitTextToSize(item.descripcion || "—", descWidth) as string[];
    const rowH = Math.max(6.5, descLines.length * 3.4 + 2.5);

    if (y + rowH > 200) {
      // keep drawing; page overflow handled lightly by compressing
    }

    doc.text(String(item.cantidad), cols.cant + 6, y + 4, { align: "center" });
    doc.text(normalizeUnidad(item.unidad), cols.um + 1, y + 4);
    doc.text(descLines, cols.desc + 1, y + 4);
    doc.text(money(item.precio, "PEN"), cols.pu, y + 4, { align: "right" });
    doc.text(money(item.importe, "PEN"), cols.importe - 1, y + 4, { align: "right" });
    y += rowH;
  }

  const bodyH = Math.max(minBody, y - bodyStart);
  const tableBottom = bodyStart + bodyH;
  doc.rect(MARGIN, startY, CONTENT_W, headerH + bodyH);
  // column guides
  doc.line(cols.um, startY, cols.um, tableBottom);
  doc.line(cols.desc, startY, cols.desc, tableBottom);
  doc.line(cols.pu - 18, startY, cols.pu - 18, tableBottom);
  doc.line(cols.importe - 28, startY, cols.importe - 28, tableBottom);

  return tableBottom + 4;
}

function drawSonAndTotals(doc: jsPDF, y: number, input: ComprobantePdfInput): number {
  const son = `SON: ${numeroALetras(input.total, input.moneda)}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setBlack(doc);
  const sonLines = doc.splitTextToSize(son, 118) as string[];
  doc.text(sonLines, MARGIN, y + 3);

  const boxX = 138;
  const boxW = PAGE_W - MARGIN - boxX;
  const rows: Array<[string, string, boolean]> = [
    ["OP. GRAVADA", money(input.subtotal, input.moneda), false],
    ["I.G.V", money(input.igv, input.moneda), false],
    ["IMPORTE TOTAL", money(input.total, input.moneda, true), true],
  ];
  const rowH = 5.8;
  const boxH = rows.length * rowH;
  doc.setLineWidth(0.35);
  doc.rect(boxX, y, boxW, boxH);

  rows.forEach(([label, value, bold], index) => {
    const rowY = y + index * rowH;
    if (index > 0) doc.line(boxX, rowY, boxX + boxW, rowY);
    doc.line(boxX + boxW * 0.55, rowY, boxX + boxW * 0.55, rowY + rowH);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(7.2);
    doc.text(label, boxX + 2, rowY + 4);
    doc.setFont("helvetica", "bold");
    doc.text(value, boxX + boxW - 2, rowY + 4, { align: "right" });
  });

  return y + Math.max(sonLines.length * 4, boxH) + 5;
}

async function drawObservacionesQr(
  doc: jsPDF,
  y: number,
  input: ComprobantePdfInput,
): Promise<number> {
  const boxH = 34;
  const qrSize = 28;
  const qrPad = 3;
  const textW = CONTENT_W - qrSize - qrPad * 3;

  doc.setLineWidth(0.4);
  doc.rect(MARGIN, y, CONTENT_W, boxH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setBlack(doc);
  doc.text("OBSERVACIONES:", MARGIN + 2, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  let ty = y + 9;
  const obs = input.observaciones?.trim();
  if (obs) {
    const obsLines = doc.splitTextToSize(obs, textW) as string[];
    doc.text(obsLines.slice(0, 2), MARGIN + 2, ty);
    ty += obsLines.slice(0, 2).length * 3 + 1;
  }

  const resolucion = input.emisor.resolucionSunat || DEFAULT_RESOLUCION_SUNAT;
  const proveedor = input.emisor.proveedorFacturacion || DEFAULT_PROVEEDOR_FACTURACION;
  const legal =
    `Representación impresa de la ${input.titulo.replace(/\s+/g, " ")}. ` +
    `Autorizado mediante Resolución de Intendencia N° ${resolucion}. ` +
    `Emitido a través de ${proveedor} Proveedor Autorizado por SUNAT, ` +
    `descarga el documento en WWW.RAPIFAC.COM`;
  const legalLines = doc.splitTextToSize(legal, textW) as string[];
  doc.text(legalLines.slice(0, 5), MARGIN + 2, ty);

  const qrPayload =
    `https://www.rapifac.com/?ruc=${encodeURIComponent(input.emisor.ruc)}` +
    `&tipo=${encodeURIComponent(input.titulo)}` +
    `&serie=${encodeURIComponent(input.numero)}` +
    `&total=${input.total.toFixed(2)}`;
  const qrDataUrl = await generateQrDataUrl(qrPayload);
  doc.addImage(
    qrDataUrl,
    "PNG",
    PAGE_W - MARGIN - qrSize - qrPad,
    y + (boxH - qrSize) / 2,
    qrSize,
    qrSize,
  );

  return y + boxH + 4;
}

function drawCuentasBancariasFixed(
  doc: jsPDF,
  y: number,
  cuentas: CuentaBancariaPdf[],
): number {
  const headerH = 6;
  const colHeaderH = 5;
  const rowH = 5;
  const rows = cuentas.length > 0 ? cuentas : DEFAULT_CUENTAS_BANCARIAS;
  const tableH = headerH + colHeaderH + rows.length * rowH;

  doc.setFillColor(45, 45, 45);
  doc.rect(MARGIN, y, CONTENT_W, headerH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("CUENTAS BANCARIAS", MARGIN + CONTENT_W / 2, y + 4.2, { align: "center" });

  const col = {
    banco: MARGIN + 2,
    moneda: MARGIN + 30,
    cuenta: MARGIN + 58,
    cci: MARGIN + 118,
  };

  let rowY = y + headerH;
  doc.setFillColor(245, 245, 245);
  doc.rect(MARGIN, rowY, CONTENT_W, colHeaderH, "F");
  setBlack(doc);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("BANCO", col.banco, rowY + 3.5);
  doc.text("MONEDA", col.moneda, rowY + 3.5);
  doc.text("NRO. CUENTA", col.cuenta, rowY + 3.5);
  doc.text("NRO. CUENTA CCI", col.cci, rowY + 3.5);
  rowY += colHeaderH;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  for (const cuenta of rows) {
    doc.text(cuenta.banco, col.banco, rowY + 3.5);
    doc.text(cuenta.moneda, col.moneda, rowY + 3.5);
    doc.text(cuenta.cuenta, col.cuenta, rowY + 3.5);
    doc.text(cuenta.cci, col.cci, rowY + 3.5);
    rowY += rowH;
  }

  doc.setLineWidth(0.35);
  doc.rect(MARGIN, y, CONTENT_W, tableH);
  doc.line(MARGIN, y + headerH, MARGIN + CONTENT_W, y + headerH);
  doc.line(MARGIN, y + headerH + colHeaderH, MARGIN + CONTENT_W, y + headerH + colHeaderH);

  return y + tableH + 6;
}

export async function renderComprobantePdf(input: ComprobantePdfInput): Promise<jsPDF> {
  const doc = await createPdfDocument();
  let y = await drawHeader(doc, input);
  y = drawClientBlock(doc, y, input);
  y = drawItemsTable(doc, y, input.items);
  y = drawSonAndTotals(doc, y, input);
  y = await drawObservacionesQr(doc, y, input);
  y = drawCuentasBancariasFixed(doc, y, input.emisor.cuentasBancarias ?? DEFAULT_CUENTAS_BANCARIAS);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setBlack(doc);
  doc.text("GRACIAS POR SU PREFERENCIA...", MARGIN, Math.min(y + 2, 290));

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
    razonSocial: anyEmisor.razonSocial || "Mi Empresa",
    nombreComercial: anyEmisor.nombreComercial || undefined,
    ruc: anyEmisor.ruc || "—",
    direccion: anyEmisor.direccion || "—",
    telefono: telefono || "—",
    email: anyEmisor.email || "—",
    web: anyEmisor.web,
    giro: anyEmisor.giro,
    logoUrl: anyEmisor.logoUrl,
    resolucionSunat: anyEmisor.resolucionSunat,
    proveedorFacturacion: anyEmisor.proveedorFacturacion,
    cuentasBancarias: anyEmisor.cuentasBancarias,
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
  const symbol = currencySymbol(data.moneda);

  const doc = await renderComprobantePdf({
    titulo,
    numero: number,
    fecha: data.fechaEmision,
    cliente: data.cliente,
    clienteRuc: data.clienteRuc,
    direccion: data.direccion || "—",
    formaPago: data.formaPago || "Contado",
    vendedor: data.vendedor || "—",
    medioPago: `${data.formaPago || "Contado"} ${symbol} ${money(total, data.moneda)}`,
    moneda: data.moneda,
    items: lineItems.map((line) => ({
      cantidad: line.cantidad,
      unidad: line.unidad,
      descripcion: [line.producto, line.productoCodigo ? `(${line.productoCodigo})` : "", line.observaciones]
        .filter(Boolean)
        .join("\n"),
      precio: line.precioUnitario,
      importe: line.cantidad * line.precioUnitario,
    })),
    subtotal,
    igv,
    total,
    observaciones: data.observacionGeneral,
    emisor: pdfEmisor,
  });

  downloadPdf(doc, `${number}.pdf`);
}
