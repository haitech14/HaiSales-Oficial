import type { PurchaseOrder } from "@/lib/logistica/types";

export type ComprasFilterMode = "compras" | "requisiciones" | "correo";

export function isCompraOnDate(order: PurchaseOrder, selected: Date): boolean {
  const [day, month, year] = order.fecha.split("/").map(Number);
  if (!day || !month || !year) return false;
  return (
    selected.getDate() === day &&
    selected.getMonth() + 1 === month &&
    selected.getFullYear() === year
  );
}

export function matchesComprasFilterMode(order: PurchaseOrder, mode: ComprasFilterMode): boolean {
  if (mode === "compras") return true;
  if (mode === "requisiciones") return order.category === "requisicion";
  return order.category === "observada" || order.estado === "Observada";
}

export function formatCompraCardDateTime(fecha: string, hora: string): string {
  const normalizedTime = hora.includes("M")
    ? hora
    : new Date(`1970-01-01T${hora}`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
  return `${fecha} ${normalizedTime}`;
}

export function formatCompraMockAmount(amount: number): string {
  const value = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$ ${value}`;
}
