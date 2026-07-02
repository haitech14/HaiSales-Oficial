import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  cuentasCobrarKpis as staticKpis,
  cuentasCobrarRecords as mockRecords,
  cuentasCobrarTabs,
  type CobroEstado,
  type CuentasCobrarRecord,
} from "@/lib/cuentas-cobrar-mock-data";
import { seedDemoDataForUser } from "@/lib/seed-demo";

type CuentaRow = Database["public"]["Tables"]["cuentas_cobrar"]["Row"];

export type CuentasCobrarSnapshot = {
  records: CuentasCobrarRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

function formatDate(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mapEstado(row: CuentaRow): CobroEstado {
  if (row.estado === "vencido" || row.dias_mora > 0) return "Vencida";
  return "Por vencer";
}

function mapRowToRecord(row: CuentaRow, clientName?: string | null): CuentasCobrarRecord {
  const vencida = mapEstado(row) === "Vencida";
  return {
    id: row.id,
    date: formatDate(row.fecha_emision),
    document: row.documento,
    client: clientName ?? "Cliente",
    reference: row.notas ?? row.documento,
    dueDate: formatDate(row.fecha_vencimiento),
    dueDateOverdue: vencida,
    total: Number(row.monto),
    balance: Number(row.saldo_pendiente),
    daysOverdue: vencida ? row.dias_mora : null,
    status: mapEstado(row),
    seller: "Equipo comercial",
    section: "facturas",
  };
}

function buildSnapshot(records: CuentasCobrarRecord[], source: "supabase" | "mock"): CuentasCobrarSnapshot {
  const vencidas = records.filter((r) => r.status === "Vencida");
  const porVencer = records.filter((r) => r.status === "Por vencer");
  const saldoTotal = records.reduce((sum, r) => sum + r.balance, 0);
  const saldoVencido = vencidas.reduce((sum, r) => sum + r.balance, 0);
  const saldoPorVencer = porVencer.reduce((sum, r) => sum + r.balance, 0);

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return { ...kpi, value: formatCurrency(saldoTotal) };
    if (index === 1) return { ...kpi, value: formatCurrency(saldoVencido) };
    if (index === 2) return { ...kpi, value: formatCurrency(saldoPorVencer * 0.55) };
    if (index === 3) return { ...kpi, value: formatCurrency(saldoPorVencer * 0.3) };
    return { ...kpi, value: formatCurrency(saldoPorVencer * 0.15) };
  });

  return {
    records,
    kpis,
    tabCounts: {
      todas: null,
      facturas: records.filter((r) => r.section === "facturas").length,
      "notas-credito": records.filter((r) => r.section === "notas-credito").length,
      "cobros-recibidos": records.filter((r) => r.section === "cobros-recibidos").length,
      anticipos: records.filter((r) => r.section === "anticipos").length,
    },
    totalRecords: records.length,
    source,
  };
}

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export async function fetchCuentasCobrarSnapshot(userId: string | null): Promise<CuentasCobrarSnapshot> {
  if (!userId) {
    return buildSnapshot(mockRecords, "mock");
  }

  const { data, error } = await supabase
    .from("cuentas_cobrar")
    .select("*, clientes(razon_social)")
    .eq("user_id", userId)
    .order("fecha_vencimiento", { ascending: true });

  if (error) {
    console.warn("[cuentas-cobrar] Error al cargar:", error.message);
    return buildSnapshot(mockRecords, "mock");
  }

  if (!data?.length) {
    await seedDemoDataForUser(userId);
    const retry = await supabase
      .from("cuentas_cobrar")
      .select("*, clientes(razon_social)")
      .eq("user_id", userId)
      .order("fecha_vencimiento", { ascending: true });

    if (retry.error || !retry.data?.length) {
      return buildSnapshot(mockRecords, "mock");
    }
    data = retry.data;
  }

  const records = data.map((row) =>
    mapRowToRecord(
      row as CuentaRow,
      (row as CuentaRow & { clientes?: { razon_social: string } | null }).clientes?.razon_social,
    ),
  );

  return buildSnapshot(records, "supabase");
}

export { cuentasCobrarTabs, formatCurrency, getCobroStatusStyles } from "@/lib/cuentas-cobrar-mock-data";
