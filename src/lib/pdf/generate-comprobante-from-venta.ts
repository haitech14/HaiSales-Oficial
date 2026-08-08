import { supabase } from "@/integrations/supabase/client";
import { empresaEmisor } from "@/lib/nueva-venta-mock-data";
import type { EmpresaEmisor } from "@/lib/parametros/empresa-service";
import {
  renderComprobantePdf,
  toComprobantePdfEmisor,
  type ComprobantePdfEmisor,
} from "@/lib/pdf/generate-comprobante-pdf";
import { downloadPdf } from "@/lib/pdf/pdf-utils";
import { currencySymbol } from "@/lib/pdf/numero-a-letras";
import { mapDbTipoToDisplay } from "@/lib/ventas/comprobantes";

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
  direccion: string;
  formaPago: string;
  vendedor: string;
  moneda: string;
  observacion: string;
  subtotal: number;
  igv: number;
  total: number;
  items: VentaPdfItem[];
};

function getComprobanteTitle(tipo: string): string {
  const display = mapDbTipoToDisplay(tipo).toLowerCase();
  if (display.includes("boleta")) return "BOLETA DE VENTA ELECTRÓNICA";
  if (display.includes("nota de venta")) return "NOTA DE VENTA";
  if (display.includes("crédito") || display.includes("credito")) return "NOTA DE CRÉDITO ELECTRÓNICA";
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

function extractMeta(notas?: string | null) {
  const formaPago = notas?.match(/Forma de pago:\s*([^·]+)/i)?.[1]?.trim();
  const direccion = notas?.match(/Dirección:\s*([^·]+)/i)?.[1]?.trim();
  const obs = notas?.match(/Obs:\s*([^·]+)/i)?.[1]?.trim();
  return { formaPago, direccion, obs };
}

export async function fetchVentaPdfData(ventaId: string): Promise<VentaPdfData | null> {
  const { data: venta, error } = await supabase
    .from("ventas")
    .select(
      "id, codigo_comprobante, tipo_comprobante, fecha, cliente_nombre, cliente_ruc, subtotal, igv, total, notas, vendedor_nombre",
    )
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

  const meta = extractMeta(venta.notas);

  return {
    codigoComprobante: venta.codigo_comprobante ?? venta.id.slice(0, 8),
    tipoComprobante: venta.tipo_comprobante,
    fecha: formatDisplayDate(venta.fecha),
    cliente: venta.cliente_nombre ?? "Cliente",
    clienteRuc: venta.cliente_ruc ?? "—",
    direccion: meta.direccion || "—",
    formaPago: meta.formaPago || "Contado",
    vendedor: venta.vendedor_nombre ?? "—",
    moneda: "PEN",
    observacion: meta.obs || "",
    subtotal: Number(venta.subtotal),
    igv: Number(venta.igv),
    total: Number(venta.total),
    items: pdfItems,
  };
}

export async function generateComprobantePdfFromVenta(
  ventaId: string,
  emisor: EmpresaEmisor | ComprobantePdfEmisor = empresaEmisor,
): Promise<boolean> {
  const data = await fetchVentaPdfData(ventaId);
  if (!data || data.items.length === 0) return false;

  const symbol = currencySymbol(data.moneda);
  const titulo = getComprobanteTitle(data.tipoComprobante);
  const doc = await renderComprobantePdf({
    titulo,
    numero: data.codigoComprobante,
    fecha: data.fecha,
    cliente: data.cliente,
    clienteRuc: data.clienteRuc,
    direccion: data.direccion,
    formaPago: data.formaPago,
    vendedor: data.vendedor,
    medioPago: `${data.formaPago} ${symbol} ${data.total.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    moneda: data.moneda,
    items: data.items.map((item) => ({
      cantidad: item.cantidad,
      unidad: item.unidad,
      descripcion: item.descripcion,
      precio: item.precio,
      importe: item.subtotal,
    })),
    subtotal: data.subtotal,
    igv: data.igv,
    total: data.total,
    observaciones: data.observacion,
    emisor: toComprobantePdfEmisor(emisor),
  });

  downloadPdf(doc, `${data.codigoComprobante}.pdf`);
  return true;
}
