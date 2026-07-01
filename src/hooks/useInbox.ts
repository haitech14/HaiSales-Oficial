import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { filterInboxConversations } from "@/lib/inbox/mock-data";
import { INBOX_CHANNEL_ORDER, inboxChannelMeta } from "@/lib/inbox/channels";
import { fetchInboxSnapshot } from "@/lib/inbox/inbox-service";
import { getAllInboxProviders } from "@/lib/inbox/providers";
import type { ChannelConnection, InboxFilters } from "@/lib/inbox/types";

const INBOX_QUERY_KEY = ["inbox", "snapshot"] as const;

export function useInbox(initialFilters?: Partial<InboxFilters>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<InboxFilters>({
    tab: "todos",
    channel: "all",
    advisor: "all",
    search: "",
    ...initialFilters,
  });
  const [showSidebar, setShowSidebar] = useState(true);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...INBOX_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchInboxSnapshot(user?.id ?? null),
    staleTime: 60_000,
  });

  const filteredConversations = useMemo(() => {
    if (!data) return [];
    return filterInboxConversations(data.conversations, filters);
  }, [data, filters]);

  const advisors = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.conversations.map((item) => item.advisor))].sort();
  }, [data]);

  const channelConnections: ChannelConnection[] = useMemo(() => {
    return INBOX_CHANNEL_ORDER.map((channel) => {
      const provider = getAllInboxProviders().find((item) => item.channel === channel);
      return {
        channel,
        status: provider?.isConfigured() ? "connected" : "disconnected",
        accountLabel: provider?.isConfigured()
          ? inboxChannelMeta[channel].label
          : undefined,
        lastSyncAt: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined,
      };
    });
  }, [dataUpdatedAt]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY });
  }, [queryClient]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refetch();
    }, 5 * 60_000);
    return () => window.clearInterval(interval);
  }, [refetch]);

  return {
    snapshot: data,
    filteredConversations,
    filters,
    setFilters,
    advisors,
    channelConnections,
    showSidebar,
    setShowSidebar,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
