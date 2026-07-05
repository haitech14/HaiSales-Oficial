import { supabase } from "@/integrations/supabase/client";
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

export type VentaPdfItem = {
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio: number;
  subtotal: number;
};

export type VentaPdfData = {
  codigoComprobante: string;
  tipoComprobante: string;
  fecha: string;
  cliente: string;
  clienteRuc: string;
  subtotal: number;
  igv: number;
  total: number;
  items: VentaPdfItem[];
};

function getComprobanteTitle(tipo: string): string {
  if (tipo.includes("boleta")) return "BOLETA DE VENTA ELECTRÓNICA";
  if (tipo.includes("nota_venta") || tipo.includes("nota de venta")) return "NOTA DE VENTA";
  if (tipo.includes("nota")) return "NOTA DE CRÉDITO ELECTRÓNICA";
  return "FACTURA ELECTRÓNICA";
}

function formatDisplayDate(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function fetchVentaPdfData(ventaId: string): Promise<VentaPdfData | null> {
  const { data: venta, error } = await supabase
    .from("ventas")
    .select("id, codigo_comprobante, tipo_comprobante, fecha, cliente_nombre, cliente_ruc, subtotal, igv, total")
    .eq("id", ventaId)
    .single();

  if (error || !venta) return null;

  const { data: items } = await supabase
    .from("venta_items")
    .select("descripcion, cantidad, precio_unitario, subtotal, producto_id, productos(sku, unidad)")
    .eq("venta_id", ventaId)
    .order("created_at", { ascending: true });

  const pdfItems: VentaPdfItem[] = (items ?? []).map((item) => {
    const producto = item.productos as { sku: string | null; unidad: string | null } | null;
    return {
      codigo: producto?.sku ?? "—",
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad),
      unidad: producto?.unidad ?? "UND",
      precio: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
    };
  });

  return {
    codigoComprobante: venta.codigo_comprobante ?? venta.id.slice(0, 8),
    tipoComprobante: venta.tipo_comprobante,
    fecha: formatDisplayDate(venta.fecha),
    cliente: venta.cliente_nombre ?? "Cliente",
    clienteRuc: venta.cliente_ruc ?? "—",
    subtotal: Number(venta.subtotal),
    igv: Number(venta.igv),
    total: Number(venta.total),
    items: pdfItems,
  };
}

export async function generateComprobantePdfFromVenta(
  ventaId: string,
  emisor: EmpresaEmisor = empresaEmisor,
): Promise<boolean> {
  const data = await fetchVentaPdfData(ventaId);
  if (!data || data.items.length === 0) return false;

  const doc = await createPdfDocument();
  const title = getComprobanteTitle(data.tipoComprobante);

  let y = drawPdfHeader(doc, title, data.codigoComprobante, data.fecha);
  y = drawCompanyBlock(doc, y, emisor);
  y = drawClientBlock(doc, y, data.cliente, data.clienteRuc, "—");
  y += 4;
  y = drawItemsTable(doc, y, data.items);
  y = drawTotalsBlock(doc, y, data.subtotal, data.igv, data.total);

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

  drawPdfFooter(doc, "Comprobante histórico importado — HaiSales");
  downloadPdf(doc, `${data.codigoComprobante}.pdf`);
  return true;
}
