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

const DEMO_MESSAGE_IDS = new Set([
  "tc-ventas-1",
  "tc-ventas-2",
  "tc-soporte-1",
  "tc-envios-1",
]);

function withoutDemoMessages(messages: TeamChatMessage[]): TeamChatMessage[] {
  return messages.filter((message) => !DEMO_MESSAGE_IDS.has(message.id));
}

function storageKey(userId: string) {
  return `haisales_team_chat_${userId}`;
}

export function loadTeamChatMessages(userId: string | undefined): TeamChatMessage[] {
  if (!userId) return [];

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as TeamChatMessage[];
    if (!Array.isArray(parsed)) return [];

    const cleaned = withoutDemoMessages(parsed);
    if (cleaned.length !== parsed.length) {
      saveTeamChatMessages(userId, cleaned);
    }
    return cleaned;
  } catch {
    return [];
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
