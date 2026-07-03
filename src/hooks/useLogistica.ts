import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchLogisticaSnapshot, fetchOrderDetail } from "@/lib/logistica/logistica-service";
import {
  importGuiaReporteRows,
  importGuiasLegacyFromDatabase,
} from "@/lib/logistica/guias-import-service";
import { updateGuiaRemisionField } from "@/lib/logistica/guias-service";
import type { GuiaRemisionRow } from "@/lib/logistica/guia-report-import";
import type { GuiaEditableField, GuiaRemision, PurchaseOrder } from "@/lib/logistica/types";

const LOGISTICA_QUERY_KEY = ["logistica", "snapshot"] as const;
const ALMACENES_QUERY_KEY = ["almacenes", "snapshot"] as const;

type UseLogisticaOptions = {
  scope?: "guias" | "ordenes";
};

export function useLogistica(options?: UseLogisticaOptions) {
  const scope = options?.scope ?? "ordenes";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"ordenes" | "guias">(scope === "guias" ? "guias" : "ordenes");
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedGuiaId, setSelectedGuiaId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [guiaDetailOpen, setGuiaDetailOpen] = useState(false);
  const [importGuiasOpen, setImportGuiasOpen] = useState(false);

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

  const filteredGuias = useMemo(() => {
    if (!data) return [] as GuiaRemision[];

    const query = search.trim().toLowerCase();

    return data.guias.filter((guia) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "en_transito" && guia.estado === "En tránsito") ||
        (activeTab === "entregadas" && guia.estado === "Entregada") ||
        (activeTab === "venta" && guia.motivoTraslado === "venta");

      const matchesSearch =
        !query ||
        guia.codigoGuia.toLowerCase().includes(query) ||
        guia.destinatario.toLowerCase().includes(query) ||
        guia.ruc.includes(query) ||
        guia.contacto.toLowerCase().includes(query) ||
        guia.dni.includes(query) ||
        guia.telefono.includes(query) ||
        guia.conductor.toLowerCase().includes(query) ||
        (guia.comprobanteRelacionado?.toLowerCase().includes(query) ?? false);

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

  const openGuiaDetail = useCallback((guiaId: string) => {
    setSelectedGuiaId(guiaId);
    setGuiaDetailOpen(true);
  }, []);

  const closeGuiaDetail = useCallback(() => {
    setGuiaDetailOpen(false);
    setSelectedGuiaId(null);
  }, []);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: LOGISTICA_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ALMACENES_QUERY_KEY });
  }, [queryClient]);

  const importGuiasMutation = useMutation({
    mutationFn: (guias: GuiaRemisionRow[]) => {
      if (!user?.id) throw new Error("Debes iniciar sesión para importar guías");
      return importGuiaReporteRows(user.id, guias);
    },
    onSuccess: () => invalidate(),
  });

  const importGuiasLegacyMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("Debes iniciar sesión para importar guías");
      return importGuiasLegacyFromDatabase(user.id);
    },
    onSuccess: () => invalidate(),
  });

  const updateGuiaFieldMutation = useMutation({
    mutationFn: ({
      guiaId,
      field,
      value,
    }: {
      guiaId: string;
      field: GuiaEditableField;
      value: string;
    }) => {
      if (!user?.id) throw new Error("Debes iniciar sesión para editar guías");
      return updateGuiaRemisionField(user.id, guiaId, field, value);
    },
    onSuccess: () => invalidate(),
  });

  const updateGuiaField = useCallback(
    (guiaId: string, field: GuiaEditableField) => async (value: string) => {
      await updateGuiaFieldMutation.mutateAsync({ guiaId, field, value });
    },
    [updateGuiaFieldMutation],
  );

  const fetchDetail = useCallback(
    (orderId: string) => fetchOrderDetail(orderId, user?.id ?? null),
    [user?.id],
  );

  const switchViewMode = useCallback((mode: "ordenes" | "guias") => {
    if (scope === "guias" && mode === "ordenes") return;
    if (scope === "ordenes" && mode === "guias") return;
    setViewMode(mode);
    setActiveTab("todos");
    setSearch("");
  }, [scope]);

  return {
    snapshot: data,
    viewMode,
    setViewMode: switchViewMode,
    filteredOrders,
    filteredGuias,
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
    selectedGuiaId,
    guiaDetailOpen,
    openGuiaDetail,
    closeGuiaDetail,
    fetchDetail,
    importGuiasOpen,
    setImportGuiasOpen,
    importGuiasReporte: importGuiasMutation.mutateAsync,
    isImportingGuias: importGuiasMutation.isPending,
    importGuiasLegacyDb: importGuiasLegacyMutation.mutateAsync,
    isImportingGuiasLegacyDb: importGuiasLegacyMutation.isPending,
    updateGuiaField,
    isUpdatingGuia: updateGuiaFieldMutation.isPending,
  };
}
