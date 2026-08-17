export const NUEVA_VENTA_MODAL_BG = "#F2F2F2";

export const DOC_TIPO_FACTURA = "Factura Electrónica (01)";
export const DOC_TIPO_BOLETA = "Boleta de Venta (03)";

export const ventaTiposOperacion = [
  "VENTA INTERNA",
  "EXPORTACIÓN",
  "VENTA NO DOMICILIADA",
] as const;

export const nuevaVentaFieldClass =
  "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15";

export const nuevaVentaPlainControlClass =
  "h-9 w-full appearance-none border-0 bg-transparent px-0 text-sm text-slate-800 shadow-none outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0";

export function getComprobanteSubtitle(tipoComprobante: string): string {
  if (tipoComprobante.includes("Boleta")) return "Boleta de Venta Electrónica";
  if (tipoComprobante.includes("Factura")) return "Factura Electrónica";
  if (tipoComprobante.includes("Nota de Crédito")) return "Nota de Crédito Electrónica";
  if (tipoComprobante.includes("Nota de Venta")) return "Nota de Venta";
  if (tipoComprobante === "Guía de Remisión") return "Guía de Remisión";
  if (tipoComprobante === "Cotización") return "Cotización";
  return tipoComprobante;
}

export function monedaLabel(moneda: "PEN" | "USD"): string {
  return moneda === "USD" ? "Dólares ($)" : "Soles (S/)";
}
