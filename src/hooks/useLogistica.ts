import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchLogisticaSnapshot, fetchOrderDetail } from "@/lib/logistica/logistica-service";
import type { PurchaseOrder } from "@/lib/logistica/types";

const LOGISTICA_QUERY_KEY = ["logistica", "snapshot"] as const;

export function useLogistica() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...LOGISTICA_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchLogisticaSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredOrders = useMemo(() => {
    if (!data) return [] as PurchaseOrder[];

    const query = search.trim().toLowerCase();

    return data.orders.filter((order) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "requisiciones" && order.category === "requisicion") ||
        (activeTab === "ordenes" && order.category === "orden") ||
        (activeTab === "transito" && order.category === "transito") ||
        (activeTab === "recibidas" && order.category === "recibida") ||
        (activeTab === "observadas" && order.category === "observada");

      const matchesSearch =
        !query ||
        order.numero.toLowerCase().includes(query) ||
        order.requisicionId.toLowerCase().includes(query) ||
        order.proveedor.toLowerCase().includes(query) ||
        order.ruc.includes(query) ||
        order.almacen.toLowerCase().includes(query) ||
        order.responsable.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, search]);

  const openOrderDetail = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailOpen(true);
  }, []);

  const closeOrderDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedOrderId(null);
  }, []);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: LOGISTICA_QUERY_KEY });
  }, [queryClient]);

  const fetchDetail = useCallback(
    (orderId: string) => fetchOrderDetail(orderId, user?.id ?? null),
    [user?.id],
  );

  return {
    snapshot: data,
    filteredOrders,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    selectedOrderId,
    detailOpen,
    openOrderDetail,
    closeOrderDetail,
    fetchDetail,
  };
}
