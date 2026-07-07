import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchServiciosSnapshot, filterServicioRecords } from "@/lib/servicios/servicios-service";

const QUERY_KEY = ["servicios", "snapshot"] as const;

export function useServicios() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchServiciosSnapshot,
    staleTime: 30_000,
  });

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return filterServicioRecords(data.records, { activeTab, search });
  }, [activeTab, data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  const paginatedRecords = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize, totalPages]);

  const setActiveTabSafe = useCallback((tab: string) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  const setSearchSafe = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  return {
    snapshot: data,
    filteredRecords,
    paginatedRecords,
    activeTab,
    setActiveTab: setActiveTabSafe,
    search,
    setSearch: setSearchSafe,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
