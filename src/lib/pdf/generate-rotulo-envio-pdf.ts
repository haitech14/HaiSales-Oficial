import type { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { EmpresaConfig, EmpresaEmisor } from "@/lib/parametros/empresa-service";
import { configToEmisor } from "@/lib/parametros/empresa-service";
import {
  buildRotuloPlainText,
  type RotuloEnvioData,
} from "@/lib/logistica/rotulo-utils";

export type RotuloPdfFormat = "a4" | "a5" | "ticket";

export type RotuloRemitente = EmpresaEmisor & {
  nombreComercial?: string;
  ciudad?: string;
  logoUrl?: string;
};

export type RotuloPdfInput = {
  data: RotuloEnvioData;
  remitente: RotuloRemitente;
  format?: RotuloPdfFormat;
};

type PageMetrics = {
  width: number;
  height: number;
  margin: number;
  titleSize: number;
  labelSize: number;
  bodySize: number;
  smallSize: number;
  destinatarioSize: number;
  ciudadSize: number;
  isTicket: boolean;
};

const TICKET_WIDTH_MM = 80;
const TICKET_PAGE_HEIGHT_MM = 320;

function getPageMetrics(format: RotuloPdfFormat): PageMetrics {
  if (format === "ticket") {
    return {
      width: TICKET_WIDTH_MM,
      height: TICKET_PAGE_HEIGHT_MM,
      margin: 3,
      titleSize: 8.5,
      labelSize: 5.5,
      bodySize: 6.5,
      smallSize: 5.5,
      destinatarioSize: 9.5,
      ciudadSize: 11,
      isTicket: true,
    };
  }
  if (format === "a5") {
    return {
      width: 210,
      height: 148,
      margin: 8,
      titleSize: 11,
      labelSize: 7,
      bodySize: 8.5,
      smallSize: 7,
      destinatarioSize: 13,
      ciudadSize: 15,
      isTicket: false,
    };
  }
  return {
    width: 297,
    height: 210,
    margin: 10,
    titleSize: 13,
    labelSize: 8,
    bodySize: 10,
    smallSize: 8.5,
    destinatarioSize: 18,
    ciudadSize: 22,
    isTicket: false,
  };
}

async function createRotuloDocument(format: RotuloPdfFormat): Promise<jsPDF> {
  const { jsPDF: JsPDF } = await import("jspdf");
  if (format === "ticket") {
    return new JsPDF({
      unit: "mm",
      format: [TICKET_WIDTH_MM, TICKET_PAGE_HEIGHT_MM],
      orientation: "portrait",
    });
  }
  return new JsPDF({
    unit: "mm",
    format,
    orientation: "landscape",
  });
}

function displayValue(value: string): string {
  return value && value !== "—" ? value : "—";
}

function isDataUrl(value: string): boolean {
  return value.startsWith("data:");
}

const LOGO_FALLBACKS = ["/logo.png", "/haisales-logo.png", "/haisaleslogo.png"];
const IMAGE_LOAD_TIMEOUT_MS = 4000;

async function loadImageDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (isDataUrl(src)) return src;

  const loadTask = async (): Promise<string | null> => {
    try {
      const response = await fetch(src);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  return Promise.race([
    loadTask(),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), IMAGE_LOAD_TIMEOUT_MS);
    }),
  ]);
}

async function resolveLogoDataUrl(remitente: RotuloRemitente): Promise<string | null> {
  const candidates = [remitente.logoUrl, ...LOGO_FALLBACKS].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const candidate of candidates) {
    const dataUrl = await loadImageDataUrl(candidate);
    if (dataUrl) return dataUrl;
  }

  return null;
}

function buildTrackingPayload(data: RotuloEnvioData): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://haisales.pe";
  return `${origin}/app/logistica?guia=${encodeURIComponent(data.codigoGuia)}`;
}

async function generateQrDataUrl(text: string, size = 220): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: size,
    errorCorrectionLevel: "M",
  });
}

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

async function drawHeaderBand(
  doc: jsPDF,
  data: RotuloEnvioData,
  remitente: RotuloRemitente,
  metrics: PageMetrics,
): Promise<number> {
  if (metrics.isTicket) {
    return drawTicketHeaderBand(doc, data, remitente, metrics);
  }

  const { width, margin } = metrics;
  const y = margin * 0.5;
  const bandHeight = metrics.width <= 150 ? 22 : metrics.width <= 220 ? 28 : 32;
  const sideWidth = metrics.width <= 150 ? 18 : 30;
  const centerX = margin + sideWidth + 2;
  const centerWidth = width - margin * 2 - sideWidth * 2 - 4;
  const qrX = width - margin - sideWidth;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, width - margin * 2, bandHeight, 2, 2, "FD");

  const logoDataUrl = await resolveLogoDataUrl(remitente);
  const logoSize = Math.min(sideWidth - 2, bandHeight - 4);
  if (logoDataUrl) {
    try {
      doc.addImage(
        logoDataUrl,
        "PNG",
        margin + (sideWidth - logoSize) / 2,
        y + (bandHeight - logoSize) / 2,
        logoSize,
        logoSize,
        undefined,
        "FAST",
      );
    } catch {
      // Sin logo si la imagen no es compatible.
    }
  }

  const remitenteNombre =
    remitente.nombreComercial?.trim() || remitente.razonSocial || "Mi Empresa";
  let textY = y + (metrics.width <= 150 ? 5 : 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(metrics.titleSize);
  doc.setTextColor(15, 23, 42);
  textY = drawWrappedText(doc, remitenteNombre, centerX, textY, centerWidth, metrics.titleSize * 0.42) + 0.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(metrics.smallSize);
  doc.setTextColor(51, 65, 85);
  const empresaLines = [
    `RUC ${displayValue(remitente.ruc)}`,
    displayValue(remitente.direccion),
    remitente.ciudad ? `${remitente.ciudad}` : "",
    `Tel: ${displayValue(remitente.telefono)}${remitente.email && remitente.email !== "—" ? `  |  ${remitente.email}` : ""}`,
    `Guía ${data.codigoGuia} · ${data.fecha}`,
  ].filter(Boolean);

  for (const line of empresaLines) {
    textY = drawWrappedText(doc, line, centerX, textY, centerWidth, metrics.smallSize * 0.42) + 0.3;
  }

  try {
    const qrDataUrl = await generateQrDataUrl(buildTrackingPayload(data));
    const qrSize = Math.min(sideWidth - 2, bandHeight - 8);
    doc.addImage(qrDataUrl, "PNG", qrX + (sideWidth - qrSize) / 2, y + 2, qrSize, qrSize);
    doc.setFontSize(metrics.labelSize - 1);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("Seguimiento", qrX + sideWidth / 2, y + bandHeight - 1.5, { align: "center" });
  } catch {
    doc.setFontSize(metrics.smallSize);
    doc.setTextColor(100, 116, 139);
    doc.text("QR", qrX + sideWidth / 2, y + bandHeight / 2, { align: "center" });
  }

  return y + bandHeight + margin * 0.35;
}

async function drawTicketHeaderBand(
  doc: jsPDF,
  data: RotuloEnvioData,
  remitente: RotuloRemitente,
  metrics: PageMetrics,
): Promise<number> {
  const { width, margin } = metrics;
  const contentWidth = width - margin * 2;
  let y = margin;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);

  const logoDataUrl = await resolveLogoDataUrl(remitente);
  const logoSize = 14;
  const headerStartY = y;

  if (logoDataUrl) {
    try {
      doc.addImage(
        logoDataUrl,
        "PNG",
        margin + (contentWidth - logoSize) / 2,
        y,
        logoSize,
        logoSize,
        undefined,
        "FAST",
      );
      y += logoSize + 2;
    } catch {
      // Sin logo si la imagen no es compatible.
    }
  }

  const remitenteNombre =
    remitente.nombreComercial?.trim() || remitente.razonSocial || "Mi Empresa";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(metrics.titleSize);
  doc.setTextColor(15, 23, 42);
  y = drawWrappedText(doc, remitenteNombre, margin, y, contentWidth, metrics.titleSize * 0.42) + 0.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(metrics.smallSize);
  doc.setTextColor(51, 65, 85);
  const empresaLines = [
    `RUC ${displayValue(remitente.ruc)}`,
    displayValue(remitente.direccion),
    remitente.ciudad ? `${remitente.ciudad}` : "",
    `Tel: ${displayValue(remitente.telefono)}`,
    `Guía ${data.codigoGuia} · ${data.fecha}`,
  ].filter(Boolean);

  for (const line of empresaLines) {
    y = drawWrappedText(doc, line, margin, y, contentWidth, metrics.smallSize * 0.42) + 0.3;
  }

  try {
    const qrDataUrl = await generateQrDataUrl(buildTrackingPayload(data), 160);
    const qrSize = 22;
    doc.addImage(qrDataUrl, "PNG", margin + (contentWidth - qrSize) / 2, y + 1, qrSize, qrSize);
    y += qrSize + 2;
    doc.setFontSize(metrics.labelSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("Seguimiento", margin + contentWidth / 2, y, { align: "center" });
    y += 2;
  } catch {
    y += 1;
  }

  const bandHeight = y - headerStartY + 2;
  doc.roundedRect(margin, headerStartY - 1, contentWidth, bandHeight, 1.5, 1.5, "S");

  return y + margin * 0.35;
}

function countWrappedLines(
  doc: jsPDF,
  text: string,
  maxWidth: number,
): number {
  return (doc.splitTextToSize(text, maxWidth) as string[]).length;
}

function drawDestinatarioSection(
  doc: jsPDF,
  data: RotuloEnvioData,
  x: number,
  y: number,
  width: number,
  metrics: PageMetrics,
): number {
  const padding = 3;
  const innerX = x + padding;
  const innerWidth = width - padding * 2;
  const addressLine = displayValue(data.direccion);
  const ciudadLine = displayValue(data.ciudad);

  const metaLines = metrics.isTicket
    ? [
        `RUC ${displayValue(data.ruc)}`,
        `Atención: ${displayValue(data.contacto)}`,
        `DNI: ${displayValue(data.dni)}`,
        `Tel: ${displayValue(data.telefono)}`,
      ]
    : [
        [
          `RUC ${displayValue(data.ruc)}`,
          `Atención: ${displayValue(data.contacto)}`,
          `DNI: ${displayValue(data.dni)}`,
          `Tel: ${displayValue(data.telefono)}`,
        ].join("   |   "),
      ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(metrics.destinatarioSize);
  const destinatarioLines = countWrappedLines(doc, displayValue(data.destinatario), innerWidth);
  doc.setFontSize(metrics.smallSize);
  const metaLineCount = metaLines.reduce(
    (sum, line) => sum + countWrappedLines(doc, line, innerWidth),
    0,
  );
  doc.setFontSize(metrics.bodySize);
  const addressLines = countWrappedLines(doc, addressLine, innerWidth);
  doc.setFontSize(metrics.ciudadSize);
  const ciudadLines = ciudadLine !== "—" ? countWrappedLines(doc, ciudadLine.toUpperCase(), innerWidth) : 0;

  const blockHeight =
    padding * 2 +
    metrics.labelSize * 0.9 +
    destinatarioLines * metrics.destinatarioSize * 0.45 +
    metaLineCount * metrics.smallSize * 0.45 +
    addressLines * metrics.bodySize * 0.45 +
    (ciudadLines > 0 ? ciudadLines * metrics.ciudadSize * 0.45 + 0.8 : 0) +
    2;

  let cursorY = y + padding + metrics.labelSize * 0.4;

  doc.setDrawColor(191, 219, 254);
  doc.setFillColor(239, 246, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, width, blockHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(metrics.labelSize);
  doc.setTextColor(37, 99, 235);
  doc.text("DESTINATARIO", innerX, cursorY);
  cursorY += metrics.labelSize * 0.9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(metrics.destinatarioSize);
  doc.setTextColor(15, 23, 42);
  cursorY =
    drawWrappedText(
      doc,
      displayValue(data.destinatario),
      innerX,
      cursorY,
      innerWidth,
      metrics.destinatarioSize * 0.45,
    ) + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(metrics.smallSize);
  doc.setTextColor(51, 65, 85);
  for (const line of metaLines) {
    cursorY = drawWrappedText(doc, line, innerX, cursorY, innerWidth, metrics.smallSize * 0.42) + 0.5;
  }
  cursorY += 0.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(metrics.bodySize);
  doc.setTextColor(30, 41, 59);
  cursorY = drawWrappedText(doc, addressLine, innerX, cursorY, innerWidth, metrics.bodySize * 0.42) + 0.8;

  if (ciudadLine !== "—") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(metrics.ciudadSize);
    doc.setTextColor(15, 23, 42);
    drawWrappedText(doc, ciudadLine.toUpperCase(), innerX, cursorY, innerWidth, metrics.ciudadSize * 0.45);
  }

  return y + blockHeight;
}

function drawShippingMeta(
  doc: jsPDF,
  data: RotuloEnvioData,
  x: number,
  y: number,
  width: number,
  metrics: PageMetrics,
): number {
  const pairs = metrics.isTicket
    ? [
        ["Sucursal", data.sucursal],
        ["Comprobante", data.comprobante],
        ["Bultos", data.bultos],
        ["Peso", data.peso],
        ["Conductor", data.conductor],
        ["Placa", data.placa],
      ]
    : [
        ["Sucursal", data.sucursal],
        ["Comprobante", data.comprobante],
        ["Bultos", data.bultos],
        ["Peso", data.peso],
        ["Conductor", data.conductor],
        ["Placa", data.placa],
      ];

  const cols = metrics.isTicket ? 1 : 3;
  const colWidth = width / cols;
  const rowHeight = metrics.smallSize * 2.1;
  const rows = Math.ceil(pairs.length / cols);
  const boxHeight = metrics.labelSize + rows * rowHeight + 3;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, boxHeight, 1.5, 1.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(metrics.labelSize);
  doc.setTextColor(37, 99, 235);
  doc.text("DATOS DEL ENVÍO", x + 3, y + metrics.labelSize * 0.75);

  const rowY = y + metrics.labelSize + 1.5;

  pairs.forEach((pair, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellX = x + col * colWidth + 3;
    const cellY = rowY + row * rowHeight;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(metrics.smallSize);
    doc.setTextColor(100, 116, 139);
    doc.text(pair[0], cellX, cellY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(displayValue(pair[1]), cellX, cellY + metrics.smallSize * 0.9, {
      maxWidth: colWidth - 4,
    });
  });

  return y + boxHeight;
}

export function configToRotuloRemitente(config: EmpresaConfig): RotuloRemitente {
  const emisor = configToEmisor(config);
  return {
    ...emisor,
    nombreComercial: config.nombreComercial,
    ciudad: config.ciudad,
    logoUrl: config.logoUrl,
  };
}

export function defaultRotuloRemitente(): RotuloRemitente {
  return {
    razonSocial: "Mi Empresa",
    ruc: "—",
    direccion: "—",
    telefono: "—",
    email: "—",
  };
}

export async function generateRotuloEnvioPdf({
  data,
  remitente,
  format = "a4",
}: RotuloPdfInput): Promise<jsPDF> {
  const doc = await createRotuloDocument(format);
  const metrics = getPageMetrics(format);
  const { width, height, margin } = metrics;
  const contentWidth = width - margin * 2;
  const gap = margin * 0.35;

  let y = await drawHeaderBand(doc, data, remitente, metrics);
  y = drawDestinatarioSection(doc, data, margin, y + gap, contentWidth, metrics);
  y = drawShippingMeta(doc, data, margin, y + gap, contentWidth, metrics);

  if (data.observacion !== "—" && !metrics.isTicket) {
    doc.setFontSize(metrics.smallSize);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    const obs = doc.splitTextToSize(`Obs: ${data.observacion}`, contentWidth) as string[];
    doc.text(obs, margin, Math.min(y + 3, height - margin * 1.2));
  }

  doc.setFontSize(metrics.isTicket ? metrics.smallSize - 1 : metrics.smallSize - 0.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  const footerY = metrics.isTicket ? Math.min(y + 4, height - margin) : height - margin * 0.4;
  doc.text(
    metrics.isTicket ? "HaiSales" : "Documento generado por HaiSales — Pegar en el paquete para envío",
    margin,
    footerY,
    { maxWidth: contentWidth },
  );

  return doc;
}

export async function generateRotuloEnvioBlob(input: RotuloPdfInput): Promise<Blob> {
  const doc = await generateRotuloEnvioPdf(input);
  return doc.output("blob");
}

export async function downloadRotuloEnvioPdf(input: RotuloPdfInput): Promise<void> {
  const doc = await generateRotuloEnvioPdf(input);
  const suffix = input.format ?? "a4";
  doc.save(`rotulo-${suffix}-${input.data.codigoGuia.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`);
}

export function getRotuloCopyText(data: RotuloEnvioData): string {
  return buildRotuloPlainText(data);
}
