export type OrdenCompraItem = {
  producto: string;
  productoCodigo: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
};

export type NuevaOrdenCompraFormData = {
  proveedor: string;
  ruc: string;
  items: OrdenCompraItem[];
  centroCosto: string;
  requerimiento: string;
  almacenDestino: string;
  fechaRequerida: string;
  condicionPago: string;
  responsable: string;
  responsableInitials: string;
  estadoAprobacion: string;
  prioridad: string;
};

export const defaultOrdenCompraItem: OrdenCompraItem = {
  producto: "",
  productoCodigo: "",
  cantidad: 0,
  unidad: "Und.",
  precioUnitario: 0,
};

export const defaultNuevaOrdenCompraForm: NuevaOrdenCompraFormData = {
  proveedor: "",
  ruc: "",
  items: [{ ...defaultOrdenCompraItem }],
  centroCosto: "",
  requerimiento: "",
  almacenDestino: "",
  fechaRequerida: "",
  condicionPago: "",
  responsable: "",
  responsableInitials: "",
  estadoAprobacion: "Pendiente de aprobación",
  prioridad: "Media",
};

export function calculateOrdenCompraTotals(items: OrdenCompraItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.cantidad * item.precioUnitario,
    0,
  );
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  return { subtotal, igv, total };
}

export function formatOrdenCurrency(amount: number): string {
  return amount.toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
