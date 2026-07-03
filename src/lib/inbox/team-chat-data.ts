export type TeamChatChannel = "ventas" | "soporte" | "envios";

export type TeamChatMessage = {
  id: string;
  channel: TeamChatChannel;
  authorName: string;
  authorInitials: string;
  body: string;
  sentAt: string;
};

export const teamChatChannels: Array<{
  id: TeamChatChannel;
  label: string;
  description: string;
  color: string;
}> = [
  {
    id: "ventas",
    label: "Ventas",
    description: "Coordinación comercial y cierres",
    color: "#3b82f6",
  },
  {
    id: "soporte",
    label: "Soporte",
    description: "Incidencias y atención técnica",
    color: "#8b5cf6",
  },
  {
    id: "envios",
    label: "Envíos",
    description: "Logística y entregas",
    color: "#f59e0b",
  },
];

const seedMessages: TeamChatMessage[] = [
  {
    id: "tc-ventas-1",
    channel: "ventas",
    authorName: "Ana Pérez",
    authorInitials: "AP",
    body: "¿Alguien puede confirmar stock del modelo Oslo antes de la reunión de las 3pm?",
    sentAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "tc-ventas-2",
    channel: "ventas",
    authorName: "Carlos Ruiz",
    authorInitials: "CR",
    body: "Sí, hay 12 unidades en almacén central.",
    sentAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "tc-soporte-1",
    channel: "soporte",
    authorName: "Laura Martínez",
    authorInitials: "LM",
    body: "Ticket #1842 resuelto. Era configuración de facturación en SUNAT.",
    sentAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "tc-envios-1",
    channel: "envios",
    authorName: "Jorge Díaz",
    authorInitials: "JD",
    body: "Guía GR-2026-0412 salió con courier. ETA mañana 10am.",
    sentAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
];

function storageKey(userId: string) {
  return `haisales_team_chat_${userId}`;
}

export function loadTeamChatMessages(userId: string | undefined): TeamChatMessage[] {
  if (!userId) return seedMessages;

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      localStorage.setItem(storageKey(userId), JSON.stringify(seedMessages));
      return seedMessages;
    }
    const parsed = JSON.parse(raw) as TeamChatMessage[];
    return Array.isArray(parsed) ? parsed : seedMessages;
  } catch {
    return seedMessages;
  }
}

export function saveTeamChatMessages(userId: string, messages: TeamChatMessage[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(messages));
}

export function appendTeamChatMessage(
  userId: string,
  channel: TeamChatChannel,
  body: string,
  authorName: string,
  authorInitials: string,
): TeamChatMessage[] {
  const current = loadTeamChatMessages(userId);
  const message: TeamChatMessage = {
    id: `tc-${channel}-${Date.now()}`,
    channel,
    authorName,
    authorInitials,
    body,
    sentAt: new Date().toISOString(),
  };
  const next = [...current, message];
  saveTeamChatMessages(userId, next);
  return next;
}

export function countTeamChatMessagesByChannel(messages: TeamChatMessage[]) {
  return teamChatChannels.reduce(
    (acc, channel) => {
      acc[channel.id] = messages.filter((item) => item.channel === channel.id).length;
      return acc;
    },
    {} as Record<TeamChatChannel, number>,
  );
}
