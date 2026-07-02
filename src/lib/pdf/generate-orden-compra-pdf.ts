import type { jsPDF } from "jspdf";
import type { NuevaOrdenCompraFormData } from "@/lib/nueva-orden-compra-types";
import { calculateOrdenCompraTotals, formatOrdenCurrency } from "@/lib/nueva-orden-compra-types";
import { empresaEmisor } from "@/lib/nueva-venta-mock-data";
import {
  createPdfDocument,
  downloadPdf,
  drawCompanyBlock,
  drawItemsTable,
  drawPdfFooter,
  drawPdfHeader,
  drawTotalsBlock,
} from "@/lib/pdf/pdf-utils";

function buildOrdenNumber(): string {
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `OC-2026-${seq}`;
}

function drawSupplierBlock(
  doc: jsPDF,
  y: number,
  proveedor: string,
  ruc: string,
): number {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 22, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("PROVEEDOR", 18, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(proveedor || "—", 18, y + 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`RUC: ${ruc || "—"}`, 18, y + 18);

  return y + 28;
}

function drawOrdenMetaBlock(
  doc: jsPDF,
  y: number,
  data: NuevaOrdenCompraFormData,
): number {
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Almacén destino: ${data.almacenDestino || "—"}`, 14, y);
  doc.text(`Fecha requerida: ${data.fechaRequerida || "—"}`, 14, y + 5);
  doc.text(`Condición de pago: ${data.condicionPago || "—"}`, 14, y + 10);
  doc.text(`Centro de costo: ${data.centroCosto || "—"}`, 110, y);
  doc.text(`Responsable: ${data.responsable || "—"}`, 110, y + 5);
  doc.text(`Prioridad: ${data.prioridad || "—"}`, 110, y + 10);
  if (data.requerimiento) {
    doc.text(`Requerimiento: ${data.requerimiento}`, 14, y + 15);
    return y + 22;
  }
  return y + 16;
}

export async function generateOrdenCompraPdf(data: NuevaOrdenCompraFormData): Promise<string> {
  const doc = await createPdfDocument();
  const number = buildOrdenNumber();
  const fecha = new Date().toLocaleDateString("es-PE");
  const { subtotal, igv, total } = calculateOrdenCompraTotals(data.items);

  let y = drawPdfHeader(doc, "ORDEN DE COMPRA", number, fecha);
  y = drawCompanyBlock(doc, y, empresaEmisor);
  y = drawSupplierBlock(doc, y, data.proveedor, data.ruc);
  y = drawOrdenMetaBlock(doc, y, data);

  y = drawItemsTable(
    doc,
    y,
    data.items.map((item) => ({
      codigo: item.productoCodigo || "—",
      descripcion: item.producto || "Producto o servicio",
      cantidad: item.cantidad,
      unidad: item.unidad,
      precio: item.precioUnitario,
      subtotal: item.cantidad * item.precioUnitario,
    })),
  );

  y = drawTotalsBlock(doc, y, subtotal, igv, total);

  doc.setDrawColor(234, 179, 8);
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(14, y, 182, 14, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(161, 98, 7);
  doc.text(`Estado de aprobación: ${data.estadoAprobacion}`, 18, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Documento sujeto a aprobación interna antes de emitirse al proveedor.", 18, y + 11);

  drawPdfFooter(
    doc,
    "Orden de compra generada por HaiSales. Requiere aprobación del área de compras.",
  );

  downloadPdf(doc, `${number}.pdf`);
  return number;
}

export function formatOrdenPdfSummary(data: NuevaOrdenCompraFormData): string {
  const { total } = calculateOrdenCompraTotals(data.items);
  return formatOrdenCurrency(total);
}
