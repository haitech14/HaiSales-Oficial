import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { buildInboxSnapshot } from "@/lib/inbox/providers";
import type {
  ChannelConnection,
  InboxChannel,
  InboxConversation,
  InboxMessage,
  InboxPriority,
  InboxSnapshot,
  InboxStage,
  InboxStatus,
} from "@/lib/inbox/types";

type InboxRow = Database["public"]["Tables"]["inbox_conversations"]["Row"];

export type InboxDataSnapshot = InboxSnapshot & {
  source: "supabase" | "mock";
};

function mapRowToConversation(row: InboxRow): InboxConversation {
  const advisor = row.advisor_name ?? "Sin asignar";
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const connectionId = row.connection_id ?? undefined;
  const sourcePhoneLabel =
    typeof metadata.source_phone_label === "string" ? metadata.source_phone_label : undefined;

  return {
    id: row.id,
    channel: row.channel as InboxChannel,
    connectionId: connectionId ?? undefined,
    sourcePhoneLabel,
    externalId: row.external_id,
    contact: {
      name: row.contact_name,
      identifier: row.contact_identifier,
      avatarUrl: row.contact_avatar_url ?? undefined,
    },
    lastMessage: row.last_message ?? "",
    lastMessageAt: row.last_message_at ?? row.updated_at,
    isRead: row.is_read,
    stage: row.stage as InboxStage,
    priority: row.priority as InboxPriority,
    status: row.status as InboxStatus,
    advisor,
    advisorInitials: row.advisor_initials ?? advisor.slice(0, 2).toUpperCase(),
    campaign: row.campaign ?? undefined,
    isAssigned: advisor !== "Sin asignar",
    contactType: "cliente",
  };
}

function buildSnapshotWithSource(
  conversations: InboxConversation[],
  source: "supabase" | "mock",
): InboxDataSnapshot {
  return {
    ...buildInboxSnapshot(conversations),
    source,
  };
}

export async function fetchInboxSnapshot(userId: string | null): Promise<InboxDataSnapshot> {
  if (!userId) {
    return buildSnapshotWithSource([], "supabase");
  }

  const { data, error } = await supabase
    .from("inbox_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (error) {
    console.warn("[inbox] Error al cargar conversaciones:", error.message);
    return buildSnapshotWithSource([], "supabase");
  }

  if (!data || data.length === 0) {
    return buildSnapshotWithSource([], "supabase");
  }

  return buildSnapshotWithSource(data.map(mapRowToConversation), "supabase");
}

export async function fetchInboxChannelConnections(userId: string): Promise<ChannelConnection[]> {
  const { data, error } = await supabase
    .from("inbox_channel_connections")
    .select("channel, status, display_name, last_sync_at, error_message")
    .eq("user_id", userId);

  if (error) {
    console.warn("[inbox] Error al cargar conexiones:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const config = (row.config ?? {}) as { phone_number_id?: string };
    return {
      id: row.id,
      channel: row.channel as InboxChannel,
      phoneNumberId: config.phone_number_id ?? row.external_account_id ?? undefined,
      status: row.status as ChannelConnection["status"],
      accountLabel: row.display_name ?? undefined,
      lastSyncAt: row.last_sync_at ?? undefined,
      errorMessage: row.error_message ?? undefined,
    };
  });
}

type MessageRow = Database["public"]["Tables"]["inbox_messages"]["Row"];

function mapRowToMessage(row: MessageRow): InboxMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction as InboxMessage["direction"],
    body: row.body,
    sentAt: row.sent_at,
  };
}

export async function fetchInboxMessages(conversationId: string): Promise<InboxMessage[]> {
  const { data, error } = await supabase
    .from("inbox_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });

  if (error) {
    console.warn("[inbox] Error al cargar mensajes:", error.message);
    return [];
  }

  return (data ?? []).map(mapRowToMessage);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from("inbox_conversations")
    .update({ is_read: true })
    .eq("id", conversationId);

  if (error) {
    console.warn("[inbox] Error al marcar conversación leída:", error.message);
  }
}

export async function sendInboxMessage(conversationId: string, body: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("whatsapp-send", {
    body: { conversationId, body },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }
}

export async function persistInboxConversations(
  userId: string,
  conversations: InboxConversation[],
): Promise<void> {
  if (conversations.length === 0) return;

  const rows = conversations.map((conv) => ({
    user_id: userId,
    channel: conv.channel,
    external_id: conv.externalId,
    contact_name: conv.contact.name,
    contact_identifier: conv.contact.identifier,
    contact_avatar_url: conv.contact.avatarUrl ?? null,
    last_message: conv.lastMessage,
    last_message_at: conv.lastMessageAt,
    is_read: conv.isRead,
    stage: conv.stage,
    priority: conv.priority,
    status: conv.status,
    advisor_name: conv.advisor,
    advisor_initials: conv.advisorInitials,
    campaign: conv.campaign ?? null,
  }));

  const { error } = await supabase
    .from("inbox_conversations")
    .upsert(rows, { onConflict: "user_id,channel,external_id" });

  if (error) {
    console.warn("[inbox] Error al persistir conversaciones:", error.message);
  }
}
