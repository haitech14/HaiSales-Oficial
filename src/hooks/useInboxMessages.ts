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
    queryFn: () => fetchInboxMessages(conversationId!),
    enabled: Boolean(conversationId),
    staleTime: 15_000,
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
        () => {
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
