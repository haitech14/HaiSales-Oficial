import { supabase } from "@/integrations/supabase/client";
import { importProductosLegacyForUser } from "@/lib/inventario/import-productos-legacy";
import { ensureVentasImported, normalizeFechaIso } from "@/lib/ventas/ventas-period-utils";

export type InventarioMovimiento = {
  id: string;
  fecha: string;
  hora: string;
  tipo: "Entrada" | "Salida" | "Transferencia";
  producto: string;
  sku: string;
  cantidad: number;
  unidad: string;
  almacen: string;
  referencia: string;
  motivo: string;
};

export type VentasProductosSyncSummary = {
  productosImportados: number;
  ventaItemsRpc: number;
  itemsVinculados: number;
  kardexCreados: number;
};

type ProductoLite = {
  id: string;
  sku: string | null;
  nombre: string;
  almacen: string;
  costo: number;
  stock: number;
  unidad: string;
  tipo: string | null;
};

type VentaLite = {
  id: string;
  codigo_comprobante: string | null;
  numero: string;
  cliente_nombre: string | null;
  fecha: string;
  estado: string;
};

type VentaItemLite = {
  id: string;
  venta_id: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
};

const KARDEX_TABLE = "kardex_movimientos" as const;

function formatMovementDate(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return {
    fecha: date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function matchProducto(
  productos: ProductoLite[],
  descripcion: string,
  codigoHint?: string | null,
): ProductoLite | null {
  const normalizedHint = codigoHint?.trim();
  if (normalizedHint) {
    const byHint = productos.find(
      (producto) => producto.sku?.toLowerCase() === normalizedHint.toLowerCase(),
    );
    if (byHint) return byHint;
  }

  const skuCandidate = descripcion.trim().match(/^([A-Z0-9][A-Z0-9\-_.:]{2,})/i)?.[1];
  if (skuCandidate) {
    const bySku = productos.find(
      (producto) => producto.sku?.toLowerCase() === skuCandidate.toLowerCase(),
    );
    if (bySku) return bySku;
  }

  const normalizedDescription = descripcion.trim().toLowerCase();
  if (!normalizedDescription) return null;

  const byName = productos.find((producto) => {
    const name = producto.nombre.toLowerCase();
    return (
      normalizedDescription.includes(name) ||
      name.includes(normalizedDescription.slice(0, Math.min(40, normalizedDescription.length)))
    );
  });

  return byName ?? null;
}

async function loadProductosIndex(userId: string): Promise<ProductoLite[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("id, sku, nombre, almacen, costo, stock, unidad, tipo")
    .eq("user_id", userId)
    .eq("activo", true);

  if (error) {
    console.warn("[sync] productos:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    sku: row.sku,
    nombre: row.nombre,
    almacen: row.almacen,
    costo: Number(row.costo ?? 0),
    stock: Number(row.stock ?? 0),
    unidad: row.unidad,
    tipo: row.tipo,
  }));
}

async function loadVentasIndex(userId: string): Promise<VentaLite[]> {
  const { data, error } = await supabase
    .from("ventas")
    .select("id, codigo_comprobante, numero, cliente_nombre, fecha, estado")
    .eq("user_id", userId)
    .neq("estado", "anulada");

  if (error) {
    console.warn("[sync] ventas:", error.message);
    return [];
  }

  return data ?? [];
}

async function loadVentaItems(ventaIds: string[]): Promise<VentaItemLite[]> {
  if (ventaIds.length === 0) return [];

  const { data, error } = await supabase
    .from("venta_items")
    .select("id, venta_id, producto_id, descripcion, cantidad")
    .in("venta_id", ventaIds);

  if (error) {
    console.warn("[sync] venta_items:", error.message);
    return [];
  }

  return data ?? [];
}

async function kardexExists(
  userId: string,
  productoId: string,
  documentoReferencia: string,
  tipo: "entrada" | "salida",
): Promise<boolean> {
  const kardexTable = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { count, error } = await kardexTable
    .from(KARDEX_TABLE)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("producto_id", productoId)
    .eq("documento_referencia", documentoReferencia)
    .eq("tipo", tipo);

  if (error) {
    console.warn("[sync] kardex exists:", error.message);
    return true;
  }

  return (count ?? 0) > 0;
}

async function registerStockMovement(input: {
  userId: string;
  producto: ProductoLite;
  cantidad: number;
  tipo: "entrada" | "salida";
  documentoReferencia: string;
  motivo: string;
  responsable: string;
  fechaMovimiento: string;
}): Promise<boolean> {
  const qty = Math.abs(input.cantidad);
  if (qty <= 0 || input.producto.tipo === "service") return false;

  const exists = await kardexExists(
    input.userId,
    input.producto.id,
    input.documentoReferencia,
    input.tipo,
  );
  if (exists) return false;

  const costoUnitario = input.producto.costo > 0 ? input.producto.costo : 0;
  const kardexTable = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { error: kardexError } = await kardexTable.from(KARDEX_TABLE).insert({
    user_id: input.userId,
    producto_id: input.producto.id,
    almacen_origen: input.producto.almacen,
    almacen_destino: null,
    tipo: input.tipo,
    cantidad: qty,
    unidad: input.producto.unidad,
    costo_unitario: costoUnitario,
    costo_total: qty * costoUnitario,
    motivo: input.motivo,
    responsable: input.responsable,
    documento_referencia: input.documentoReferencia,
    estado: "completado",
    fecha_movimiento: input.fechaMovimiento,
  } as never);

  if (kardexError) {
    console.warn("[sync] kardex insert:", kardexError.message);
    return false;
  }

  const nextStock =
    input.tipo === "entrada"
      ? input.producto.stock + qty
      : Math.max(0, input.producto.stock - qty);

  const { error: stockError } = await supabase
    .from("productos")
    .update({
      stock: nextStock,
      ultimo_movimiento_at: new Date().toISOString(),
    })
    .eq("id", input.producto.id)
    .eq("user_id", input.userId);

  if (stockError) {
    console.warn("[sync] stock update:", stockError.message);
    return false;
  }

  input.producto.stock = nextStock;
  return true;
}

async function linkOrphanVentaItems(
  userId: string,
  productos: ProductoLite[],
  items: VentaItemLite[],
): Promise<number> {
  let linked = 0;

  for (const item of items) {
    if (item.producto_id) continue;

    const producto = matchProducto(productos, item.descripcion);
    if (!producto) continue;

    const { error } = await supabase
      .from("venta_items")
      .update({ producto_id: producto.id })
      .eq("id", item.id);

    if (!error) {
      item.producto_id = producto.id;
      linked += 1;
    }
  }

  return linked;
}

async function ensureKardexForLinkedItems(
  userId: string,
  productos: ProductoLite[],
  ventas: VentaLite[],
  items: VentaItemLite[],
): Promise<number> {
  const ventaMap = new Map(ventas.map((venta) => [venta.id, venta]));
  let created = 0;

  for (const item of items) {
    if (!item.producto_id) continue;

    const venta = ventaMap.get(item.venta_id);
    const producto = productos.find((row) => row.id === item.producto_id);
    if (!venta || !producto) continue;

    const cantidad = Number(item.cantidad);
    if (!cantidad) continue;

    const documento = venta.codigo_comprobante ?? venta.numero;
    const tipo = cantidad < 0 ? "entrada" : "salida";
    const inserted = await registerStockMovement({
      userId,
      producto,
      cantidad,
      tipo,
      documentoReferencia: documento,
      motivo: `Venta ${documento}`,
      responsable: venta.cliente_nombre ?? "Ventas",
      fechaMovimiento: normalizeFechaIso(venta.fecha),
    });

    if (inserted) created += 1;
  }

  return created;
}

export async function syncVentasProductosKardex(
  userId: string,
): Promise<VentasProductosSyncSummary> {
  const summary: VentasProductosSyncSummary = {
    productosImportados: 0,
    ventaItemsRpc: 0,
    itemsVinculados: 0,
    kardexCreados: 0,
  };

  const productosImport = await importProductosLegacyForUser(userId);
  summary.productosImportados = productosImport.count;

  await ensureVentasImported(userId);

  const { data: rpcCount, error: rpcError } = await supabase.rpc(
    "import_venta_items_legacy_for_user",
    { p_user_id: userId },
  );

  if (!rpcError && typeof rpcCount === "number") {
    summary.ventaItemsRpc = rpcCount;
  } else if (rpcError) {
    console.warn("[sync] import venta_items RPC:", rpcError.message);
  }

  const [productos, ventas] = await Promise.all([
    loadProductosIndex(userId),
    loadVentasIndex(userId),
  ]);
  const items = await loadVentaItems(ventas.map((venta) => venta.id));

  summary.itemsVinculados = await linkOrphanVentaItems(userId, productos, items);
  summary.kardexCreados = await ensureKardexForLinkedItems(userId, productos, ventas, items);

  return summary;
}

export async function registerVentaItemStockMovement(input: {
  userId: string;
  productoId: string;
  cantidad: number;
  documentoReferencia: string;
  clienteNombre?: string | null;
  fechaMovimiento: string;
}): Promise<void> {
  const { data: producto, error } = await supabase
    .from("productos")
    .select("id, sku, nombre, almacen, costo, stock, unidad, tipo")
    .eq("user_id", input.userId)
    .eq("id", input.productoId)
    .maybeSingle();

  if (error || !producto || producto.tipo === "service") return;

  const cantidad = Number(input.cantidad);
  if (!cantidad) return;

  await registerStockMovement({
    userId: input.userId,
    producto: {
      id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      almacen: producto.almacen,
      costo: Number(producto.costo ?? 0),
      stock: Number(producto.stock ?? 0),
      unidad: producto.unidad,
      tipo: producto.tipo,
    },
    cantidad,
    tipo: cantidad < 0 ? "entrada" : "salida",
    documentoReferencia: input.documentoReferencia,
    motivo: `Venta ${input.documentoReferencia}`,
    responsable: input.clienteNombre ?? "Ventas",
    fechaMovimiento: normalizeFechaIso(input.fechaMovimiento),
  });
}

export async function resolveProductoIdForVenta(
  userId: string,
  descripcion: string,
  codigoHint?: string | null,
): Promise<string | null> {
  const productos = await loadProductosIndex(userId);
  return matchProducto(productos, descripcion, codigoHint)?.id ?? null;
}

export async function fetchRecentInventarioMovimientos(
  userId: string,
  limit = 8,
): Promise<InventarioMovimiento[]> {
  const kardexTable = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { data, error } = await kardexTable
    .from(KARDEX_TABLE)
    .select("id, tipo, cantidad, unidad, almacen_origen, documento_referencia, motivo, created_at, productos(nombre, sku)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[inventario] movimientos:", error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    tipo: string;
    cantidad: number;
    unidad: string;
    almacen_origen: string | null;
    documento_referencia: string | null;
    motivo: string | null;
    created_at: string;
    productos: { nombre: string; sku: string | null } | null;
  }>).map((row) => {
    const { fecha, hora } = formatMovementDate(row.created_at);
    const tipo =
      row.tipo === "entrada" ? "Entrada" : row.tipo === "salida" ? "Salida" : "Transferencia";

    return {
      id: row.id,
      fecha,
      hora,
      tipo,
      producto: row.productos?.nombre ?? "Producto",
      sku: row.productos?.sku ?? "—",
      cantidad: Number(row.cantidad),
      unidad: row.unidad,
      almacen: row.almacen_origen ?? "Almacén Central",
      referencia: row.documento_referencia ?? "—",
      motivo: row.motivo ?? "Movimiento de inventario",
    };
  });
}
