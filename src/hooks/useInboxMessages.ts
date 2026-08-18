import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchInboxMessages, markConversationRead } from "@/lib/inbox/inbox-service";
import type { InboxMessage } from "@/lib/inbox/types";

const messagesQueryKey = (conversationId: string) =>
  ["inbox", "messages", conversationId] as const;

export function useInboxMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<InboxMessage[]>({
    queryKey: conversationId ? messagesQueryKey(conversationId) : ["inbox", "messages", "none"],
    queryFn: () => fetchInboxMessages(conversationId!, { syncRemote: true }),
    enabled: Boolean(conversationId),
    staleTime: 1_500,
    refetchInterval: conversationId ? 4_000 : false,
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`inbox-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inbox_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            conversation_id?: string;
            direction?: string;
            body?: string;
            sent_at?: string;
          };
          if (row?.id && row.body) {
            queryClient.setQueryData<InboxMessage[]>(messagesQueryKey(conversationId), (current) => {
              if ((current ?? []).some((item) => item.id === row.id)) return current;
              return [
                ...(current ?? []),
                {
                  id: row.id,
                  conversationId: row.conversation_id || conversationId,
                  direction: row.direction === "outbound" ? "outbound" : "inbound",
                  body: row.body,
                  sentAt: row.sent_at || new Date().toISOString(),
                },
              ];
            });
          }
          void queryClient.invalidateQueries({ queryKey: messagesQueryKey(conversationId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    if (!conversationId) return;
    void markConversationRead(conversationId);
  }, [conversationId]);

  return query;
}
