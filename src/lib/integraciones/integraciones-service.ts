import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  integraciones as catalogIntegraciones,
  integracionesKpis as staticKpis,
  type IntegracionEstado,
  type IntegracionItem,
} from "@/lib/integraciones-mock-data";

type ConnectionRow = Database["public"]["Tables"]["inbox_channel_connections"]["Row"];

export type IntegracionesSnapshot = {
  items: IntegracionItem[];
  kpis: typeof staticKpis;
  source: "supabase" | "mock";
};

const CHANNEL_TO_INTEGRATION: Record<string, string> = {
  whatsapp: "whatsapp",
  email: "sunat",
  web: "woocommerce",
};

function mapStatus(status: string): IntegracionEstado {
  if (status === "connected") return "Conectado";
  if (status === "error") return "Error";
  return "Pendiente";
}

function formatSync(iso: string | null) {
  if (!iso) return undefined;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  return `Hace ${mins} min`;
}

function mergeConnections(connections: ConnectionRow[]): IntegracionItem[] {
  const merged = catalogIntegraciones.map((item) => ({ ...item }));

  for (const connection of connections) {
    const integrationId = CHANNEL_TO_INTEGRATION[connection.channel] ?? connection.channel;
    const index = merged.findIndex((item) => item.id === integrationId);
    if (index >= 0) {
      merged[index] = {
        ...merged[index],
        estado: mapStatus(connection.status),
        ultimaSync: formatSync(connection.last_sync_at),
      };
    }
  }

  return merged;
}

function buildSnapshot(items: IntegracionItem[], source: "supabase" | "mock"): IntegracionesSnapshot {
  const activas = items.filter((i) => i.estado === "Conectado").length;
  const pendientes = items.filter((i) => i.estado === "Pendiente").length;
  const errores = items.filter((i) => i.estado === "Error").length;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return { ...kpi, value: String(activas) };
    if (index === 1) return { ...kpi, value: String(pendientes) };
    return { ...kpi, value: String(errores) };
  });

  return { items, kpis, source };
}

export async function fetchIntegracionesSnapshot(userId: string | null): Promise<IntegracionesSnapshot> {
  if (!userId) {
    return buildSnapshot(catalogIntegraciones, "supabase");
  }

  const { data, error } = await supabase
    .from("inbox_channel_connections")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.warn("[integraciones] Error al cargar:", error.message);
    return buildSnapshot(catalogIntegraciones, "supabase");
  }

  if (!data?.length) {
    return buildSnapshot(catalogIntegraciones, "supabase");
  }

  return buildSnapshot(mergeConnections(data), "supabase");
}

export { integracionesKpis } from "@/lib/integraciones-mock-data";
