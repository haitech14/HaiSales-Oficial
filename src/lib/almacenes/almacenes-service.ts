import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  almacenesKpis as staticKpis,
  almacenesTabs,
  kardexMovements as mockMovements,
  type KardexMovement,
} from "@/lib/almacenes-mock-data";
import {
  movimientoAlmacenes,
  movimientoResponsables,
  type NuevoMovimientoFormState,
} from "@/lib/almacenes-form-data";
import { seedDemoDataForUser } from "@/lib/seed-demo";

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

export type AlmacenesSnapshot = {
  movements: KardexMovement[];
  almacenes: AlmacenRow[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
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
    estado: row.estado === "borrador" ? "Borrador" : "Completado",
  };
}

function mapProductoToMovement(row: ProductoRow, index: number): KardexMovement {
  const { fecha, hora } = formatDateTime(row.ultimo_movimiento_at ?? row.updated_at);
  const tipo = row.stock <= 5 ? "Salida" : index % 3 === 0 ? "Entrada" : "Transferencia";
  return {
    id: `MOV-${row.id.slice(0, 8).toUpperCase()}`,
    fecha,
    hora,
    tipo,
    producto: row.nombre,
    sku: row.sku ?? "—",
    cantidad: Math.max(1, Math.min(row.stock, 24)),
    unidad: row.unidad,
    almacen: row.almacen ?? "Almacén Principal",
    ubicacion: "—",
    costo: Number(row.costo ?? row.precio) * Math.max(1, Math.min(row.stock, 5)),
    referencia: `PRD-${row.id.slice(0, 6).toUpperCase()}`,
    estado: "Completado",
  };
}

function resolveAlmacenLabel(value: string) {
  return movimientoAlmacenes.find((item) => item.value === value)?.label ?? value;
}

function resolveResponsableLabel(value: string) {
  return movimientoResponsables.find((item) => item.value === value)?.label ?? value;
}

function buildSnapshot(
  movements: KardexMovement[],
  almacenes: AlmacenRow[],
  source: "supabase" | "mock",
): AlmacenesSnapshot {
  const entradas = movements.filter((m) => m.tipo === "Entrada").length;
  const salidas = movements.filter((m) => m.tipo === "Salida").length;
  const transferencias = movements.filter((m) => m.tipo === "Transferencia").length;

  return {
    movements,
    almacenes,
    kpis: staticKpis,
    tabCounts: {
      todos: null,
      entradas,
      salidas,
      transferencias,
    },
    totalRecords: movements.length,
    source,
  };
}

async function loadKardexMovements(userId: string): Promise<KardexMovement[] | null> {
  const { data, error } = await supabase
    .from("kardex_movimientos" as "productos")
    .select("*, productos(nombre, sku)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return null;
  }

  return ((data ?? []) as unknown as KardexRow[]).map(mapKardexRowToMovement);
}

export async function fetchAlmacenesSnapshot(userId: string | null): Promise<AlmacenesSnapshot> {
  if (!userId) {
    return buildSnapshot(mockMovements, [], "mock");
  }

  const [almacenesResult, kardexMovements] = await Promise.all([
    supabase.from("almacenes").select("*").eq("user_id", userId).eq("activo", true).order("nombre"),
    loadKardexMovements(userId),
  ]);

  if (almacenesResult.error) {
    console.warn("[almacenes] Error al cargar:", almacenesResult.error.message);
    return buildSnapshot(mockMovements, [], "mock");
  }

  let almacenes = almacenesResult.data ?? [];

  if (kardexMovements?.length) {
    return buildSnapshot(kardexMovements, almacenes, "supabase");
  }

  const productosResult = await supabase
    .from("productos")
    .select("*")
    .eq("user_id", userId)
    .eq("activo", true)
    .order("ultimo_movimiento_at", { ascending: false })
    .limit(50);

  if (productosResult.error) {
    return buildSnapshot(mockMovements, almacenes, "mock");
  }

  let productos = productosResult.data ?? [];

  if (!almacenes.length || !productos.length) {
    await seedDemoDataForUser(userId);
    const retryAlmacenes = await supabase
      .from("almacenes")
      .select("*")
      .eq("user_id", userId)
      .eq("activo", true)
      .order("nombre");
    const retryKardex = await loadKardexMovements(userId);
    almacenes = retryAlmacenes.data ?? [];

    if (retryKardex?.length) {
      return buildSnapshot(retryKardex, almacenes, "supabase");
    }

    const retryProductos = await supabase
      .from("productos")
      .select("*")
      .eq("user_id", userId)
      .eq("activo", true)
      .order("ultimo_movimiento_at", { ascending: false })
      .limit(50);
    productos = retryProductos.data ?? [];
  }

  if (!productos.length) {
    return buildSnapshot(mockMovements, almacenes, almacenes.length ? "supabase" : "mock");
  }

  const movements = productos.map(mapProductoToMovement);
  return buildSnapshot(movements, almacenes, "supabase");
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

export {
  almacenesTabs,
  formatKardexCost,
  getMovimientoEstadoStyles,
  getMovimientoStyles,
} from "@/lib/almacenes-mock-data";
