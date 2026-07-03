import { supabase } from "@/integrations/supabase/client";
import { withRealKpi } from "@/lib/kpi-utils";
import {
  generalKpis as staticGeneralKpis,
  indicadoresFinancieros as staticIndicadores,
} from "@/lib/dashboard-general-data";
import { reportesKpis as staticReportesKpis } from "@/lib/dashboard-reportes-data";
import {
  buildPeriodChartBuckets,
  isIsoDateInRange,
  isPeriodMonthInRange,
  resolvePreviousPeriodRange,
  type PeriodRange,
} from "@/lib/period-filter";
import type { VentaRecord } from "@/lib/ventas-mock-data";

export type DonutSlice = { name: string; value: number; color: string };
export type RankingRow = { name: string; value: number; participacion: number };
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
  indicadoresFinancieros: typeof staticIndicadores;
  topClientes: RankingRow[];
  topProductos: RankingRow[];
  ventasMensualesChart: { mes: string; monto: number }[];
  periodLabel: string;
  source: "supabase" | "empty";
};

const INGRESO_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#14b8a6"];
const GASTO_COLORS = ["#ef4444", "#f97316", "#8b5cf6", "#94a3b8"];

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
  if (venta.fechaIso) return isIsoDateInRange(venta.fechaIso, range);
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
      .filter((venta) => isIsoDateInRange(venta.fechaIso ?? null, {
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
    indicadoresFinancieros: staticIndicadores,
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
  productos: Array<{ descripcion: string; subtotal: number }>;
  clientesActivos: number;
  porCobrarTotal: number;
  porCobrarDocs: number;
}): DashboardAnalytics {
  const { range, ventas, ordenesCompra, productos, clientesActivos, porCobrarTotal, porCobrarDocs } =
    input;
  const prevRange = resolvePreviousPeriodRange(range.preset);

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

  const ingresosPorTipo = [
    { name: "Facturas", value: periodVentas.filter((v) => v.documentType === "Factura").reduce((s, v) => s + v.amount, 0) },
    { name: "Boletas", value: periodVentas.filter((v) => v.documentType === "Boleta").reduce((s, v) => s + v.amount, 0) },
    { name: "Notas de crédito", value: periodVentas.filter((v) => v.documentType === "Nota de crédito").reduce((s, v) => s + v.amount, 0) },
  ];

  const gastosPorTipo = [
    { name: "Compras", value: periodOrdenes.filter((o) => o.tipo === "compra").reduce((s, o) => s + Number(o.importe), 0) },
    { name: "Servicios", value: periodOrdenes.filter((o) => o.tipo === "servicio").reduce((s, o) => s + Number(o.importe), 0) },
  ];

  const ingresosDistribucion = buildDistribution(ingresosPorTipo, INGRESO_COLORS);
  const gastosDistribucion = buildDistribution(gastosPorTipo, GASTO_COLORS);

  const productTotals = new Map<string, number>();
  for (const item of productos) {
    const key = item.descripcion.trim() || "Sin descripción";
    productTotals.set(key, (productTotals.get(key) ?? 0) + Number(item.subtotal));
  }
  const productGrandTotal = [...productTotals.values()].reduce((sum, value) => sum + value, 0);
  const topProductos =
    productGrandTotal > 0
      ? [...productTotals.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({
            name,
            value,
            participacion: Math.round((value / productGrandTotal) * 1000) / 10,
          }))
      : [];

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
    if (index === 2) return withRealKpi(kpi, String(topProductos.length), `Productos facturados`);
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
    indicadoresFinancieros: staticIndicadores,
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

  const [ventasRes, ordenesRes, cxcRes] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, fecha, total, estado, tipo_comprobante, cliente_nombre, cliente_ruc, estado_sunat, vendedor_nombre, vendedor_iniciales, hora_emision, numero, codigo_comprobante")
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
  const ventaIds = ventaRows.map((row) => row.id);

  let productos: Array<{ descripcion: string; subtotal: number }> = [];
  if (ventaIds.length > 0) {
    const { data: items } = await supabase
      .from("venta_items")
      .select("descripcion, subtotal, venta_id")
      .in("venta_id", ventaIds);

    const ventasInRange = new Set(
      ventaRows
        .filter((row) => isIsoDateInRange(row.fecha, range))
        .map((row) => row.id),
    );

    productos = (items ?? [])
      .filter((item) => ventasInRange.has(item.venta_id))
      .map((item) => ({
        descripcion: item.descripcion,
        subtotal: Number(item.subtotal),
      }));
  }

  const ventas: VentaRecord[] = ventaRows.map((row) => ({
    id: row.id,
    date: new Date(row.fecha.includes("T") ? row.fecha : `${row.fecha}T12:00:00`).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: row.hora_emision ?? "00:00",
    documentType:
      row.tipo_comprobante === "boleta"
        ? "Boleta"
        : row.tipo_comprobante === "nota_credito"
          ? "Nota de crédito"
          : "Factura",
    documentCode: row.codigo_comprobante ?? row.numero,
    client: row.cliente_nombre ?? "Cliente",
    ruc: row.cliente_ruc ?? "—",
    amount: Number(row.total),
    status: row.estado_sunat === "aceptado" ? "Aceptado" : row.estado_sunat === "rechazado" ? "Rechazado" : "Pendiente",
    businessStatus: "Activa",
    periodMonth: row.fecha.slice(0, 7),
    fechaIso: row.fecha,
    hasCdr: false,
    seller: row.vendedor_nombre ?? "Sin asignar",
    sellerInitials: row.vendedor_iniciales ?? "SA",
  }));

  const clientesActivos = new Set(
    ventas.filter((venta) => isVentaInRange(venta, range)).map((venta) => venta.ruc || venta.client),
  ).size;

  const porCobrarTotal = (cxcRes.data ?? []).reduce((sum, row) => sum + Number(row.saldo_pendiente), 0);
  const porCobrarDocs = cxcRes.data?.length ?? 0;

  return buildDashboardAnalytics({
    range,
    ventas,
    ordenesCompra: ordenesRes.data ?? [],
    productos,
    clientesActivos,
    porCobrarTotal,
    porCobrarDocs,
  });
}
