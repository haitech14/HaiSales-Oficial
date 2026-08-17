export type VentaMoneda = "PEN" | "USD";

export type ClienteTipoPrecioKey =
  | "publico"
  | "mayorista"
  | "tecnico"
  | "distribuidor"
  | "gobierno"
  | "proveedor";

export type VentaPriceTiers = {
  publico?: number | null;
  mayorista?: number | null;
  tecnico?: number | null;
  distribuidor?: number | null;
  gobierno?: number | null;
  proveedor?: number | null;
};

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
  /** Precios PEN por tipo de cliente (si existen). */
  preciosPen?: VentaPriceTiers;
  /** Precios USD por tipo de cliente (si existen). */
  preciosUsd?: VentaPriceTiers;
  /** Si el usuario editó el precio a mano, no se recalcula al cambiar tipo. */
  precioManual?: boolean;
  observaciones?: string;
  imageUrl?: string | null;
  iconBg?: string;
  iconColor?: string;
  iconKind?: string;
};

export type NuevaVentaFormData = {
  clienteId: string;
  cliente: string;
  clienteRuc: string;
  contacto: string;
  celular: string;
  direccion: string;
  tipoCliente: string;
  oportunidad: string;
  observacionGeneral: string;
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
  clienteId: "",
  cliente: "",
  clienteRuc: "",
  contacto: "",
  celular: "",
  direccion: "",
  tipoCliente: "",
  oportunidad: "",
  observacionGeneral: "",
  producto: "",
  productoCodigo: "",
  cantidad: 1,
  unidad: "UND",
  precioUnitario: 0,
  tipoComprobante: "Boleta de Venta (03)",
  serie: "B001",
  formaPago: "Contado",
  moneda: "PEN",
  fechaEmision: "30/06/2026",
  vendedor: "Jhelcen Romero",
  vendedorInitials: "JR",
  estadoInicial: "Negociación",
};

/** Factores sobre precio público cuando no hay tarifa específica. */
const TIPO_CLIENTE_PRICE_FACTOR: Record<ClienteTipoPrecioKey, number> = {
  publico: 1,
  tecnico: 0.95,
  distribuidor: 0.9,
  mayorista: 0.85,
  gobierno: 1,
  proveedor: 0.92,
};

export function normalizeClienteTipoPrecioKey(tipoCliente: string): ClienteTipoPrecioKey {
  const value = tipoCliente
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (value.includes("mayorist")) return "mayorista";
  if (value.includes("tecnic")) return "tecnico";
  if (value.includes("distribuid")) return "distribuidor";
  if (value.includes("gobierno") || value.includes("estatal")) return "gobierno";
  if (value.includes("proveed")) return "proveedor";
  return "publico";
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function pickTierPrice(tiers: VentaPriceTiers | undefined, key: ClienteTipoPrecioKey): number | null {
  if (!tiers) return null;
  const direct = tiers[key];
  if (typeof direct === "number" && Number.isFinite(direct) && direct > 0) return direct;
  // Gobierno / proveedor caen a público si no hay tarifa propia
  if ((key === "gobierno" || key === "proveedor") && tiers.publico) {
    const publico = tiers.publico;
    if (typeof publico === "number" && Number.isFinite(publico) && publico > 0) return publico;
  }
  return null;
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

/**
 * Resuelve el precio unitario según moneda + tipo de cliente.
 * Usa tarifas por tipo si existen; si no, aplica factor sobre el precio público/base.
 */
export function resolveUnitPriceForClienteTipo(
  moneda: VentaMoneda,
  tipoCliente: string,
  options: {
    precioPen?: number | null;
    precioUsd?: number | null;
    preciosPen?: VentaPriceTiers;
    preciosUsd?: VentaPriceTiers;
    fallback?: number;
  },
): number {
  const key = normalizeClienteTipoPrecioKey(tipoCliente || "Público");
  const tiers = moneda === "USD" ? options.preciosUsd : options.preciosPen;
  const tierPrice = pickTierPrice(tiers, key);
  if (tierPrice != null) return roundMoney(tierPrice);

  const base = unitPriceForMoneda(
    moneda,
    options.precioPen,
    options.precioUsd,
    options.fallback ?? 0,
  );
  if (base <= 0) return 0;

  const factor = TIPO_CLIENTE_PRICE_FACTOR[key] ?? 1;
  return roundMoney(base * factor);
}

const IGV_RATE = 0.18;
const IGV_DIVISOR = 1 + IGV_RATE;

/**
 * Precios unitarios incluyen IGV.
 * Total = suma de líneas; base e IGV se extraen del total (÷ 1.18).
 */
export function calculateVentaTotals(cantidad: number, precioUnitario: number) {
  const total = roundMoney(cantidad * precioUnitario);
  const subtotal = roundMoney(total / IGV_DIVISOR);
  const igv = roundMoney(total - subtotal);

  return { subtotal, igv, total };
}

export function calculateCartTotals(lines: VentaCartLine[]) {
  const total = roundMoney(
    lines.reduce((sum, line) => sum + line.cantidad * line.precioUnitario, 0),
  );
  const subtotal = roundMoney(total / IGV_DIVISOR);
  const igv = roundMoney(total - subtotal);
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
