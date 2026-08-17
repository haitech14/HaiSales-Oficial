import { isGenericLastMessage } from "@/lib/inbox/empty-conversations-cleanup";
import type { Database } from "@/integrations/supabase/types";

type OportunidadInsert = Database["public"]["Tables"]["oportunidades"]["Insert"];

type InboxConversationRow = Pick<
  Database["public"]["Tables"]["inbox_conversations"]["Row"],
  | "channel"
  | "contact_name"
  | "contact_identifier"
  | "external_id"
  | "last_message"
  | "last_message_at"
  | "created_at"
  | "metadata"
>;

export type SocialLeadBadge = "WhatsApp" | "Facebook" | "Instagram";

const SOCIAL_CHANNELS = ["whatsapp", "facebook", "instagram", "messenger"] as const;

export function isWhatsAppLeadCodigo(codigo: string): boolean {
  return codigo.startsWith("WA-");
}

export function socialLeadBadgeFromCodigo(
  codigo: string,
  title?: string,
): SocialLeadBadge | null {
  if (codigo.startsWith("WA-") || title === "Lead WhatsApp") return "WhatsApp";
  if (codigo.startsWith("FB-") || title === "Lead Facebook") return "Facebook";
  if (codigo.startsWith("IG-") || title === "Lead Instagram") return "Instagram";
  return null;
}

function channelLabel(channel: string): SocialLeadBadge {
  if (channel === "instagram") return "Instagram";
  if (channel === "facebook" || channel === "messenger") return "Facebook";
  return "WhatsApp";
}

export function leadCodigoFromConversation(conv: InboxConversationRow): string | null {
  const channel = conv.channel;
  if (channel === "whatsapp") {
    const digits = (conv.contact_identifier || conv.external_id).replace(/\D/g, "");
    if (!digits) return null;
    const codigo = `WA-${digits.slice(0, 20)}`;
    return codigo === "WA-" ? null : codigo;
  }

  const raw = (conv.contact_identifier || conv.external_id).replace(/[^A-Za-z0-9]/g, "");
  if (!raw) return null;
  const prefix = channel === "instagram" ? "IG" : "FB";
  return `${prefix}-${raw.slice(0, 20)}`;
}

function buildSocialOportunidadRow(
  userId: string,
  codigo: string,
  conv: InboxConversationRow,
): OportunidadInsert {
  const metadata = (conv.metadata ?? {}) as Record<string, unknown>;
  const label = channelLabel(conv.channel);
  const responsable =
    typeof metadata.source_phone_label === "string" && metadata.source_phone_label.trim()
      ? metadata.source_phone_label.trim()
      : label;
  const initials =
    responsable.replace(/[^A-Za-zÁÉÍÓÚáéíóú]/g, "").slice(0, 2).toUpperCase() || label.slice(0, 2);

  return {
    user_id: userId,
    codigo,
    cliente_nombre: conv.contact_name?.trim() || `Contacto ${label}`,
    cliente_ruc: conv.contact_identifier?.trim() || null,
    titulo: `Lead ${label}`,
    subtitulo: (conv.last_message?.trim() || `Conversación ${label}`).slice(0, 160),
    valor: 0,
    etapa: "Prospectos",
    probabilidad: 10,
    responsable_nombre: responsable,
    responsable_iniciales: initials,
    fecha_oportunidad: conv.last_message_at ?? conv.created_at ?? new Date().toISOString(),
  };
}

/** Sincroniza conversaciones WhatsApp, Facebook e Instagram del Inbox a Prospectos. */
export async function syncWhatsAppLeadsToProspeccion(userId: string): Promise<number> {
  const { data: conversations, error } = await supabase
    .from("inbox_conversations")
    .select(
      "channel, contact_name, contact_identifier, external_id, last_message, last_message_at, created_at, metadata",
    )
    .eq("user_id", userId)
    .in("channel", [...SOCIAL_CHANNELS])
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.warn("[crm] Inbox social:", error.message);
    return 0;
  }

  if (!conversations?.length) return 0;

  const latestByCodigo = new Map<string, InboxConversationRow>();
  for (const conv of conversations) {
    if (isGenericLastMessage(conv.last_message)) continue;
    const codigo = leadCodigoFromConversation(conv);
    if (!codigo || latestByCodigo.has(codigo)) continue;
    latestByCodigo.set(codigo, conv);
  }

  const codigos = [...latestByCodigo.keys()];
  if (codigos.length === 0) return 0;

  const { data: existing, error: existingError } = await supabase
    .from("oportunidades")
    .select("codigo, etapa")
    .eq("user_id", userId)
    .in("codigo", codigos);

  if (existingError) {
    console.warn("[crm] Oportunidades sociales existentes:", existingError.message);
    return 0;
  }

  const existingMap = new Map((existing ?? []).map((row) => [row.codigo, row.etapa]));
  const inserts: OportunidadInsert[] = [];
  const updates: OportunidadInsert[] = [];

  for (const [codigo, conv] of latestByCodigo) {
    const row = buildSocialOportunidadRow(userId, codigo, conv);
    const etapa = existingMap.get(codigo);

    if (!etapa) {
      inserts.push(row);
    } else if (etapa === "Prospectos") {
      updates.push(row);
    }
  }

  let synced = 0;

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from("oportunidades").insert(inserts);
    if (insertError) {
      console.warn("[crm] Insert social leads:", insertError.message);
    } else {
      synced += inserts.length;
    }
  }

  for (const row of updates) {
    const { error: updateError } = await supabase
      .from("oportunidades")
      .update({
        cliente_nombre: row.cliente_nombre,
        cliente_ruc: row.cliente_ruc,
        subtitulo: row.subtitulo,
        fecha_oportunidad: row.fecha_oportunidad,
      })
      .eq("user_id", userId)
      .eq("codigo", row.codigo!)
      .eq("etapa", "Prospectos");

    if (!updateError) synced += 1;
  }

  return synced;
}
