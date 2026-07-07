import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAlquileresSnapshot,
  filterAlquilerRecords,
} from "@/lib/alquileres/alquileres-service";

const QUERY_KEY = ["alquileres", "snapshot"] as const;

export function useAlquileres() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAlquileresSnapshot,
    staleTime: 30_000,
  });

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return filterAlquilerRecords(data.records, {
      activeTab,
      search,
      statusFilter,
      equipmentTypeFilter,
    });
  }, [activeTab, data, equipmentTypeFilter, search, statusFilter]);

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
    statusFilter,
    setStatusFilter,
    equipmentTypeFilter,
    setEquipmentTypeFilter,
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
