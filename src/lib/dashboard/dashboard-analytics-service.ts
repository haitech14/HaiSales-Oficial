import { supabase } from "@/integrations/supabase/client";
import { withRealKpi } from "@/lib/kpi-utils";
import {
  generalKpis as staticGeneralKpis,
} from "@/lib/dashboard-general-data";
import { reportesKpis as staticReportesKpis } from "@/lib/dashboard-reportes-data";
import {
  buildPeriodChartBuckets,
  isIsoDateInRange,
  isPeriodMonthInRange,
  resolveMonthKeyRange,
  resolvePreviousPeriodRange,
  type PeriodRange,
} from "@/lib/period-filter";
import type { VentaRecord } from "@/lib/ventas-mock-data";
import {
  normalizeFechaIso,
  resolvePeriodMonth,
  scheduleVentasLegacyImport,
} from "@/lib/ventas/ventas-period-utils";
import { INGRESO_DISTRIBUCION_LABELS, mapDbTipoToDisplay } from "@/lib/ventas/comprobantes";

export type DonutSlice = { name: string; value: number; color: string };
export type RankingRow = { name: string; value: number; participacion: number };
export type ProductSaleLine = { name: string; subtotal: number };
export type FinancialChartRow = {
  mes: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
  entradas?: number;
  salidas?: number;
  neto?: number;
};

export type DashboardAnalytics = {
  generalKpis: typeof staticGeneralKpis;
  reportesKpis: typeof staticReportesKpis;
  resumenFinancieroChart: FinancialChartRow[];
  flujoCajaChart: FinancialChartRow[];
  ingresosDistribucion: DonutSlice[];
  gastosDistribucion: DonutSlice[];
  topClientes: RankingRow[];
  topProductos: RankingRow[];
  ventasMensualesChart: { mes: string; monto: number }[];
  periodLabel: string;
  source: "supabase" | "empty";
};

const INGRESO_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#14b8a6"];
const GASTO_COLORS = ["#ef4444", "#f97316", "#8b5cf6", "#94a3b8"];
const PLACEHOLDER_VENTA_ITEM =
  /^(Factura|Boleta|Nota de crédito|Nota de Credito|FACTURA|BOLETA|NOTA DE CR[EÉ]DITO)\s*·\s*/i;

type LegacyVentaItemRow = {
  descripcion: string;
  subtotal: number;
  codigo: string | null;
  periodo_mes: string | null;
  fecha: string;
};

type VentaItemWithProducto = {
  descripcion: string;
  subtotal: number;
  venta_id: string;
  productos: { nombre: string; sku: string | null } | null;
};

function normalizeProductKey(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function resolveProductDisplayName(input: {
  descripcion: string;
  codigo?: string | null;
  producto?: { nombre: string; sku: string | null } | null;
}): string | null {
  if (input.producto?.nombre) {
    const sku = input.producto.sku?.trim();
    return sku ? `${input.producto.nombre} (${sku})` : input.producto.nombre;
  }

  const descripcion = input.descripcion.trim();
  if (!descripcion || PLACEHOLDER_VENTA_ITEM.test(descripcion)) {
    return null;
  }

  const codigo = input.codigo?.trim();
  return codigo ? `${codigo} · ${descripcion}` : descripcion;
}

function isLegacyItemInRange(item: LegacyVentaItemRow, range: PeriodRange): boolean {
  if (item.periodo_mes && isPeriodMonthInRange(item.periodo_mes, range)) {
    return true;
  }

  const fechaIso = normalizeFechaIso(item.fecha);
  return isIsoDateInRange(fechaIso, range);
}

function buildTopProductos(lines: ProductSaleLine[]): RankingRow[] {
  const totals = new Map<string, number>();

  for (const line of lines) {
    const key = normalizeProductKey(line.name);
    if (!key) continue;
    totals.set(key, (totals.get(key) ?? 0) + line.subtotal);
  }

  const ranked = [...totals.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const grandTotal = ranked.reduce((sum, [, value]) => sum + value, 0);
  if (grandTotal <= 0) return [];

  return ranked.map(([name, value]) => ({
    name,
    value,
    participacion: Math.round((value / grandTotal) * 1000) / 10,
  }));
}

async function loadLegacyProductSalesFromBundle(range: PeriodRange): Promise<ProductSaleLine[]> {
  try {
    const response = await fetch("/data/venta-items-legacy-bundle.json");
    if (!response.ok) return [];

    const payload = (await response.json()) as {
      files?: Array<{
        items?: Array<{
          descripcion: string;
          subtotal: number;
          codigo: string | null;
          periodo_mes: string | null;
          fecha: string;
        }>;
      }>;
    };

    const lines: ProductSaleLine[] = [];

    for (const file of payload.files ?? []) {
      for (const item of file.items ?? []) {
        if (!isLegacyItemInRange(item, range)) continue;

        const name = resolveProductDisplayName({
          descripcion: item.descripcion,
          codigo: item.codigo,
        });
        if (!name) continue;

        lines.push({ name, subtotal: Number(item.subtotal) });
      }
    }

    return lines;
  } catch (error) {
    console.warn("[dashboard] Bundle venta ítems:", error);
    return [];
  }
}

async function loadLegacyProductSalesForRange(range: PeriodRange): Promise<ProductSaleLine[]> {
  const legacyTable = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { data, error } = await legacyTable
    .from("venta_legacy_import_items")
    .select("descripcion, subtotal, codigo, periodo_mes, fecha");

  if (error) {
    console.warn("[dashboard] Legacy venta ítems:", error.message);
    return loadLegacyProductSalesFromBundle(range);
  }

  const lines: ProductSaleLine[] = [];

  for (const item of (data ?? []) as LegacyVentaItemRow[]) {
    if (!isLegacyItemInRange(item, range)) continue;

    const name = resolveProductDisplayName({
      descripcion: item.descripcion,
      codigo: item.codigo,
    });
    if (!name) continue;

    lines.push({ name, subtotal: Number(item.subtotal) });
  }

  if (lines.length > 0) return lines;
  return loadLegacyProductSalesFromBundle(range);
}

async function loadVentaItemProductSales(
  ventaIds: string[],
): Promise<ProductSaleLine[]> {
  if (ventaIds.length === 0) return [];

  const { data, error } = await supabase
    .from("venta_items")
    .select("descripcion, subtotal, venta_id, productos(nombre, sku)")
    .in("venta_id", ventaIds);

  if (error) {
    console.warn("[dashboard] venta_items:", error.message);
    return [];
  }

  const lines: ProductSaleLine[] = [];

  for (const item of (data ?? []) as VentaItemWithProducto[]) {
    const name = resolveProductDisplayName({
      descripcion: item.descripcion,
      producto: item.productos,
    });
    if (!name) continue;

    lines.push({ name, subtotal: Number(item.subtotal) });
  }

  return lines;
}

async function loadProductSalesForRange(
  range: PeriodRange,
  ventaRows: Array<{ id: string; fecha: string; notas: string | null }>,
): Promise<ProductSaleLine[]> {
  const ventasInRange = ventaRows.filter((row) => {
    const fechaIso = normalizeFechaIso(row.fecha);
    const periodMonth = resolvePeriodMonth(row.fecha, row.notas);
    return isIsoDateInRange(fechaIso, range) || isPeriodMonthInRange(periodMonth, range);
  });

  const ventaItemLines = await loadVentaItemProductSales(ventasInRange.map((row) => row.id));
  if (ventaItemLines.length > 0) {
    return ventaItemLines;
  }

  return loadLegacyProductSalesForRange(range);
}

function formatPen(amount: number): string {
  return `S/ ${Math.round(amount).toLocaleString("es-PE")}`;
}

function pctChangeLabel(current: number, previous: number): string {
  if (current === 0 && previous === 0) return "Sin datos en el periodo";
  if (previous === 0) return "Sin periodo anterior comparable";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% vs. periodo anterior`;
}

function isVentaInRange(venta: VentaRecord, range: PeriodRange): boolean {
  if (venta.businessStatus === "Anulada") return false;
  const fechaIso = normalizeFechaIso(venta.fechaIso);
  if (fechaIso && isIsoDateInRange(fechaIso, range)) return true;
  return isPeriodMonthInRange(venta.periodMonth, range);
}

function sumVentas(ventas: VentaRecord[]): number {
  return ventas.reduce((sum, venta) => sum + venta.amount, 0);
}

function buildDistribution(
  entries: Array<{ name: string; value: number }>,
  colors: string[],
): DonutSlice[] {
  const total = entries.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [];

  return entries
    .filter((item) => item.value > 0)
    .map((item, index) => ({
      name: item.name,
      value: Math.round((item.value / total) * 100),
      color: colors[index % colors.length],
    }));
}

function buildTopClients(ventas: VentaRecord[]): RankingRow[] {
  const totals = new Map<string, number>();

  for (const venta of ventas) {
    const key = venta.client.trim() || "Sin cliente";
    totals.set(key, (totals.get(key) ?? 0) + venta.amount);
  }

  const grandTotal = sumVentas(ventas);
  if (grandTotal <= 0) return [];

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value,
      participacion: Math.round((value / grandTotal) * 1000) / 10,
    }));
}

function buildFinancialChart(
  ventas: VentaRecord[],
  gastosByBucket: Map<string, number>,
  range: PeriodRange,
): FinancialChartRow[] {
  const buckets = buildPeriodChartBuckets(range);

  return buckets.map((bucket) => {
    const ingresos = ventas
      .filter((venta) => isVentaInRange(venta, {
        preset: range.preset,
        start: bucket.start,
        end: bucket.end,
        label: bucket.label,
        shortLabel: bucket.label,
      }))
      .reduce((sum, venta) => sum + venta.amount, 0);

    const gastos = gastosByBucket.get(`${bucket.start}:${bucket.end}`) ?? 0;
    const ingresosK = Math.round(ingresos / 1000);
    const gastosK = Math.round(gastos / 1000);
    const utilidadK = Math.max(ingresosK - gastosK, 0);

    return {
      mes: bucket.label,
      ingresos: ingresosK,
      gastos: gastosK,
      utilidad: utilidadK,
      entradas: ingresosK,
      salidas: gastosK,
      neto: utilidadK,
    };
  });
}

function buildGastosByBucket(
  ordenes: Array<{ importe: number; created_at: string }>,
  range: PeriodRange,
): Map<string, number> {
  const buckets = buildPeriodChartBuckets(range);
  const map = new Map<string, number>();

  for (const bucket of buckets) {
    const total = ordenes
      .filter((orden) => {
        const iso = orden.created_at.slice(0, 10);
        return iso >= bucket.start && iso <= bucket.end;
      })
      .reduce((sum, orden) => sum + Number(orden.importe), 0);
    map.set(`${bucket.start}:${bucket.end}`, total);
  }

  return map;
}

function emptyAnalytics(range: PeriodRange): DashboardAnalytics {
  const zeroChart = buildPeriodChartBuckets(range).map((bucket) => ({
    mes: bucket.label,
    ingresos: 0,
    gastos: 0,
    utilidad: 0,
    entradas: 0,
    salidas: 0,
    neto: 0,
  }));

  const emptyKpis = staticGeneralKpis.map((kpi) =>
    withRealKpi(kpi, kpi.label.includes("S/") ? "S/ 0" : "0"),
  );

  const emptyReportesKpis = staticReportesKpis.map((kpi) => withRealKpi(kpi, "0"));

  return {
    generalKpis: emptyKpis,
    reportesKpis: emptyReportesKpis,
    resumenFinancieroChart: zeroChart,
    flujoCajaChart: zeroChart,
    ingresosDistribucion: [],
    gastosDistribucion: [],
    topClientes: [],
    topProductos: [],
    ventasMensualesChart: zeroChart.map((row) => ({ mes: row.mes, monto: 0 })),
    periodLabel: range.label,
    source: "empty",
  };
}

export function buildDashboardAnalytics(input: {
  range: PeriodRange;
  ventas: VentaRecord[];
  ordenesCompra: Array<{ importe: number; created_at: string; tipo: string }>;
  productSales: ProductSaleLine[];
  clientesActivos: number;
  porCobrarTotal: number;
  porCobrarDocs: number;
}): DashboardAnalytics {
  const { range, ventas, ordenesCompra, productSales, clientesActivos, porCobrarTotal, porCobrarDocs } =
    input;
  const prevRange =
    range.preset === "mes_con_ventas"
      ? resolveMonthKeyRange(
          (() => {
            const start = new Date(`${range.start}T12:00:00`);
            const prev = new Date(start.getFullYear(), start.getMonth() - 1, 1);
            return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
          })(),
        )
      : resolvePreviousPeriodRange(range.preset);

  const periodVentas = ventas.filter((venta) => isVentaInRange(venta, range));
  const prevVentas = ventas.filter((venta) => isVentaInRange(venta, prevRange));

  const ingresos = sumVentas(periodVentas);
  const prevIngresos = sumVentas(prevVentas);

  const periodOrdenes = ordenesCompra.filter((orden) =>
    isIsoDateInRange(orden.created_at.slice(0, 10), range),
  );
  const prevOrdenes = ordenesCompra.filter((orden) =>
    isIsoDateInRange(orden.created_at.slice(0, 10), prevRange),
  );

  const gastos = periodOrdenes.reduce((sum, orden) => sum + Number(orden.importe), 0);
  const prevGastos = prevOrdenes.reduce((sum, orden) => sum + Number(orden.importe), 0);
  const utilidad = ingresos - gastos;
  const prevUtilidad = prevIngresos - prevGastos;
  const facturas = periodVentas.length;

  const gastosByBucket = buildGastosByBucket(periodOrdenes, range);
  const resumenFinancieroChart = buildFinancialChart(periodVentas, gastosByBucket, range);
  const flujoCajaChart = resumenFinancieroChart.map((row) => ({
    ...row,
    entradas: row.ingresos,
    salidas: row.gastos,
    neto: row.utilidad,
  }));

  const ingresosPorTipo = INGRESO_DISTRIBUCION_LABELS.map(({ documentType, label }) => ({
    name: label,
    value: periodVentas
      .filter((venta) => venta.documentType === documentType)
      .reduce((sum, venta) => sum + venta.amount, 0),
  }));

  const gastosPorTipo = [
    { name: "Compras", value: periodOrdenes.filter((o) => o.tipo === "compra").reduce((s, o) => s + Number(o.importe), 0) },
    { name: "Servicios", value: periodOrdenes.filter((o) => o.tipo === "servicio").reduce((s, o) => s + Number(o.importe), 0) },
  ];

  const ingresosDistribucion = buildDistribution(ingresosPorTipo, INGRESO_COLORS);
  const gastosDistribucion = buildDistribution(gastosPorTipo, GASTO_COLORS);

  const topProductos = buildTopProductos(productSales);
  const distinctProducts = new Set(
    productSales.map((line) => normalizeProductKey(line.name)).filter(Boolean),
  ).size;

  const marginPct = ingresos > 0 ? ((utilidad / ingresos) * 100).toFixed(2) : "0.00";

  const generalKpis = staticGeneralKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, formatPen(ingresos), pctChangeLabel(ingresos, prevIngresos));
    if (index === 1) return withRealKpi(kpi, formatPen(gastos), pctChangeLabel(gastos, prevGastos));
    if (index === 2) {
      return withRealKpi(
        {
          ...kpi,
          note: `${marginPct}% del periodo`,
        },
        formatPen(utilidad),
        pctChangeLabel(utilidad, prevUtilidad),
      );
    }
    if (index === 3) return withRealKpi(kpi, String(facturas), pctChangeLabel(facturas, prevVentas.length));
    if (index === 4) {
      return withRealKpi(
        kpi,
        String(clientesActivos),
        clientesActivos > 0 ? `${clientesActivos} con compras en el periodo` : "Sin datos en el periodo",
      );
    }
    return withRealKpi(
      kpi,
      formatPen(porCobrarTotal),
      porCobrarDocs > 0 ? `${porCobrarDocs} documentos pendientes` : "Sin pendientes en el periodo",
    );
  });

  const topClientes = buildTopClients(periodVentas);

  const reportesKpis = staticReportesKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(facturas), `Comprobantes del periodo`);
    if (index === 1) return withRealKpi(kpi, formatPen(ingresos), `Ingresos de ${range.shortLabel}`);
    if (index === 2) return withRealKpi(kpi, String(distinctProducts), `Productos facturados`);
    return withRealKpi(kpi, topClientes.length > 0 ? `${topClientes.length}` : "0", `Clientes del periodo`);
  });
  const ventasMensualesChart = resumenFinancieroChart.map((row) => ({
    mes: row.mes,
    monto: row.ingresos * 1000,
  }));

  const hasData = ingresos > 0 || gastos > 0 || facturas > 0;

  return {
    generalKpis,
    reportesKpis,
    resumenFinancieroChart: hasData ? resumenFinancieroChart : buildPeriodChartBuckets(range).map((bucket) => ({
      mes: bucket.label,
      ingresos: 0,
      gastos: 0,
      utilidad: 0,
      entradas: 0,
      salidas: 0,
      neto: 0,
    })),
    flujoCajaChart: hasData ? flujoCajaChart : buildPeriodChartBuckets(range).map((bucket) => ({
      mes: bucket.label,
      ingresos: 0,
      gastos: 0,
      utilidad: 0,
      entradas: 0,
      salidas: 0,
      neto: 0,
    })),
    ingresosDistribucion,
    gastosDistribucion,
    topClientes,
    topProductos,
    ventasMensualesChart,
    periodLabel: range.label,
    source: hasData ? "supabase" : "empty",
  };
}

export async function fetchDashboardAnalytics(
  userId: string | null,
  range: PeriodRange,
): Promise<DashboardAnalytics> {
  if (!userId) {
    return emptyAnalytics(range);
  }

  scheduleVentasLegacyImport(userId);

  const [ventasRes, ordenesRes, cxcRes] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, fecha, total, estado, tipo_comprobante, cliente_nombre, cliente_ruc, estado_sunat, vendedor_nombre, vendedor_iniciales, hora_emision, numero, codigo_comprobante, notas")
      .eq("user_id", userId)
      .neq("estado", "anulada"),
    supabase
      .from("ordenes_compra")
      .select("importe, created_at, tipo")
      .eq("user_id", userId),
    supabase
      .from("cuentas_cobrar")
      .select("saldo_pendiente")
      .eq("user_id", userId)
      .gt("saldo_pendiente", 0),
  ]);

  const ventaRows = ventasRes.data ?? [];
  const productSales = await loadProductSalesForRange(range, ventaRows);

  const ventas: VentaRecord[] = ventaRows.map((row) => {
    const fechaIso = normalizeFechaIso(row.fecha);
    return {
      id: row.id,
      date: new Date(`${fechaIso}T12:00:00`).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: row.hora_emision ?? "00:00",
      documentType: mapDbTipoToDisplay(row.tipo_comprobante),
      documentCode: row.codigo_comprobante ?? row.numero,
      client: row.cliente_nombre ?? "Cliente",
      ruc: row.cliente_ruc ?? "—",
      amount: Number(row.total),
      status: row.estado_sunat === "aceptado" ? "Aceptado" : row.estado_sunat === "rechazado" ? "Rechazado" : "Pendiente",
      businessStatus: row.estado === "anulada" ? "Anulada" : "Activa",
      periodMonth: resolvePeriodMonth(row.fecha, row.notas),
      fechaIso,
      hasCdr: false,
      seller: row.vendedor_nombre ?? "Sin asignar",
      sellerInitials: row.vendedor_iniciales ?? "SA",
    };
  });

  const clientesActivos = new Set(
    ventas.filter((venta) => isVentaInRange(venta, range)).map((venta) => venta.ruc || venta.client),
  ).size;

  const porCobrarTotal = (cxcRes.data ?? []).reduce((sum, row) => sum + Number(row.saldo_pendiente), 0);
  const porCobrarDocs = cxcRes.data?.length ?? 0;

  return buildDashboardAnalytics({
    range,
    ventas,
    ordenesCompra: ordenesRes.data ?? [],
    productSales,
    clientesActivos,
    porCobrarTotal,
    porCobrarDocs,
  });
}
