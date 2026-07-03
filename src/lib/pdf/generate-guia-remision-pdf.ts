import type { NuevaVentaFormData } from "@/lib/nueva-venta-types";
import { formatVentaCurrency } from "@/lib/nueva-venta-types";
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
} from "@/lib/pdf/pdf-utils";

function buildGuiaNumber(serie: string): string {
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${serie.replace("F", "T")}-${seq}`;
}

export async function generateGuiaRemisionPdf(
  data: NuevaVentaFormData,
  emisor: EmpresaEmisor = empresaEmisor,
): Promise<void> {
  const doc = await createPdfDocument();
  const number = buildGuiaNumber(data.serie);
  const subtotal = data.cantidad * data.precioUnitario;

  let y = drawPdfHeader(doc, "GUÍA DE REMISIÓN ELECTRÓNICA", number, data.fechaEmision);
  y = drawCompanyBlock(doc, y, emisor);
  y = drawClientBlock(doc, y, data.cliente, data.clienteRuc, data.contacto);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 88, 28, 2, 2, "FD");
  doc.roundedRect(108, y, 88, 28, 2, 2, "FD");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("DATOS DEL TRASLADO", 18, y + 6);
  doc.text("TRANSPORTE", 112, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Motivo: Venta", 18, y + 12);
  doc.text("Modalidad: Transporte público", 18, y + 17);
  doc.text(`Punto de partida: ${emisor.direccion.substring(0, 38)}`, 18, y + 22);
  doc.text("Punto de llegada: Dirección del cliente", 18, y + 27);

  doc.text("Transportista: Por asignar", 112, y + 12);
  doc.text("Placa: —", 112, y + 17);
  doc.text("Licencia: —", 112, y + 22);
  doc.text(`Peso bruto total: ${data.cantidad.toFixed(2)} ${data.unidad}`, 112, y + 27);

  y += 34;

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

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`Valor referencial del traslado: ${formatVentaCurrency(subtotal)}`, 14, y + 4);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Documento de traslado de mercancías. Debe acompañar el bien durante el transporte según normativa SUNAT.",
    14,
    y + 12,
    { maxWidth: 182 },
  );

  drawPdfFooter(
    doc,
    "Guía de remisión electrónica generada por HaiSales. Verifique datos antes del traslado.",
  );

  downloadPdf(doc, `GRE-${number}.pdf`);
}
