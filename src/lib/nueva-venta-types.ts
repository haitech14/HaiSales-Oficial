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
  tipoComprobante: string;
  serie: string;
  formaPago: string;
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

export function formatVentaCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
