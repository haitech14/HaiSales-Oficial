export const movimientoTipos = [
  { value: "entrada", label: "Entrada" },
  { value: "salida", label: "Salida" },
  { value: "transferencia", label: "Transferencia" },
];

export const movimientoAlmacenes = [
  { value: "principal", label: "Almacén Principal" },
  { value: "norte", label: "Almacén Norte" },
  { value: "sur", label: "Almacén Sur" },
  { value: "este", label: "Almacén Este" },
];

export const movimientoUbicaciones = [
  { value: "a01-01-01", label: "A01-01-01" },
  { value: "a01-01-02", label: "A01-01-02" },
  { value: "a02-01-03", label: "A02-01-03" },
  { value: "b01-01-01", label: "B01-01-01" },
  { value: "b02-03-02", label: "B02-03-02" },
  { value: "c01-02-01", label: "C01-02-01" },
];

export const movimientoMotivos = [
  { value: "compra", label: "Compra" },
  { value: "venta", label: "Venta" },
  { value: "ajuste", label: "Ajuste de inventario" },
  { value: "devolucion", label: "Devolución" },
  { value: "transferencia", label: "Transferencia interna" },
  { value: "merma", label: "Merma" },
];

export const movimientoResponsables = [
  { value: "jhelcen-romero", label: "Jhelcen Romero" },
  { value: "ana-martinez", label: "Ana Martínez" },
  { value: "juan-campos", label: "Juan Campos" },
  { value: "maria-gomez", label: "María Gómez" },
];

export type NuevoMovimientoFormState = {
  tipoMovimiento: string;
  productoSku: string;
  almacenOrigen: string;
  ubicacionOrigen: string;
  almacenDestino: string;
  ubicacionDestino: string;
  cantidad: string;
  costoUnitario: string;
  motivo: string;
  responsable: string;
  fechaMovimiento: string;
  documentoReferencia: string;
};

export const defaultNuevoMovimientoForm: NuevoMovimientoFormState = {
  tipoMovimiento: "entrada",
  productoSku: "",
  almacenOrigen: "principal",
  ubicacionOrigen: "a01-01-01",
  almacenDestino: "principal",
  ubicacionDestino: "a01-01-02",
  cantidad: "",
  costoUnitario: "",
  motivo: "compra",
  responsable: "",
  fechaMovimiento: new Date().toISOString().slice(0, 10),
  documentoReferencia: "",
};

export function calculateMovimientoSummary(cantidad: string, costoUnitario: string, stockActual = 125) {
  const qty = parseFloat(cantidad.replace(/,/g, "")) || 0;
  const cost = parseFloat(costoUnitario.replace(/,/g, "")) || 0;
  const stockResultante = stockActual + qty;
  const costoPromedio = cost > 0 ? cost : 18.65;

  return { stockActual, stockResultante, costoPromedio };
}

export function formatMovimientoCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
