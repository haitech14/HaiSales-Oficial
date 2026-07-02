import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { NuevaVentaFormData } from "@/lib/nueva-venta-types";
import { createVentaFromForm, fetchVentasSnapshot } from "@/lib/ventas/ventas-service";
import type { VentaRecord } from "@/lib/ventas-mock-data";

const VENTAS_QUERY_KEY = ["ventas", "snapshot"] as const;

export function useVentas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...VENTAS_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchVentasSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredRecords = useMemo(() => {
    if (!data) return [] as VentaRecord[];

    const query = search.trim().toLowerCase();

    return data.records.filter((item) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "facturas" && item.documentType === "Factura") ||
        (activeTab === "boletas" && item.documentType === "Boleta") ||
        (activeTab === "notas" && item.documentType === "Nota de crédito") ||
        (activeTab === "pendientes" && item.status === "Pendiente") ||
        (activeTab === "rechazados" && item.status === "Rechazado");

      const matchesSearch =
        !query ||
        item.client.toLowerCase().includes(query) ||
        item.ruc.includes(query) ||
        item.documentCode.toLowerCase().includes(query) ||
        item.seller.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: VENTAS_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (form: NuevaVentaFormData) => {
      if (!user?.id) throw new Error("Debes iniciar sesión para registrar ventas");
      return createVentaFromForm(user.id, form);
    },
    onSuccess: () => invalidate(),
  });

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
    createVenta: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
