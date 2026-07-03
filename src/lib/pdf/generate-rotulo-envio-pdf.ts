import type { jsPDF } from "jspdf";
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
  headerH: number;
  titleSize: number;
  labelSize: number;
  bodySize: number;
  smallSize: number;
};

function getPageMetrics(format: RotuloPdfFormat): PageMetrics {
  if (format === "ticket") {
    return {
      width: 140,
      height: 80,
      margin: 4,
      headerH: 10,
      titleSize: 9,
      labelSize: 5.5,
      bodySize: 6.5,
      smallSize: 5,
    };
  }
  if (format === "a5") {
    return {
      width: 210,
      height: 148,
      margin: 8,
      headerH: 14,
      titleSize: 13,
      labelSize: 7,
      bodySize: 9,
      smallSize: 7,
    };
  }
  return {
    width: 297,
    height: 210,
    margin: 10,
    headerH: 16,
    titleSize: 16,
    labelSize: 8,
    bodySize: 10,
    smallSize: 8,
  };
}

async function createRotuloDocument(format: RotuloPdfFormat): Promise<jsPDF> {
  const { jsPDF: JsPDF } = await import("jspdf");
  if (format === "ticket") {
    return new JsPDF({ unit: "mm", format: [140, 80], orientation: "landscape" });
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

function drawSectionTitle(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  size: number,
): void {
  doc.setFontSize(size);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(title, x, y);
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

function drawPartyBlockClean(
  doc: jsPDF,
  title: string,
  lines: string[],
  x: number,
  y: number,
  width: number,
  metrics: PageMetrics,
): number {
  const padding = metrics.margin * 0.3;
  const innerX = x + padding;
  const innerWidth = width - padding * 2;
  let cursorY = y + padding + metrics.labelSize * 0.5;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);

  const estimatedHeight =
    padding * 2 +
    metrics.labelSize +
    metrics.bodySize +
    Math.max(0, lines.length - 1) * metrics.smallSize * 1.2;
  doc.roundedRect(x, y, width, estimatedHeight, 1.5, 1.5, "FD");

  drawSectionTitle(doc, title, innerX, cursorY, metrics.labelSize);
  cursorY += metrics.bodySize * 0.85;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(metrics.bodySize);
  doc.setTextColor(30, 41, 59);
  cursorY = drawWrappedText(doc, lines[0], innerX, cursorY, innerWidth, metrics.bodySize * 0.42) + 0.8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(metrics.smallSize);
  doc.setTextColor(71, 85, 105);
  for (const line of lines.slice(1)) {
    cursorY = drawWrappedText(doc, line, innerX, cursorY, innerWidth, metrics.smallSize * 0.42) + 0.6;
  }

  return y + estimatedHeight;
}

function drawShippingMeta(
  doc: jsPDF,
  data: RotuloEnvioData,
  x: number,
  y: number,
  width: number,
  metrics: PageMetrics,
): number {
  const pairs =
    metrics.width <= 150
      ? [
          ["Bultos", data.bultos],
          ["Peso", data.peso],
          ["Agencia", data.conductor],
        ]
      : [
          ["Sucursal", data.sucursal],
          ["Comprobante", data.comprobante],
          ["Bultos", data.bultos],
          ["Peso", data.peso],
          ["Conductor", data.conductor],
          ["Placa", data.placa],
        ];

  const cols = metrics.width <= 150 ? 3 : 3;
  const colWidth = width / cols;
  let rowY = y;
  const rowHeight = metrics.smallSize * 2.2;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, Math.ceil(pairs.length / cols) * rowHeight + 4, 1.5, 1.5, "S");

  drawSectionTitle(doc, "DATOS DEL ENVÍO", x + 3, y + metrics.labelSize * 0.55, metrics.labelSize);
  rowY = y + metrics.labelSize + 2;

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

  return rowY + Math.ceil(pairs.length / cols) * rowHeight + 2;
}

export function configToRotuloRemitente(config: EmpresaConfig): RotuloRemitente {
  const emisor = configToEmisor(config);
  return {
    ...emisor,
    nombreComercial: config.nombreComercial,
    ciudad: config.ciudad,
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
  const { width, height, margin, headerH } = metrics;
  const contentWidth = width - margin * 2;

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, width, headerH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(metrics.titleSize);
  doc.setFont("helvetica", "bold");
  doc.text("RÓTULO DE ENVÍO", margin, headerH * 0.55);

  doc.setFontSize(metrics.smallSize + 1);
  doc.setFont("helvetica", "normal");
  doc.text(`Guía ${data.codigoGuia} · ${data.fecha}`, margin, headerH * 0.88);

  const formatLabel = format === "ticket" ? "Ticket 80mm" : format.toUpperCase();
  doc.text(formatLabel, width - margin, headerH * 0.55, { align: "right" });

  let y = headerH + margin * 0.6;
  const gap = margin * 0.4;
  const columnWidth = (contentWidth - gap) / 2;

  const remitenteNombre =
    remitente.nombreComercial?.trim() || remitente.razonSocial || "Mi Empresa";
  const remitenteLines = [
    remitenteNombre,
    `RUC ${displayValue(remitente.ruc)}`,
    displayValue(remitente.direccion),
    remitente.ciudad ? `${remitente.ciudad}` : "",
    `Tel: ${displayValue(remitente.telefono)}${remitente.email && remitente.email !== "—" ? `  |  ${remitente.email}` : ""}`,
  ].filter(Boolean);

  const destinatarioLines = [
    data.destinatario,
    `RUC ${displayValue(data.ruc)}`,
    `Atención: ${displayValue(data.contacto)}`,
    `Tel: ${displayValue(data.telefono)}`,
    displayValue(data.direccion),
  ];

  const leftBottom = drawPartyBlockClean(
    doc,
    "REMITENTE",
    remitenteLines,
    margin,
    y,
    columnWidth,
    metrics,
  );
  const rightBottom = drawPartyBlockClean(
    doc,
    "DESTINATARIO",
    destinatarioLines,
    margin + columnWidth + gap,
    y,
    columnWidth,
    metrics,
  );

  y = Math.max(leftBottom, rightBottom) + gap;
  y = drawShippingMeta(doc, data, margin, y, contentWidth, metrics);

  if (data.observacion !== "—" && metrics.width > 150) {
    doc.setFontSize(metrics.smallSize);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    const obs = doc.splitTextToSize(`Obs: ${data.observacion}`, contentWidth) as string[];
    doc.text(obs, margin, Math.min(y + 4, height - margin));
  }

  doc.setFontSize(metrics.smallSize - 0.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Documento generado por HaiSales — Pegar en el paquete para envío", margin, height - margin * 0.4);

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
