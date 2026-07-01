import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { buildInboxSnapshot, syncAllInboxProviders } from "@/lib/inbox/providers";
import type {
  InboxChannel,
  InboxConversation,
  InboxPriority,
  InboxSnapshot,
  InboxStage,
  InboxStatus,
} from "@/lib/inbox/types";
import { seedDemoDataForUser } from "@/lib/seed-demo";

type InboxRow = Database["public"]["Tables"]["inbox_conversations"]["Row"];

export type InboxDataSnapshot = InboxSnapshot & {
  source: "supabase" | "mock";
};

function mapRowToConversation(row: InboxRow): InboxConversation {
  const advisor = row.advisor_name ?? "Sin asignar";
  return {
    id: row.id,
    channel: row.channel as InboxChannel,
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
  };
}

function buildSnapshotWithSource(
  conversations: InboxConversation[],
  source: "supabase" | "mock",
): InboxDataSnapshot {
  const base = buildInboxSnapshot(conversations);

  const openCount = conversations.filter((c) => c.status === "activa").length;
  const newLeads = conversations.filter((c) => c.stage === "nuevo").length;

  const kpis = base.kpis.map((kpi, index) => {
    if (index === 0) return { ...kpi, value: String(openCount || kpi.value) };
    if (index === 1) return { ...kpi, value: String(newLeads || kpi.value) };
    return kpi;
  });

  const stageStats = base.stageStats.map((stat) => ({
    ...stat,
    count: conversations.filter((c) => c.stage === stat.stage).length || stat.count,
  }));

  return {
    ...base,
    kpis,
    stageStats,
    source,
  };
}

export async function fetchInboxSnapshot(userId: string | null): Promise<InboxDataSnapshot> {
  if (!userId) {
    const conversations = await syncAllInboxProviders();
    return buildSnapshotWithSource(conversations, "mock");
  }

  let { data, error } = await supabase
    .from("inbox_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (error) {
    console.warn("[inbox] Error al cargar conversaciones:", error.message);
    const conversations = await syncAllInboxProviders();
    return buildSnapshotWithSource(conversations, "mock");
  }

  if (!data || data.length === 0) {
    await seedDemoDataForUser(userId);
    const retry = await supabase
      .from("inbox_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });

    if (retry.error || !retry.data?.length) {
      const conversations = await syncAllInboxProviders();
      return buildSnapshotWithSource(conversations, "mock");
    }
    data = retry.data;
  }

  return buildSnapshotWithSource(data.map(mapRowToConversation), "supabase");
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
