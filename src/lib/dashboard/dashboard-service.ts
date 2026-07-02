import { supabase } from "@/integrations/supabase/client";
import {
  dashboardKpis as staticKpis,
  dashboardRecords as mockRecords,
  dashboardTabs,
  type DashboardRecord,
  type DashboardStatus,
  type DashboardTabId,
} from "@/lib/dashboard-mock-data";
import { seedDemoDataForUser } from "@/lib/seed-demo";

export type DashboardSnapshot = {
  records: DashboardRecord[];
  kpis: typeof staticKpis;
  tabCounts: Partial<Record<DashboardTabId, number | null>>;
  totalRecords: number;
  source: "supabase" | "mock";
};

function formatDateParts(isoDate: string, isoTime?: string | null) {
  const date = isoTime ? new Date(`${isoDate}T${isoTime}`) : new Date(isoDate);
  return {
    date: date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function mapVentaToRecord(row: {
  id: string;
  codigo_comprobante: string | null;
  numero: string;
  cliente_nombre: string | null;
  total: number;
  estado_sunat: string | null;
  vendedor_nombre: string | null;
  vendedor_iniciales: string | null;
  fecha: string;
  hora_emision: string | null;
}): DashboardRecord {
  const { date, time } = formatDateParts(row.fecha, row.hora_emision);
  const statusMap: Record<string, DashboardStatus> = {
    aceptado: "Emitido",
    pendiente: "Pendiente",
    rechazado: "Pendiente",
  };

  return {
    id: row.id,
    date,
    time,
    area: "Facturación",
    document: row.codigo_comprobante ?? row.numero,
    detail: row.cliente_nombre ?? "Cliente",
    amount: Number(row.total),
    status: statusMap[row.estado_sunat ?? "pendiente"] ?? "Pendiente",
    responsible: row.vendedor_nombre ?? "Sin asignar",
    responsibleInitials: row.vendedor_iniciales ?? "SA",
    tab: "facturacion",
  };
}

function mapOportunidadToRecord(row: {
  id: string;
  codigo: string;
  titulo: string;
  cliente_nombre: string;
  valor: number;
  etapa: string;
  responsable_nombre: string;
  responsable_iniciales: string;
  fecha_oportunidad: string;
}): DashboardRecord {
  const date = new Date(row.fecha_oportunidad);
  return {
    id: row.id,
    date: date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false }),
    area: "CRM",
    document: row.codigo,
    detail: `${row.titulo} — ${row.cliente_nombre}`,
    amount: Number(row.valor),
    status: row.etapa === "Cierre ganado" ? "Completado" : "Pendiente",
    responsible: row.responsable_nombre,
    responsibleInitials: row.responsable_iniciales,
    tab: "crm",
  };
}

function mapClienteToRecord(row: {
  id: string;
  razon_social: string;
  ruc: string | null;
  ejecutivo_nombre: string | null;
  ejecutivo_iniciales: string | null;
  created_at: string;
}): DashboardRecord {
  const date = new Date(row.created_at);
  return {
    id: row.id,
    date: date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false }),
    area: "Clientes",
    document: row.ruc ?? "—",
    detail: row.razon_social,
    amount: null,
    status: "Activo",
    responsible: row.ejecutivo_nombre ?? "Sin asignar",
    responsibleInitials: row.ejecutivo_iniciales ?? "SA",
    tab: "resumen",
  };
}

function buildSnapshot(records: DashboardRecord[], source: "supabase" | "mock"): DashboardSnapshot {
  const totalIngresos = records
    .filter((r) => r.amount && r.area === "Facturación")
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const ventasCount = records.filter((r) => r.tab === "facturacion").length;
  const pendientesCxC = records.filter((r) => r.status === "Pendiente" && r.area === "Facturación").length;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0 && totalIngresos > 0) {
      return { ...kpi, value: `S/ ${Math.round(totalIngresos).toLocaleString("es-PE")}` };
    }
    if (index === 1 && ventasCount > 0) return { ...kpi, value: String(ventasCount) };
    if (index === 2 && pendientesCxC > 0) return { ...kpi, value: String(pendientesCxC) };
    return kpi;
  });

  const tabCounts: Partial<Record<DashboardTabId, number | null>> = {
    resumen: null,
    ventas: records.filter((r) => r.tab === "ventas" || r.area === "Ventas").length,
    crm: records.filter((r) => r.tab === "crm").length,
    facturacion: records.filter((r) => r.tab === "facturacion").length,
    inventario: records.filter((r) => r.tab === "inventario").length,
    compras: records.filter((r) => r.tab === "compras").length,
  };

  return { records, kpis, tabCounts, totalRecords: records.length, source };
}

export async function fetchDashboardSnapshot(userId: string | null): Promise<DashboardSnapshot> {
  if (!userId) {
    return buildSnapshot(mockRecords, "mock");
  }

  const [ventasRes, oportunidadesRes, clientesRes] = await Promise.all([
    supabase.from("ventas").select("*").eq("user_id", userId).order("fecha", { ascending: false }).limit(20),
    supabase.from("oportunidades").select("*").eq("user_id", userId).order("fecha_oportunidad", { ascending: false }).limit(15),
    supabase.from("clientes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
  ]);

  if (ventasRes.error && oportunidadesRes.error && clientesRes.error) {
    return buildSnapshot(mockRecords, "mock");
  }

  let ventas = ventasRes.data ?? [];
  let oportunidades = oportunidadesRes.data ?? [];
  let clientes = clientesRes.data ?? [];

  if (!ventas.length && !oportunidades.length && !clientes.length) {
    await seedDemoDataForUser(userId);
    const retry = await Promise.all([
      supabase.from("ventas").select("*").eq("user_id", userId).order("fecha", { ascending: false }).limit(20),
      supabase.from("oportunidades").select("*").eq("user_id", userId).order("fecha_oportunidad", { ascending: false }).limit(15),
      supabase.from("clientes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);
    ventas = retry[0].data ?? [];
    oportunidades = retry[1].data ?? [];
    clientes = retry[2].data ?? [];
  }

  const records: DashboardRecord[] = [
    ...ventas.map(mapVentaToRecord),
    ...oportunidades.map(mapOportunidadToRecord),
    ...clientes.map(mapClienteToRecord),
  ].sort((a, b) => {
    const da = new Date(`${a.date.split("/").reverse().join("-")}T${a.time}`);
    const db = new Date(`${b.date.split("/").reverse().join("-")}T${b.time}`);
    return db.getTime() - da.getTime();
  });

  if (!records.length) {
    return buildSnapshot(mockRecords, "mock");
  }

  return buildSnapshot(records, "supabase");
}

export { dashboardTabs } from "@/lib/dashboard-mock-data";
