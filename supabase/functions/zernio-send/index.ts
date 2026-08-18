import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZERNIO_BASE = "https://zernio.com/api/v1";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = getEnv("ZERNIO_API_KEY");
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
    const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Sesión inválida" }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as {
      conversationId?: string;
      accountId?: string;
      text?: string;
      inboxConversationId?: string;
    };

    const text = body.text?.trim();
    if (!text) {
      return jsonResponse({ error: "Se requiere 'text'" }, 400);
    }

    let conversationId = body.conversationId?.trim() || "";
    let accountId = body.accountId?.trim() || "";
    const inboxConversationId = body.inboxConversationId?.trim() || "";

    if ((!conversationId || !accountId) && inboxConversationId) {
      const admin = createClient(supabaseUrl, serviceRole);
      const { data: row } = await admin
        .from("inbox_conversations")
        .select("external_id, metadata")
        .eq("id", inboxConversationId)
        .eq("user_id", user.id)
        .maybeSingle();

      const metadata = (row?.metadata ?? {}) as Record<string, unknown>;
      if (!conversationId && typeof metadata.conversation_id === "string") {
        conversationId = metadata.conversation_id;
      }
      if (!accountId && typeof metadata.account_id === "string") {
        accountId = metadata.account_id;
      }
      if (!conversationId && typeof row?.external_id === "string") {
        const match = /^zernio:(?:whatsapp|facebook|instagram|messenger):(.+)$/.exec(row.external_id);
        if (match?.[1]) conversationId = match[1];
      }
    }

    if (!conversationId || !accountId) {
      return jsonResponse({ error: "Faltan conversationId y accountId de Zernio" }, 400);
    }

    const response = await fetch(
      `${ZERNIO_BASE}/inbox/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ accountId, message: text }),
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        (typeof payload?.error === "string" && payload.error) ||
        `Zernio send ${response.status}`;
      return jsonResponse({ error: message, details: payload }, response.status);
    }

    return jsonResponse({
      ok: true,
      id: payload?.data?.messageId ?? payload?.messageId ?? null,
      message: payload?.data ?? payload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return jsonResponse({ error: message }, 500);
  }
});
