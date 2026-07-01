import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchContabilidadSnapshot } from "@/lib/contabilidad/contabilidad-service";
import type { ContabilidadRecord } from "@/lib/contabilidad-mock-data";

const CONTABILIDAD_QUERY_KEY = ["contabilidad", "snapshot"] as const;

export function useContabilidad() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...CONTABILIDAD_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchContabilidadSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredRecords = useMemo(() => {
    if (!data) return [] as ContabilidadRecord[];

    const query = search.trim().toLowerCase();

    return data.records.filter((item) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "asientos" && item.section === "asientos") ||
        (activeTab === "libro-diario" && item.section === "libro-diario") ||
        (activeTab === "balance" && item.section === "balance") ||
        (activeTab === "resultados" && item.section === "resultados") ||
        (activeTab === "conciliacion" && item.section === "conciliacion");

      const matchesSearch =
        !query ||
        item.entryCode.toLowerCase().includes(query) ||
        item.account.toLowerCase().includes(query) ||
        item.accountCode.includes(query) ||
        item.document.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CONTABILIDAD_QUERY_KEY });
  }, [queryClient]);

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
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
