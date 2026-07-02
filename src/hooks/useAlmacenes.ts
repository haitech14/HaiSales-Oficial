import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  createMovimientoAlmacen,
  fetchAlmacenesSnapshot,
} from "@/lib/almacenes/almacenes-service";
import type { NuevoMovimientoFormState } from "@/lib/almacenes-form-data";
import type { KardexMovement } from "@/lib/almacenes-mock-data";

const QUERY_KEY = ["almacenes", "snapshot"] as const;

export function useAlmacenes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchAlmacenesSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: ({ form, esBorrador }: { form: NuevoMovimientoFormState; esBorrador?: boolean }) => {
      if (!user?.id) throw new Error("Debes iniciar sesión");
      return createMovimientoAlmacen(user.id, form, esBorrador);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const filteredMovements = useMemo(() => {
    if (!data) return [] as KardexMovement[];
    const query = search.trim().toLowerCase();

    return data.movements.filter((item) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "entradas" && item.tipo === "Entrada") ||
        (activeTab === "salidas" && item.tipo === "Salida") ||
        (activeTab === "transferencias" && item.tipo === "Transferencia");

      const matchesSearch =
        !query ||
        item.producto.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.almacen.toLowerCase().includes(query) ||
        item.referencia.toLowerCase().includes(query);

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
    filteredMovements,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    createMovimiento: createMutation.mutateAsync,
    isCreatingMovimiento: createMutation.isPending,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
