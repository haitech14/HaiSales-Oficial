import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProductoInsert = Database["public"]["Tables"]["productos"]["Insert"];

type LegacyProductoRow = {
  legacy_id: string;
  sku: string;
  nombre: string;
  marca: string | null;
  categoria: string;
  stock: number;
  costo: number;
  precio: number;
  precio_mayorista: number | null;
  precio_tecnico: number | null;
  precio_distribuidor: number | null;
  moneda: string;
  tipo: string;
  unidad: string;
  almacen: string;
  afectacion_igv: string;
  descripcion: string | null;
  activo: boolean;
};

const LEGACY_PAGE_SIZE = 1000;
const UPSERT_BATCH_SIZE = 250;

function resolveStockMinimo(tipo: string, categoria: string): number {
  if (tipo === "service") return 0;
  const normalized = categoria.toLowerCase();
  if (normalized.includes("toner") || normalized.includes("repuesto")) return 5;
  return 10;
}

function mapLegacyToProducto(userId: string, src: LegacyProductoRow): ProductoInsert {
  return {
    user_id: userId,
    sku: src.sku,
    nombre: src.nombre,
    descripcion: src.descripcion,
    categoria: src.categoria,
    almacen: src.tipo === "service" ? "Almacén Central" : src.almacen,
    costo: src.costo,
    precio: src.precio,
    precio_mayorista: src.precio_mayorista,
    precio_tecnico: src.precio_tecnico,
    precio_distribuidor: src.precio_distribuidor,
    moneda: src.moneda,
    stock: src.tipo === "service" ? 0 : src.stock,
    unidad: src.unidad,
    tipo: src.tipo,
    activo: src.activo,
    stock_minimo: resolveStockMinimo(src.tipo, src.categoria),
    marca_modelo: src.marca,
    afectacion_igv: src.afectacion_igv,
    ultimo_movimiento_at: new Date().toISOString(),
  };
}

function dedupeLegacyBySku(rows: LegacyProductoRow[]): LegacyProductoRow[] {
  const bySku = new Map<string, LegacyProductoRow>();
  for (const row of rows) {
    if (!bySku.has(row.sku)) {
      bySku.set(row.sku, row);
    }
  }
  return [...bySku.values()];
}

async function loadLegacyStagingRows(): Promise<LegacyProductoRow[]> {
  const rows: LegacyProductoRow[] = [];
  let offset = 0;
  const legacyTable = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  while (true) {
    const { data, error } = await legacyTable
      .from("productos_legacy_import")
      .select(
        "legacy_id, sku, nombre, marca, categoria, stock, costo, precio, precio_mayorista, precio_tecnico, precio_distribuidor, moneda, tipo, unidad, almacen, afectacion_igv, descripcion, activo",
      )
      .order("legacy_id")
      .range(offset, offset + LEGACY_PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as unknown as LegacyProductoRow[];
    if (page.length === 0) break;

    rows.push(...page);
    if (page.length < LEGACY_PAGE_SIZE) break;
    offset += LEGACY_PAGE_SIZE;
  }

  return rows;
}

async function ensureAlmacenesFromLegacy(userId: string, legacyRows: LegacyProductoRow[]) {
  const names = [
    ...new Set(
      legacyRows.filter((row) => row.tipo !== "service").map((row) => row.almacen),
    ),
  ];

  if (names.length === 0) return;

  const almacenRows = names.map((nombre) => ({
    user_id: userId,
    nombre,
    ubicacion: "Importado desde catálogo legacy",
    activo: true,
  }));

  const { error } = await supabase
    .from("almacenes")
    .upsert(almacenRows, { onConflict: "user_id,nombre", ignoreDuplicates: true });

  if (error) {
    console.warn("[inventario] Almacenes legacy:", error.message);
  }
}

async function upsertProductosInBatches(userId: string, legacyRows: LegacyProductoRow[]) {
  const productos = dedupeLegacyBySku(legacyRows).map((row) => mapLegacyToProducto(userId, row));
  let upserted = 0;

  for (let index = 0; index < productos.length; index += UPSERT_BATCH_SIZE) {
    const batch = productos.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from("productos")
      .upsert(batch, { onConflict: "user_id,sku" });

    if (error) {
      throw new Error(error.message);
    }

    upserted += batch.length;
  }

  return upserted;
}

export async function importProductosLegacyFromClient(userId: string): Promise<number> {
  const legacyRows = await loadLegacyStagingRows();
  if (legacyRows.length === 0) {
    return 0;
  }

  await ensureAlmacenesFromLegacy(userId, legacyRows);
  return upsertProductosInBatches(userId, legacyRows);
}

export async function importProductosLegacyForUser(
  userId: string,
): Promise<{ count: number; error?: string }> {
  try {
    const count = await importProductosLegacyFromClient(userId);
    return { count };
  } catch (clientError) {
    const message = clientError instanceof Error ? clientError.message : String(clientError);
    console.warn("[inventario] Import legacy cliente:", message);
    return { count: 0, error: message };
  }
}
