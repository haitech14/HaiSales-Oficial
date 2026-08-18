import { supabase } from "@/integrations/supabase/client";
import {
  isIsoDateInRange,
  isPeriodMonthInRange,
  resolveMonthKeyRange,
  resolvePreviousPeriodRange,
  type PeriodRange,
} from "@/lib/period-filter";
import { normalizeFechaIso, resolvePeriodMonth, scheduleVentasLegacyImport } from "@/lib/ventas/ventas-period-utils";
import type {
  EstadisticasCurrencySummary,
  EstadisticasDailyPoint,
  EstadisticasData,
  EstadisticasDocumentSummaryRow,
  EstadisticasDocumentoTipo,
  EstadisticasDistribucionSlice,
  EstadisticasEmisionKpi,
} from "./estadisticas-types";

type VentaRow = {
  id: string;
  fecha: string;
  total: number;
  moneda: string | null;
  tipo_comprobante: string | null;
  codigo_comprobante: string | null;
  numero: string;
  notas: string | null;
  estado: string;
};

type OrdenRow = {
  importe: number;
  created_at: string;
};

const DOCUMENTO_TIPOS: Array<{ id: string; label: string; color: string }> = [
  { id: "factura", label: "Facturas", color: "#3b82f6" },
  { id: "boleta", label: "Boletas", color: "#22c55e" },
  { id: "nota_credito", label: "Notas de crédito", color: "#f97316" },
  { id: "nota_debito", label: "Notas de débito", color: "#84cc16" },
  { id: "guia", label: "Guías de remisión", color: "#8b5cf6" },
  { id: "proforma", label: "Proformas", color: "#ec4899" },
  { id: "nota_venta", label: "Notas de venta", color: "#a3e635" },
];

const DISTRIBUCION_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#a3e635", "#84cc16"];

let ordenesTableAvailable = true;

function isMissingRelationError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

function categorizeDocumento(row: VentaRow): string {
  const codigo = (row.codigo_comprobante ?? row.numero ?? "").toUpperCase();
  const notas = (row.notas ?? "").toLowerCase();

  if (codigo.startsWith("T") || notas.includes("guía") || notas.includes("guia")) {
    return "guia";
  }
  if (codigo.startsWith("COT") || notas.includes("proforma") || notas.includes("cotiz")) {
    return "proforma";
  }

  switch (row.tipo_comprobante) {
    case "boleta":
      return "boleta";
    case "nota_credito":
      return "nota_credito";
    case "nota_venta":
      return "nota_venta";
    case "factura":
    default:
      return "factura";
  }
}

function isVentaInRange(row: VentaRow, range: PeriodRange): boolean {
  if (row.estado === "anulada") return false;
  const fechaIso = normalizeFechaIso(row.fecha);
  if (fechaIso && isIsoDateInRange(fechaIso, range)) return true;
  return isPeriodMonthInRange(resolvePeriodMonth(row.fecha, row.notas), range);
}

function resolvePreviousRange(range: PeriodRange): PeriodRange {
  if (range.preset === "mes_con_ventas") {
    const start = new Date(`${range.start}T12:00:00`);
    const prev = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    return resolveMonthKeyRange(
      `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return resolvePreviousPeriodRange(range.preset);
}

function formatPreviousPeriodLabel(range: PeriodRange): string {
  const start = new Date(`${range.start}T12:00:00`);
  const month = String(start.getMonth() + 1).padStart(2, "0");
  return `${month}/${start.getFullYear()}`;
}

function buildChangeLabel(current: number, previous: number, previousLabel: string): {
  label: string;
  positive: boolean | null;
} {
  if (current === previous) {
    return { label: `Sin cambios vs. ${previousLabel}`, positive: null };
  }
  if (previous === 0 && current > 0) {
    return { label: `+100% vs. ${previousLabel}`, positive: true };
  }
  if (previous === 0) {
    return { label: `Sin cambios vs. ${previousLabel}`, positive: null };
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    label: `${sign}${Math.round(pct)}% vs. ${previousLabel}`,
    positive: pct >= 0,
  };
}

function countByCategory(rows: VentaRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const tipo of DOCUMENTO_TIPOS) {
    map.set(tipo.id, 0);
  }
  map.set("nota_debito", 0);

  for (const row of rows) {
    const category = categorizeDocumento(row);
    map.set(category, (map.get(category) ?? 0) + 1);
  }

  return map;
}

function buildEmisionKpis(current: Map<string, number>, previous: Map<string, number>, previousLabel: string): EstadisticasEmisionKpi[] {
  const comprobantes =
    (current.get("factura") ?? 0) +
    (current.get("boleta") ?? 0) +
    (current.get("nota_credito") ?? 0) +
    (current.get("nota_venta") ?? 0);
  const prevComprobantes =
    (previous.get("factura") ?? 0) +
    (previous.get("boleta") ?? 0) +
    (previous.get("nota_credito") ?? 0) +
    (previous.get("nota_venta") ?? 0);

  const total = [...current.values()].reduce((sum, value) => sum + value, 0);
  const prevTotal = [...previous.values()].reduce((sum, value) => sum + value, 0);
  const guias = current.get("guia") ?? 0;
  const prevGuias = previous.get("guia") ?? 0;
  const otros = (current.get("proforma") ?? 0) + (current.get("nota_debito") ?? 0);
  const prevOtros = (previous.get("proforma") ?? 0) + (previous.get("nota_debito") ?? 0);

  const items = [
    { id: "total" as const, label: "Total", value: total, previous: prevTotal },
    { id: "comprobantes" as const, label: "Comprobantes", value: comprobantes, previous: prevComprobantes },
    { id: "guias" as const, label: "Guías", value: guias, previous: prevGuias },
    { id: "otros" as const, label: "Otros", value: otros, previous: prevOtros, hint: "Proformas, notas." },
  ];

  return items.map(({ id, label, value, previous: prev, hint }) => {
    const change = buildChangeLabel(value, prev, previousLabel);
    return {
      id,
      label,
      value,
      changeLabel: change.label,
      changePositive: change.positive,
      hint,
    };
  });
}

function buildDocumentosPorTipo(counts: Map<string, number>): EstadisticasDocumentoTipo[] {
  const maxCount = Math.max(...DOCUMENTO_TIPOS.map((tipo) => counts.get(tipo.id) ?? 0), 1);
  return DOCUMENTO_TIPOS.map((tipo) => ({
    ...tipo,
    count: counts.get(tipo.id) ?? 0,
    maxCount,
  }));
}

function buildDistribucion(counts: Map<string, number>): EstadisticasDistribucionSlice[] {
  const entries = DOCUMENTO_TIPOS.map((tipo) => ({
    name: tipo.label,
    count: counts.get(tipo.id) ?? 0,
    color: tipo.color,
  })).filter((entry) => entry.count > 0);

  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  if (total <= 0) {
    return [{ name: "Sin emisiones", value: 100, color: "#e2e8f0" }];
  }

  return entries.map((entry) => ({
    name: entry.name,
    value: Math.round((entry.count / total) * 100),
    color: entry.color,
  }));
}

function resolveCurrency(moneda: string | null): "pen" | "usd" | "eur" {
  const normalized = (moneda ?? "PEN").toUpperCase();
  if (normalized === "USD") return "usd";
  if (normalized === "EUR") return "eur";
  return "pen";
}

function sumByCurrency(rows: VentaRow[]): { pen: number; usd: number; eur: number } {
  return rows.reduce(
    (acc, row) => {
      const currency = resolveCurrency(row.moneda);
      acc[currency] += Number(row.total);
      return acc;
    },
    { pen: 0, usd: 0, eur: 0 },
  );
}

function formatMoney(symbol: "S/" | "$", amount: number): string {
  const value = amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol} ${value}`;
}

function isCreditSale(row: VentaRow): boolean {
  const notas = (row.notas ?? "").toUpperCase();
  return notas.includes("FORMA DE PAGO: CREDITO") || notas.includes("FORMA DE PAGO: CRÉDITO");
}

function parseTipoCambio(notas: string | null): number {
  const match = (notas ?? "").match(/T\.C:\s*([\d.]+)/i);
  const value = match ? Number(match[1]) : 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function isUsdOrigin(row: VentaRow): boolean {
  if (resolveCurrency(row.moneda) === "usd") return true;
  return /moneda origen:\s*usd/i.test(row.notas ?? "");
}

function cobradoAmountByCurrency(row: VentaRow): { pen: number; usd: number } {
  if (row.estado === "anulada" || isCreditSale(row)) {
    return { pen: 0, usd: 0 };
  }

  const total = Number(row.total) || 0;
  if (total <= 0) return { pen: 0, usd: 0 };

  if (isUsdOrigin(row)) {
    if (resolveCurrency(row.moneda) === "usd") {
      return { pen: 0, usd: total };
    }
    const tipoCambio = parseTipoCambio(row.notas);
    return { pen: 0, usd: tipoCambio > 0 ? total / tipoCambio : total };
  }

  return { pen: total, usd: 0 };
}

function sumCobranzas(rows: VentaRow[]): { pen: number; usd: number } {
  return rows.reduce(
    (acc, row) => {
      const cobrado = cobradoAmountByCurrency(row);
      acc.pen += cobrado.pen;
      acc.usd += cobrado.usd;
      return acc;
    },
    { pen: 0, usd: 0 },
  );
}

function buildCurrencyCard(
  def: Omit<EstadisticasCurrencySummary, "amount" | "formatted" | "changeLabel">,
  amount: number,
  previousAmount: number,
  previousLabel: string,
  symbol: "S/" | "$",
): EstadisticasCurrencySummary {
  const change = buildChangeLabel(amount, previousAmount, previousLabel);
  return {
    ...def,
    amount,
    formatted: formatMoney(symbol, amount),
    changeLabel: change.label,
  };
}

function buildVentasCurrencySummaries(
  current: { pen: number; usd: number },
  previous: { pen: number; usd: number },
  cobranzas: { pen: number; usd: number },
  previousCobranzas: { pen: number; usd: number },
  previousLabel: string,
): EstadisticasCurrencySummary[] {
  return [
    buildCurrencyCard(
      {
        id: "pen",
        label: "Soles",
        symbol: "S/",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        lineColor: "#22c55e",
      },
      current.pen,
      previous.pen,
      previousLabel,
      "S/",
    ),
    buildCurrencyCard(
      {
        id: "usd",
        label: "Dólares",
        symbol: "$",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        lineColor: "#3b82f6",
      },
      current.usd,
      previous.usd,
      previousLabel,
      "$",
    ),
    buildCurrencyCard(
      {
        id: "cobranza_pen",
        label: "Cobranzas soles",
        symbol: "S/",
        iconBg: "bg-violet-50",
        iconColor: "text-violet-600",
        lineColor: "#7c3aed",
      },
      cobranzas.pen,
      previousCobranzas.pen,
      previousLabel,
      "S/",
    ),
    buildCurrencyCard(
      {
        id: "cobranza_usd",
        label: "Cobranzas dólares",
        symbol: "$",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-500",
        lineColor: "#f97316",
      },
      cobranzas.usd,
      previousCobranzas.usd,
      previousLabel,
      "$",
    ),
  ];
}

function buildComprasCurrencySummaries(
  current: { pen: number; usd: number },
  previous: { pen: number; usd: number },
  previousLabel: string,
): EstadisticasCurrencySummary[] {
  return [
    buildCurrencyCard(
      {
        id: "pen",
        label: "Soles",
        symbol: "S/",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        lineColor: "#22c55e",
      },
      current.pen,
      previous.pen,
      previousLabel,
      "S/",
    ),
    buildCurrencyCard(
      {
        id: "usd",
        label: "Dólares",
        symbol: "$",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        lineColor: "#3b82f6",
      },
      current.usd,
      previous.usd,
      previousLabel,
      "$",
    ),
  ];
}

function buildDailyTrend(rows: VentaRow[], range: PeriodRange, filter?: "ventas" | "proformas"): EstadisticasDailyPoint[] {
  const start = new Date(`${range.start}T12:00:00`);
  const end = new Date(`${range.end}T12:00:00`);
  const daysInMonth = end.getDate();
  const points: EstadisticasDailyPoint[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayKey = String(day).padStart(2, "0");
    const iso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${dayKey}`;
    const dayRows = rows.filter((row) => {
      const fechaIso = normalizeFechaIso(row.fecha);
      if (fechaIso !== iso) return false;
      const category = categorizeDocumento(row);
      if (filter === "proformas") return category === "proforma";
      if (filter === "ventas") return category !== "proforma";
      return true;
    });

    const totals = sumByCurrency(dayRows);
    points.push({
      day: dayKey,
      soles: totals.pen,
      dolares: totals.usd,
      euros: totals.eur,
    });
  }

  return points;
}

function buildDocumentSummary(rows: VentaRow[]): EstadisticasDocumentSummaryRow[] {
  const summaryMap = new Map<string, EstadisticasDocumentSummaryRow>();

  for (const tipo of DOCUMENTO_TIPOS) {
    summaryMap.set(tipo.id, {
      id: tipo.id,
      label: tipo.label,
      color: tipo.color,
      pen: 0,
      usd: 0,
      eur: 0,
      operations: 0,
    });
  }

  for (const row of rows) {
    const category = categorizeDocumento(row);
    const entry = summaryMap.get(category);
    if (!entry) continue;

    const currency = resolveCurrency(row.moneda);
    entry[currency] += Number(row.total);
    entry.operations += 1;
  }

  return DOCUMENTO_TIPOS.map((tipo) => summaryMap.get(tipo.id)!);
}

function buildComprasCurrency(ordenes: OrdenRow[], range: PeriodRange, previousRange: PeriodRange, previousLabel: string) {
  const currentRows = ordenes.filter((row) => isIsoDateInRange(row.created_at.slice(0, 10), range));
  const previousRows = ordenes.filter((row) => isIsoDateInRange(row.created_at.slice(0, 10), previousRange));

  const current = {
    pen: currentRows.reduce((sum, row) => sum + Number(row.importe), 0),
    usd: 0,
  };
  const previous = {
    pen: previousRows.reduce((sum, row) => sum + Number(row.importe), 0),
    usd: 0,
  };

  return {
    summaries: buildComprasCurrencySummaries(current, previous, previousLabel),
    dailyTrend: buildComprasDailyTrend(currentRows, range),
  };
}

function buildComprasDailyTrend(ordenes: OrdenRow[], range: PeriodRange): EstadisticasDailyPoint[] {
  const start = new Date(`${range.start}T12:00:00`);
  const end = new Date(`${range.end}T12:00:00`);
  const daysInMonth = end.getDate();
  const points: EstadisticasDailyPoint[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayKey = String(day).padStart(2, "0");
    const iso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${dayKey}`;
    const total = ordenes
      .filter((row) => row.created_at.slice(0, 10) === iso)
      .reduce((sum, row) => sum + Number(row.importe), 0);

    points.push({
      day: dayKey,
      soles: total,
      dolares: 0,
      euros: 0,
    });
  }

  return points;
}

function emptyEstadisticas(range: PeriodRange): EstadisticasData {
  const previousRange = resolvePreviousRange(range);
  const previousLabel = formatPreviousPeriodLabel(previousRange);
  const emptyCounts = new Map(DOCUMENTO_TIPOS.map((tipo) => [tipo.id, 0]));

  return {
    emisionKpis: buildEmisionKpis(emptyCounts, emptyCounts, previousLabel),
    documentosPorTipo: buildDocumentosPorTipo(emptyCounts),
    distribucion: [{ name: "Sin emisiones", value: 100, color: "#e2e8f0" }],
    distribucionTotalLabel: "0%",
    ventasCurrency: buildVentasCurrencySummaries(
      { pen: 0, usd: 0 },
      { pen: 0, usd: 0 },
      { pen: 0, usd: 0 },
      { pen: 0, usd: 0 },
      previousLabel,
    ),
    ventasDailyTrend: buildDailyTrend([], range, "ventas"),
    proformasDailyTrend: buildDailyTrend([], range, "proformas"),
    ventasDocumentSummary: [
      {
        id: "factura",
        label: "Facturas",
        color: "#3b82f6",
        pen: 0,
        usd: 0,
        eur: 0,
        operations: 0,
      },
    ],
    comprasCurrency: buildComprasCurrencySummaries({ pen: 0, usd: 0 }, { pen: 0, usd: 0 }, previousLabel),
    comprasDailyTrend: buildComprasDailyTrend([], range),
    previousPeriodLabel: previousLabel,
    source: "empty",
  };
}

export function buildEstadisticas(input: {
  range: PeriodRange;
  ventas: VentaRow[];
  ordenes: OrdenRow[];
}): EstadisticasData {
  const { range, ventas, ordenes } = input;
  const previousRange = resolvePreviousRange(range);
  const previousLabel = formatPreviousPeriodLabel(previousRange);

  const periodVentas = ventas.filter((row) => isVentaInRange(row, range));
  const prevVentas = ventas.filter((row) => isVentaInRange(row, previousRange));

  const currentCounts = countByCategory(periodVentas);
  const previousCounts = countByCategory(prevVentas);

  const currentCurrency = sumByCurrency(periodVentas);
  const previousCurrency = sumByCurrency(prevVentas);

  const distribucion = buildDistribucion(currentCounts);
  const distribucionTotalLabel =
    distribucion.length === 1 && distribucion[0]?.name === "Sin emisiones"
      ? "0%"
      : `${distribucion[0]?.value ?? 0}%`;

  const compras = buildComprasCurrency(ordenes, range, previousRange, previousLabel);

  const documentSummary = buildDocumentSummary(periodVentas);
  const defaultSummary = emptyEstadisticas(range).ventasDocumentSummary;
  const hasData = periodVentas.length > 0 || ordenes.some((row) => isIsoDateInRange(row.created_at.slice(0, 10), range));

  return {
    emisionKpis: buildEmisionKpis(currentCounts, previousCounts, previousLabel),
    documentosPorTipo: buildDocumentosPorTipo(currentCounts),
    distribucion,
    distribucionTotalLabel,
    ventasCurrency: buildVentasCurrencySummaries(
      { pen: currentCurrency.pen, usd: currentCurrency.usd },
      { pen: previousCurrency.pen, usd: previousCurrency.usd },
      sumCobranzas(periodVentas),
      sumCobranzas(prevVentas),
      previousLabel,
    ),
    ventasDailyTrend: buildDailyTrend(periodVentas, range, "ventas"),
    proformasDailyTrend: buildDailyTrend(periodVentas, range, "proformas"),
    ventasDocumentSummary: documentSummary.some((row) => row.operations > 0)
      ? documentSummary.filter((row) => row.operations > 0)
      : defaultSummary,
    comprasCurrency: compras.summaries,
    comprasDailyTrend: compras.dailyTrend,
    previousPeriodLabel: previousLabel,
    source: hasData ? "supabase" : "empty",
  };
}

export async function fetchEstadisticas(userId: string | null, range: PeriodRange): Promise<EstadisticasData> {
  if (!userId) {
    return emptyEstadisticas(range);
  }

  scheduleVentasLegacyImport(userId);

  const ventasQuery = supabase
    .from("ventas")
    .select("id, fecha, total, moneda, tipo_comprobante, codigo_comprobante, numero, notas, estado")
    .eq("user_id", userId)
    .neq("estado", "anulada");

  const ordenesQuery = ordenesTableAvailable
    ? supabase.from("ordenes_compra").select("importe, created_at").eq("user_id", userId)
    : Promise.resolve({ data: [] as OrdenRow[], error: null });

  const [ventasRes, ordenesRes] = await Promise.all([ventasQuery, ordenesQuery]);

  if (ventasRes.error) {
    throw new Error(ventasRes.error.message);
  }
  if (ordenesRes.error) {
    if (isMissingRelationError(ordenesRes.error)) {
      ordenesTableAvailable = false;
    } else {
      throw new Error(ordenesRes.error.message);
    }
  }

  return buildEstadisticas({
    range,
    ventas: ventasRes.data ?? [],
    ordenes: ordenesRes.data ?? [],
  });
}

export function formatEstadisticasPeriodLabel(range: PeriodRange): string {
  const start = new Date(`${range.start}T12:00:00`);
  const month = start.toLocaleDateString("es-PE", { month: "long" });
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capitalized}, ${start.getFullYear()}`;
}

export { DOCUMENTO_TIPOS };
