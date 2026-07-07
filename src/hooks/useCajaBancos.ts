import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCajaBancosSnapshot,
  filterCajaBancosRecords,
} from "@/lib/caja-bancos/caja-bancos-service";

const QUERY_KEY = ["caja-bancos", "snapshot"] as const;

export function useCajaBancos() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("todos");
  const [selectedCuenta, setSelectedCuenta] = useState("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchCajaBancosSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const availableCuentas = useMemo(() => {
    if (!data) return [] as string[];
    return [...new Set(data.records.map((item) => item.account))].sort((a, b) =>
      a.localeCompare(b, "es"),
    );
  }, [data]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return filterCajaBancosRecords(data.records, {
      activeTab,
      search,
      selectedCuenta,
    });
  }, [activeTab, data, search, selectedCuenta]);

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

  const setSelectedCuentaSafe = useCallback((value: string) => {
    setSelectedCuenta(value);
    setPage(1);
  }, []);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    snapshot: data,
    filteredRecords,
    paginatedRecords,
    availableCuentas,
    activeTab,
    setActiveTab: setActiveTabSafe,
    selectedCuenta,
    setSelectedCuenta: setSelectedCuentaSafe,
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
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
