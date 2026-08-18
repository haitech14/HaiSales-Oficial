import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZERNIO_BASE = "https://zernio.com/api/v1";
const ZAVU_BASE = "https://api.zavu.dev/v1";

type ConversationRow = {
  id: string;
  user_id: string;
  contact_identifier: string;
  external_id?: string | null;
  metadata: Record<string, unknown> | null;
};

type ZernioMessage = {
  id: string;
  message?: string | null;
  direction?: string;
  createdAt?: string;
  sentAt?: string;
  attachments?: Array<{ type?: string; url?: string; filename?: string }>;
};

type ZavuMessage = {
  id: string;
  text?: string | null;
  status?: string;
  direction?: string;
  from?: string;
  to?: string;
  messageType?: string;
  createdAt?: string;
  content?: { mediaUrl?: string; filename?: string };
};

type KapsoMessage = {
  id: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  kapso?: {
    direction?: string;
    content?: string | null;
    media_url?: string | null;
    media_data?: { filename?: string };
  };
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

function attachmentLabel(type?: string, filename?: string): string {
  if (filename?.trim()) return filename.trim();
  if (type === "image") return "[Imagen]";
  if (type === "video") return "[Video]";
  if (type === "audio") return "[Audio]";
  return "[Adjunto]";
}

function mapZernioDirection(direction?: string): "inbound" | "outbound" {
  return direction === "outgoing" || direction === "outbound" ? "outbound" : "inbound";
}

function zavuRemoteIdFromExternal(externalId?: string | null): string {
  const match = /^(?:zavu:(?:whatsapp|facebook|instagram|messenger):)(.+)$/.exec(externalId ?? "");
  return match?.[1] ?? "";
}

function mapZavuDirection(
  message: ZavuMessage,
  contactIdentifier?: string,
): "inbound" | "outbound" {
  const direction = (message.direction ?? "").toLowerCase();
  if (direction === "inbound" || direction === "incoming" || direction === "in") return "inbound";
  if (direction === "outbound" || direction === "outgoing" || direction === "out") return "outbound";

  const status = (message.status ?? "").toLowerCase();
  if (status === "received" || status === "inbound") return "inbound";
  if (status === "sent" || status === "delivered" || status === "read" || status === "queued") {
    return "outbound";
  }

  const fromDigits = (message.from ?? "").replace(/\D/g, "");
  const contactDigits = (contactIdentifier ?? "").replace(/\D/g, "");
  if (fromDigits.length >= 6 && contactDigits.length >= 6) {
    if (fromDigits.endsWith(contactDigits.slice(-9)) || contactDigits.endsWith(fromDigits.slice(-9))) {
      return "inbound";
    }
  }
  if (message.from && contactIdentifier && message.from === contactIdentifier) return "inbound";

  return "outbound";
}

async function fetchZernioMessages(conversationId: string, accountId: string): Promise<ZernioMessage[]> {
  const apiKey = getEnv("ZERNIO_API_KEY");
  const all: ZernioMessage[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({
      accountId,
      limit: "100",
      sortOrder: "asc",
    });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(
      `${ZERNIO_BASE}/inbox/conversations/${encodeURIComponent(conversationId)}/messages?${params}`,
      { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } },
    );
    const payload = await response.json().catch(() => ({})) as {
      messages?: ZernioMessage[];
      pagination?: { hasMore?: boolean; nextCursor?: string | null };
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error || `Zernio mensajes ${response.status}`);
    }
    const rows = payload.messages ?? [];
    all.push(...rows);
    cursor = payload.pagination?.nextCursor ?? undefined;
    if (!payload.pagination?.hasMore || !cursor || rows.length === 0) break;
  }

  return all;
}

async function fetchKapsoMessages(conversationId: string, phoneNumberId?: string): Promise<KapsoMessage[]> {
  const apiKey = getEnv("KAPSO_API_KEY");
  const base = (Deno.env.get("KAPSO_API_BASE_URL") ?? "https://api.kapso.ai").replace(/\/$/, "");
  const all: KapsoMessage[] = [];
  let after: string | undefined;

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({
      conversation_id: conversationId,
      limit: "100",
    });
    if (phoneNumberId) params.set("phone_number_id", phoneNumberId);
    if (after) params.set("after", after);

    const response = await fetch(`${base}/platform/v1/whatsapp/messages?${params}`, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    const payload = await response.json().catch(() => ({})) as {
      data?: KapsoMessage[];
      paging?: { cursors?: { after?: string } };
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error || `Kapso mensajes ${response.status}`);
    }
    const rows = payload.data ?? [];
    all.push(...rows);
    after = payload.paging?.cursors?.after;
    if (!after || rows.length === 0) break;
  }

  return all;
}

function kapsoSentAt(timestamp?: string): string {
  if (!timestamp) return new Date().toISOString();
  const numeric = Number(timestamp);
  if (Number.isFinite(numeric) && numeric > 0) {
    return new Date(numeric * 1000).toISOString();
  }
  return timestamp;
}

async function fetchZavuMessages(conversationId: string): Promise<ZavuMessage[]> {
  const apiKey = getEnv("ZAVUDEV_API_KEY");
  const all: ZavuMessage[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(
      `${ZAVU_BASE}/conversations/${encodeURIComponent(conversationId)}/messages?${params}`,
      { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } },
    );
    const payload = await response.json().catch(() => ({})) as {
      items?: ZavuMessage[];
      nextCursor?: string | null;
      error?: string;
      message?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error || payload.message || `Zavu mensajes ${response.status}`);
    }
    const rows = payload.items ?? [];
    all.push(...rows);
    cursor = payload.nextCursor ?? undefined;
    if (!cursor || rows.length === 0) break;
  }

  return all;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
    const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "No autorizado" }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Sesión inválida" }, 401);

    const body = (await req.json().catch(() => ({}))) as { conversationId?: string };
    const conversationId = body.conversationId?.trim();
    if (!conversationId) return jsonResponse({ error: "Falta conversationId" }, 400);

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: conversation, error: convError } = await admin
      .from("inbox_conversations")
      .select("id, user_id, contact_identifier, external_id, metadata")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (convError || !conversation) {
      return jsonResponse({ error: "Conversación no encontrada" }, 404);
    }

    const row = conversation as ConversationRow;
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const provider = typeof metadata.provider === "string" ? metadata.provider : "";
    const remoteConversationId =
      (typeof metadata.conversation_id === "string" ? metadata.conversation_id : "") ||
      zavuRemoteIdFromExternal(row.external_id);
    const accountId = typeof metadata.account_id === "string" ? metadata.account_id : "";
    const kapsoConversationId =
      typeof metadata.kapso_conversation_id === "string" ? metadata.kapso_conversation_id : "";
    const kapsoPhoneNumberId =
      typeof metadata.phone_number_id === "string" ? metadata.phone_number_id : "";
    const isKapso = provider === "kapso" || Boolean(kapsoConversationId);

    const inserts: Record<string, unknown>[] = [];

    if (provider === "zernio" && remoteConversationId && accountId) {
      const messages = await fetchZernioMessages(remoteConversationId, accountId);
      for (const message of messages) {
        const attachment = message.attachments?.[0];
        const bodyText =
          message.message?.trim() ||
          attachmentLabel(attachment?.type, attachment?.filename);
        inserts.push({
          conversation_id: row.id,
          user_id: user.id,
          external_id: `zernio:${message.id}`,
          direction: mapZernioDirection(message.direction),
          body: bodyText.slice(0, 4000),
          sent_at: message.sentAt || message.createdAt || new Date().toISOString(),
          metadata: {
            provider: "zernio",
            attachment_url: attachment?.url ?? null,
            attachment_type: attachment?.type ?? null,
          },
        });
      }
    } else if (isKapso && kapsoConversationId) {
      const messages = await fetchKapsoMessages(kapsoConversationId, kapsoPhoneNumberId);
      for (const message of messages) {
        const bodyText =
          message.kapso?.content?.trim() ||
          message.text?.body?.trim() ||
          attachmentLabel(message.type, message.kapso?.media_data?.filename);
        inserts.push({
          conversation_id: row.id,
          user_id: user.id,
          external_id: `kapso:${message.id}`,
          direction: message.kapso?.direction === "outbound" ? "outbound" : "inbound",
          body: bodyText.slice(0, 4000),
          sent_at: kapsoSentAt(message.timestamp),
          metadata: {
            provider: "kapso",
            message_type: message.type ?? null,
            media_url: message.kapso?.media_url ?? null,
          },
        });
      }
    } else if ((provider === "zavu" || row.external_id?.startsWith("zavu:")) && remoteConversationId) {
      const messages = await fetchZavuMessages(remoteConversationId);
      for (const message of messages) {
        const bodyText =
          message.text?.trim() ||
          attachmentLabel(message.messageType, message.content?.filename);
        inserts.push({
          conversation_id: row.id,
          user_id: user.id,
          external_id: `zavu:${message.id}`,
          direction: mapZavuDirection(message, row.contact_identifier),
          body: bodyText.slice(0, 4000),
          sent_at: message.createdAt || new Date().toISOString(),
          metadata: {
            provider: "zavu",
            message_type: message.messageType ?? null,
            media_url: message.content?.mediaUrl ?? null,
          },
        });
      }
    } else {
      return jsonResponse({ synced: 0, provider: provider || "local" });
    }

    if (inserts.length === 0) {
      return jsonResponse({ synced: 0, provider });
    }

    const { data: existing } = await admin
      .from("inbox_messages")
      .select("external_id")
      .eq("conversation_id", row.id)
      .in(
        "external_id",
        inserts.map((item) => item.external_id as string),
      );

    const known = new Set((existing ?? []).map((item) => item.external_id));
    const fresh = inserts.filter((item) => !known.has(item.external_id as string));

    if (fresh.length > 0) {
      const { error: insertError } = await admin.from("inbox_messages").insert(fresh);
      if (insertError) {
        return jsonResponse({ error: insertError.message }, 500);
      }

      const latest = [...inserts].sort((a, b) =>
        String(a.sent_at).localeCompare(String(b.sent_at)),
      ).at(-1);
      if (latest) {
        await admin
          .from("inbox_conversations")
          .update({
            last_message: String(latest.body).slice(0, 500),
            last_message_at: latest.sent_at,
          })
          .eq("id", row.id);
      }
    }

    return jsonResponse({
      synced: fresh.length,
      provider,
      total: inserts.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[inbox-messages-sync]", error);
    return jsonResponse({ error: message }, 500);
  }
});
