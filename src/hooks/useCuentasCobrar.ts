import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchCuentasCobrarSnapshot } from "@/lib/cuentas-cobrar/cuentas-cobrar-service";
import type { CuentasCobrarRecord } from "@/lib/cuentas-cobrar-mock-data";

const QUERY_KEY = ["cuentas-cobrar", "snapshot"] as const;

export function useCuentasCobrar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todas");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchCuentasCobrarSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredRecords = useMemo(() => {
    if (!data) return [] as CuentasCobrarRecord[];
    const query = search.trim().toLowerCase();

    return data.records.filter((item) => {
      const matchesTab =
        activeTab === "todas" ||
        (activeTab === "facturas" && item.section === "facturas") ||
        (activeTab === "notas-credito" && item.section === "notas-credito") ||
        (activeTab === "cobros-recibidos" && item.section === "cobros-recibidos") ||
        (activeTab === "anticipos" && item.section === "anticipos");

      const matchesSearch =
        !query ||
        item.client.toLowerCase().includes(query) ||
        item.document.toLowerCase().includes(query) ||
        item.reference.toLowerCase().includes(query) ||
        item.seller.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
