import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZERNIO_BASE = "https://zernio.com/api/v1";
const CRM_CHANNELS = ["whatsapp", "facebook", "instagram"] as const;

type ZernioAccount = {
  _id?: string;
  id?: string;
  platform?: string;
  displayName?: string;
  isActive?: boolean;
};

type ZernioConversation = {
  id: string;
  platform?: string;
  accountId?: string;
  accountUsername?: string;
  participantId?: string;
  participantName?: string;
  participantPicture?: string | null;
  participantUsername?: string;
  lastMessage?: string | null;
  updatedTime?: string;
  status?: string;
  unreadCount?: number;
  url?: string;
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

async function zernioGet<T>(path: string): Promise<T> {
  const apiKey = getEnv("ZERNIO_API_KEY");
  const response = await fetch(`${ZERNIO_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Zernio API ${response.status}: ${JSON.stringify(data)}`);
  }
  return data as T;
}

function mapPlatform(platform?: string): (typeof CRM_CHANNELS)[number] | null {
  const value = (platform ?? "").toLowerCase();
  if (value === "whatsapp" || value === "facebook" || value === "instagram") return value;
  if (value === "messenger") return "facebook";
  return null;
}

function leadCodigo(channel: string, conv: ZernioConversation): string | null {
  if (channel === "whatsapp") {
    const digits = (conv.participantUsername || conv.participantId || "").replace(/\D/g, "");
    if (!digits) return null;
    return `WA-${digits.slice(0, 20)}`;
  }
  const raw = (conv.participantId || conv.id || "").replace(/[^A-Za-z0-9]/g, "");
  if (!raw) return null;
  const prefix = channel === "instagram" ? "IG" : "FB";
  return `${prefix}-${raw.slice(0, 20)}`;
}

function channelLabel(channel: string): string {
  if (channel === "instagram") return "Instagram";
  if (channel === "facebook") return "Facebook";
  return "WhatsApp";
}

async function listAllConversations(): Promise<ZernioConversation[]> {
  const all: ZernioConversation[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const params = new URLSearchParams({ limit: "100", sortOrder: "desc" });
    if (cursor) params.set("cursor", cursor);
    const payload = await zernioGet<{
      data?: ZernioConversation[];
      pagination?: { hasMore?: boolean; nextCursor?: string | null };
    }>(`/inbox/conversations?${params.toString()}`);
    const rows = payload.data ?? [];
    all.push(...rows);
    cursor = payload.pagination?.nextCursor ?? undefined;
    if (!payload.pagination?.hasMore || !cursor || rows.length === 0) break;
  }

  return all;
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
    const userId = authData.user.id;

    const accountsPayload = await zernioGet<{ accounts?: ZernioAccount[] }>("/accounts");
    const accounts = (accountsPayload.accounts ?? []).filter((account) =>
      Boolean(mapPlatform(account.platform)),
    );

    const connectionByAccount = new Map<string, { id: string; label: string; channel: string }>();

    for (const account of accounts) {
      const channel = mapPlatform(account.platform);
      const accountId = account._id || account.id;
      if (!channel || !accountId) continue;

      const displayLabel = account.displayName || channelLabel(channel);
      const { data: row, error } = await admin
        .from("inbox_channel_connections")
        .upsert(
          {
            user_id: userId,
            channel,
            display_name: displayLabel,
            external_account_id: accountId,
            status: account.isActive === false ? "disconnected" : "connected",
            error_message: null,
            last_sync_at: new Date().toISOString(),
            config: {
              provider: "zernio",
              platform: channel,
              account_id: accountId,
            },
          },
          { onConflict: "user_id,channel,external_account_id" },
        )
        .select("id")
        .single();

      if (!error && row) {
        connectionByAccount.set(accountId, {
          id: row.id as string,
          label: displayLabel,
          channel,
        });
      }
    }

    const conversations = await listAllConversations();

    for (const conv of conversations) {
      const channel = mapPlatform(conv.platform);
      const accountId = conv.accountId;
      if (!channel || !accountId || connectionByAccount.has(accountId)) continue;

      const displayLabel = conv.accountUsername || channelLabel(channel);
      const { data: row, error } = await admin
        .from("inbox_channel_connections")
        .upsert(
          {
            user_id: userId,
            channel,
            display_name: displayLabel,
            external_account_id: accountId,
            status: "connected",
            error_message: null,
            last_sync_at: new Date().toISOString(),
            config: {
              provider: "zernio",
              platform: channel,
              account_id: accountId,
            },
          },
          { onConflict: "user_id,channel,external_account_id" },
        )
        .select("id")
        .single();

      if (!error && row) {
        connectionByAccount.set(accountId, {
          id: row.id as string,
          label: displayLabel,
          channel,
        });
      }
    }

    const inboxRows: Record<string, unknown>[] = [];
    const oppRows: Record<string, unknown>[] = [];
    const seenInbox = new Set<string>();
    const seenOpp = new Set<string>();

    for (const conv of conversations) {
      const channel = mapPlatform(conv.platform);
      if (!channel) continue;

      const connection = conv.accountId ? connectionByAccount.get(conv.accountId) : undefined;
      const label = connection?.label || conv.accountUsername || channelLabel(channel);
      const identifier =
        conv.participantUsername ||
        conv.participantId ||
        conv.id;
      const externalId = `zernio:${channel}:${conv.id}`;
      if (seenInbox.has(externalId)) continue;
      seenInbox.add(externalId);

      inboxRows.push({
        user_id: userId,
        channel,
        connection_id: connection?.id ?? null,
        external_id: externalId,
        contact_name: conv.participantName?.trim() || `Contacto ${channelLabel(channel)}`,
        contact_identifier: identifier,
        contact_avatar_url: conv.participantPicture || null,
        last_message: (conv.lastMessage || `Conversación ${channelLabel(channel)}`).slice(0, 500),
        last_message_at: conv.updatedTime || new Date().toISOString(),
        is_read: (conv.unreadCount ?? 0) === 0,
        stage: "nuevo",
        status: conv.status === "archived" ? "cerrada" : "activa",
        advisor_name: label,
        advisor_initials: label.replace(/[^A-Za-zÁÉÍÓÚáéíóú]/g, "").slice(0, 2).toUpperCase() || "CR",
        metadata: {
          provider: "zernio",
          platform: channel,
          account_id: conv.accountId ?? null,
          conversation_id: conv.id,
          source_phone_label: label,
          url: conv.url ?? null,
        },
      });

      const codigo = leadCodigo(channel, conv);
      if (!codigo || seenOpp.has(codigo)) continue;
      seenOpp.add(codigo);

      const responsable = label;
      oppRows.push({
        user_id: userId,
        codigo,
        cliente_nombre: conv.participantName?.trim() || `Contacto ${channelLabel(channel)}`,
        cliente_ruc: identifier,
        titulo: `Lead ${channelLabel(channel)}`,
        subtitulo: (conv.lastMessage || `Conversación ${channelLabel(channel)}`).slice(0, 160),
        valor: 0,
        etapa: "Prospectos",
        probabilidad: 10,
        responsable_nombre: responsable,
        responsable_iniciales:
          responsable.replace(/[^A-Za-zÁÉÍÓÚáéíóú]/g, "").slice(0, 2).toUpperCase() || "CR",
        fecha_oportunidad: conv.updatedTime || new Date().toISOString(),
      });
    }

    for (let i = 0; i < inboxRows.length; i += 100) {
      const batch = inboxRows.slice(i, i + 100);
      const { error } = await admin
        .from("inbox_conversations")
        .upsert(batch, { onConflict: "user_id,channel,external_id" });
      if (error) console.error("[zernio-inbox-sync] inbox:", error.message);
    }

    for (const row of oppRows) {
      const { data: existing } = await admin
        .from("oportunidades")
        .select("id, etapa")
        .eq("user_id", userId)
        .eq("codigo", row.codigo as string)
        .maybeSingle();

      if (!existing) {
        const { error } = await admin.from("oportunidades").insert(row);
        if (error) console.error("[zernio-inbox-sync] opp insert:", error.message);
      } else if (existing.etapa === "Prospectos") {
        const { error } = await admin
          .from("oportunidades")
          .update({
            cliente_nombre: row.cliente_nombre,
            cliente_ruc: row.cliente_ruc,
            subtitulo: row.subtitulo,
            fecha_oportunidad: row.fecha_oportunidad,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) console.error("[zernio-inbox-sync] opp update:", error.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        provider: "zernio",
        accounts: accounts.length,
        conversationsSynced: inboxRows.length,
        opportunitiesSynced: oppRows.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[zernio-inbox-sync]", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error al sincronizar Zernio",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
