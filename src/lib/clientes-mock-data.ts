export type ClientSegment = "Corporativo" | "PYME" | "Minorista" | "Prospecto" | "Otros";
export type ClientStatus = "Activo" | "Prospecto" | "Con deuda" | "Inactivo";

export type ClientRecord = {
  id: string;
  fechaAlta: string;
  ruc: string;
  razonSocial: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  distrito: string;
  tipoCliente: string;
  equipoInteres: string;
  produccionMensual: string;
  fechaToner: string;
  ultimaCompra: string;
  cumpleanos: string;
  frecuenciaCompra: string;
  ticketCompra: string;
  modelosInteres: string;
  observaciones: string;
  contacto: string;
  cargo: string;
  segmento: ClientSegment;
  estado: ClientStatus;
  ejecutivo: string;
  ejecutivoInitials: string;
};

type ClientMockInput = Omit<
  ClientRecord,
  "correo" | "direccion" | "ciudad" | "provincia" | "distrito" | "tipoCliente" | "equipoInteres" | "produccionMensual" | "fechaToner" | "ultimaCompra" | "cumpleanos" | "frecuenciaCompra" | "ticketCompra" | "modelosInteres" | "observaciones"
> &
  Partial<Pick<ClientRecord, "correo" | "direccion" | "ciudad" | "provincia" | "distrito" | "tipoCliente" | "equipoInteres" | "produccionMensual" | "fechaToner" | "ultimaCompra" | "cumpleanos" | "frecuenciaCompra" | "ticketCompra" | "modelosInteres" | "observaciones">>;

const clientImportDefaults: Pick<
  ClientRecord,
  "correo" | "direccion" | "ciudad" | "provincia" | "distrito" | "tipoCliente" | "equipoInteres" | "produccionMensual" | "fechaToner" | "ultimaCompra" | "cumpleanos" | "frecuenciaCompra" | "ticketCompra" | "modelosInteres" | "observaciones"
> = {
  correo: "—",
  direccion: "—",
  ciudad: "—",
  provincia: "—",
  distrito: "—",
  tipoCliente: "Público",
  equipoInteres: "—",
  produccionMensual: "—",
  fechaToner: "—",
  ultimaCompra: "—",
  cumpleanos: "—",
  frecuenciaCompra: "—",
  ticketCompra: "—",
  modelosInteres: "—",
  observaciones: "—",
};

export function withClientDefaults(client: ClientMockInput): ClientRecord {
  return { ...clientImportDefaults, ...client };
}

export const clientesKpis = [
  {
    label: "Clientes activos",
    value: "1,284",
    change: "+8.7% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [980, 1020, 1080, 1120, 1160, 1190, 1220, 1250, 1270, 1284],
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    label: "Prospectos",
    value: "312",
    change: "+4.3% vs. mes anterior",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [260, 268, 275, 282, 288, 295, 300, 305, 309, 312],
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  {
    label: "Con deuda",
    value: "45",
    change: "-3.2% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [58, 55, 52, 50, 49, 48, 47, 46, 46, 45],
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
  },
  {
    label: "Ticket promedio",
    value: "S/ 3,420",
    change: "+6.1% vs. mes anterior",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [2800, 2900, 3000, 3080, 3150, 3200, 3280, 3340, 3380, 3420],
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
];

export const clientesTabs = [
  { id: "todos", label: "Todos", count: null },
  { id: "publico", label: "Público", count: 0 },
  { id: "distribuidor", label: "Distribuidor", count: 0 },
  { id: "tecnico", label: "Técnico", count: 0 },
  { id: "mayorista", label: "Mayorista", count: 0 },
  { id: "proveedor", label: "Proveedor", count: 0 },
  { id: "gobierno", label: "Gobierno", count: 0 },
];

export const clienteTipoOptions = clientesTabs
  .filter((tab) => tab.id !== "todos")
  .map((tab) => tab.label);

export const clienteSegmentoOptions: ClientSegment[] = [
  "Corporativo",
  "PYME",
  "Minorista",
  "Prospecto",
  "Otros",
];

/** RUCs del seed demo frontend — no deben mezclarse con datos legacy reales. */
export const demoClienteRucs = [
  "20123456789",
  "20567891234",
  "20456789123",
  "20678912345",
  "20345678912",
  "20198765432",
  "20765432198",
  "20432198765",
  "20543219876",
  "20654321987",
];

const SEGMENT_CHART_COLORS: Record<ClientSegment | "Otros", string> = {
  Corporativo: "#3b82f6",
  PYME: "#eab308",
  Minorista: "#a855f7",
  Prospecto: "#06b6d4",
  Otros: "#1e40af",
};

export type SegmentChartItem = {
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type DebtAgeChartItem = {
  label: string;
  amount: number;
  percent: number;
  color: string;
};

export type ExecutiveChartItem = {
  name: string;
  portfolio: number;
  percent: number;
  metricLabel: "ventas" | "clientes";
};

export function buildSegmentChart(clients: ClientRecord[]): SegmentChartItem[] {
  if (clients.length === 0) return [];

  const counts = new Map<string, number>();
  for (const client of clients) {
    const key = client.segmento || "Otros";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = clients.length;
  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / total) * 100),
      color: SEGMENT_CHART_COLORS[label as ClientSegment] ?? SEGMENT_CHART_COLORS.Otros,
    }))
    .sort((a, b) => b.count - a.count);
}

export const emptyDebtByAge: DebtAgeChartItem[] = [
  { label: "0-30 días", amount: 0, percent: 0, color: "bg-emerald-500" },
  { label: "31-60 días", amount: 0, percent: 0, color: "bg-amber-500" },
  { label: "61-90 días", amount: 0, percent: 0, color: "bg-red-500" },
  { label: "91-120 días", amount: 0, percent: 0, color: "bg-violet-500" },
  { label: "Más de 120 días", amount: 0, percent: 0, color: "bg-blue-600" },
];

export function buildExecutiveChart(
  clients: ClientRecord[],
  portfolioByClientId: Map<string, number>,
): ExecutiveChartItem[] {
  const totals = new Map<string, number>();

  for (const client of clients) {
    const ejecutivo = client.ejecutivo?.trim();
    if (!ejecutivo || ejecutivo === "Sin asignar") continue;

    const portfolio = portfolioByClientId.get(client.id) ?? 0;
    totals.set(ejecutivo, (totals.get(ejecutivo) ?? 0) + portfolio);
  }

  const ranked = [...totals.entries()]
    .map(([name, portfolio]) => ({ name, portfolio }))
    .sort((a, b) => {
      if (b.portfolio !== a.portfolio) return b.portfolio - a.portfolio;
      return a.name.localeCompare(b.name, "es");
    })
    .slice(0, 5);

  const hasRevenue = ranked.some((item) => item.portfolio > 0);

  if (!hasRevenue) {
    const byCount = new Map<string, number>();
    for (const client of clients) {
      const ejecutivo = client.ejecutivo?.trim();
      if (!ejecutivo || ejecutivo === "Sin asignar") continue;
      byCount.set(ejecutivo, (byCount.get(ejecutivo) ?? 0) + 1);
    }

    const fallback = [...byCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, portfolio: count, clientCount: count }));

    const maxCount = fallback[0]?.portfolio ?? 1;
    return fallback.map((item) => ({
      name: item.name,
      portfolio: item.portfolio,
      percent: Math.round((item.portfolio / maxCount) * 100),
      metricLabel: "clientes" as const,
    }));
  }

  const maxPortfolio = ranked[0]?.portfolio || 1;
  return ranked.map((item) => ({
    name: item.name,
    portfolio: item.portfolio,
    percent: Math.round((item.portfolio / maxPortfolio) * 100),
    metricLabel: "ventas" as const,
  }));
}

export function normalizeTipoClienteKey(tipo: string): string {
  const value = tipo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (value.includes("gobierno") || value.includes("estatal") || value.includes("sector public")) {
    return "gobierno";
  }
  if (value.includes("distribuid")) return "distribuidor";
  if (value.includes("tecnic")) return "tecnico";
  if (value.includes("mayorist")) return "mayorista";
  if (value.includes("proveed")) return "proveedor";
  return "publico";
}

export function formatTipoClienteLabel(tipo: string): string {
  switch (normalizeTipoClienteKey(tipo)) {
    case "distribuidor":
      return "Distribuidor";
    case "tecnico":
      return "Técnico";
    case "mayorista":
      return "Mayorista";
    case "proveedor":
      return "Proveedor";
    case "gobierno":
      return "Gobierno";
    default:
      return "Público";
  }
}

export function getTipoClienteStyles(tipo: string) {
  switch (normalizeTipoClienteKey(tipo)) {
    case "distribuidor":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "tecnico":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "mayorista":
      return "bg-violet-50 text-violet-700 border-violet-100";
    case "proveedor":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "gobierno":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "publico":
      return "bg-sky-50 text-sky-700 border-sky-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

export function getSegmentStyles(segment: ClientSegment) {
  switch (segment) {
    case "Corporativo":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "PYME":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "Minorista":
      return "bg-violet-50 text-violet-700 border-violet-100";
    case "Prospecto":
      return "bg-cyan-50 text-cyan-700 border-cyan-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

export function getClientStatusStyles(status: ClientStatus) {
  switch (status) {
    case "Activo":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Prospecto":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Con deuda":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function formatDebtAmount(value: number) {
  return `S/ ${value.toLocaleString("es-PE")}`;
}
