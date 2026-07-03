import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  almacenesKpis as staticKpis,
  almacenesTabs,
  type KardexMovement,
} from "@/lib/almacenes-mock-data";
import {
  movimientoAlmacenes,
  movimientoResponsables,
  type NuevoMovimientoFormState,
} from "@/lib/almacenes-form-data";
import { withRealKpi } from "@/lib/kpi-utils";

type KardexRow = {
  id: string;
  producto_id: string | null;
  almacen_origen: string | null;
  almacen_destino: string | null;
  ubicacion_origen: string | null;
  ubicacion_destino: string | null;
  tipo: string;
  cantidad: number;
  unidad: string;
  costo_total: number | null;
  documento_referencia: string | null;
  estado: string;
  fecha_movimiento: string;
  created_at: string;
  productos?: { nombre: string; sku: string | null } | null;
};

type AlmacenRow = Database["public"]["Tables"]["almacenes"]["Row"];
type ProductoRow = Database["public"]["Tables"]["productos"]["Row"];

const WAREHOUSE_COLORS = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ef4444", "#8b5cf6"];

export type AlmacenesPanelStat = {
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type AlmacenesPanelStock = {
  label: string;
  amount: number;
  percent: number;
  color: string;
};

export type AlmacenesPanelAlert = {
  label: string;
  count: number;
  color: string;
  width: string;
};

export type AlmacenesSnapshot = {
  movements: KardexMovement[];
  almacenes: AlmacenRow[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  movimientosPorTipo: AlmacenesPanelStat[];
  stockPorAlmacen: AlmacenesPanelStock[];
  alerts: AlmacenesPanelAlert[];
  source: "supabase" | "mock";
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return {
    fecha: date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function mapKardexRowToMovement(row: KardexRow): KardexMovement {
  const { fecha, hora } = formatDateTime(row.created_at);
  const tipoLabel =
    row.tipo === "entrada" ? "Entrada" : row.tipo === "salida" ? "Salida" : "Transferencia";

  let estado: KardexMovement["estado"] = "Completado";
  if (row.estado === "borrador") estado = "Pendiente";
  if (row.estado === "observado") estado = "Observado";

  return {
    id: `MOV-${row.id.slice(0, 8).toUpperCase()}`,
    fecha,
    hora,
    tipo: tipoLabel,
    producto: row.productos?.nombre ?? "Producto",
    sku: row.productos?.sku ?? "—",
    cantidad: Number(row.cantidad),
    unidad: row.unidad,
    almacen: row.almacen_origen ?? row.almacen_destino ?? "Almacén Principal",
    ubicacion: row.ubicacion_origen ?? row.ubicacion_destino ?? "—",
    costo: Number(row.costo_total ?? 0),
    referencia: row.documento_referencia ?? `KDX-${row.id.slice(0, 6).toUpperCase()}`,
    estado,
  };
}

function isCurrentMonth(fecha: string): boolean {
  const parts = fecha.split("/");
  if (parts.length !== 3) return false;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year) return false;
  const now = new Date();
  return month === now.getMonth() + 1 && year === now.getFullYear();
}

function computeStockValorizado(productos: ProductoRow[]): number {
  return productos.reduce((sum, producto) => {
    const cost = Number(producto.costo ?? producto.precio ?? 0);
    return sum + Number(producto.stock) * cost;
  }, 0);
}

function computeMovimientosPorTipo(movements: KardexMovement[]): AlmacenesPanelStat[] {
  const entradas = movements.filter((movement) => movement.tipo === "Entrada").length;
  const salidas = movements.filter((movement) => movement.tipo === "Salida").length;
  const transferencias = movements.filter((movement) => movement.tipo === "Transferencia").length;
  const total = movements.length;

  return [
    {
      label: "Entradas",
      count: entradas,
      percent: total > 0 ? Math.round((entradas / total) * 100) : 0,
      color: "#22c55e",
    },
    {
      label: "Salidas",
      count: salidas,
      percent: total > 0 ? Math.round((salidas / total) * 100) : 0,
      color: "#ef4444",
    },
    {
      label: "Transferencias",
      count: transferencias,
      percent: total > 0 ? Math.round((transferencias / total) * 100) : 0,
      color: "#3b82f6",
    },
  ];
}

function computeStockPorAlmacen(
  productos: ProductoRow[],
  almacenes: AlmacenRow[],
): AlmacenesPanelStock[] {
  const totals = new Map<string, number>();

  for (const producto of productos) {
    const key = producto.almacen?.trim() || "Sin asignar";
    const cost = Number(producto.costo ?? producto.precio ?? 0);
    totals.set(key, (totals.get(key) ?? 0) + Number(producto.stock) * cost);
  }

  const entries =
    almacenes.length > 0
      ? almacenes.map((almacen) => ({
          label: almacen.nombre,
          amount: totals.get(almacen.nombre) ?? 0,
        }))
      : [...totals.entries()].map(([label, amount]) => ({ label, amount }));

  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
  if (totalAmount === 0 && entries.length === 0) return [];

  return entries.map((entry, index) => ({
    ...entry,
    percent: totalAmount > 0 ? Math.round((entry.amount / totalAmount) * 100) : 0,
    color: WAREHOUSE_COLORS[index % WAREHOUSE_COLORS.length],
  }));
}

function computeAlerts(
  movements: KardexMovement[],
  productos: ProductoRow[],
): AlmacenesPanelAlert[] {
  const diferencias = movements.filter((movement) => movement.estado === "Observado").length;
  const bajoStock = productos.filter(
    (producto) => Number(producto.stock) <= Number(producto.stock_minimo ?? 0),
  ).length;
  const transferenciasPendientes = movements.filter(
    (movement) => movement.estado === "Pendiente" && movement.tipo === "Transferencia",
  ).length;

  const alerts: AlmacenesPanelAlert[] = [];

  if (diferencias > 0) {
    alerts.push({
      label: `${diferencias} diferencia${diferencias === 1 ? "" : "s"} por revisar`,
      count: diferencias,
      color: "bg-red-500",
      width: "100%",
    });
  }

  if (bajoStock > 0) {
    alerts.push({
      label: `${bajoStock} producto${bajoStock === 1 ? "" : "s"} bajo stock mínimo`,
      count: bajoStock,
      color: "bg-orange-500",
      width: bajoStock > 0 && diferencias > 0 ? "80%" : "100%",
    });
  }

  if (transferenciasPendientes > 0) {
    alerts.push({
      label: `${transferenciasPendientes} transferencia${transferenciasPendientes === 1 ? "" : "s"} pendiente${transferenciasPendientes === 1 ? "" : "s"}`,
      count: transferenciasPendientes,
      color: "bg-blue-400",
      width: "60%",
    });
  }

  return alerts;
}

function buildSnapshot(
  movements: KardexMovement[],
  almacenes: AlmacenRow[],
  productos: ProductoRow[],
  source: "supabase" | "mock",
): AlmacenesSnapshot {
  const entradas = movements.filter((movement) => movement.tipo === "Entrada").length;
  const salidas = movements.filter((movement) => movement.tipo === "Salida").length;
  const transferencias = movements.filter((movement) => movement.tipo === "Transferencia").length;

  const stockValorizado = computeStockValorizado(productos);
  const entradasMes = movements.filter(
    (movement) => movement.tipo === "Entrada" && isCurrentMonth(movement.fecha),
  ).length;
  const salidasMes = movements.filter(
    (movement) => movement.tipo === "Salida" && isCurrentMonth(movement.fecha),
  ).length;
  const diferencias = movements.filter((movement) => movement.estado === "Observado").length;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) {
      return withRealKpi(
        kpi,
        stockValorizado > 0
          ? `S/ ${Math.round(stockValorizado).toLocaleString("es-PE")}`
          : "S/ 0",
      );
    }
    if (index === 1) return withRealKpi(kpi, String(entradasMes));
    if (index === 2) return withRealKpi(kpi, String(salidasMes));
    if (index === 3) return withRealKpi(kpi, String(diferencias));
    return withRealKpi(kpi, "0");
  });

  return {
    movements,
    almacenes,
    kpis,
    tabCounts: {
      todos: null,
      entradas,
      salidas,
      transferencias,
    },
    totalRecords: movements.length,
    movimientosPorTipo: computeMovimientosPorTipo(movements),
    stockPorAlmacen: computeStockPorAlmacen(productos, almacenes),
    alerts: computeAlerts(movements, productos),
    source,
  };
}

async function loadKardexMovements(userId: string): Promise<KardexMovement[]> {
  const { data, error } = await supabase
    .from("kardex_movimientos" as "productos")
    .select("*, productos(nombre, sku)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.warn("[almacenes] Error al cargar kardex:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as KardexRow[]).map(mapKardexRowToMovement);
}

async function loadProductos(userId: string): Promise<ProductoRow[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("user_id", userId)
    .eq("activo", true);

  if (error) {
    console.warn("[almacenes] Error al cargar productos:", error.message);
    return [];
  }

  let productos = data ?? [];

  if (!productos.length) {
    const imported = await importLegacyProductosIfNeeded(userId);
    if (imported) {
      const retry = await supabase
        .from("productos")
        .select("*")
        .eq("user_id", userId)
        .eq("activo", true);

      if (!retry.error && retry.data?.length) {
        productos = retry.data;
      }
    }
  }

  return productos;
}

async function importLegacyProductosIfNeeded(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("import_productos_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[almacenes] Import legacy productos:", error.message);
    return false;
  }

  return typeof data === "number" && data > 0;
}

export async function fetchAlmacenesSnapshot(userId: string | null): Promise<AlmacenesSnapshot> {
  if (!userId) {
    return buildSnapshot([], [], [], "supabase");
  }

  const [almacenesResult, movements, productos] = await Promise.all([
    supabase.from("almacenes").select("*").eq("user_id", userId).eq("activo", true).order("nombre"),
    loadKardexMovements(userId),
    loadProductos(userId),
  ]);

  if (almacenesResult.error) {
    console.warn("[almacenes] Error al cargar almacenes:", almacenesResult.error.message);
    return buildSnapshot(movements, [], productos, "supabase");
  }

  return buildSnapshot(movements, almacenesResult.data ?? [], productos, "supabase");
}

export async function createMovimientoAlmacen(
  userId: string,
  form: NuevoMovimientoFormState,
  esBorrador = false,
) {
  const cantidad = parseFloat(form.cantidad.replace(/,/g, "")) || 0;
  const costoUnitario = parseFloat(form.costoUnitario.replace(/,/g, "")) || 0;
  const skuQuery = form.productoSku.trim();

  const { data: producto, error: productoError } = await supabase
    .from("productos")
    .select("*")
    .eq("user_id", userId)
    .or(`sku.ilike.%${skuQuery}%,nombre.ilike.%${skuQuery}%`)
    .limit(1)
    .maybeSingle();

  if (productoError || !producto) {
    throw new Error("No se encontró el producto indicado");
  }

  const almacenOrigen = resolveAlmacenLabel(form.almacenOrigen);
  const almacenDestino = resolveAlmacenLabel(form.almacenDestino);
  const responsable = resolveResponsableLabel(form.responsable);
  const tipo = form.tipoMovimiento as "entrada" | "salida" | "transferencia";

  let nuevoStock = producto.stock;
  if (!esBorrador) {
    if (tipo === "entrada") nuevoStock += cantidad;
    if (tipo === "salida") nuevoStock = Math.max(0, nuevoStock - cantidad);
  }

  const kardexPayload = {
    user_id: userId,
    producto_id: producto.id,
    almacen_origen: almacenOrigen,
    almacen_destino: tipo === "transferencia" ? almacenDestino : null,
    ubicacion_origen: form.ubicacionOrigen,
    ubicacion_destino: form.ubicacionDestino,
    tipo,
    cantidad,
    unidad: producto.unidad,
    costo_unitario: costoUnitario || null,
    costo_total: cantidad * (costoUnitario || Number(producto.costo ?? producto.precio)),
    motivo: form.motivo,
    responsable,
    documento_referencia: form.documentoReferencia.trim() || null,
    estado: esBorrador ? "borrador" : "completado",
    fecha_movimiento: form.fechaMovimiento,
  };

  const { error: kardexError } = await supabase
    .from("kardex_movimientos" as "productos")
    .insert(kardexPayload as never);

  if (kardexError) {
    console.warn("[almacenes] kardex_movimientos no disponible:", kardexError.message);
  }

  if (!esBorrador) {
    const { error: updateError } = await supabase
      .from("productos")
      .update({
        stock: nuevoStock,
        almacen: tipo === "transferencia" ? almacenDestino : almacenOrigen,
        ultimo_movimiento_at: new Date().toISOString(),
        costo: costoUnitario || producto.costo,
      })
      .eq("id", producto.id)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  return { productoId: producto.id, cantidad, tipo };
}

function resolveAlmacenLabel(value: string) {
  return movimientoAlmacenes.find((item) => item.value === value)?.label ?? value;
}

function resolveResponsableLabel(value: string) {
  return movimientoResponsables.find((item) => item.value === value)?.label ?? value;
}

export {
  almacenesTabs,
  formatKardexCost,
  getMovimientoEstadoStyles,
  getMovimientoStyles,
} from "@/lib/almacenes-mock-data";
