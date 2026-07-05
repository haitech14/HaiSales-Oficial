import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import type { NuevaVentaFormData } from "@/lib/nueva-venta-types";
import { isIsoDateInRange, isPeriodMonthInRange } from "@/lib/period-filter";
import {
  buildVentasSnapshotFromRecords,
  createVentaFromForm,
  fetchVentasSnapshot,
  importVentasLegacyFromDatabase,
  importVentaItemsLegacyFromDatabase,
} from "@/lib/ventas/ventas-service";
import { importVentaReporteRows } from "@/lib/ventas/ventas-import-service";
import type { VentaReporteRow } from "@/lib/ventas/venta-report-import";
import type { VentaRecord } from "@/lib/ventas-mock-data";

const VENTAS_QUERY_KEY = ["ventas", "snapshot"] as const;
const CAJA_QUERY_KEY = ["caja-bancos", "snapshot"] as const;
const CXC_QUERY_KEY = ["cuentas-cobrar", "snapshot"] as const;
const CRM_QUERY_KEY = ["crm", "snapshot"] as const;

export function useVentas() {
  const { user } = useAuth();
  const { range } = useAppPeriod();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...VENTAS_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchVentasSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const periodRecords = useMemo(() => {
    if (!data) return [] as VentaRecord[];

    return data.records.filter((item) => {
      if (item.fechaIso) return isIsoDateInRange(item.fechaIso, range);
      return isPeriodMonthInRange(item.periodMonth, range);
    });
  }, [data, range]);
  const displaySnapshot = useMemo(() => {
    if (!data) return data;
    return buildVentasSnapshotFromRecords(periodRecords);
  }, [data, periodRecords]);

  const filteredRecords = useMemo(() => {
    if (!data) return [] as VentaRecord[];

    const query = search.trim().toLowerCase();

    return periodRecords.filter((item) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "facturas" && item.documentType === "Factura") ||
        (activeTab === "boletas" && item.documentType === "Boleta") ||
        (activeTab === "notas-venta" && item.documentType === "Nota de venta") ||
        (activeTab === "notas" && item.documentType === "Nota de crédito") ||
        (activeTab === "anulados" && item.businessStatus === "Anulada") ||
        (activeTab === "pendientes" && item.status === "Pendiente") ||
        (activeTab === "rechazados" && item.status === "Rechazado");

      const matchesSearch =
        !query ||
        item.client.toLowerCase().includes(query) ||
        item.ruc.includes(query) ||
        item.documentCode.toLowerCase().includes(query) ||
        item.seller.toLowerCase().includes(query) ||
        (item.formaPago?.toLowerCase().includes(query) ?? false) ||
        (item.businessStatus?.toLowerCase().includes(query) ?? false);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, periodRecords, data, search]);

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

  const importMutation = useMutation({
    mutationFn: (rows: VentaReporteRow[]) => {
      if (!user?.id) throw new Error("Debes iniciar sesión para importar comprobantes");
      return importVentaReporteRows(user.id, rows);
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: CAJA_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CXC_QUERY_KEY });
    },
  });

  const importLegacyMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Debes iniciar sesión para importar comprobantes");
      const ventas = await importVentasLegacyFromDatabase(user.id);
      const items = await importVentaItemsLegacyFromDatabase(user.id);
      return ventas + items;
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: CAJA_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CXC_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["clientes", "snapshot"] });
      queryClient.invalidateQueries({ queryKey: CRM_QUERY_KEY });
    },
  });

  const downloadComprobantePdf = useCallback(async (ventaId: string) => {
    const { generateComprobantePdfFromVenta } = await import("@/lib/pdf/generate-comprobante-from-venta");
    return generateComprobantePdfFromVenta(ventaId);
  }, []);

  return {
    snapshot: displaySnapshot,
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
    importVentasReporte: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    importVentasLegacyDb: importLegacyMutation.mutateAsync,
    isImportingLegacyDb: importLegacyMutation.isPending,
    downloadComprobantePdf,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
