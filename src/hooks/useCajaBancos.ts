import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchCajaBancosSnapshot } from "@/lib/caja-bancos/caja-bancos-service";
import type { CajaBancosRecord } from "@/lib/caja-bancos-mock-data";

const QUERY_KEY = ["caja-bancos", "snapshot"] as const;

function periodFromDisplayDate(date: string): string {
  const [day, month, year] = date.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}`;
}

export function useCajaBancos() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("todos");
  const [selectedMonth, setSelectedMonth] = useState("todos");
  const [selectedCuenta, setSelectedCuenta] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchCajaBancosSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const availableMonths = useMemo(() => {
    if (!data) return [] as string[];
    const months = new Set(
      data.records
        .map((item) => periodFromDisplayDate(item.date))
        .filter(Boolean),
    );
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [data]);

  const availableCuentas = useMemo(() => {
    if (!data) return [] as string[];
    return [...new Set(data.records.map((item) => item.cuenta))].sort((a, b) => a.localeCompare(b, "es"));
  }, [data]);

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

      const matchesMonth =
        selectedMonth === "todos" || periodFromDisplayDate(item.date) === selectedMonth;

      const matchesCuenta = selectedCuenta === "todos" || item.cuenta === selectedCuenta;

      const matchesSearch =
        !query ||
        item.concepto.toLowerCase().includes(query) ||
        item.cuenta.toLowerCase().includes(query) ||
        item.cuentaNumero.includes(query) ||
        item.documento.toLowerCase().includes(query);

      return matchesTab && matchesMonth && matchesCuenta && matchesSearch;
    });
  }, [activeTab, data, search, selectedCuenta, selectedMonth]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    snapshot: data,
    filteredRecords,
    availableMonths,
    availableCuentas,
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    selectedCuenta,
    setSelectedCuenta,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
