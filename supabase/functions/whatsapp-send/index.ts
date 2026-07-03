import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ConnectionConfig = {
  phone_number_id?: string;
  display_phone_number?: string;
  provider?: string;
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

function normalizeWaId(raw: string): string {
  return raw.replace(/\D/g, "");
}

async function sendKapsoTextMessage(phoneNumberId: string, to: string, body: string) {
  const apiKey = getEnv("KAPSO_API_KEY");
  const baseUrl = (Deno.env.get("KAPSO_API_BASE_URL") ?? "https://api.kapso.ai").replace(/\/$/, "");
  const graphVersion = Deno.env.get("META_GRAPH_VERSION") ?? "v24.0";
  const url = `${baseUrl}/meta/whatsapp/${graphVersion}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizeWaId(to),
      type: "text",
      text: { body },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = typeof payload === "object" && payload !== null
      ? JSON.stringify(payload)
      : String(payload);
    throw new Error(`Kapso send failed (${response.status}): ${detail}`);
  }

  const messageId = (payload as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id;
  return messageId ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversationId, body } = await req.json() as {
      conversationId?: string;
      body?: string;
    };

    if (!conversationId || !body?.trim()) {
      return new Response(JSON.stringify({ error: "conversationId y body son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: conversation, error: convError } = await admin
      .from("inbox_conversations")
      .select("id, user_id, channel, external_id, contact_identifier, connection_id, metadata")
      .eq("id", conversationId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: "Conversación no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (conversation.channel !== "whatsapp") {
      return new Response(JSON.stringify({ error: "Solo se pueden enviar mensajes WhatsApp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let phoneNumberId: string | undefined;
    const metadata = conversation.metadata as Record<string, unknown> | null;

    if (conversation.connection_id) {
      const { data: connection } = await admin
        .from("inbox_channel_connections")
        .select("external_account_id, config")
        .eq("id", conversation.connection_id)
        .maybeSingle();

      const config = (connection?.config ?? {}) as ConnectionConfig;
      phoneNumberId = config.phone_number_id ?? connection?.external_account_id ?? undefined;
    }

    phoneNumberId ??= typeof metadata?.phone_number_id === "string" ? metadata.phone_number_id : undefined;
    phoneNumberId ??= Deno.env.get("DEFAULT_WHATSAPP_PHONE_NUMBER_ID") ?? undefined;

    if (!phoneNumberId) {
      return new Response(JSON.stringify({ error: "No hay phone_number_id configurado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipient = conversation.contact_identifier || conversation.external_id;
    const externalMessageId = await sendKapsoTextMessage(phoneNumberId, recipient, body.trim());
    const sentAt = new Date().toISOString();

    const { data: inserted, error: insertError } = await admin
      .from("inbox_messages")
      .insert({
        conversation_id: conversation.id,
        user_id: authData.user.id,
        external_id: externalMessageId,
        direction: "outbound",
        body: body.trim(),
        sent_at: sentAt,
        metadata: { phone_number_id: phoneNumberId, provider: "kapso" },
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    await admin
      .from("inbox_conversations")
      .update({
        last_message: body.trim(),
        last_message_at: sentAt,
        is_read: true,
        updated_at: sentAt,
      })
      .eq("id", conversation.id);

    return new Response(
      JSON.stringify({ success: true, messageId: inserted.id, externalMessageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[whatsapp-send]", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error al enviar mensaje" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
