import type { InboxChannel, InboxConversation, InboxSnapshot } from "../types";
import type { InboxProvider, InboxProviderConfig } from "./types";
import { withRealKpi } from "@/lib/kpi-utils";

function createStubProvider(channel: InboxChannel): InboxProvider {
  let config: InboxProviderConfig = {};

  return {
    channel,
    isConfigured() {
      return Boolean(config.accessToken || config.apiUrl);
    },
    async connect(nextConfig) {
      config = { ...config, ...nextConfig };
    },
    async disconnect() {
      config = {};
    },
    async syncConversations() {
      return [];
    },
    async sendMessage(conversationExternalId, body) {
      if (!this.isConfigured()) {
        throw new Error(`Conecta la API de ${channel} antes de enviar mensajes.`);
      }
      console.info(`[${channel}] Mensaje enviado a ${conversationExternalId}:`, body);
    },
  };
}

const providers: InboxProvider[] = (
  ["whatsapp", "instagram", "facebook", "messenger", "tiktok", "web", "email"] as InboxChannel[]
).map(createStubProvider);

export function getInboxProvider(channel: InboxChannel): InboxProvider {
  const provider = providers.find((item) => item.channel === channel);
  if (!provider) throw new Error(`Proveedor no registrado: ${channel}`);
  return provider;
}

export function getAllInboxProviders(): InboxProvider[] {
  return providers;
}

export async function syncAllInboxProviders(): Promise<InboxConversation[]> {
  return [];
}

const STAGE_META = [
  { stage: "nuevo" as const, label: "Nuevos", color: "#38bdf8" },
  { stage: "seguimiento" as const, label: "En seguimiento", color: "#3b82f6" },
  { stage: "cotizado" as const, label: "Cotizados", color: "#8b5cf6" },
  { stage: "cerrado" as const, label: "Cerrados", color: "#22c55e" },
  { stage: "perdido" as const, label: "Perdidos", color: "#f43f5e" },
];

const KPI_TEMPLATES = [
  {
    label: "Conversaciones abiertas",
    value: "0",
    change: "Sin datos en el periodo",
    sparkColor: "#22c55e",
    sparkPoints: [0],
  },
  {
    label: "Leads nuevos",
    value: "0",
    change: "Sin datos en el periodo",
    sparkColor: "#8b5cf6",
    sparkPoints: [0],
  },
  {
    label: "Respuesta promedio",
    value: "—",
    change: "Sin datos en el periodo",
    sparkColor: "#f97316",
    sparkPoints: [0],
  },
  {
    label: "Conversión a venta",
    value: "0%",
    change: "Sin datos en el periodo",
    sparkColor: "#3b82f6",
    sparkPoints: [0],
  },
];

export function buildInboxSnapshot(conversations: InboxConversation[]): InboxSnapshot {
  const openCount = conversations.filter((conversation) => conversation.status === "activa").length;
  const newLeads = conversations.filter((conversation) => conversation.stage === "nuevo").length;
  const unanswered = conversations.filter(
    (conversation) => conversation.status === "activa" && !conversation.isRead,
  ).length;
  const waitingCustomer = conversations.filter(
    (conversation) => conversation.status === "activa" && conversation.stage === "seguimiento",
  ).length;
  const assigned = conversations.filter((conversation) => conversation.isAssigned).length;

  const stageStats = STAGE_META.map((meta) => ({
    ...meta,
    count: conversations.filter((conversation) => conversation.stage === meta.stage).length,
  }));

  const kpis = KPI_TEMPLATES.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(openCount));
    if (index === 1) return withRealKpi(kpi, String(newLeads));
    if (index === 2) {
      return conversations.length > 0
        ? { ...kpi, value: "—", change: "Calculando..." }
        : withRealKpi(kpi, "—");
    }
    return withRealKpi(kpi, conversations.length > 0 ? "0%" : "0%");
  });

  return {
    conversations,
    kpis,
    stageStats,
    advisorStats: [],
    pending: {
      unanswered,
      waitingCustomer,
      assigned,
    },
    updatedAt: new Date().toISOString(),
  };
}
