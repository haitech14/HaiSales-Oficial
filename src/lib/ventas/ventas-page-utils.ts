import type { VentaRecord } from "@/lib/ventas-mock-data";

export type VentasFilterMode = "comprobantes" | "nota-venta" | "proformas";

export function matchesVentasFilterMode(
  record: VentaRecord,
  mode: VentasFilterMode,
): boolean {
  switch (mode) {
    case "comprobantes":
      return (
        record.documentType === "Factura" ||
        record.documentType === "Boleta" ||
        record.documentType === "Nota de crédito"
      );
    case "nota-venta":
      return record.documentType === "Nota de venta";
    case "proformas":
      return /^(COT|C0|PRO)/i.test(record.documentCode.trim());
    default:
      return true;
  }
}

export function ventasEmptyStateMessage(_mode: VentasFilterMode): string {
  return "No se encontraron documentos emitidos en esta fecha.";
}

export type VentasResumenMoneda = "general" | "soles" | "dolares" | "euros";

const DOCUMENT_LABELS: Record<VentaRecord["documentType"], string> = {
  Factura: "Factura Electrónica",
  Boleta: "Boleta de Venta",
  "Nota de crédito": "Nota de Crédito",
  "Nota de venta": "Nota de Venta",
};

export function getVentaDocumentLabel(type: VentaRecord["documentType"]): string {
  return DOCUMENT_LABELS[type] ?? type;
}

export function formatVentasMockAmount(amount: number): string {
  const value = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-$ ${value}` : `$ ${value}`;
}

export function formatVentasSoles(amount: number): string {
  return `S/ ${Math.abs(amount).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatVentasHeaderDate(date: Date): string {
  const weekday = date.toLocaleDateString("es-PE", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("es-PE", { month: "long" });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capitalizedWeekday}, ${day}º ${capitalizedMonth}`;
}

export function formatVentasCardDateTime(date: string, time: string): string {
  const normalizedTime = time.includes("M")
    ? time
    : new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
  return `${date} ${normalizedTime}`;
}

export function isVentaRecordOnDate(record: VentaRecord, selected: Date): boolean {
  const [day, month, year] = record.date.split("/").map(Number);
  if (!day || !month || !year) return false;
  return (
    selected.getDate() === day &&
    selected.getMonth() + 1 === month &&
    selected.getFullYear() === year
  );
}

export type VentasPorTipoRow = {
  label: string;
  monto: number;
  count: number;
};

export const VENTAS_POR_TIPO_LABELS = [
  "Facturas",
  "Facturas (Desde NV)",
  "Boletas",
  "Boletas (Desde NV)",
  "Notas de débito",
  "Notas de crédito",
] as const;

export function buildVentasPorTipoRows(records: VentaRecord[]): VentasPorTipoRow[] {
  const activos = records.filter((item) => item.businessStatus !== "Anulada");
  const sum = (items: VentaRecord[]) => items.reduce((acc, item) => acc + item.amount, 0);

  const facturas = activos.filter((item) => item.documentType === "Factura");
  const boletas = activos.filter((item) => item.documentType === "Boleta");
  const notasCredito = activos.filter((item) => item.documentType === "Nota de crédito");

  return [
    { label: "Facturas", monto: sum(facturas), count: facturas.length },
    { label: "Facturas (Desde NV)", monto: 0, count: 0 },
    { label: "Boletas", monto: sum(boletas), count: boletas.length },
    { label: "Boletas (Desde NV)", monto: 0, count: 0 },
    { label: "Notas de débito", monto: 0, count: 0 },
    { label: "Notas de crédito", monto: sum(notasCredito), count: notasCredito.length },
  ];
}

export function buildVentasResumen(records: VentaRecord[]) {
  const activos = records.filter((item) => item.businessStatus !== "Anulada");
  const total = activos.reduce((sum, item) => sum + item.amount, 0);
  const emisiones = activos.length;
  const promedio = emisiones > 0 ? total / emisiones : 0;
  const subtotal = total / 1.18;
  const igv = total - subtotal;

  const ultima = [...activos].sort((a, b) => {
    const ta = `${a.date} ${a.time}`;
    const tb = `${b.date} ${b.time}`;
    return tb.localeCompare(ta);
  })[0];

  const ultimaEmision = ultima
    ? ultima.time.includes("M")
      ? ultima.time
      : new Date(`1970-01-01T${ultima.time}`).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
    : "—";

  return { total, emisiones, promedio, igv, ultimaEmision };
}
