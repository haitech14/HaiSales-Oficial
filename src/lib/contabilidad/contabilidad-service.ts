import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  contabilidadKpis as staticKpis,
  contabilidadRecords as mockRecords,
  contabilidadTabs,
  type ContabilidadEntryStatus,
  type ContabilidadRecord,
  type ContabilidadSection,
} from "@/lib/contabilidad-mock-data";
import { seedDemoDataForUser } from "@/lib/seed-demo";

type AsientoRow = Database["public"]["Tables"]["asientos_contables"]["Row"];
type LineaRow = Database["public"]["Tables"]["asiento_lineas"]["Row"];

type AsientoWithLineas = AsientoRow & {
  asiento_lineas: LineaRow[] | null;
};

export type ContabilidadSnapshot = {
  records: ContabilidadRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

const ESTADO_FROM_DB: Record<string, ContabilidadEntryStatus> = {
  publicado: "Publicado",
  borrador: "Borrador",
  anulado: "Anulado",
};

const SECCION_FROM_DB: Record<string, ContabilidadSection> = {
  asientos: "asientos",
  libro_diario: "libro-diario",
  balance: "balance",
  resultados: "resultados",
  conciliacion: "conciliacion",
};

function formatDateParts(fecha: string, hora?: string | null) {
  const date = new Date(fecha.includes("T") ? fecha : `${fecha}T12:00:00`);
  return {
    date: date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: hora ?? "00:00",
  };
}

function flattenAsientos(rows: AsientoWithLineas[]): ContabilidadRecord[] {
  const records: ContabilidadRecord[] = [];

  for (const asiento of rows) {
    const { date, time } = formatDateParts(asiento.fecha, asiento.hora_emision);
    const status = ESTADO_FROM_DB[asiento.estado] ?? "Borrador";
    const section = SECCION_FROM_DB[asiento.seccion] ?? "asientos";
    const lineas = asiento.asiento_lineas ?? [];

    for (const linea of lineas) {
      records.push({
        id: linea.id,
        date,
        time,
        entryCode: asiento.codigo,
        account: linea.cuenta_nombre,
        accountCode: linea.cuenta_codigo,
        document: asiento.documento_ref ?? "—",
        description: linea.descripcion ?? asiento.glosa ?? "—",
        debit: linea.debe != null ? Number(linea.debe) : null,
        credit: linea.haber != null ? Number(linea.haber) : null,
        status,
        section,
      });
    }
  }

  return records;
}

function buildSnapshot(
  records: ContabilidadRecord[],
  source: "supabase" | "mock",
): ContabilidadSnapshot {
  const asientosCount = new Set(
    records.filter((r) => r.section === "asientos").map((r) => r.entryCode),
  ).size;

  const tabCounts: Record<string, number | null> = {
    todos: null,
    asientos: asientosCount,
    "libro-diario": records.filter((r) => r.section === "libro-diario").length || null,
    balance: records.filter((r) => r.section === "balance").length || null,
    resultados: records.filter((r) => r.section === "resultados").length || null,
    conciliacion: records.filter((r) => r.section === "conciliacion").length || null,
  };

  const ingresos = records.reduce((sum, r) => sum + (r.credit ?? 0), 0);
  const egresos = records.reduce((sum, r) => sum + (r.debit ?? 0), 0);
  const ganancia = Math.max(0, ingresos - egresos);
  const margen = ingresos > 0 ? Math.round((ganancia / ingresos) * 1000) / 10 : 0;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0 && ingresos > 0) {
      return { ...kpi, value: `S/ ${Math.round(ingresos).toLocaleString("es-PE")}` };
    }
    if (index === 1 && egresos > 0) {
      return { ...kpi, value: `S/ ${Math.round(egresos).toLocaleString("es-PE")}` };
    }
    if (index === 2 && ganancia > 0) {
      return { ...kpi, value: `S/ ${Math.round(ganancia).toLocaleString("es-PE")}` };
    }
    if (index === 3 && ingresos > 0) {
      return { ...kpi, value: `${margen}%` };
    }
    return kpi;
  });

  return {
    records,
    kpis,
    tabCounts,
    totalRecords: records.length,
    source,
  };
}

export async function fetchContabilidadSnapshot(
  userId: string | null,
): Promise<ContabilidadSnapshot> {
  if (!userId) {
    return buildSnapshot(mockRecords, "mock");
  }

  const { data, error } = await supabase
    .from("asientos_contables")
    .select("*, asiento_lineas(*)")
    .eq("user_id", userId)
    .order("fecha", { ascending: false });

  if (error) {
    console.warn("[contabilidad] Error al cargar asientos:", error.message);
    return buildSnapshot(mockRecords, "mock");
  }

  if (!data || data.length === 0) {
    await seedDemoDataForUser(userId);
    const retry = await supabase
      .from("asientos_contables")
      .select("*, asiento_lineas(*)")
      .eq("user_id", userId)
      .order("fecha", { ascending: false });

    if (retry.error || !retry.data?.length) {
      return buildSnapshot(mockRecords, "mock");
    }
    data = retry.data;
  }

  return buildSnapshot(flattenAsientos(data as AsientoWithLineas[]), "supabase");
}

export {
  contabilidadTabs,
  formatAmountCell,
  getEntryStatusStyles,
} from "@/lib/contabilidad-mock-data";
