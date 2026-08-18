import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { filterInboxConversations } from "@/lib/inbox/mock-data";
import { INBOX_CHANNEL_ORDER, inboxChannelMeta } from "@/lib/inbox/channels";
import { fetchInboxSnapshot, fetchInboxChannelConnections } from "@/lib/inbox/inbox-service";
import { getAllInboxProviders } from "@/lib/inbox/providers";
import type { ChannelConnection, InboxFilters, WhatsAppConnectionFilter } from "@/lib/inbox/types";

const INBOX_QUERY_KEY = ["inbox", "snapshot"] as const;

export function useInbox(initialFilters?: Partial<InboxFilters>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const didRemoteSync = useRef(false);
  const [filters, setFilters] = useState<InboxFilters>({
    view: "all",
    advisor: "all",
    search: "",
    ...initialFilters,
  });
  const [whatsappConnectionFilter, setWhatsappConnectionFilter] =
    useState<WhatsAppConnectionFilter>("all");
  const [showSidebar, setShowSidebar] = useState(true);

  const { data, isLoading, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...INBOX_QUERY_KEY, user?.id ?? "guest"],
    queryFn: async () => {
      const snapshot = await fetchInboxSnapshot(user?.id ?? null, {
        syncRemote: true,
      });
      didRemoteSync.current = true;
      const connections = user?.id ? await fetchInboxChannelConnections(user.id) : [];
      return { snapshot, connections };
    },
    staleTime: 2_000,
    refetchInterval: 8_000,
    refetchOnWindowFocus: true,
  });

  const snapshot = data?.snapshot;
  const dbConnections = data?.connections ?? [];

  const whatsappConnections = useMemo(
    () => dbConnections.filter((item) => item.channel === "whatsapp"),
    [dbConnections],
  );

  const filteredConversations = useMemo(() => {
    if (!snapshot) return [];
    if (filters.view === "team-chat") return [];

    let conversations = filterInboxConversations(snapshot.conversations, filters);

    if (whatsappConnectionFilter !== "all") {
      conversations = conversations.filter(
        (conversation) => conversation.connectionId === whatsappConnectionFilter,
      );
    }

    return conversations;
  }, [snapshot, filters, whatsappConnectionFilter]);

  const advisors = useMemo(() => {
    if (!snapshot) return [];
    return [...new Set(snapshot.conversations.map((item) => item.advisor))].sort();
  }, [snapshot]);

  const channelConnections: ChannelConnection[] = useMemo(() => {
    return INBOX_CHANNEL_ORDER.map((channel) => {
      const channelRows = dbConnections.filter((item) => item.channel === channel);
      const connectedRow = channelRows.find((item) => item.status === "connected");

      if (connectedRow) {
        return connectedRow;
      }

      if (channelRows[0]) {
        return channelRows[0];
      }

      const provider = getAllInboxProviders().find((item) => item.channel === channel);
      return {
        channel,
        status: provider?.isConfigured() ? "connected" : "disconnected",
        accountLabel: provider?.isConfigured() ? inboxChannelMeta[channel].label : undefined,
        lastSyncAt: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined,
      };
    });
  }, [dbConnections, dataUpdatedAt]);

  const refresh = useCallback(async () => {
    didRemoteSync.current = false;
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY });
  }, [queryClient]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`inbox-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inbox_conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inbox_messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const conversationId =
            payload.new && typeof payload.new === "object" && "conversation_id" in payload.new
              ? String((payload.new as { conversation_id?: string }).conversation_id ?? "")
              : "";
          void queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY });
          if (conversationId) {
            void queryClient.invalidateQueries({
              queryKey: ["inbox", "messages", conversationId],
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    snapshot,
    filteredConversations,
    filters,
    setFilters,
    whatsappConnectionFilter,
    setWhatsappConnectionFilter,
    whatsappConnections,
    advisors,
    channelConnections,
    showSidebar,
    setShowSidebar,
    isLoading,
    isFetching,
    isError,
    refresh,
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
