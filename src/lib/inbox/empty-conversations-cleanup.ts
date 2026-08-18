import { supabase } from "@/integrations/supabase/client";
import { socialLeadBadgeFromCodigo } from "@/lib/crm/whatsapp-prospeccion-sync";

const CLEANUP_TTL_MS = 60_000;
let lastCleanupAt = 0;
let cleanupInFlight: Promise<{ conversations: number; opportunities: number }> | null = null;

type ConversationRow = {
  id: string;
  external_id: string;
  channel: string;
  contact_identifier: string;
  last_message: string | null;
};

type OportunidadRow = {
  codigo: string;
  cliente_nombre: string;
  subtitulo: string | null;
  titulo: string;
  valor: number;
  etapa: string;
};

const GENERIC_LAST_MESSAGE = [
  /^conversaci[oó]n (whatsapp|facebook|instagram|messenger)$/i,
  /^contacto (whatsapp|facebook|instagram)$/i,
  /^lead (whatsapp|facebook|instagram)$/i,
];

export function isGenericLastMessage(lastMessage: string | null | undefined): boolean {
  const text = lastMessage?.trim() ?? "";
  if (!text) return true;
  return GENERIC_LAST_MESSAGE.some((pattern) => pattern.test(text));
}

export function isPlaceholderOportunidad(row: OportunidadRow): boolean {
  if (row.etapa !== "Prospectos" || Number(row.valor) !== 0) return false;

  const name = row.cliente_nombre.trim().toLowerCase();
  const subtitle = row.subtitulo?.trim().toLowerCase() ?? "";

  return (
    name === "nuevo prospecto" ||
    subtitle.includes("completar datos") ||
    subtitle === "prospecto nuevo"
  );
}

function isEmptyConversation(
  conversation: ConversationRow,
  messageCountByConversation: Map<string, number>,
): boolean {
  const messageCount = messageCountByConversation.get(conversation.id) ?? 0;
  if (messageCount > 0) return false;
  if (conversation.contact_identifier?.trim()) return false;
  return isGenericLastMessage(conversation.last_message);
}

export async function deleteEmptyConversations(
  userId: string,
  options?: { force?: boolean },
): Promise<{ conversations: number; opportunities: number }> {
  if (!options?.force && cleanupInFlight) return cleanupInFlight;

  const now = Date.now();
  if (!options?.force && now - lastCleanupAt < CLEANUP_TTL_MS) {
    return { conversations: 0, opportunities: 0 };
  }

  cleanupInFlight = (async () => {
    try {
      const { data: conversations, error: convError } = await supabase
        .from("inbox_conversations")
        .select("id, external_id, channel, contact_identifier, last_message")
        .eq("user_id", userId);

      if (convError) {
        console.warn("[inbox] Limpieza conversaciones vacías:", convError.message);
        return { conversations: 0, opportunities: 0 };
      }

      const rows = (conversations ?? []) as ConversationRow[];
      const conversationIds = rows.map((row) => row.id);
      const messageCountByConversation = new Map<string, number>();

      if (conversationIds.length > 0) {
        const { data: messages, error: msgError } = await supabase
          .from("inbox_messages")
          .select("conversation_id")
          .in("conversation_id", conversationIds);

        if (msgError) {
          console.warn("[inbox] Limpieza mensajes:", msgError.message);
        } else {
          for (const message of messages ?? []) {
            const id = message.conversation_id as string;
            messageCountByConversation.set(id, (messageCountByConversation.get(id) ?? 0) + 1);
          }
        }
      }

      const emptyConversations = rows.filter((row) =>
        isEmptyConversation(row, messageCountByConversation),
      );
      const emptyIds = emptyConversations.map((row) => row.id);

      if (emptyIds.length > 0) {
        await supabase.from("inbox_messages").delete().in("conversation_id", emptyIds);
        const { error: deleteConvError } = await supabase
          .from("inbox_conversations")
          .delete()
          .in("id", emptyIds);

        if (deleteConvError) {
          console.warn("[inbox] Eliminar conversaciones vacías:", deleteConvError.message);
        }
      }

      const { data: opportunities, error: oppError } = await supabase
        .from("oportunidades")
        .select("codigo, cliente_nombre, subtitulo, titulo, valor, etapa")
        .eq("user_id", userId)
        .eq("etapa", "Prospectos");

      if (oppError) {
        console.warn("[inbox] Limpieza oportunidades:", oppError.message);
        return { conversations: emptyIds.length, opportunities: 0 };
      }

      const placeholderCodigos = ((opportunities ?? []) as OportunidadRow[])
        .filter((opp) => isPlaceholderOportunidad(opp) && !socialLeadBadgeFromCodigo(opp.codigo, opp.titulo))
        .map((opp) => opp.codigo);

      if (placeholderCodigos.length > 0) {
        const { error: deleteOppError } = await supabase
          .from("oportunidades")
          .delete()
          .eq("user_id", userId)
          .in("codigo", placeholderCodigos);

        if (deleteOppError) {
          console.warn("[inbox] Eliminar oportunidades vacías:", deleteOppError.message);
        }
      }

      lastCleanupAt = Date.now();
      return {
        conversations: emptyIds.length,
        opportunities: placeholderCodigos.length,
      };
    } catch (error) {
      console.warn(
        "[inbox] Limpieza conversaciones vacías:",
        error instanceof Error ? error.message : error,
      );
      return { conversations: 0, opportunities: 0 };
    } finally {
      cleanupInFlight = null;
    }
  })();

  return cleanupInFlight;
}
