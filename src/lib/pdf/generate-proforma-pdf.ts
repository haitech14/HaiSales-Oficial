import type { NuevaVentaFormData } from "@/lib/nueva-venta-types";
import { calculateVentaTotals } from "@/lib/nueva-venta-types";
import { empresaEmisor } from "@/lib/nueva-venta-mock-data";
import type { EmpresaEmisor } from "@/lib/parametros/empresa-service";
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

function buildProformaNumber(): string {
  const now = new Date();
  const seq = String(now.getTime()).slice(-6);
  return `PRO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${seq}`;
}

export async function generateProformaPdf(
  data: NuevaVentaFormData,
  emisor: EmpresaEmisor = empresaEmisor,
): Promise<void> {
  const doc = await createPdfDocument();
  const number = buildProformaNumber();
  const { subtotal, igv, total } = calculateVentaTotals(data.cantidad, data.precioUnitario);

  let y = drawPdfHeader(doc, "PROFORMA", number, data.fechaEmision);
  y = drawCompanyBlock(doc, y, emisor);
  y = drawClientBlock(doc, y, data.cliente, data.clienteRuc, data.contacto);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Vendedor: ${data.vendedor}  |  Validez: 15 días  |  Forma de pago: ${data.formaPago}`, 14, y);
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

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Esta proforma no constituye comprobante de pago. Los precios incluyen IGV. Sujeto a disponibilidad de stock.",
    14,
    y + 4,
    { maxWidth: 182 },
  );

  drawPdfFooter(
    doc,
    "Documento informativo sin valor tributario. Para emitir comprobante, registre la venta en el sistema.",
  );

  downloadPdf(doc, `${number}.pdf`);
}
