import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { pickHumanContactName } from "@/lib/crm/contact-display-name";

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
    const digits = (conv.contact_identifier || "").replace(/\D/g, "");
    if (digits.length >= 6) return `WA-${digits.slice(0, 20)}`;
    const raw = (conv.external_id || conv.contact_identifier || "").replace(/[^A-Za-z0-9]/g, "");
    if (!raw) return null;
    return `WA-${raw.slice(0, 20)}`;
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
  responsableNombre: string,
): OportunidadInsert {
  const metadata = (conv.metadata ?? {}) as Record<string, unknown>;
  const label = channelLabel(conv.channel);
  const responsable = responsableNombre.trim() || "Usuario";
  const initials =
    responsable
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "US";
  const displayName = typeof metadata.display_name === "string" ? metadata.display_name : "";
  const profileName = typeof metadata.profile_name === "string" ? metadata.profile_name : "";
  const waUsername = typeof metadata.wa_username === "string" ? metadata.wa_username : "";
  const clienteNombre =
    pickHumanContactName(displayName, profileName, waUsername, conv.contact_name) ||
    conv.contact_name?.trim() ||
    `Contacto ${label}`;

  return {
    user_id: userId,
    codigo,
    cliente_nombre: clienteNombre,
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
export async function syncWhatsAppLeadsToProspeccion(
  userId: string,
  options?: { insertOnly?: boolean; responsableNombre?: string },
): Promise<number> {
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
    const codigo = leadCodigoFromConversation(conv);
    if (!codigo || latestByCodigo.has(codigo)) continue;
    latestByCodigo.set(codigo, conv);
  }

  const codigos = [...latestByCodigo.keys()];
  if (codigos.length === 0) return 0;

  const { data: existing, error: existingError } = await supabase
    .from("oportunidades")
    .select("codigo, etapa, cliente_nombre")
    .eq("user_id", userId)
    .in("codigo", codigos);

  if (existingError) {
    console.warn("[crm] Oportunidades sociales existentes:", existingError.message);
    return 0;
  }

  const existingMap = new Map((existing ?? []).map((row) => [row.codigo, row]));
  const inserts: OportunidadInsert[] = [];
  const updates: OportunidadInsert[] = [];

  for (const [codigo, conv] of latestByCodigo) {
    const row = buildSocialOportunidadRow(
      userId,
      codigo,
      conv,
      options?.responsableNombre || "Usuario",
    );
    const current = existingMap.get(codigo);

    if (!current) {
      inserts.push(row);
      continue;
    }
    if (current.etapa !== "Prospectos") continue;

    const nextName = pickHumanContactName(row.cliente_nombre, current.cliente_nombre) || row.cliente_nombre;
    const nameImproved = nextName !== current.cliente_nombre && Boolean(pickHumanContactName(nextName));
    if (!options?.insertOnly || nameImproved) {
      updates.push({ ...row, cliente_nombre: nextName });
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

  if (updates.length > 0) {
    const chunkSize = 8;
    for (let index = 0; index < updates.length; index += chunkSize) {
      const chunk = updates.slice(index, index + chunkSize);
      const results = await Promise.all(
        chunk.map((row) =>
          supabase
            .from("oportunidades")
            .update({
              cliente_nombre: row.cliente_nombre,
              cliente_ruc: row.cliente_ruc,
              subtitulo: row.subtitulo,
              fecha_oportunidad: row.fecha_oportunidad,
            })
            .eq("user_id", userId)
            .eq("codigo", row.codigo!)
            .eq("etapa", "Prospectos"),
        ),
      );
      synced += results.filter((result) => !result.error).length;
    }
  }

  return synced;
}
