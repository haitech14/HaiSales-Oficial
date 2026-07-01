import type { InboxChannel, InboxConversation } from "./types";

const baseConversations: Omit<InboxConversation, "channel" | "externalId">[] = [
  {
    id: "conv-001",
    contact: { name: "Distribuidora Andina", identifier: "+51 987 654 321" },
    lastMessage: "¿Tienen disponibilidad del plan Pro para 5 usuarios?",
    lastMessageAt: "2026-06-30T10:35:00",
    isRead: true,
    stage: "seguimiento",
    priority: "alta",
    status: "activa",
    advisor: "Laura Martínez",
    advisorInitials: "LM",
    campaign: "WhatsApp Ads Q2",
  },
  {
    id: "conv-002",
    contact: { name: "TechSolutions SAC", identifier: "techsolutions@email.com" },
    lastMessage: "Adjunto la orden de compra para revisión.",
    lastMessageAt: "2026-06-30T09:48:00",
    isRead: true,
    stage: "cotizado",
    priority: "alta",
    status: "activa",
    advisor: "Carlos Ruiz",
    advisorInitials: "CR",
  },
  {
    id: "conv-003",
    contact: { name: "María López", identifier: "FB: maria.lopez.retail" },
    lastMessage: "Vi su publicación, ¿hacen demo hoy?",
    lastMessageAt: "2026-06-30T09:12:00",
    isRead: false,
    stage: "nuevo",
    priority: "media",
    status: "activa",
    advisor: "Ana Pérez",
    advisorInitials: "AP",
    campaign: "Facebook Lead Gen",
  },
  {
    id: "conv-004",
    contact: { name: "Importaciones Luna", identifier: "+51 912 445 887" },
    lastMessage: "Perfecto, agendamos la capacitación para el viernes.",
    lastMessageAt: "2026-06-29T18:20:00",
    isRead: true,
    stage: "cerrado",
    priority: "baja",
    status: "cerrada",
    advisor: "Laura Martínez",
    advisorInitials: "LM",
  },
  {
    id: "conv-005",
    contact: { name: "Retail Express", identifier: "m.me/retailexpress.pe" },
    lastMessage: "¿El módulo de facturación incluye notas de crédito?",
    lastMessageAt: "2026-06-29T16:05:00",
    isRead: true,
    stage: "seguimiento",
    priority: "media",
    status: "activa",
    advisor: "Jorge Díaz",
    advisorInitials: "JD",
  },
  {
    id: "conv-006",
    contact: { name: "Usuario TikTok @ferre_max", identifier: "@ferre_max" },
    lastMessage: "Quiero saber precios para mi ferretería.",
    lastMessageAt: "2026-06-29T14:30:00",
    isRead: false,
    stage: "nuevo",
    priority: "alta",
    status: "activa",
    advisor: "Carlos Ruiz",
    advisorInitials: "CR",
    campaign: "TikTok Inbox",
  },
  {
    id: "conv-007",
    contact: { name: "Visitante Web #4821", identifier: "chat.haisales.com/4821" },
    lastMessage: "Hola, necesito integrar inventario con facturación.",
    lastMessageAt: "2026-06-29T11:15:00",
    isRead: true,
    stage: "nuevo",
    priority: "media",
    status: "activa",
    advisor: "Ana Pérez",
    advisorInitials: "AP",
  },
  {
    id: "conv-008",
    contact: { name: "Comercial Norte EIRL", identifier: "ventas@comercialnorte.pe" },
    lastMessage: "Re: Cotización HaiSales — ¿pueden mejorar el plazo de pago?",
    lastMessageAt: "2026-06-29T09:40:00",
    isRead: true,
    stage: "cotizado",
    priority: "alta",
    status: "activa",
    advisor: "Laura Martínez",
    advisorInitials: "LM",
  },
  {
    id: "conv-009",
    contact: { name: "Servicios Integrales", identifier: "+51 956 778 234" },
    lastMessage: "Gracias, por ahora no continuamos.",
    lastMessageAt: "2026-06-28T17:55:00",
    isRead: true,
    stage: "perdido",
    priority: "baja",
    status: "cerrada",
    advisor: "Jorge Díaz",
    advisorInitials: "JD",
  },
  {
    id: "conv-010",
    contact: { name: "Constructora Norte", identifier: "FB: constructora.norte" },
    lastMessage: "¿Tienen integración con SUNAT para facturación?",
    lastMessageAt: "2026-06-28T15:22:00",
    isRead: true,
    stage: "seguimiento",
    priority: "media",
    status: "activa",
    advisor: "Carlos Ruiz",
    advisorInitials: "CR",
  },
];

const channelAssignment: Record<string, InboxChannel> = {
  "conv-001": "whatsapp",
  "conv-002": "email",
  "conv-003": "facebook",
  "conv-004": "whatsapp",
  "conv-005": "messenger",
  "conv-006": "tiktok",
  "conv-007": "web",
  "conv-008": "email",
  "conv-009": "whatsapp",
  "conv-010": "facebook",
};

export const mockInboxConversations: InboxConversation[] = baseConversations.map((item) => {
  const channel = channelAssignment[item.id] ?? "whatsapp";
  return {
    ...item,
    channel,
    externalId: `${channel}-${item.id}`,
  };
});

export function getMockConversationsByChannel(channel: InboxChannel): InboxConversation[] {
  return mockInboxConversations.filter((conversation) => conversation.channel === channel);
}

export function filterInboxConversations(
  conversations: InboxConversation[],
  filters: {
    tab: string;
    channel: InboxChannel | "all";
    advisor: string;
    search: string;
  },
): InboxConversation[] {
  return conversations.filter((conversation) => {
    if (filters.tab !== "todos" && conversation.stage !== filters.tab) return false;
    if (filters.channel !== "all" && conversation.channel !== filters.channel) return false;
    if (filters.advisor !== "all" && conversation.advisor !== filters.advisor) return false;
    if (!filters.search.trim()) return true;

    const query = filters.search.toLowerCase();
    return (
      conversation.contact.name.toLowerCase().includes(query) ||
      conversation.contact.identifier.toLowerCase().includes(query) ||
      conversation.lastMessage.toLowerCase().includes(query) ||
      (conversation.campaign?.toLowerCase().includes(query) ?? false) ||
      conversation.advisor.toLowerCase().includes(query)
    );
  });
}
