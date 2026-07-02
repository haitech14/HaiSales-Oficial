import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchCajaBancosSnapshot } from "@/lib/caja-bancos/caja-bancos-service";
import type { CajaBancosRecord } from "@/lib/caja-bancos-mock-data";

const QUERY_KEY = ["caja-bancos", "snapshot"] as const;

export function useCajaBancos() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchCajaBancosSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredRecords = useMemo(() => {
    if (!data) return [] as CajaBancosRecord[];
    const query = search.trim().toLowerCase();

    return data.records.filter((item) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "ingresos" && item.tipo === "ingreso") ||
        (activeTab === "egresos" && item.tipo === "egreso") ||
        (activeTab === "transferencias" && item.tipo === "transferencia") ||
        (activeTab === "pendientes" && item.estado === "Pendiente") ||
        (activeTab === "conciliados" && item.estado === "Conciliado");

      const matchesSearch =
        !query ||
        item.concepto.toLowerCase().includes(query) ||
        item.cuenta.toLowerCase().includes(query) ||
        item.cuentaNumero.includes(query) ||
        item.documento.toLowerCase().includes(query);

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
