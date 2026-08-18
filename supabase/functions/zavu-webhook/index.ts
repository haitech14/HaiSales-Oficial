import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-zavu-signature",
};

type ZavuEvent = {
  id?: string;
  type?: string;
  timestamp?: number;
  senderId?: string;
  projectId?: string;
  data?: Record<string, unknown>;
};

type ConnectionRow = {
  id: string;
  user_id: string;
  channel: string;
  display_name: string | null;
  webhook_secret: string | null;
  config: Record<string, unknown> | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRole);
}

function mapInboxChannel(channel?: string): "whatsapp" | "facebook" | "instagram" | null {
  const value = (channel ?? "").toLowerCase();
  if (value === "whatsapp" || value === "sms") return "whatsapp";
  if (value === "instagram") return "instagram";
  if (value === "messenger" || value === "facebook") return "facebook";
  return null;
}

function digitsOnly(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseSignatureHeader(header: string): Record<string, string> {
  const parts: Record<string, string> = {};
  for (const piece of header.split(",")) {
    const index = piece.indexOf("=");
    if (index > 0) parts[piece.slice(0, index).trim()] = piece.slice(index + 1).trim();
  }
  return parts;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyZavuSignature(rawBody: string, header: string | null, secret: string | null) {
  if (!header || !secret) return false;
  const parts = parseSignatureHeader(header);
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp)) return false;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (age > 300 || age < -60) return false;
  const received = parts.v2 ?? parts.v1;
  if (!received) return false;
  const signedPayload = parts.v2 ? `${timestamp}.${rawBody}` : rawBody;
  const expected = await hmacHex(secret, signedPayload);
  return timingSafeEqual(expected, received);
}

function messageBody(data: Record<string, unknown>): string {
  const text = asString(data.text);
  if (text) return text.slice(0, 4000);
  const type = asString(data.messageType) || "text";
  if (type === "image") return "[Imagen]";
  if (type === "video") return "[Video]";
  if (type === "audio") return "[Audio]";
  if (type === "document") return "[Documento]";
  if (type === "location") return "[Ubicación]";
  if (type === "contact") return "[Contacto]";
  if (type === "sticker") return "[Sticker]";
  return `Mensaje ${type}`;
}

function sentAtFrom(data: Record<string, unknown>, eventTimestamp?: number): string {
  const providerTs = data.providerTimestamp;
  if (typeof providerTs === "number" && Number.isFinite(providerTs)) {
    return new Date(providerTs).toISOString();
  }
  if (typeof eventTimestamp === "number" && Number.isFinite(eventTimestamp)) {
    return new Date(eventTimestamp).toISOString();
  }
  return new Date().toISOString();
}

function leadCodigo(channel: string, identifier: string): string | null {
  if (channel === "whatsapp") {
    const digits = digitsOnly(identifier);
    if (!digits) return null;
    return `WA-${digits.slice(0, 20)}`;
  }
  const raw = identifier.replace(/[^A-Za-z0-9]/g, "");
  if (!raw) return null;
  return `${channel === "instagram" ? "IG" : "FB"}-${raw.slice(0, 20)}`;
}

function initialsFrom(label: string, fallback: string): string {
  return label.replace(/[^A-Za-zÁÉÍÓÚáéíóú]/g, "").slice(0, 2).toUpperCase() || fallback;
}

async function resolveConnection(
  admin: ReturnType<typeof createClient>,
  senderId?: string,
): Promise<ConnectionRow | null> {
  if (senderId) {
    const { data } = await admin
      .from("inbox_channel_connections")
      .select("id, user_id, channel, display_name, webhook_secret, config")
      .eq("external_account_id", senderId)
      .eq("status", "connected")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as ConnectionRow;
  }

  const { data } = await admin
    .from("inbox_channel_connections")
    .select("id, user_id, channel, display_name, webhook_secret, config")
    .eq("status", "connected")
    .in("channel", ["whatsapp", "facebook", "instagram", "zavu"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as ConnectionRow | null) ?? null;
}

async function findConversation(
  admin: ReturnType<typeof createClient>,
  params: {
    userId: string;
    channel: string;
    senderId?: string;
    identifier: string;
  },
) {
  const { userId, channel, senderId, identifier } = params;
  const digits = digitsOnly(identifier);
  const candidates = [...new Set([identifier, digits ? `+${digits}` : "", digits].filter(Boolean))];

  const { data } = await admin
    .from("inbox_conversations")
    .select("id, metadata, contact_name")
    .eq("user_id", userId)
    .eq("channel", channel)
    .in("contact_identifier", candidates)
    .order("last_message_at", { ascending: false })
    .limit(8);

  const rows = data ?? [];
  return (
    rows.find((row) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      return senderId && asString(metadata.sender_id) === senderId;
    }) ??
    rows[0] ??
    null
  );
}

async function upsertLead(
  admin: ReturnType<typeof createClient>,
  params: {
    userId: string;
    channel: string;
    identifier: string;
    contactName: string;
    body: string;
    sentAt: string;
    owner: string;
  },
) {
  const codigo = leadCodigo(params.channel, params.identifier);
  if (!codigo) return;

  const { data: existing } = await admin
    .from("oportunidades")
    .select("id, etapa")
    .eq("user_id", params.userId)
    .eq("codigo", codigo)
    .maybeSingle();

  if (!existing) {
    await admin.from("oportunidades").insert({
      user_id: params.userId,
      codigo,
      cliente_nombre: params.contactName,
      cliente_ruc: params.identifier,
      titulo: `Lead ${params.channel === "whatsapp" ? "WhatsApp" : params.channel}`,
      subtitulo: params.body.slice(0, 160),
      valor: 0,
      etapa: "Prospectos",
      probabilidad: 10,
      responsable_nombre: params.owner,
      responsable_iniciales: initialsFrom(params.owner, "ZV"),
      fecha_oportunidad: params.sentAt,
    });
    return;
  }

  if (existing.etapa === "Prospectos") {
    await admin
      .from("oportunidades")
      .update({
        subtitulo: params.body.slice(0, 160),
        fecha_oportunidad: params.sentAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  }
}

async function persistMessage(
  admin: ReturnType<typeof createClient>,
  params: {
    connection: ConnectionRow;
    channel: "whatsapp" | "facebook" | "instagram";
    identifier: string;
    contactName: string;
    body: string;
    sentAt: string;
    direction: "inbound" | "outbound";
    messageId: string;
    senderId?: string;
    eventId?: string;
  },
) {
  const { connection, channel, identifier, contactName, body, sentAt, direction, messageId, senderId } =
    params;
  const userId = connection.user_id;
  const label = connection.display_name || "Zavu";
  const externalId = `zavu:${channel}:${identifier}`;

  let conversation = await findConversation(admin, {
    userId,
    channel,
    senderId,
    identifier,
  });

  if (!conversation) {
    const { data, error } = await admin
      .from("inbox_conversations")
      .upsert(
        {
          user_id: userId,
          channel,
          connection_id: connection.id,
          external_id: externalId,
          contact_name: contactName || identifier,
          contact_identifier: identifier,
          last_message: body.slice(0, 500),
          last_message_at: sentAt,
          is_read: direction === "outbound",
          stage: "nuevo",
          status: "activa",
          advisor_name: label,
          advisor_initials: initialsFrom(label, "ZV"),
          metadata: {
            provider: "zavu",
            sender_id: senderId ?? null,
            source_phone_label: label,
            profile_name: contactName || null,
          },
        },
        { onConflict: "user_id,channel,external_id" },
      )
      .select("id, metadata, contact_name")
      .single();
    if (error || !data) {
      console.error("[zavu-webhook] conversation upsert:", error?.message);
      return;
    }
    conversation = data;
  } else {
    const metadata = {
      ...((conversation.metadata ?? {}) as Record<string, unknown>),
      provider: "zavu",
      sender_id: senderId ?? null,
      source_phone_label: label,
    };
    await admin
      .from("inbox_conversations")
      .update({
        last_message: body.slice(0, 500),
        last_message_at: sentAt,
        is_read: direction === "outbound",
        contact_name: contactName || conversation.contact_name,
        connection_id: connection.id,
        metadata,
      })
      .eq("id", conversation.id);
  }

  const messageExternalId = `zavu:${messageId}`;
  const { data: existingMessage } = await admin
    .from("inbox_messages")
    .select("id")
    .eq("user_id", userId)
    .eq("external_id", messageExternalId)
    .maybeSingle();

  if (!existingMessage) {
    const { error: messageError } = await admin.from("inbox_messages").insert({
      conversation_id: conversation.id,
      user_id: userId,
      external_id: messageExternalId,
      direction,
      body: body.slice(0, 4000),
      sent_at: sentAt,
      metadata: { provider: "zavu", event_id: params.eventId ?? null },
    });
    if (messageError) {
      console.error("[zavu-webhook] message insert:", messageError.message);
    }
  }

  if (direction === "inbound") {
    await upsertLead(admin, {
      userId,
      channel,
      identifier,
      contactName: contactName || identifier,
      body,
      sentAt,
      owner: label,
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody || "{}") as ZavuEvent;
    const data = (event.data ?? {}) as Record<string, unknown>;
    const senderId = asString(event.senderId);
    const admin = getAdmin();
    const connection = await resolveConnection(admin, senderId || undefined);

    if (!connection) {
      console.warn("[zavu-webhook] Sin conexión para sender:", senderId);
      return jsonResponse({ ok: true, ignored: "no_connection" });
    }

    const secret = connection.webhook_secret || Deno.env.get("ZAVU_WEBHOOK_SECRET")?.trim() || null;
    const signatureHeader = req.headers.get("x-zavu-signature");
    const signed = await verifyZavuSignature(rawBody, signatureHeader, secret);
    if (secret && !signed) {
      if (!senderId) {
        return jsonResponse({ error: "Firma inválida" }, 401);
      }
      console.warn("[zavu-webhook] Firma inválida, se procesa por sender conocido:", senderId);
    }
    if (!secret && !senderId) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const type = asString(event.type);
    const channel = mapInboxChannel(asString(data.channel) || connection.channel);
    if (!channel) return jsonResponse({ ok: true, ignored: "channel" });

    if (type === "conversation.new") {
      const identifier = asString(data.phoneNumber) || asString(data.from);
      if (!identifier) return jsonResponse({ ok: true, ignored: "no_from" });
      await persistMessage(admin, {
        connection,
        channel,
        identifier,
        contactName: asString(data.profileName) || identifier,
        body: asString(data.firstMessageText) || "Conversación WhatsApp",
        sentAt: sentAtFrom(data, event.timestamp),
        direction: "inbound",
        messageId: asString(data.firstMessageId) || asString(event.id) || crypto.randomUUID(),
        senderId,
        eventId: asString(event.id),
      });
      return jsonResponse({ ok: true, type });
    }

    if (type === "message.inbound") {
      const identifier = asString(data.from);
      if (!identifier) return jsonResponse({ ok: true, ignored: "no_from" });
      await persistMessage(admin, {
        connection,
        channel,
        identifier,
        contactName: asString(data.profileName) || identifier,
        body: messageBody(data),
        sentAt: sentAtFrom(data, event.timestamp),
        direction: "inbound",
        messageId: asString(data.messageId) || asString(event.id) || crypto.randomUUID(),
        senderId,
        eventId: asString(event.id),
      });
      return jsonResponse({ ok: true, type });
    }

    if (type === "message.sent") {
      const identifier = asString(data.to) || asString(data.from);
      const text = asString(data.text);
      const isEcho = asString(data.source) === "whatsapp_business_app" || Boolean(text);
      if (!identifier || !isEcho) return jsonResponse({ ok: true, ignored: "status_only" });
      await persistMessage(admin, {
        connection,
        channel,
        identifier,
        contactName: asString(data.profileName) || identifier,
        body: messageBody(data),
        sentAt: sentAtFrom(data, event.timestamp),
        direction: "outbound",
        messageId: asString(data.messageId) || asString(event.id) || crypto.randomUUID(),
        senderId,
        eventId: asString(event.id),
      });
      return jsonResponse({ ok: true, type });
    }

    return jsonResponse({ ok: true, ignored: type || "unknown" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[zavu-webhook]", error);
    return jsonResponse({ error: message }, 500);
  }
});
