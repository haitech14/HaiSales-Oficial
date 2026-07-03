import type { InboxChannel, InboxConversation, InboxSnapshot } from "../types";
import type { InboxProvider, InboxProviderConfig } from "./types";
import { getMockConversationsByChannel } from "../mock-data";

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
      return getMockConversationsByChannel(channel);
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
  const batches = await Promise.all(providers.map((provider) => provider.syncConversations()));
  return batches
    .flat()
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export function buildInboxSnapshot(conversations: InboxConversation[]): InboxSnapshot {
  const stageStats = [
    { stage: "nuevo" as const, label: "Nuevos", count: 32, color: "#38bdf8" },
    { stage: "seguimiento" as const, label: "En seguimiento", count: 28, color: "#3b82f6" },
    { stage: "cotizado" as const, label: "Cotizados", count: 18, color: "#8b5cf6" },
    { stage: "cerrado" as const, label: "Cerrados", count: 12, color: "#22c55e" },
    { stage: "perdido" as const, label: "Perdidos", count: 8, color: "#f43f5e" },
  ];

  return {
    conversations,
    kpis: [
      {
        label: "Conversaciones abiertas",
        value: "186",
        change: "+12.5% vs. ayer",
        changePositive: true,
        sparkColor: "#22c55e",
        sparkPoints: [142, 148, 151, 158, 162, 168, 172, 178, 182, 186],
      },
      {
        label: "Leads nuevos",
        value: "54",
        change: "+8.0% vs. ayer",
        changePositive: true,
        sparkColor: "#8b5cf6",
        sparkPoints: [38, 40, 42, 44, 46, 48, 50, 51, 53, 54],
      },
      {
        label: "Respuesta promedio",
        value: "3m 20s",
        change: "-15% vs. ayer",
        changePositive: true,
        sparkColor: "#f97316",
        sparkPoints: [280, 260, 250, 240, 230, 220, 210, 205, 202, 200],
      },
      {
        label: "Conversión a venta",
        value: "18.4%",
        change: "+2.3% vs. ayer",
        changePositive: true,
        sparkColor: "#3b82f6",
        sparkPoints: [14, 14.5, 15, 15.5, 16, 16.8, 17.2, 17.8, 18.1, 18.4],
      },
    ],
    stageStats,
    advisorStats: [
      { name: "Laura Martínez", initials: "LM", responseRate: 94 },
      { name: "Carlos Ruiz", initials: "CR", responseRate: 88 },
      { name: "Ana Pérez", initials: "AP", responseRate: 82 },
      { name: "Jorge Díaz", initials: "JD", responseRate: 76 },
    ],
    pending: {
      unanswered: 42,
      waitingCustomer: 27,
      assigned: 16,
    },
    updatedAt: new Date().toISOString(),
  };
}
