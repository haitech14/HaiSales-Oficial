import type { ServicioRecord, ServicioTipo } from "@/lib/servicios/servicios-mock-data";
import { formatVentasHeaderDate, formatVentasSoles } from "@/lib/ventas/ventas-page-utils";

export type ServiciosFilterMode = "ordenes" | "cotizaciones" | "visitas";

export function formatServiciosHeaderDate(date: Date): string {
  return formatVentasHeaderDate(date);
}

export function formatServiciosSoles(amount: number): string {
  return formatVentasSoles(amount);
}

export function matchesServiciosFilterMode(
  record: ServicioRecord,
  mode: ServiciosFilterMode,
): boolean {
  switch (mode) {
    case "ordenes":
      return /^OS-/i.test(record.orderCode.trim());
    case "cotizaciones":
      return /^COT-/i.test(record.orderCode.trim());
    case "visitas":
      return (
        record.serviceType === "Preventivo" ||
        record.serviceType === "Diagnóstico" ||
        record.serviceType === "Instalación"
      );
    default:
      return true;
  }
}

export function serviciosEmptyStateMessage(_mode: ServiciosFilterMode): string {
  return "No se encontraron órdenes registradas en esta fecha.";
}

export function isServicioRecordOnDate(record: ServicioRecord, selected: Date): boolean {
  const [day, month, year] = record.date.split("/").map(Number);
  if (!day || !month || !year) return false;
  return (
    selected.getDate() === day &&
    selected.getMonth() + 1 === month &&
    selected.getFullYear() === year
  );
}

export type ServiciosPorTipoRow = {
  label: string;
  monto: number;
  count: number;
};

const SERVICIO_TIPO_LABELS: Record<ServicioTipo, string> = {
  Correctivo: "Correctivo",
  Diagnóstico: "Diagnóstico",
  Mantenimiento: "Mantenimiento",
  Instalación: "Instalación",
  Preventivo: "Preventivo",
};

export function buildServiciosPorTipoRows(records: ServicioRecord[]): ServiciosPorTipoRow[] {
  const activos = records.filter((item) => item.status !== "Garantía" || item.amount > 0);
  const sum = (items: ServicioRecord[]) => items.reduce((acc, item) => acc + item.amount, 0);

  return (Object.keys(SERVICIO_TIPO_LABELS) as ServicioTipo[]).map((tipo) => {
    const items = activos.filter((item) => item.serviceType === tipo);
    return {
      label: SERVICIO_TIPO_LABELS[tipo],
      monto: sum(items),
      count: items.length,
    };
  });
}

export function buildServiciosResumen(records: ServicioRecord[]) {
  const activos = records.filter((item) => item.status !== "Garantía" || item.amount > 0);
  const total = activos.reduce((sum, item) => sum + item.amount, 0);
  const ordenes = activos.length;
  const promedio = ordenes > 0 ? total / ordenes : 0;
  const subtotal = total / 1.18;
  const igv = total - subtotal;

  const ultima = [...activos].sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split("/").map(Number);
    const [dayB, monthB, yearB] = b.date.split("/").map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA).getTime();
    const dateB = new Date(yearB, monthB - 1, dayB).getTime();
    return dateB - dateA;
  })[0];

  return {
    total,
    ordenes,
    promedio,
    igv,
    ultimaOrden: ultima?.orderCode ?? "—",
  };
}

export type ServiciosResumenMoneda = "general" | "soles" | "dolares" | "euros";
