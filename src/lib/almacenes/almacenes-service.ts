import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  almacenesKpis as staticKpis,
  almacenesTabs,
  kardexMovements as mockMovements,
  type KardexMovement,
} from "@/lib/almacenes-mock-data";
import { seedDemoDataForUser } from "@/lib/seed-demo";

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

export async function fetchAlmacenesSnapshot(userId: string | null): Promise<AlmacenesSnapshot> {
  if (!userId) {
    return buildSnapshot(mockMovements, [], "mock");
  }

  const [almacenesResult, productosResult] = await Promise.all([
    supabase.from("almacenes").select("*").eq("user_id", userId).eq("activo", true).order("nombre"),
    supabase.from("productos").select("*").eq("user_id", userId).eq("activo", true).order("ultimo_movimiento_at", { ascending: false }).limit(50),
  ]);

  if (almacenesResult.error || productosResult.error) {
    console.warn("[almacenes] Error al cargar:", almacenesResult.error?.message ?? productosResult.error?.message);
    return buildSnapshot(mockMovements, [], "mock");
  }

  let almacenes = almacenesResult.data ?? [];
  let productos = productosResult.data ?? [];

  if (!almacenes.length || !productos.length) {
    await seedDemoDataForUser(userId);
    const retry = await Promise.all([
      supabase.from("almacenes").select("*").eq("user_id", userId).eq("activo", true).order("nombre"),
      supabase.from("productos").select("*").eq("user_id", userId).eq("activo", true).order("ultimo_movimiento_at", { ascending: false }).limit(50),
    ]);
    almacenes = retry[0].data ?? [];
    productos = retry[1].data ?? [];
  }

  if (!productos.length) {
    return buildSnapshot(mockMovements, almacenes, almacenes.length ? "supabase" : "mock");
  }

  const movements = productos.map(mapProductoToMovement);
  return buildSnapshot(movements, almacenes, "supabase");
}

export {
  almacenesTabs,
  formatKardexCost,
  getMovimientoEstadoStyles,
  getMovimientoStyles,
} from "@/lib/almacenes-mock-data";
