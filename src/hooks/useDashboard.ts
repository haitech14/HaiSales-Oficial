import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchDashboardSnapshot } from "@/lib/dashboard/dashboard-service";
import type { DashboardRecord, DashboardTabId } from "@/lib/dashboard-mock-data";

const QUERY_KEY = ["dashboard", "snapshot"] as const;

export function useDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTabId>("resumen");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchDashboardSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredRecords = useMemo(() => {
    if (!data) return [] as DashboardRecord[];
    const query = search.trim().toLowerCase();

    return data.records.filter((item) => {
      const matchesTab = activeTab === "resumen" || item.tab === activeTab;
      const matchesSearch =
        !query ||
        item.document.toLowerCase().includes(query) ||
        item.area.toLowerCase().includes(query) ||
        item.detail.toLowerCase().includes(query) ||
        item.responsible.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    snapshot: data,
    filteredRecords,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
