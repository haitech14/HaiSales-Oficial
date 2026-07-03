import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hub-signature-256, x-webhook-event, x-webhook-signature",
};

type MetaWhatsAppWebhookBody = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

type KapsoMessageWebhookBody = {
  phone_number_id?: string;
  message?: {
    id: string;
    timestamp?: string;
    type: string;
    text?: { body?: string };
    kapso?: { content?: string; direction?: string };
  };
  conversation?: {
    phone_number?: string;
    kapso?: { contact_name?: string };
  };
};

type ResolvedConnection = {
  id: string;
  user_id: string;
  display_name: string | null;
};

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey);
}

function normalizeWaId(raw: string): string {
  return raw.replace(/\D/g, "");
}

function formatIdentifier(waId: string): string {
  return waId.startsWith("+") ? waId : `+${waId}`;
}

async function resolveConnection(
  supabase: ReturnType<typeof createClient>,
  phoneNumberId?: string,
): Promise<ResolvedConnection | null> {
  if (phoneNumberId) {
    const { data } = await supabase
      .from("inbox_channel_connections")
      .select("id, user_id, display_name")
      .eq("channel", "whatsapp")
      .eq("external_account_id", phoneNumberId)
      .eq("status", "connected")
      .maybeSingle();

    if (data) return data as ResolvedConnection;
  }

  const { data } = await supabase
    .from("inbox_channel_connections")
    .select("id, user_id, display_name")
    .eq("channel", "whatsapp")
    .eq("status", "connected")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as ResolvedConnection | null) ?? null;
}

async function persistInboundMessage(
  supabase: ReturnType<typeof createClient>,
  params: {
    userId: string;
    connectionId: string;
    connectionLabel: string | null;
    phoneNumberId?: string;
    externalId: string;
    contactName: string;
    contactIdentifier: string;
    body: string;
    sentAt: string;
    messageExternalId: string;
    messageType: string;
  },
) {
  const {
    userId,
    connectionId,
    connectionLabel,
    phoneNumberId,
    externalId,
    contactName,
    contactIdentifier,
    body,
    sentAt,
    messageExternalId,
    messageType,
  } = params;

  const { data: conversation, error: conversationError } = await supabase
    .from("inbox_conversations")
    .upsert(
      {
        user_id: userId,
        channel: "whatsapp",
        connection_id: connectionId,
        external_id: externalId,
        contact_name: contactName,
        contact_identifier: contactIdentifier,
        last_message: body,
        last_message_at: sentAt,
        is_read: false,
        metadata: {
          phone_number_id: phoneNumberId,
          source_phone_label: connectionLabel,
          whatsapp_message_id: messageExternalId,
        },
      },
      { onConflict: "user_id,channel,external_id" },
    )
    .select("id")
    .single();

  if (conversationError || !conversation) {
    console.error("[whatsapp-webhook] conversation upsert:", conversationError?.message);
    return;
  }

  const { error: messageError } = await supabase.from("inbox_messages").insert({
    conversation_id: conversation.id,
    user_id: userId,
    external_id: messageExternalId,
    direction: "inbound",
    body,
    sent_at: sentAt,
    metadata: { type: messageType, phone_number_id: phoneNumberId },
  });

  if (messageError) {
    console.error("[whatsapp-webhook] message insert:", messageError.message);
  }

  await supabase
    .from("inbox_channel_connections")
    .update({
      status: "connected",
      last_sync_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", connectionId);
}

async function handleKapsoPayload(
  supabase: ReturnType<typeof createClient>,
  payload: KapsoMessageWebhookBody,
  eventHeader: string | null,
) {
  if (!payload.message) return;
  if (eventHeader && !eventHeader.includes("message.received")) return;
  if (payload.message.kapso?.direction === "outbound") return;

  const phoneNumberId = payload.phone_number_id;
  const connection = await resolveConnection(supabase, phoneNumberId);
  if (!connection) {
    console.warn("[whatsapp-webhook] Sin conexión para phone_number_id:", phoneNumberId);
    return;
  }

  const phoneRaw = payload.conversation?.phone_number ?? "";
  const waId = normalizeWaId(phoneRaw);
  if (!waId) return;

  const externalId = phoneNumberId ? `${phoneNumberId}:${waId}` : waId;

  const contactName =
    payload.conversation?.kapso?.contact_name ?? "Contacto WhatsApp";
  const body =
    payload.message.text?.body ??
    payload.message.kapso?.content ??
    `[${payload.message.type}]`;
  const timestamp = payload.message.timestamp;
  const sentAt = timestamp
    ? new Date(Number(timestamp) * 1000).toISOString()
    : new Date().toISOString();

  await persistInboundMessage(supabase, {
    userId: connection.user_id,
    connectionId: connection.id,
    connectionLabel: connection.display_name,
    phoneNumberId,
    externalId,
    contactName,
    contactIdentifier: formatIdentifier(waId),
    body,
    sentAt,
    messageExternalId: payload.message.id,
    messageType: payload.message.type,
  });
}

async function handleMetaPayload(
  supabase: ReturnType<typeof createClient>,
  payload: MetaWhatsAppWebhookBody,
) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;

      const phoneNumberId = change.value?.metadata?.phone_number_id;
      const connection = await resolveConnection(supabase, phoneNumberId);
      if (!connection) {
        console.warn("[whatsapp-webhook] Sin conexión activa para phone_number_id:", phoneNumberId);
        continue;
      }

      const messages = change.value?.messages ?? [];
      const contactName =
        change.value?.contacts?.[0]?.profile?.name ?? "Contacto WhatsApp";

      for (const message of messages) {
        const waId = normalizeWaId(message.from);
        const externalId = phoneNumberId ? `${phoneNumberId}:${waId}` : waId;
        const body = message.text?.body ?? `[${message.type}]`;
        const sentAt = new Date(Number(message.timestamp) * 1000).toISOString();

        await persistInboundMessage(supabase, {
          userId: connection.user_id,
          connectionId: connection.id,
          connectionLabel: connection.display_name,
          phoneNumberId,
          externalId,
          contactName,
          contactIdentifier: formatIdentifier(waId),
          body,
          sentAt,
          messageExternalId: message.id,
          messageType: message.type,
        });
      }
    }
  }
}

function isKapsoPayload(payload: Record<string, unknown>): boolean {
  return Boolean(payload.message && payload.phone_number_id);
}

function isMetaPayload(payload: Record<string, unknown>): boolean {
  return Boolean(payload.entry);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const verifyToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN");
  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    return new Response("Forbidden", {
      status: 403,
      headers: corsHeaders,
    });
  }

  if (req.method === "POST") {
    try {
      const rawBody = await req.text();
      const eventHeader = req.headers.get("X-Webhook-Event");
      const payload = rawBody ? JSON.parse(rawBody) as Record<string, unknown> : {};
      const supabase = getSupabaseAdmin();

      if (Array.isArray(payload)) {
        for (const item of payload) {
          if (isKapsoPayload(item as Record<string, unknown>)) {
            await handleKapsoPayload(supabase, item as KapsoMessageWebhookBody, eventHeader);
          }
        }
      } else if (isKapsoPayload(payload)) {
        await handleKapsoPayload(supabase, payload as KapsoMessageWebhookBody, eventHeader);
      } else if (isMetaPayload(payload)) {
        await handleMetaPayload(supabase, payload as MetaWhatsAppWebhookBody);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[whatsapp-webhook]", error);
      return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
});
