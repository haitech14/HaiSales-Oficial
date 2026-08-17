import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Zavudev from "npm:@zavudev/sdk@0.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ZavuConversation = {
  id: string;
  contactId?: string;
  contactIdentifier: string;
  channels?: string[];
  lastMessage?: {
    id?: string;
    text?: string;
    channel?: string;
    direction?: string;
    at?: string;
  };
  senderId?: string;
  messageCount?: number;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapInboxChannel(channel?: string): "whatsapp" | "facebook" | "instagram" | null {
  const value = (channel ?? "").toLowerCase();
  if (value === "whatsapp") return "whatsapp";
  if (value === "instagram") return "instagram";
  if (value === "messenger" || value === "facebook") return "facebook";
  return null;
}

function channelLabel(channel: string): string {
  if (channel === "instagram") return "Instagram";
  if (channel === "facebook") return "Facebook";
  return "WhatsApp";
}

function leadCodigo(channel: string, identifier: string, conversationId: string): string | null {
  if (channel === "whatsapp") {
    const digits = identifier.replace(/\D/g, "");
    if (!digits) return null;
    return `WA-${digits.slice(0, 20)}`;
  }
  const raw = (identifier || conversationId).replace(/[^A-Za-z0-9]/g, "");
  if (!raw) return null;
  return `${channel === "instagram" ? "IG" : "FB"}-${raw.slice(0, 20)}`;
}

function initialsFrom(label: string, fallback: string): string {
  return label.replace(/[^A-Za-zÁÉÍÓÚáéíóú]/g, "").slice(0, 2).toUpperCase() || fallback;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ZAVUDEV_API_KEY")?.trim();
    if (!apiKey) {
      return jsonResponse({ error: "Falta ZAVUDEV_API_KEY en secrets de Supabase" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey || !serviceRole) {
      return jsonResponse({ error: "Faltan variables SUPABASE_*" }, 500);
    }

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

    const zavu = new Zavudev({ apiKey });
    const me = await zavu.me.retrieve();
    const projectId = me.project?.id ?? "zavu-default";
    const projectName = me.project?.name ?? "Zavu";
    const teamName = me.team?.name ?? "Zavu";

    const senders: Array<{
      id: string;
      name: string;
      phoneNumber?: string;
      channels?: string[];
    }> = [];
    for await (const sender of zavu.senders.list()) {
      senders.push(sender);
    }

    const contactsById = new Map<
      string,
      { displayName?: string; profileName?: string | null; primaryPhone?: string }
    >();
    for await (const contact of zavu.contacts.list()) {
      contactsById.set(contact.id, contact);
    }

    const conversations: ZavuConversation[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 20; page += 1) {
      const payload = await zavu.get<{ items?: ZavuConversation[]; nextCursor?: string | null }>(
        "/v1/conversations",
        { query: { limit: 100, ...(cursor ? { cursor } : {}) } },
      );
      const rows = payload.items ?? [];
      conversations.push(...rows);
      cursor = payload.nextCursor ?? undefined;
      if (!cursor || rows.length === 0) break;
    }

    const admin = createClient(supabaseUrl, serviceRole);
    const now = new Date().toISOString();

    const { data: projectConnection, error: projectError } = await admin
      .from("inbox_channel_connections")
      .upsert(
        {
          user_id: user.id,
          channel: "zavu",
          display_name: `${teamName} · ${projectName}`,
          external_account_id: projectId,
          webhook_secret: null,
          status: "connected",
          error_message: null,
          last_sync_at: now,
          config: {
            provider: "zavu",
            api_base_url: "https://api.zavu.dev",
            project_id: projectId,
            project_name: projectName,
            team_id: me.team?.id ?? null,
            team_name: teamName,
            api_key_id: me.apiKey?.id ?? null,
            is_test_mode: Boolean(me.isTestMode),
            sdk: "@zavudev/sdk",
          },
        },
        { onConflict: "user_id,channel,external_account_id" },
      )
      .select("id")
      .single();

    if (projectError) {
      return jsonResponse({ error: projectError.message }, 500);
    }

    const connectionBySender = new Map<string, { id: string; label: string; channel: string }>();

    for (const sender of senders) {
      const senderChannels = (sender.channels ?? []).map(mapInboxChannel).filter(Boolean);
      const uniqueChannels = [...new Set(senderChannels)] as Array<
        "whatsapp" | "facebook" | "instagram"
      >;
      if (uniqueChannels.length === 0) uniqueChannels.push("whatsapp");

      for (const channel of uniqueChannels) {
        const label =
          sender.name ||
          sender.phoneNumber ||
          `${teamName} · ${channelLabel(channel)}`;
        const { data: row, error } = await admin
          .from("inbox_channel_connections")
          .upsert(
            {
              user_id: user.id,
              channel,
              display_name: label,
              external_account_id: sender.id,
              status: "connected",
              error_message: null,
              last_sync_at: now,
              config: {
                provider: "zavu",
                sender_id: sender.id,
                phone_number: sender.phoneNumber ?? null,
                project_id: projectId,
              },
            },
            { onConflict: "user_id,channel,external_account_id" },
          )
          .select("id")
          .single();

        if (!error && row) {
          connectionBySender.set(`${sender.id}:${channel}`, {
            id: row.id as string,
            label,
            channel,
          });
        }
      }
    }

    const inboxRows: Record<string, unknown>[] = [];
    const oppRows: Record<string, unknown>[] = [];
    const seenInbox = new Set<string>();
    const seenOpp = new Set<string>();

    for (const conv of conversations) {
      const rawChannel = conv.lastMessage?.channel || conv.channels?.[0];
      const channel = mapInboxChannel(rawChannel);
      if (!channel) continue;

      const connection =
        (conv.senderId ? connectionBySender.get(`${conv.senderId}:${channel}`) : undefined) ??
        [...connectionBySender.values()].find((item) => item.channel === channel);
      const contact = conv.contactId ? contactsById.get(conv.contactId) : undefined;
      const label = connection?.label || `${teamName} · ${channelLabel(channel)}`;
      const contactName =
        contact?.profileName?.trim() ||
        contact?.displayName?.trim() ||
        conv.contactIdentifier;
      const lastMessage =
        conv.lastMessage?.text?.trim() || `Conversación ${channelLabel(channel)}`;
      const externalId = `zavu:${channel}:${conv.id}`;
      if (seenInbox.has(externalId)) continue;
      seenInbox.add(externalId);

      inboxRows.push({
        user_id: user.id,
        channel,
        connection_id: connection?.id ?? projectConnection?.id ?? null,
        external_id: externalId,
        contact_name: contactName,
        contact_identifier: conv.contactIdentifier,
        last_message: lastMessage.slice(0, 500),
        last_message_at: conv.lastMessage?.at || conv.updatedAt || now,
        is_read: (conv.unreadCount ?? 0) === 0,
        stage: "nuevo",
        status: "activa",
        advisor_name: label,
        advisor_initials: initialsFrom(label, "ZV"),
        metadata: {
          provider: "zavu",
          conversation_id: conv.id,
          contact_id: conv.contactId ?? null,
          sender_id: conv.senderId ?? null,
          source_phone_label: label,
          message_count: conv.messageCount ?? 0,
        },
      });

      const codigo = leadCodigo(channel, conv.contactIdentifier, conv.id);
      if (!codigo || seenOpp.has(codigo)) continue;
      seenOpp.add(codigo);

      oppRows.push({
        user_id: user.id,
        codigo,
        cliente_nombre: contactName,
        cliente_ruc: conv.contactIdentifier,
        titulo: `Lead ${channelLabel(channel)}`,
        subtitulo: lastMessage.slice(0, 160),
        valor: 0,
        etapa: "Prospectos",
        probabilidad: 10,
        responsable_nombre: label,
        responsable_iniciales: initialsFrom(label, "ZV"),
        fecha_oportunidad: conv.lastMessage?.at || conv.updatedAt || now,
      });
    }

    for (let i = 0; i < inboxRows.length; i += 100) {
      const batch = inboxRows.slice(i, i + 100);
      const { error } = await admin
        .from("inbox_conversations")
        .upsert(batch, { onConflict: "user_id,channel,external_id" });
      if (error) console.error("[zavu-sync] inbox:", error.message);
    }

    for (const row of oppRows) {
      const { data: existing } = await admin
        .from("oportunidades")
        .select("id, etapa")
        .eq("user_id", user.id)
        .eq("codigo", row.codigo as string)
        .maybeSingle();

      if (!existing) {
        const { error } = await admin.from("oportunidades").insert(row);
        if (error) console.error("[zavu-sync] opp insert:", error.message);
      } else if (existing.etapa === "Prospectos") {
        const { error } = await admin
          .from("oportunidades")
          .update({
            cliente_nombre: row.cliente_nombre,
            cliente_ruc: row.cliente_ruc,
            subtitulo: row.subtitulo,
            fecha_oportunidad: row.fecha_oportunidad,
            updated_at: now,
          })
          .eq("id", existing.id);
        if (error) console.error("[zavu-sync] opp update:", error.message);
      }
    }

    return jsonResponse({
      connected: true,
      provider: "zavu",
      sdk: "@zavudev/sdk",
      project: me.project,
      team: me.team,
      isTestMode: Boolean(me.isTestMode),
      senders: senders.length,
      conversationsSynced: inboxRows.length,
      opportunitiesSynced: oppRows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[zavu-sync]", error);
    return jsonResponse({ error: message }, 500);
  }
});
