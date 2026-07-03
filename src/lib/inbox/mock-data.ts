import type { InboxChannel, InboxConversation, InboxMessage } from "./types";

const mariaContact = {
  name: "María Fernanda Silva",
  identifier: "+51 987 654 321",
  phone: "+51 987 654 321",
  email: "maria.silva@email.com",
  location: "Lima, Perú",
  isFrequentClient: true,
  clientSince: "Ene 2024",
  totalPurchases: "S/ 12,450",
  orderCount: 8,
  tags: ["Interesado", "Muebles", "Lima", "Hot Lead"],
  previousConversations: [
    { id: "prev-1", title: "Pedido #F001-1254", date: "15 Jun 2026", channel: "whatsapp" as InboxChannel },
    { id: "prev-2", title: "Consulta catálogo", date: "02 May 2026", channel: "instagram" as InboxChannel },
    { id: "prev-3", title: "Cotización muebles", date: "18 Abr 2026", channel: "whatsapp" as InboxChannel },
  ],
  internalNotes: [
    {
      id: "note-1",
      author: "Carlos R.",
      date: "28 Jun 2026",
      body: "Cliente interesada en línea de muebles de oficina. Enviar catálogo actualizado.",
    },
    {
      id: "note-2",
      author: "Ana P.",
      date: "15 Jun 2026",
      body: "Compra frecuente. Ofrecer descuento por volumen en próximo pedido.",
    },
  ],
};

export const mockInboxConversations: InboxConversation[] = [
  {
    id: "conv-maria",
    channel: "whatsapp",
    externalId: "wa-maria",
    contact: mariaContact,
    lastMessage: "¿Tienen disponible el modelo Oslo en color gris?",
    lastMessageAt: "2026-07-01T11:30:00",
    isRead: false,
    stage: "seguimiento",
    priority: "alta",
    status: "activa",
    advisor: "Carlos Ruiz",
    advisorInitials: "CR",
    isAssigned: true,
    contactType: "cliente",
  },
  {
    id: "conv-002",
    channel: "instagram",
    externalId: "ig-lucia",
    contact: {
      name: "Lucía Mendoza",
      identifier: "@lucia.mendoza",
      phone: "+51 912 334 556",
      email: "lucia@email.com",
      location: "Arequipa, Perú",
      tags: ["Nuevo", "Decoración"],
    },
    lastMessage: "Vi su publicación en stories, ¿hacen envíos?",
    lastMessageAt: "2026-07-01T10:45:00",
    isRead: false,
    stage: "nuevo",
    priority: "media",
    status: "activa",
    advisor: "Ana Pérez",
    advisorInitials: "AP",
    isAssigned: true,
    contactType: "lead",
  },
  {
    id: "conv-003",
    channel: "facebook",
    externalId: "fb-roberto",
    contact: {
      name: "Roberto Vargas",
      identifier: "FB: roberto.vargas",
      phone: "+51 945 221 889",
    },
    lastMessage: "Necesito cotización para 20 sillas ergonómicas",
    lastMessageAt: "2026-07-01T09:20:00",
    isRead: true,
    stage: "cotizado",
    priority: "alta",
    status: "activa",
    advisor: "Laura Martínez",
    advisorInitials: "LM",
    isAssigned: true,
    contactType: "cliente",
  },
  {
    id: "conv-004",
    channel: "whatsapp",
    externalId: "wa-carmen",
    contact: {
      name: "Carmen Delgado",
      identifier: "+51 978 112 334",
    },
    lastMessage: "Gracias por la información, lo reviso y les escribo",
    lastMessageAt: "2026-07-01T08:15:00",
    isRead: true,
    stage: "seguimiento",
    priority: "baja",
    status: "activa",
    advisor: "Jorge Díaz",
    advisorInitials: "JD",
    isAssigned: true,
    contactType: "prospecto",
  },
  {
    id: "conv-005",
    channel: "web",
    externalId: "web-4821",
    contact: {
      name: "Visitante Web #4821",
      identifier: "chat.haisales.com/4821",
      email: "visitante4821@email.com",
    },
    lastMessage: "Hola, necesito integrar inventario con facturación",
    lastMessageAt: "2026-06-30T16:30:00",
    isRead: false,
    stage: "nuevo",
    priority: "media",
    status: "activa",
    advisor: "Sin asignar",
    advisorInitials: "—",
    isAssigned: false,
    contactType: "lead",
  },
  {
    id: "conv-006",
    channel: "email",
    externalId: "mail-norte",
    contact: {
      name: "Comercial Norte EIRL",
      identifier: "ventas@comercialnorte.pe",
      email: "ventas@comercialnorte.pe",
    },
    lastMessage: "Re: Cotización — ¿pueden mejorar el plazo de pago?",
    lastMessageAt: "2026-06-30T14:10:00",
    isRead: true,
    stage: "cotizado",
    priority: "alta",
    status: "activa",
    advisor: "Sin asignar",
    advisorInitials: "—",
    isAssigned: false,
    contactType: "cliente",
  },
  {
    id: "conv-007",
    channel: "instagram",
    externalId: "ig-ferre",
    contact: {
      name: "Ferretería El Sol",
      identifier: "@ferreteria_el_sol",
    },
    lastMessage: "Quiero saber precios para mi ferretería",
    lastMessageAt: "2026-06-30T11:00:00",
    isRead: false,
    stage: "nuevo",
    priority: "alta",
    status: "activa",
    advisor: "Sin asignar",
    advisorInitials: "—",
    isAssigned: false,
    contactType: "lead",
  },
  {
    id: "conv-008",
    channel: "whatsapp",
    externalId: "wa-andina",
    contact: {
      name: "Distribuidora Andina",
      identifier: "+51 987 654 321",
      phone: "+51 987 654 321",
      isFrequentClient: true,
      clientSince: "Mar 2023",
      totalPurchases: "S/ 45,200",
      orderCount: 22,
      tags: ["Corporativo", "Lima"],
    },
    lastMessage: "¿Tienen disponibilidad del plan Pro para 5 usuarios?",
    lastMessageAt: "2026-06-30T10:35:00",
    isRead: true,
    stage: "seguimiento",
    priority: "alta",
    status: "activa",
    advisor: "Laura Martínez",
    advisorInitials: "LM",
    isAssigned: true,
    contactType: "cliente",
    campaign: "WhatsApp Ads Q2",
  },
];

export const mockInboxMessages: InboxMessage[] = [
  {
    id: "msg-1",
    conversationId: "conv-maria",
    direction: "inbound",
    body: "Hola, buen día 👋",
    sentAt: "2026-07-01T09:15:00",
  },
  {
    id: "msg-2",
    conversationId: "conv-maria",
    direction: "outbound",
    body: "¡Hola María! Buen día, gracias por escribirnos. ¿En qué podemos ayudarte hoy?",
    sentAt: "2026-07-01T09:18:00",
  },
  {
    id: "msg-3",
    conversationId: "conv-maria",
    direction: "inbound",
    body: "Estoy buscando un escritorio para mi home office. Vi el modelo Oslo en su catálogo.",
    sentAt: "2026-07-01T09:22:00",
  },
  {
    id: "msg-4",
    conversationId: "conv-maria",
    direction: "outbound",
    body: "Excelente elección. El modelo Oslo está disponible en 3 colores: gris, blanco y nogal. ¿Cuál te interesa?",
    sentAt: "2026-07-01T09:25:00",
  },
  {
    id: "msg-5",
    conversationId: "conv-maria",
    direction: "inbound",
    body: "¿Tienen disponible el modelo Oslo en color gris?",
    sentAt: "2026-07-01T11:30:00",
  },
];

export function getMessagesForConversation(conversationId: string): InboxMessage[] {
  const messages = mockInboxMessages.filter((m) => m.conversationId === conversationId);
  if (messages.length > 0) return messages;

  const conversation = mockInboxConversations.find((c) => c.id === conversationId);
  if (!conversation) return [];

  return [
    {
      id: `auto-${conversationId}`,
      conversationId,
      direction: "inbound",
      body: conversation.lastMessage,
      sentAt: conversation.lastMessageAt,
    },
    {
      id: `reply-${conversationId}`,
      conversationId,
      direction: "outbound",
      body: `Hola ${conversation.contact.name.split(" ")[0]}, gracias por escribirnos. Un asesor te atenderá en breve.`,
      sentAt: conversation.lastMessageAt,
      isAutoReply: true,
    },
  ];
}

export function getMockConversationsByChannel(channel: InboxChannel): InboxConversation[] {
  return mockInboxConversations.filter((conversation) => conversation.channel === channel);
}

export function filterInboxConversations(
  conversations: InboxConversation[],
  filters: {
    view: string;
    advisor: string;
    search: string;
  },
): InboxConversation[] {
  return conversations.filter((conversation) => {
    if (filters.view === "unread" && conversation.isRead) return false;
    if (
      filters.view !== "all" &&
      filters.view !== "unread" &&
      filters.view !== "team-chat" &&
      conversation.channel !== filters.view
    ) {
      return false;
    }
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

export function splitConversationsByAssignment(conversations: InboxConversation[]) {
  const assigned = conversations.filter((c) => c.isAssigned !== false && c.advisor !== "Sin asignar");
  const unassigned = conversations.filter((c) => c.isAssigned === false || c.advisor === "Sin asignar");
  return { assigned, unassigned };
}
