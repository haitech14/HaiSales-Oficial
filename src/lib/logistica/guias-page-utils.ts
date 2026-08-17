import type { GuiaRemision } from "@/lib/logistica/types";

export type GuiaFilterMode = "todos" | "sucursal" | "traslado";

export function isGuiaOnDate(guia: GuiaRemision, selected: Date): boolean {
  const [day, month, year] = guia.fecha.split("/").map(Number);
  if (!day || !month || !year) return false;
  return (
    selected.getDate() === day &&
    selected.getMonth() + 1 === month &&
    selected.getFullYear() === year
  );
}

export function matchesGuiaFilterMode(guia: GuiaRemision, mode: GuiaFilterMode): boolean {
  if (mode === "todos") return true;
  if (mode === "sucursal") return guia.estado === "Emitida";
  return guia.estado === "En tránsito" || guia.estado === "Entregada";
}

export function formatGuiaCardDateTime(fecha: string, hora: string): string {
  const normalizedTime = hora.includes("M")
    ? hora
    : new Date(`1970-01-01T${hora}`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
  return `${fecha} ${normalizedTime}`;
}
