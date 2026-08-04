export type VentaCartLine = {
  id: string;
  producto: string;
  productoCodigo: string;
  productoId?: string | null;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  precioPen?: number;
  precioUsd?: number;
  imageUrl?: string | null;
  iconBg?: string;
  iconColor?: string;
  iconKind?: string;
};

export type VentaMoneda = "PEN" | "USD";

export type NuevaVentaFormData = {
  cliente: string;
  clienteRuc: string;
  contacto: string;
  oportunidad: string;
  producto: string;
  productoCodigo: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  lineItems?: VentaCartLine[];
  tipoComprobante: string;
  serie: string;
  formaPago: string;
  moneda: VentaMoneda;
  fechaEmision: string;
  vendedor: string;
  vendedorInitials: string;
  estadoInicial: string;
};

export const defaultNuevaVentaForm: NuevaVentaFormData = {
  cliente: "",
  clienteRuc: "",
  contacto: "",
  oportunidad: "",
  producto: "",
  productoCodigo: "",
  cantidad: 1,
  unidad: "UND",
  precioUnitario: 0,
  tipoComprobante: "Factura Electrónica (01)",
  serie: "F001",
  formaPago: "Contado",
  moneda: "PEN",
  fechaEmision: "30/06/2026",
  vendedor: "Jhelcen Romero",
  vendedorInitials: "JR",
  estadoInicial: "Negociación",
};

export function calculateVentaTotals(cantidad: number, precioUnitario: number) {
  const subtotal = cantidad * precioUnitario;
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  return { subtotal, igv, total };
}

export function calculateCartTotals(lines: VentaCartLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.cantidad * line.precioUnitario, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  return { subtotal, igv, total };
}

export function resolveVentaLineItems(form: NuevaVentaFormData): VentaCartLine[] {
  if (form.lineItems && form.lineItems.length > 0) {
    return form.lineItems;
  }

  if (!form.producto.trim()) {
    return [];
  }

  return [
    {
      id: "single",
      producto: form.producto,
      productoCodigo: form.productoCodigo,
      cantidad: form.cantidad,
      unidad: form.unidad,
      precioUnitario: form.precioUnitario,
    },
  ];
}

export function formatVentaCurrency(amount: number, moneda: VentaMoneda = "PEN"): string {
  const prefix = moneda === "USD" ? "$" : "S/";
  return `${prefix} ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function unitPriceForMoneda(
  moneda: VentaMoneda,
  precioPen?: number | null,
  precioUsd?: number | null,
  fallback = 0,
): number {
  if (moneda === "USD") {
    if (typeof precioUsd === "number" && Number.isFinite(precioUsd) && precioUsd > 0) {
      return precioUsd;
    }
  } else if (typeof precioPen === "number" && Number.isFinite(precioPen) && precioPen > 0) {
    return precioPen;
  }
  return fallback;
}
