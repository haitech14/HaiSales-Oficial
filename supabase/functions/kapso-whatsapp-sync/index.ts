import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type KapsoPhoneNumber = {
  id?: string;
  phone_number_id?: string;
  display_phone_number?: string;
  name?: string;
  business_account_id?: string;
};

type ConnectionConfig = {
  phone_number_id: string;
  display_phone_number?: string;
  business_account_id?: string;
  provider: "kapso";
  webhook_url?: string;
};

type KapsoConversation = {
  id?: string;
  status?: string;
  last_active_at?: string;
  created_at?: string;
  phone_number?: string | null;
  phone_number_id?: string | null;
  kapso?: {
    contact_name?: string | null;
    last_message_text?: string | null;
    last_message_timestamp?: string | null;
  };
};

type SyncedConnection = {
  id: string;
  phoneNumberId: string;
  displayLabel: string;
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

function platformBaseUrl(): string {
  const raw = (Deno.env.get("KAPSO_API_BASE_URL") ?? "https://api.kapso.ai").replace(/\/$/, "");
  if (raw.endsWith("/platform/v1")) return raw.slice(0, -"/platform/v1".length);
  return raw;
}

async function kapsoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getEnv("KAPSO_API_KEY");
  const url = `${platformBaseUrl()}/platform/v1/${path.replace(/^\//, "")}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Kapso API ${response.status}: ${JSON.stringify(data)}`);
  }
  return data as T;
}

function normalizeWaId(raw: string): string {
  return raw.replace(/\D/g, "");
}

function formatIdentifier(waId: string): string {
  return waId.startsWith("+") ? waId : `+${waId}`;
}

function unwrapList<T>(payload: { data?: T[] | { data?: T[] } }): T[] {
  const nested = payload.data;
  if (Array.isArray(nested)) return nested;
  if (nested && Array.isArray(nested.data)) return nested.data;
  return [];
}

async function listKapsoPhoneNumbers(): Promise<KapsoPhoneNumber[]> {
  const payload = await kapsoRequest<{ data?: { data?: KapsoPhoneNumber[] } | KapsoPhoneNumber[] }>(
    "whatsapp/phone_numbers?per_page=50",
  );
  return unwrapList(payload);
}

async function listKapsoConversationsMeta(phoneNumberId: string): Promise<KapsoConversation[]> {
  const apiKey = getEnv("KAPSO_API_KEY");
  const graphVersion = Deno.env.get("META_GRAPH_VERSION") ?? "v24.0";
  const all: KapsoConversation[] = [];
  let after: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const params = new URLSearchParams({
      limit: "100",
      fields: "kapso(contact_name,last_message_text,last_message_timestamp)",
    });
    if (after) params.set("after", after);

    const url =
      `${platformBaseUrl()}/meta/whatsapp/${graphVersion}/${phoneNumberId}/conversations?${params.toString()}`;
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    });
    const payload = await response.json().catch(() => ({})) as {
      data?: KapsoConversation[] | { data?: KapsoConversation[] };
      paging?: { cursors?: { after?: string } };
    };
    if (!response.ok) {
      throw new Error(`Kapso Meta API ${response.status}: ${JSON.stringify(payload)}`);
    }

    const rows = unwrapList(payload).map((row) => ({
      ...row,
      phone_number_id: row.phone_number_id ?? phoneNumberId,
    }));
    all.push(...rows);
    after = payload.paging?.cursors?.after;
    if (!after || rows.length === 0) break;
  }

  return all;
}

async function listKapsoConversations(phoneNumberId?: string): Promise<KapsoConversation[]> {
  const all: KapsoConversation[] = [];
  let after: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (phoneNumberId) params.set("phone_number_id", phoneNumberId);
    if (after) params.set("after", after);

    const payload = await kapsoRequest<{
      data?: KapsoConversation[] | { data?: KapsoConversation[] };
      paging?: { cursors?: { after?: string } };
    }>(`whatsapp/conversations?${params.toString()}`);

    const rows = unwrapList(payload);
    all.push(...rows);
    after = payload.paging?.cursors?.after;
    if (!after || rows.length === 0) break;
  }

  if (all.length === 0 && phoneNumberId) {
    try {
      return await listKapsoConversationsMeta(phoneNumberId);
    } catch (error) {
      console.warn("[kapso-whatsapp-sync] meta conversations:", error);
    }
  }

  return all;
}

function conversationToInboxRow(
  userId: string,
  connection: SyncedConnection,
  conv: KapsoConversation,
) {
  const phoneRaw = conv.phone_number ?? "";
  const waId = normalizeWaId(phoneRaw);
  if (!waId) return null;

  const phoneNumberId = conv.phone_number_id ?? connection.phoneNumberId;
  const lastMessage =
    conv.kapso?.last_message_text?.trim() || "Conversación WhatsApp";
  const lastAt =
    conv.kapso?.last_message_timestamp ??
    conv.last_active_at ??
    conv.created_at ??
    new Date().toISOString();

  return {
    user_id: userId,
    channel: "whatsapp",
    connection_id: connection.id,
    external_id: phoneNumberId ? `${phoneNumberId}:${waId}` : waId,
    contact_name: conv.kapso?.contact_name?.trim() || "Contacto WhatsApp",
    contact_identifier: formatIdentifier(waId),
    last_message: lastMessage.slice(0, 500),
    last_message_at: lastAt,
    stage: "nuevo",
    status: conv.status === "ended" ? "cerrada" : "activa",
    advisor_name: connection.displayLabel,
    advisor_initials:
      connection.displayLabel.replace(/[^A-Za-zÁÉÍÓÚáéíóú]/g, "").slice(0, 2).toUpperCase() ||
      "WA",
    metadata: {
      provider: "kapso",
      phone_number_id: phoneNumberId,
      source_phone_label: connection.displayLabel,
      kapso_conversation_id: conv.id ?? null,
    },
  };
}

async function persistKapsoConversations(
  admin: ReturnType<typeof createClient>,
  userId: string,
  connections: SyncedConnection[],
): Promise<number> {
  const seen = new Set<string>();
  const rows: ReturnType<typeof conversationToInboxRow>[] = [];

  const phoneIds = connections.map((item) => item.phoneNumberId).filter(Boolean);
  const queries = phoneIds.length > 0
    ? phoneIds.map((id) => listKapsoConversations(id))
    : [listKapsoConversations()];

  const pages = await Promise.all(queries);
  const fallback = connections[0];

  for (const conv of pages.flat()) {
    const phoneNumberId = conv.phone_number_id ?? "";
    const connection =
      connections.find((item) => item.phoneNumberId === phoneNumberId) ?? fallback;
    if (!connection) continue;

    const row = conversationToInboxRow(userId, connection, conv);
    if (!row || seen.has(row.external_id)) continue;
    seen.add(row.external_id);
    rows.push(row);
  }

  const validRows = rows.filter((row): row is NonNullable<typeof row> => Boolean(row));
  if (validRows.length === 0) return 0;

  for (let i = 0; i < validRows.length; i += 100) {
    const batch = validRows.slice(i, i + 100);
    const { error } = await admin
      .from("inbox_conversations")
      .upsert(batch, { onConflict: "user_id,channel,external_id" });
    if (error) {
      console.error("[kapso-whatsapp-sync] conversations upsert:", error.message);
    }
  }

  const { error: rpcError } = await admin.rpc("sync_prospeccion_whatsapp_for_user", {
    p_user_id: userId,
  });
  if (rpcError) {
    console.warn("[kapso-whatsapp-sync] prospección RPC:", rpcError.message);
  }

  return validRows.length;
}

async function ensureKapsoWebhook(phoneNumberId: string, webhookUrl: string, verifyToken: string) {
  type WebhookRow = { id: string; url?: string; active?: boolean };
  const existing = await kapsoRequest<{ data?: WebhookRow[] }>(
    `whatsapp/phone_numbers/${phoneNumberId}/webhooks`,
  );
  const rows = existing.data ?? [];
  const match = rows.find((row) => row.url === webhookUrl);

  if (match?.active) return match.id;

  const created = await kapsoRequest<{ data?: WebhookRow }>(
    `whatsapp/phone_numbers/${phoneNumberId}/webhooks`,
    {
      method: "POST",
      body: JSON.stringify({
        whatsapp_webhook: {
          url: webhookUrl,
          kind: "meta",
          payload_version: "v2",
          active: true,
          events: ["whatsapp.message.received", "whatsapp.message.sent"],
          secret_key: verifyToken,
        },
      }),
    },
  );

  return created.data?.id ?? null;
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

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const webhookUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/whatsapp-webhook`;
    const verifyToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") ?? "";
    const defaultPhoneNumberId = Deno.env.get("DEFAULT_WHATSAPP_PHONE_NUMBER_ID") ?? "597907523413541";

    let numbers = await listKapsoPhoneNumbers();

    if (numbers.length === 0 && defaultPhoneNumberId) {
      numbers = [{ phone_number_id: defaultPhoneNumberId, display_phone_number: defaultPhoneNumberId }];
    }

    const body = await req.json().catch(() => ({})) as { syncConversations?: boolean };
    const shouldSyncConversations = body.syncConversations !== false;

    const synced: SyncedConnection[] = [];

    for (const number of numbers) {
      const phoneNumberId = number.phone_number_id ?? number.id;
      if (!phoneNumberId) continue;

      const displayLabel = number.display_phone_number ?? number.name ?? phoneNumberId;
      const config: ConnectionConfig = {
        phone_number_id: phoneNumberId,
        display_phone_number: number.display_phone_number,
        business_account_id: number.business_account_id,
        provider: "kapso",
        webhook_url: webhookUrl,
      };

      const { data: row, error: upsertError } = await admin
        .from("inbox_channel_connections")
        .upsert(
          {
            user_id: authData.user.id,
            channel: "whatsapp",
            display_name: displayLabel,
            external_account_id: phoneNumberId,
            webhook_secret: verifyToken || null,
            status: "connected",
            error_message: null,
            last_sync_at: new Date().toISOString(),
            config,
          },
          { onConflict: "user_id,channel,external_account_id" },
        )
        .select("id")
        .single();

      if (upsertError || !row) {
        console.error("[kapso-whatsapp-sync] upsert:", upsertError?.message);
        continue;
      }

      if (verifyToken) {
        try {
          await ensureKapsoWebhook(phoneNumberId, webhookUrl, verifyToken);
        } catch (webhookError) {
          console.warn("[kapso-whatsapp-sync] webhook:", webhookError);
        }
      }

      synced.push({ id: row.id as string, phoneNumberId, displayLabel });
    }

    let conversationsSynced = 0;
    if (shouldSyncConversations) {
      try {
        conversationsSynced = await persistKapsoConversations(admin, authData.user.id, synced);
      } catch (conversationError) {
        console.warn("[kapso-whatsapp-sync] conversations:", conversationError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, connections: synced, conversationsSynced }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[kapso-whatsapp-sync]", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error al sincronizar Kapso" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
