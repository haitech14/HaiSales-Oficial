import { supabase } from "@/integrations/supabase/client";

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

export async function ensureVentasImported(userId: string): Promise<void> {
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

  const { error: itemsError } = await supabase.rpc("import_venta_items_legacy_for_user", {
    p_user_id: userId,
  });
  if (itemsError) {
    console.warn("[ventas] Import ítems legacy:", itemsError.message);
  }
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
