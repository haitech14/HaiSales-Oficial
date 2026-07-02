import type { jsPDF } from "jspdf";
import { formatVentaCurrency } from "@/lib/nueva-venta-types";

export async function createPdfDocument(): Promise<jsPDF> {
  const { jsPDF: JsPDF } = await import("jspdf");
  return new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
}

export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function drawPdfHeader(
  doc: jsPDF,
  title: string,
  documentNumber: string,
  fecha: string,
): number {
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${documentNumber}`, 14, 21);
  doc.text(`Fecha: ${fecha}`, 150, 21);

  doc.setTextColor(30, 41, 59);
  return 36;
}

export function drawCompanyBlock(doc: jsPDF, y: number, empresa: {
  razonSocial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
}): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(empresa.razonSocial, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`RUC: ${empresa.ruc}`, 14, y + 5);
  doc.text(empresa.direccion, 14, y + 10);
  doc.text(`Tel: ${empresa.telefono}  |  ${empresa.email}`, 14, y + 15);
  doc.setTextColor(30, 41, 59);
  return y + 22;
}

export function drawClientBlock(
  doc: jsPDF,
  y: number,
  cliente: string,
  clienteRuc: string,
  contacto: string,
): number {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 22, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("CLIENTE / DESTINATARIO", 18, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(cliente || "—", 18, y + 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`RUC/DNI: ${clienteRuc || "—"}  |  Contacto: ${contacto || "—"}`, 18, y + 18);

  return y + 28;
}

export function drawItemsTable(
  doc: jsPDF,
  y: number,
  items: Array<{ codigo: string; descripcion: string; cantidad: number; unidad: string; precio: number; subtotal: number }>,
): number {
  const colX = [14, 32, 110, 130, 145, 170];
  const headers = ["Cód.", "Descripción", "Cant.", "Und.", "P. Unit.", "Subtotal"];

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  headers.forEach((header, i) => doc.text(header, colX[i], y + 5.5));

  let rowY = y + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  items.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY, 182, 8, "F");
    }
    doc.text(item.codigo, colX[0], rowY + 5.5);
    doc.text(item.descripcion.substring(0, 42), colX[1], rowY + 5.5);
    doc.text(item.cantidad.toFixed(2), colX[2], rowY + 5.5);
    doc.text(item.unidad, colX[3], rowY + 5.5);
    doc.text(formatVentaCurrency(item.precio), colX[4], rowY + 5.5);
    doc.text(formatVentaCurrency(item.subtotal), colX[5], rowY + 5.5);
    rowY += 8;
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(14, rowY, 196, rowY);
  return rowY + 6;
}

export function drawTotalsBlock(
  doc: jsPDF,
  y: number,
  subtotal: number,
  igv: number,
  total: number,
): number {
  const labelX = 140;
  const valueX = 196;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal:", labelX, y, { align: "right" });
  doc.text(formatVentaCurrency(subtotal), valueX, y, { align: "right" });

  doc.text("IGV (18%):", labelX, y + 6, { align: "right" });
  doc.text(formatVentaCurrency(igv), valueX, y + 6, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text("TOTAL:", labelX, y + 14, { align: "right" });
  doc.text(formatVentaCurrency(total), valueX, y + 14, { align: "right" });

  return y + 22;
}

export function drawPdfFooter(doc: jsPDF, note: string): void {
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text(note, 14, 285);
  doc.text("Documento generado por HaiSales — www.haisales.pe", 14, 290);
}
