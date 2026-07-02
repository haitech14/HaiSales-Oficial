import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  logisticsRisks as mockRisks,
  logisticaKpis as staticKpis,
  purchaseOrders as mockOrders,
} from "@/lib/logistica-mock-data";
import type {
  DbOrderStatus,
  DbOrderType,
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

const STATUS_TO_DB: Record<OrderStatus, DbOrderStatus> = {
  Aprobada: "aprobada",
  Emitida: "emitida",
  "En tránsito": "en_transito",
  Recibida: "recibida",
  Observada: "observada",
};

const STATUS_FROM_DB: Record<DbOrderStatus, OrderStatus> = {
  aprobada: "Aprobada",
  emitida: "Emitida",
  en_transito: "En tránsito",
  recibida: "Recibida",
  observada: "Observada",
};

const TYPE_TO_DB: Record<OrderType, DbOrderType> = {
  Compra: "compra",
  Servicio: "servicio",
};

const TYPE_FROM_DB: Record<DbOrderType, OrderType> = {
  compra: "Compra",
  servicio: "Servicio",
};

const MOCK_ORDER_ITEMS: Record<string, Omit<PurchaseOrderItem, "id">[]> = {
  "OC-2026-0045": [
    { descripcion: "Laptop Dell Latitude 5540", cantidad: 5, precioUnitario: 4200, subtotal: 21000 },
    { descripcion: "Monitor 24\" Full HD", cantidad: 5, precioUnitario: 890, subtotal: 4450 },
    { descripcion: "Licencia Microsoft 365 Business", cantidad: 5, precioUnitario: 1400, subtotal: 7000 },
  ],
  "OC-2026-0044": [
    { descripcion: "Tóner HP CF410A negro", cantidad: 12, precioUnitario: 320, subtotal: 3840 },
    { descripcion: "Resma papel A4 500 hojas", cantidad: 40, precioUnitario: 112, subtotal: 4480 },
  ],
  "OC-2026-0043": [
    { descripcion: "Servicio de transporte nacional", cantidad: 1, precioUnitario: 5680, subtotal: 5680 },
  ],
};

function defaultItemsForOrder(numero: string, importe: number): Omit<PurchaseOrderItem, "id">[] {
  if (MOCK_ORDER_ITEMS[numero]) return MOCK_ORDER_ITEMS[numero];
  return [
    {
      descripcion: `Ítems de ${numero}`,
      cantidad: 1,
      precioUnitario: importe,
      subtotal: importe,
    },
  ];
}

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

function mapMockToOrder(order: (typeof mockOrders)[number]): PurchaseOrder {
  return {
    id: order.id,
    numero: order.id,
    requisicionId: order.requisicionId,
    fecha: order.fecha,
    hora: order.hora,
    proveedor: order.proveedor,
    ruc: order.ruc,
    tipo: order.tipo,
    almacen: order.almacen,
    importe: order.importe,
    estado: order.estado,
    responsable: order.responsable,
    responsableInitials: order.responsableInitials,
    category: order.category,
    notas: null,
    fechaEntregaEstimada: null,
  };
}

function buildSnapshot(orders: PurchaseOrder[], source: "supabase" | "mock"): LogisticaSnapshot {
  const openStates: OrderStatus[] = ["Aprobada", "Emitida", "En tránsito", "Observada"];
  const openCount = orders.filter((o) => openStates.includes(o.estado)).length;
  const monthTotal = orders.reduce((sum, o) => sum + o.importe, 0);
  const pendingReception = orders.filter((o) => o.estado === "En tránsito" || o.estado === "Emitida").length;
  const delayed = orders.filter((o) => o.estado === "Observada").length;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return { ...kpi, value: String(openCount || kpi.value) };
    if (index === 1) {
      return {
        ...kpi,
        value: monthTotal > 0 ? `S/ ${Math.round(monthTotal).toLocaleString("es-PE")}` : kpi.value,
      };
    }
    if (index === 2) return { ...kpi, value: String(pendingReception || kpi.value) };
    if (index === 3) return { ...kpi, value: String(delayed || kpi.value) };
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
    kpis,
    tabCounts,
    ordersByStatus,
    purchasesBySupplier,
    logisticsRisks: mockRisks,
    totalRecords: orders.length,
    source,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function seedOrdersForUser(userId: string) {
  for (const mock of mockOrders) {
    const { data: inserted, error } = await supabase
      .from("ordenes_compra")
      .insert({
        user_id: userId,
        numero: mock.id,
        requisicion_id: mock.requisicionId,
        proveedor: mock.proveedor,
        proveedor_ruc: mock.ruc,
        tipo: TYPE_TO_DB[mock.tipo],
        almacen: mock.almacen,
        importe: mock.importe,
        estado: STATUS_TO_DB[mock.estado],
        categoria: mock.category,
        responsable: mock.responsable,
        responsable_iniciales: mock.responsableInitials,
        notas: `Orden demo importada desde seed inicial.`,
        fecha_entrega_estimada: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      })
      .select("id, numero")
      .single();

    if (error || !inserted) continue;

    const items = defaultItemsForOrder(mock.id, mock.importe).map((item) => ({
      orden_id: inserted.id,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
      subtotal: item.subtotal,
    }));

    if (items.length > 0) {
      await supabase.from("orden_compra_items").insert(items);
    }
  }
}

export async function fetchLogisticaSnapshot(userId: string | null): Promise<LogisticaSnapshot> {
  if (!userId) {
    return buildSnapshot(mockOrders.map(mapMockToOrder), "mock");
  }

  const { data, error } = await supabase
    .from("ordenes_compra")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[logistica] Error al cargar órdenes:", error.message);
    return buildSnapshot(mockOrders.map(mapMockToOrder), "mock");
  }

  if (!data || data.length === 0) {
    await seedOrdersForUser(userId);
    const retry = await supabase
      .from("ordenes_compra")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (retry.error || !retry.data?.length) {
      return buildSnapshot(mockOrders.map(mapMockToOrder), "mock");
    }
    data = retry.data;
  }

  return buildSnapshot(data.map(mapRowToOrder), "supabase");
}

export async function fetchOrderDetail(
  orderId: string,
  userId: string | null,
): Promise<PurchaseOrderDetail | null> {
  if (!userId) {
    const mock = mockOrders.find((o) => o.id === orderId);
    if (!mock) return null;
    const base = mapMockToOrder(mock);
    const items = defaultItemsForOrder(mock.id, mock.importe).map((item, index) => ({
      id: `mock-item-${index}`,
      ...item,
    }));
    return {
      ...base,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from("ordenes_compra")
    .select("*, orden_compra_items(*)")
    .eq("user_id", userId)
    .eq(isUuid(orderId) ? "id" : "numero", orderId)
    .maybeSingle();

  if (error || !data) {
    const mock = mockOrders.find((o) => o.id === orderId);
    if (!mock) return null;
    return fetchOrderDetail(orderId, null);
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
