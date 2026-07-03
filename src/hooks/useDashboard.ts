import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import { buildSnapshot, fetchDashboardSnapshot } from "@/lib/dashboard/dashboard-service";
import type { DashboardRecord, DashboardTabId } from "@/lib/dashboard-mock-data";
import { isIsoDateInRange, parseDisplayDateToIso } from "@/lib/period-filter";

const QUERY_KEY = ["dashboard", "snapshot"] as const;

export function useDashboard() {
  const { user } = useAuth();
  const { range } = useAppPeriod();
  const [activeTab, setActiveTab] = useState<DashboardTabId>("resumen");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchDashboardSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const periodRecords = useMemo(() => {
    if (!data) return [] as DashboardRecord[];

    return data.records.filter((item) => {
      const itemIso = parseDisplayDateToIso(item.date);
      return isIsoDateInRange(itemIso, range);
    });
  }, [data, range]);

  const displaySnapshot = useMemo(() => {
    if (!data) return data;
    return buildSnapshot(periodRecords, data.source);
  }, [data, periodRecords]);

  const filteredRecords = useMemo(() => {
    if (!data) return [] as DashboardRecord[];
    const query = search.trim().toLowerCase();

    return periodRecords.filter((item) => {
      const matchesTab = activeTab === "resumen" || item.tab === activeTab;
      const matchesSearch =
        !query ||
        item.document.toLowerCase().includes(query) ||
        item.area.toLowerCase().includes(query) ||
        item.detail.toLowerCase().includes(query) ||
        item.responsible.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, periodRecords, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    snapshot: displaySnapshot,
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
