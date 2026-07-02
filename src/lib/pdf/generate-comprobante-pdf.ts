import type { NuevaVentaFormData } from "@/lib/nueva-venta-types";
import { calculateVentaTotals } from "@/lib/nueva-venta-types";
import { empresaEmisor } from "@/lib/nueva-venta-mock-data";
import {
  createPdfDocument,
  downloadPdf,
  drawClientBlock,
  drawCompanyBlock,
  drawItemsTable,
  drawPdfFooter,
  drawPdfHeader,
  drawTotalsBlock,
} from "@/lib/pdf/pdf-utils";

function buildComprobanteNumber(serie: string): string {
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `${serie}-${seq}`;
}

function getComprobanteTitle(tipo: string): string {
  if (tipo.includes("Boleta")) return "BOLETA DE VENTA ELECTRÓNICA";
  if (tipo.includes("Nota")) return "NOTA DE CRÉDITO ELECTRÓNICA";
  return "FACTURA ELECTRÓNICA";
}

export async function generateComprobantePdf(data: NuevaVentaFormData): Promise<void> {
  const doc = await createPdfDocument();
  const number = buildComprobanteNumber(data.serie);
  const { subtotal, igv, total } = calculateVentaTotals(data.cantidad, data.precioUnitario);
  const title = getComprobanteTitle(data.tipoComprobante);

  let y = drawPdfHeader(doc, title, number, data.fechaEmision);
  y = drawCompanyBlock(doc, y, empresaEmisor);
  y = drawClientBlock(doc, y, data.cliente, data.clienteRuc, data.contacto);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Forma de pago: ${data.formaPago}  |  Vendedor: ${data.vendedor}  |  Estado: ${data.estadoInicial}`,
    14,
    y,
  );
  if (data.oportunidad) {
    doc.text(`Oportunidad vinculada: ${data.oportunidad}`, 14, y + 5);
    y += 5;
  }
  y += 8;

  y = drawItemsTable(doc, y, [
    {
      codigo: data.productoCodigo || "—",
      descripcion: data.producto || "Producto o servicio",
      cantidad: data.cantidad,
      unidad: data.unidad,
      precio: data.precioUnitario,
      subtotal,
    },
  ]);

  y = drawTotalsBlock(doc, y, subtotal, igv, total);

  doc.setDrawColor(34, 197, 94);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 14, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text("Representación impresa del comprobante electrónico", 18, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Autorizado por SUNAT — Resolución N° 034-005-0005315", 18, y + 11);

  drawPdfFooter(
    doc,
    "Comprobante electrónico válido. Consulte su validez en www.sunat.gob.pe",
  );

  downloadPdf(doc, `${number}.pdf`);
}
