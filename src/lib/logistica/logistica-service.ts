import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  logisticaKpis as staticKpis,
  guiasKpis as staticGuiasKpis,
} from "@/lib/logistica-mock-data";
import { withRealKpi } from "@/lib/kpi-utils";
import { fetchGuiasSnapshot } from "@/lib/logistica/guias-service";
import type {
  DbOrderStatus,
  DbOrderType,
  GuiaRemision,
  LogisticaSnapshot,
  OrderCategory,
  OrderStatus,
  OrderType,
  PurchaseOrder,
  PurchaseOrderDetail,
  PurchaseOrderItem,
} from "@/lib/logistica/types";
type OrdenRow = Database["public"]["Tables"]["ordenes_compra"]["Row"];
type OrdenItemRow = Database["public"]["Tables"]["orden_compra_items"]["Row"];

const STATUS_FROM_DB: Record<DbOrderStatus, OrderStatus> = {
  aprobada: "Aprobada",
  emitida: "Emitida",
  en_transito: "En tránsito",
  recibida: "Recibida",
  observada: "Observada",
};

const TYPE_FROM_DB: Record<DbOrderType, OrderType> = {
  compra: "Compra",
  servicio: "Servicio",
};

function formatDateParts(iso: string) {
  const date = new Date(iso);
  const fecha = date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { fecha, hora };
}

function mapRowToOrder(row: OrdenRow): PurchaseOrder {
  const { fecha, hora } = formatDateParts(row.created_at);
  return {
    id: row.id,
    numero: row.numero,
    requisicionId: row.requisicion_id ?? "—",
    fecha,
    hora,
    proveedor: row.proveedor,
    ruc: row.proveedor_ruc ?? "—",
    tipo: TYPE_FROM_DB[row.tipo as DbOrderType],
    almacen: row.almacen,
    importe: Number(row.importe),
    estado: STATUS_FROM_DB[row.estado as DbOrderStatus],
    responsable: row.responsable,
    responsableInitials: row.responsable_iniciales ?? row.responsable.slice(0, 2).toUpperCase(),
    category: row.categoria as OrderCategory,
    notas: row.notas,
    fechaEntregaEstimada: row.fecha_entrega_estimada,
  };
}

function buildSnapshot(
  orders: PurchaseOrder[],
  guias: GuiaRemision[],
  source: "supabase" | "mock",
): LogisticaSnapshot {
  const openStates: OrderStatus[] = ["Aprobada", "Emitida", "En tránsito", "Observada"];
  const openCount = orders.filter((o) => openStates.includes(o.estado)).length;
  const monthTotal = orders.reduce((sum, o) => sum + o.importe, 0);
  const pendingReception = orders.filter((o) => o.estado === "En tránsito" || o.estado === "Emitida").length;
  const delayed = orders.filter((o) => o.estado === "Observada").length;
  const guiasTransito = guias.filter((g) => g.estado === "En tránsito").length;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return { ...kpi, value: String(openCount + guiasTransito) };
    if (index === 1) {
      return {
        ...kpi,
        value: monthTotal > 0 ? `S/ ${Math.round(monthTotal).toLocaleString("es-PE")}` : "S/ 0",
      };
    }
    if (index === 2) return { ...kpi, value: String(pendingReception + guiasTransito) };
    if (index === 3) return { ...kpi, value: String(delayed) };
    return kpi;
  });

  const guiasEntregadas = guias.filter((g) => g.estado === "Entregada").length;
  const guiasVenta = guias.filter((g) => g.motivoTraslado === "venta").length;

  const guiasKpis = staticGuiasKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(guias.length));
    if (index === 1) return withRealKpi(kpi, String(guiasTransito));
    if (index === 2) return withRealKpi(kpi, String(guiasEntregadas));
    if (index === 3) return withRealKpi(kpi, String(guiasVenta));
    return kpi;
  });

  const tabCounts: Record<string, number | null> = {
    todos: null,
    requisiciones: orders.filter((o) => o.category === "requisicion").length,
    ordenes: orders.filter((o) => o.category === "orden").length,
    transito: orders.filter((o) => o.category === "transito").length,
    recibidas: orders.filter((o) => o.category === "recibida").length,
    observadas: orders.filter((o) => o.category === "observada").length,
  };

  const guiaTabCounts: Record<string, number | null> = {
    todos: null,
    en_transito: guias.filter((g) => g.estado === "En tránsito").length,
    entregadas: guias.filter((g) => g.estado === "Entregada").length,
    venta: guias.filter((g) => g.motivoTraslado === "venta").length,
  };
  const statusGroups: { label: OrderStatus; color: string }[] = [
    { label: "Aprobada", color: "#22c55e" },
    { label: "Emitida", color: "#38bdf8" },
    { label: "En tránsito", color: "#2563eb" },
    { label: "Recibida", color: "#10b981" },
    { label: "Observada", color: "#f97316" },
  ];

  const ordersByStatus = statusGroups.map(({ label, color }) => ({
    label,
    count: orders.filter((o) => o.estado === label).length,
    color,
  }));

  const supplierTotals = new Map<string, number>();
  orders.forEach((order) => {
    supplierTotals.set(order.proveedor, (supplierTotals.get(order.proveedor) ?? 0) + order.importe);
  });

  const sortedSuppliers = [...supplierTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const maxSupplier = sortedSuppliers[0]?.[1] ?? 1;
  const purchasesBySupplier = sortedSuppliers.map(([name, amount]) => ({
    name,
    amount,
    percent: Math.round((amount / maxSupplier) * 100),
  }));

  return {
    orders,
    guias,
    kpis,
    guiasKpis,
    tabCounts,
    guiaTabCounts,
    ordersByStatus,
    purchasesBySupplier,
    logisticsRisks: [],
    totalRecords: orders.length,
    totalGuias: guias.length,
    source,
  };
}
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchLogisticaSnapshot(userId: string | null): Promise<LogisticaSnapshot> {
  if (!userId) {
    return buildSnapshot([], [], "supabase");
  }

  const [{ data, error }, guiasResult] = await Promise.all([
    supabase
      .from("ordenes_compra")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    fetchGuiasSnapshot(userId),
  ]);

  if (error) {
    console.warn("[logistica] Error al cargar órdenes:", error.message);
    return buildSnapshot([], guiasResult.guias, "supabase");
  }

  return buildSnapshot((data ?? []).map(mapRowToOrder), guiasResult.guias, "supabase");
}
export async function fetchOrderDetail(
  orderId: string,
  userId: string | null,
): Promise<PurchaseOrderDetail | null> {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("ordenes_compra")
    .select("*, orden_compra_items(*)")
    .eq("user_id", userId)
    .eq(isUuid(orderId) ? "id" : "numero", orderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const items = ((data.orden_compra_items as OrdenItemRow[] | null) ?? []).map((item) => ({
    id: item.id,
    descripcion: item.descripcion,
    cantidad: Number(item.cantidad),
    precioUnitario: Number(item.precio_unitario),
    subtotal: Number(item.subtotal),
  }));

  return {
    ...mapRowToOrder(data),
    items,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export function formatImporte(value: number) {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export { getOrderStatusStyles } from "@/lib/logistica-mock-data";
