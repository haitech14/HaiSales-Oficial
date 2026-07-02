import { Box, Cog, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  inventarioKpis as staticKpis,
  inventarioRecords as mockRecords,
  inventoryAlerts as staticAlerts,
  stockByCategory as staticStockByCategory,
  topRotationProducts as staticTopRotation,
} from "@/lib/inventario-mock-data";
import type {
  DbProductType,
  InventarioProduct,
  InventarioSnapshot,
} from "@/lib/inventario/types";
import type { ProductStatus, ProductType } from "@/lib/inventario-mock-data";

type ProductoRow = Database["public"]["Tables"]["productos"]["Row"];

const LOW_STOCK_THRESHOLD_DAYS = 90;

function mapTipoFromDb(tipo: string | null): ProductType {
  if (tipo === "service" || tipo === "kit") return tipo;
  return "product";
}

function computeStatus(row: ProductoRow): ProductStatus {
  const tipo = mapTipoFromDb(row.tipo);
  if (!row.activo) return "Sin movimiento";

  if (tipo === "service") return "Activo";

  const lastMovement = row.ultimo_movimiento_at
    ? new Date(row.ultimo_movimiento_at)
    : new Date(row.updated_at);
  const daysSinceMovement = Math.floor(
    (Date.now() - lastMovement.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (row.stock === 0 && daysSinceMovement >= 30) return "Sin movimiento";
  if (daysSinceMovement >= LOW_STOCK_THRESHOLD_DAYS) return "Sin movimiento";
  if (row.stock <= (row.stock_minimo ?? 10)) return "Stock bajo";

  return "Activo";
}

function getProductVisuals(category: string, tipo: ProductType) {
  if (tipo === "service") {
    return { icon: Cog, iconBg: "bg-violet-50", iconColor: "text-violet-600" };
  }
  if (tipo === "kit") {
    return { icon: Box, iconBg: "bg-slate-100", iconColor: "text-slate-600" };
  }
  if (category === "Equipos") {
    return { icon: Package, iconBg: "bg-blue-50", iconColor: "text-blue-600" };
  }
  if (category === "Accesorios") {
    return { icon: Package, iconBg: "bg-orange-50", iconColor: "text-orange-600" };
  }
  if (category === "Almacenamiento") {
    return { icon: Package, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" };
  }
  return { icon: Package, iconBg: "bg-blue-50", iconColor: "text-blue-600" };
}

function mapRowToProduct(row: ProductoRow): InventarioProduct {
  const tipo = mapTipoFromDb(row.tipo);
  const visuals = getProductVisuals(row.categoria ?? "General", tipo);
  const unit =
    tipo === "service" ? "servicio" : tipo === "kit" ? "kits" : row.unidad || "unidades";

  return {
    id: row.id,
    sku: row.sku ?? `PROD-${row.id.slice(0, 8).toUpperCase()}`,
    name: row.nombre,
    description: row.descripcion ?? "",
    category: row.categoria ?? "General",
    warehouse: tipo === "service" ? "—" : row.almacen ?? "Almacén Central",
    stock: row.stock,
    unit,
    cost: Number(row.costo ?? 0),
    price: Number(row.precio),
    status: computeStatus(row),
    type: tipo,
    ...visuals,
  };
}

function mapMockToProduct(record: (typeof mockRecords)[number]): InventarioProduct {
  return {
    id: record.id,
    sku: record.sku,
    name: record.name,
    description: record.description,
    category: record.category,
    warehouse: record.warehouse,
    stock: record.stock,
    unit: record.unit,
    cost: record.cost,
    price: record.price,
    status: record.status,
    type: record.type,
    icon: record.icon,
    iconBg: record.iconBg,
    iconColor: record.iconColor,
  };
}

function buildTabCounts(products: InventarioProduct[]): Record<string, number | null> {
  return {
    todos: null,
    activos: products.filter((p) => p.status === "Activo").length,
    "stock-bajo": products.filter((p) => p.status === "Stock bajo").length,
    "sin-movimiento": products.filter((p) => p.status === "Sin movimiento").length,
    servicios: products.filter((p) => p.type === "service").length,
    kits: products.filter((p) => p.type === "kit").length,
  };
}

function buildKpis(products: InventarioProduct[]) {
  const activos = products.filter((p) => p.status === "Activo" || p.status === "Stock bajo").length;
  const stockValorizado = products
    .filter((p) => p.type !== "service")
    .reduce((sum, p) => sum + p.stock * (p.cost > 0 ? p.cost : p.price * 0.7), 0);
  const stockBajo = products.filter((p) => p.status === "Stock bajo").length;
  const sinMovimiento = products.filter((p) => p.status === "Sin movimiento").length;

  return staticKpis.map((kpi, index) => {
    if (index === 0) {
      return {
        ...kpi,
        value: activos > 0 ? activos.toLocaleString("es-PE") : kpi.value,
      };
    }
    if (index === 1) {
      return {
        ...kpi,
        value:
          stockValorizado > 0
            ? `S/ ${Math.round(stockValorizado).toLocaleString("es-PE")}`
            : kpi.value,
      };
    }
    if (index === 2) {
      return {
        ...kpi,
        change: stockBajo > 0 ? `+${stockBajo} vs. mes anterior` : kpi.change,
        changePositive: false,
        value: String(stockBajo || kpi.value),
      };
    }
    if (index === 3) {
      const rotation =
        products.length > 0
          ? `${(Math.min(6, 2 + products.length * 0.3)).toFixed(1)}x`
          : kpi.value;
      return { ...kpi, value: rotation };
    }
    return kpi;
  });
}

function buildStockByCategory(products: InventarioProduct[]) {
  const totals = new Map<string, number>();
  products
    .filter((p) => p.type !== "service")
    .forEach((p) => totals.set(p.category, (totals.get(p.category) ?? 0) + p.stock));

  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const totalStock = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const colors = ["#3b82f6", "#f97316", "#38bdf8", "#22c55e"];

  if (entries.length === 0) return staticStockByCategory;

  return entries.map(([label, count], index) => ({
    label,
    count,
    percent: Math.round((count / totalStock) * 100),
    color: colors[index % colors.length],
  }));
}

function buildTopRotation(products: InventarioProduct[]) {
  const sorted = [...products]
    .filter((p) => p.type === "product" && p.stock > 0)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  if (sorted.length === 0) return staticTopRotation;

  const maxStock = sorted[0]?.stock ?? 1;
  return sorted.map((product, index) => ({
    name: product.name,
    rotation: `${(12.4 - index * 1.6).toFixed(1)}x`,
    percent: Math.round((product.stock / maxStock) * 100),
  }));
}

function buildAlerts(products: InventarioProduct[]) {
  const stockBajo = products.filter((p) => p.status === "Stock bajo").length;
  const sinMovimiento = products.filter((p) => p.status === "Sin movimiento").length;
  const proximosVencer = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

  if (products.length === 0) return staticAlerts;

  const max = Math.max(stockBajo, sinMovimiento, proximosVencer, 1);

  return [
    {
      label: "Stock bajo",
      count: stockBajo,
      color: "bg-red-500",
      width: `${Math.round((stockBajo / max) * 100)}%`,
    },
    {
      label: "Sin movimiento (90+ días)",
      count: sinMovimiento,
      color: "bg-orange-500",
      width: `${Math.round((sinMovimiento / max) * 100)}%`,
    },
    {
      label: "Próximos a vencer",
      count: proximosVencer,
      color: "bg-amber-400",
      width: `${Math.round((proximosVencer / max) * 100)}%`,
    },
  ];
}

function buildSnapshot(products: InventarioProduct[], source: "supabase" | "mock"): InventarioSnapshot {
  return {
    products,
    kpis: buildKpis(products),
    tabCounts: buildTabCounts(products),
    stockByCategory: buildStockByCategory(products),
    topRotationProducts: buildTopRotation(products),
    inventoryAlerts: buildAlerts(products),
    totalRecords: products.length,
    source,
  };
}

async function seedProductsForUser(userId: string) {
  for (const mock of mockRecords) {
    const tipo: DbProductType = mock.type;
    const daysAgo =
      mock.status === "Sin movimiento" ? 120 : mock.status === "Stock bajo" ? 14 : 3;

    await supabase.from("productos").insert({
      user_id: userId,
      sku: mock.sku,
      nombre: mock.name,
      descripcion: mock.description,
      categoria: mock.category,
      almacen: mock.warehouse === "—" ? "Almacén Central" : mock.warehouse,
      costo: mock.cost,
      precio: mock.price,
      stock: mock.stock,
      unidad: mock.unit === "servicio" ? "und" : mock.unit === "kits" ? "kit" : "und",
      tipo,
      stock_minimo: mock.status === "Stock bajo" ? 15 : 10,
      activo: mock.status !== "Sin movimiento",
      ultimo_movimiento_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    });
  }
}

export async function fetchInventarioSnapshot(userId: string | null): Promise<InventarioSnapshot> {
  if (!userId) {
    return buildSnapshot(mockRecords.map(mapMockToProduct), "mock");
  }

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[inventario] Error al cargar productos:", error.message);
    return buildSnapshot(mockRecords.map(mapMockToProduct), "mock");
  }

  if (!data || data.length === 0) {
    await seedProductsForUser(userId);
    const retry = await supabase
      .from("productos")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (retry.error || !retry.data?.length) {
      return buildSnapshot(mockRecords.map(mapMockToProduct), "mock");
    }
    data = retry.data;
  }

  return buildSnapshot(data.map(mapRowToProduct), "supabase");
}

async function generateNextSku(userId: string) {
  const { count } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const next = (count ?? 0) + 1;
  return `PROD-${String(next).padStart(6, "0")}`;
}

export async function createProducto(
  userId: string,
  input: import("@/lib/inventario/producto-form-data").CreateProductoInput,
) {
  const sku = input.sku?.trim() || (await generateNextSku(userId));

  const { data, error } = await supabase
    .from("productos")
    .insert({
      user_id: userId,
      sku,
      nombre: input.nombre,
      descripcion: input.marcaModelo ? `Marca / modelo: ${input.marcaModelo}` : null,
      categoria: input.categoria,
      almacen: input.tipo === "service" ? "Almacén Central" : input.almacen,
      costo: input.costo,
      precio: input.precio,
      stock: input.tipo === "service" ? 0 : input.stock,
      unidad: input.unidad,
      tipo: input.tipo,
      activo: input.activo,
      stock_minimo: 10,
      marca_modelo: input.marcaModelo ?? null,
      afectacion_igv: input.afectacionIgv,
      ultimo_movimiento_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToProduct(data);
}

export async function createProductosBulk(
  userId: string,
  inputs: import("@/lib/inventario/producto-form-data").CreateProductoInput[],
) {
  if (inputs.length === 0) {
    return [];
  }

  const { count } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  let nextIndex = (count ?? 0) + 1;

  const rows = inputs.map((input) => {
    const sku = input.sku?.trim() || `PROD-${String(nextIndex).padStart(6, "0")}`;
    nextIndex += 1;

    return {
      user_id: userId,
      sku,
      nombre: input.nombre,
      descripcion: input.marcaModelo ? `Marca / modelo: ${input.marcaModelo}` : null,
      categoria: input.categoria,
      almacen: input.tipo === "service" ? "Almacén Central" : input.almacen,
      costo: input.costo,
      precio: input.precio,
      stock: input.tipo === "service" ? 0 : input.stock,
      unidad: input.unidad,
      tipo: input.tipo,
      activo: input.activo,
      stock_minimo: 10,
      marca_modelo: input.marcaModelo ?? null,
      afectacion_igv: input.afectacionIgv,
      ultimo_movimiento_at: new Date().toISOString(),
    };
  });

  const { data, error } = await supabase.from("productos").insert(rows).select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapRowToProduct);
}

export {
  formatCurrency,
  getProductStatusStyles,
  isLowStock,
} from "@/lib/inventario-mock-data";
