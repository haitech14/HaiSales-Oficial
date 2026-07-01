import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { createProducto, createProductosBulk, fetchInventarioSnapshot } from "@/lib/inventario/inventario-service";
import type { CreateProductoInput } from "@/lib/inventario/producto-form-data";
import type { InventarioProduct } from "@/lib/inventario/types";

const INVENTARIO_QUERY_KEY = ["inventario", "snapshot"] as const;

export function useInventario() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...INVENTARIO_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchInventarioSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredProducts = useMemo(() => {
    if (!data) return [] as InventarioProduct[];

    const query = search.trim().toLowerCase();

    return data.products.filter((product) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "activos" && product.status === "Activo") ||
        (activeTab === "stock-bajo" && product.status === "Stock bajo") ||
        (activeTab === "sin-movimiento" && product.status === "Sin movimiento") ||
        (activeTab === "servicios" && product.type === "service") ||
        (activeTab === "kits" && product.type === "kit");

      const matchesSearch =
        !query ||
        product.sku.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.warehouse.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: INVENTARIO_QUERY_KEY });
  }, [queryClient]);

  const createProductMutation = useMutation({
    mutationFn: async ({
      input,
    }: {
      input: CreateProductoInput;
      mode: "draft" | "create";
    }) => {
      if (!user?.id) {
        throw new Error("Inicia sesión para crear productos en Supabase");
      }
      return createProducto(user.id, input);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: async (inputs: CreateProductoInput[]) => {
      if (!user?.id) {
        throw new Error("Inicia sesión para importar productos en Supabase");
      }
      return createProductosBulk(user.id, inputs);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const submitNewProduct = useCallback(
    async (input: CreateProductoInput, mode: "draft" | "create") => {
      await createProductMutation.mutateAsync({ input, mode });
    },
    [createProductMutation],
  );

  const importProducts = useCallback(
    async (inputs: CreateProductoInput[]) => {
      await importProductsMutation.mutateAsync(inputs);
    },
    [importProductsMutation],
  );

  return {
    snapshot: data,
    filteredProducts,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    submitNewProduct,
    importProducts,
    isCreatingProduct: createProductMutation.isPending,
    isImportingProducts: importProductsMutation.isPending,
  };
}
