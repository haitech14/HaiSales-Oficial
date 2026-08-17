export type EstadisticasScope = "establecimiento" | "global";

export type EstadisticasEmisionKpi = {
  id: "total" | "comprobantes" | "guias" | "otros";
  label: string;
  value: number;
  changeLabel: string;
  changePositive: boolean | null;
  hint?: string;
};

export type EstadisticasDocumentoTipo = {
  id: string;
  label: string;
  color: string;
  count: number;
  maxCount: number;
};

export type EstadisticasDistribucionSlice = {
  name: string;
  value: number;
  color: string;
};

export type EstadisticasCurrencySummary = {
  id: "pen" | "usd" | "eur";
  label: string;
  symbol: string;
  amount: number;
  formatted: string;
  changeLabel: string;
  iconBg: string;
  iconColor: string;
  lineColor: string;
};

export type EstadisticasDailyPoint = {
  day: string;
  soles: number;
  dolares: number;
  euros: number;
};

export type EstadisticasDocumentSummaryRow = {
  id: string;
  label: string;
  color: string;
  pen: number;
  usd: number;
  eur: number;
  operations: number;
};

export type EstadisticasData = {
  emisionKpis: EstadisticasEmisionKpi[];
  documentosPorTipo: EstadisticasDocumentoTipo[];
  distribucion: EstadisticasDistribucionSlice[];
  distribucionTotalLabel: string;
  ventasCurrency: EstadisticasCurrencySummary[];
  ventasDailyTrend: EstadisticasDailyPoint[];
  proformasDailyTrend: EstadisticasDailyPoint[];
  ventasDocumentSummary: EstadisticasDocumentSummaryRow[];
  comprasCurrency: EstadisticasCurrencySummary[];
  comprasDailyTrend: EstadisticasDailyPoint[];
  previousPeriodLabel: string;
  source: "supabase" | "empty";
};
