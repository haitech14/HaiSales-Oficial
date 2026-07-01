import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  clientesKpis as staticKpis,
  clientesTabs,
  clients as mockClients,
  type ClientRecord,
  type ClientSegment,
  type ClientStatus,
} from "@/lib/clientes-mock-data";
import { seedDemoDataForUser } from "@/lib/seed-demo";

type ClienteRow = Database["public"]["Tables"]["clientes"]["Row"];

export type ClientesSnapshot = {
  clients: ClientRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

const ESTADO_FROM_DB: Record<string, ClientStatus> = {
  activo: "Activo",
  prospecto: "Prospecto",
  con_deuda: "Con deuda",
  inactivo: "Inactivo",
};

function formatDate(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function mapRowToClient(row: ClienteRow): ClientRecord {
  const ejecutivo = row.ejecutivo_nombre ?? "Sin asignar";
  return {
    id: row.id,
    fechaAlta: formatDate(row.fecha_alta),
    ruc: row.ruc ?? "—",
    razonSocial: row.razon_social,
    contacto: row.contacto_nombre ?? "—",
    cargo: row.contacto_cargo ?? "—",
    telefono: row.telefono ?? "—",
    segmento: row.segmento as ClientSegment,
    estado: ESTADO_FROM_DB[row.estado_comercial] ?? "Activo",
    ejecutivo,
    ejecutivoInitials:
      row.ejecutivo_iniciales ?? ejecutivo.slice(0, 2).toUpperCase(),
  };
}

function mapMockToClient(client: (typeof mockClients)[number]): ClientRecord {
  return { ...client };
}

function buildSnapshot(clients: ClientRecord[], source: "supabase" | "mock"): ClientesSnapshot {
  const activos = clients.filter((c) => c.estado === "Activo").length;
  const prospectos = clients.filter((c) => c.estado === "Prospecto").length;
  const morosos = clients.filter((c) => c.estado === "Con deuda").length;
  const inactivos = clients.filter((c) => c.estado === "Inactivo").length;

  const tabCounts: Record<string, number | null> = {
    todos: null,
    activos,
    prospectos,
    morosos,
    inactivos,
  };

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return { ...kpi, value: String(activos || kpi.value) };
    if (index === 1) return { ...kpi, value: String(prospectos || kpi.value) };
    if (index === 2) return { ...kpi, value: String(morosos || kpi.value) };
    return kpi;
  });

  return {
    clients,
    kpis,
    tabCounts,
    totalRecords: clients.length,
    source,
  };
}

export async function fetchClientesSnapshot(userId: string | null): Promise<ClientesSnapshot> {
  if (!userId) {
    return buildSnapshot(mockClients.map(mapMockToClient), "mock");
  }

  let { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("user_id", userId)
    .order("fecha_alta", { ascending: false });

  if (error) {
    console.warn("[clientes] Error al cargar clientes:", error.message);
    return buildSnapshot(mockClients.map(mapMockToClient), "mock");
  }

  if (!data || data.length === 0) {
    await seedDemoDataForUser(userId);
    const retry = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", userId)
      .order("fecha_alta", { ascending: false });

    if (retry.error || !retry.data?.length) {
      return buildSnapshot(mockClients.map(mapMockToClient), "mock");
    }
    data = retry.data;
  }

  return buildSnapshot(data.map(mapRowToClient), "supabase");
}

export { clientesTabs, getClientStatusStyles, getSegmentStyles } from "@/lib/clientes-mock-data";
