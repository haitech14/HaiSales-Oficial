import { supabase } from "@/integrations/supabase/client";

const legacyImportCompletedUsers = new Set<string>();
const legacyImportInFlight = new Map<string, Promise<void>>();

export function normalizeFechaIso(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.includes("T") ? trimmed.slice(0, 10) : trimmed.slice(0, 10);
}

export function extractPeriodMonthFromNotas(notas: string | null | undefined): string | undefined {
  const match = notas?.match(/Periodo:\s*(\d{4}-\d{2})/i);
  return match?.[1];
}

export function resolvePeriodMonth(fecha: string, notas?: string | null): string {
  return extractPeriodMonthFromNotas(notas) ?? normalizeFechaIso(fecha).slice(0, 7);
}

async function runVentasLegacyImport(userId: string): Promise<void> {
  const { count, error } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.warn("[ventas] Conteo previo a import:", error.message);
  }

  if ((count ?? 0) === 0) {
    const { error: importError } = await supabase.rpc("import_ventas_legacy_for_user", {
      p_user_id: userId,
    });
    if (importError) {
      console.warn("[ventas] Import legacy:", importError.message);
    }
  }

  const { count: itemCount, error: itemCountError } = await supabase
    .from("venta_items")
    .select("id, ventas!inner(user_id)", { count: "exact", head: true })
    .eq("ventas.user_id", userId);

  if (itemCountError) {
    console.warn("[ventas] Conteo venta_items:", itemCountError.message);
  }

  if ((itemCount ?? 0) === 0) {
    const { error: itemsError } = await supabase.rpc("import_venta_items_legacy_for_user", {
      p_user_id: userId,
    });
    if (itemsError) {
      console.warn("[ventas] Import ítems legacy:", itemsError.message);
    }
  }
}

export async function ensureVentasImported(userId: string): Promise<void> {
  if (legacyImportCompletedUsers.has(userId)) return;

  const inFlight = legacyImportInFlight.get(userId);
  if (inFlight) {
    await inFlight;
    return;
  }

  const task = runVentasLegacyImport(userId).finally(() => {
    legacyImportCompletedUsers.add(userId);
    legacyImportInFlight.delete(userId);
  });

  legacyImportInFlight.set(userId, task);
  await task;
}

/** Importación legacy en segundo plano; no bloquea la UI. */
export function scheduleVentasLegacyImport(userId: string): void {
  if (legacyImportCompletedUsers.has(userId) || legacyImportInFlight.has(userId)) return;
  void ensureVentasImported(userId);
}

export async function fetchAvailableVentaMonths(userId: string): Promise<string[]> {
  await ensureVentasImported(userId);

  const { data, error } = await supabase
    .from("ventas")
    .select("fecha, notas")
    .eq("user_id", userId)
    .neq("estado", "anulada");

  if (error) {
    console.warn("[ventas] Meses disponibles:", error.message);
    return [];
  }

  const months = new Set<string>();
  for (const row of data ?? []) {
    const month = resolvePeriodMonth(row.fecha, row.notas);
    if (month) months.add(month);
  }

  return [...months].sort().reverse();
}
