import { useState } from "react";
import {
  BarChart3,
  FileStack,
  FileText,
  Layers2,
  LineChart,
  PieChart as PieChartIcon,
  Sigma,
  Truck,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  EstadisticasCurrencySummary,
  EstadisticasDailyPoint,
  EstadisticasDocumentSummaryRow,
  EstadisticasDocumentoTipo,
  EstadisticasDistribucionSlice,
  EstadisticasEmisionKpi,
} from "@/lib/estadisticas/estadisticas-types";
import { cn } from "@/lib/utils";

const EMISION_ICONS = {
  total: Sigma,
  comprobantes: FileText,
  guias: Truck,
  otros: Layers2,
} as const;

const EMISION_ICON_BG = {
  total: "bg-blue-50 text-blue-600",
  comprobantes: "bg-sky-50 text-sky-600",
  guias: "bg-violet-50 text-violet-600",
  otros: "bg-slate-100 text-slate-500",
} as const;

export function EstadisticasSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <BarChart3 className="h-4 w-4" strokeWidth={2} />
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function EstadisticasCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6", className)}>
      {children}
    </article>
  );
}

export function EstadisticasEmisionKpiGrid({ items }: { items: EstadisticasEmisionKpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = EMISION_ICONS[item.id];
        return (
          <EstadisticasCard key={item.id} className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  EMISION_ICON_BG[item.id],
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{item.value}</p>
                <p
                  className={cn(
                    "mt-1 text-xs font-medium",
                    item.changePositive === true && "text-emerald-600",
                    item.changePositive === false && "text-red-500",
                    item.changePositive === null && "text-slate-400",
                  )}
                >
                  {item.hint && item.value === 0 ? item.hint : item.changeLabel}
                </p>
              </div>
            </div>
          </EstadisticasCard>
        );
      })}
    </div>
  );
}

export function EstadisticasDocumentosPorTipoCard({ items }: { items: EstadisticasDocumentoTipo[] }) {
  return (
    <EstadisticasCard className="min-h-[360px]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900">Documentos por tipo</h3>
          <p className="text-sm text-slate-500">Cantidad de documentos emitidos</p>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {items.map((item) => {
          const width = item.maxCount > 0 ? Math.max((item.count / item.maxCount) * 100, item.count > 0 ? 8 : 0) : 0;
          return (
            <li key={item.id} className="flex items-center gap-3">
              <span className="w-[148px] shrink-0 truncate text-sm text-slate-700">{item.label}</span>
              <div className="min-w-0 flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${width}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-800">
                {item.count}
              </span>
            </li>
          );
        })}
      </ul>
    </EstadisticasCard>
  );
}

export function EstadisticasDistribucionCard({
  slices,
  centerLabel,
}: {
  slices: EstadisticasDistribucionSlice[];
  centerLabel: string;
}) {
  const chartData = slices.length > 0 ? slices : [{ name: "Sin datos", value: 100, color: "#e2e8f0" }];

  return (
    <EstadisticasCard className="min-h-[360px]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <PieChartIcon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900">Distribución</h3>
          <p className="text-sm text-slate-500">Composición del total emitido</p>
        </div>
      </div>

      <div className="relative mx-auto mt-6 h-[220px] w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{centerLabel}</span>
        </div>
      </div>
    </EstadisticasCard>
  );
}

export function EstadisticasCurrencyGrid({ items }: { items: EstadisticasCurrencySummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((item) => (
        <EstadisticasCard key={item.id} className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                item.iconBg,
                item.iconColor,
              )}
            >
              {item.symbol}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{item.formatted}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">{item.changeLabel}</p>
            </div>
          </div>
        </EstadisticasCard>
      ))}
    </div>
  );
}

function DailyTrendChartBody({ data }: { data: EstadisticasDailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(value: number) => value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Line type="monotone" dataKey="soles" name="Soles" stroke="#22c55e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="dolares" name="Dólares" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="euros" name="Euros" stroke="#f97316" strokeWidth={2} dot={false} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function EstadisticasDailyTrendCard({
  title,
  subtitle,
  ventasData,
  proformasData,
  showModeToggle = false,
}: {
  title: string;
  subtitle: string;
  ventasData: EstadisticasDailyPoint[];
  proformasData?: EstadisticasDailyPoint[];
  showModeToggle?: boolean;
}) {
  const [mode, setMode] = useState<"ventas" | "proformas">("ventas");
  const chartData = showModeToggle && mode === "proformas" && proformasData ? proformasData : ventasData;

  return (
    <EstadisticasCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <LineChart className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {showModeToggle ? (
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("ventas")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                mode === "ventas" ? "bg-blue-600 text-white" : "text-slate-600",
              )}
            >
              Ventas
            </button>
            <button
              type="button"
              onClick={() => setMode("proformas")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                mode === "proformas" ? "bg-blue-600 text-white" : "text-slate-600",
              )}
            >
              Proformas
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 h-[280px]">
        <DailyTrendChartBody data={chartData} />
      </div>
    </EstadisticasCard>
  );
}

export function EstadisticasDocumentSummaryCard({ rows }: { rows: EstadisticasDocumentSummaryRow[] }) {
  return (
    <EstadisticasCard>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FileStack className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900">Resumen por documento</h3>
          <p className="text-sm text-slate-500">Monto total y operaciones</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4">Tipo de documento</th>
              <th className="pb-3 pr-4">Soles (S/)</th>
              <th className="pb-3 pr-4">Dólares (US$)</th>
              <th className="pb-3 pr-4">Euros (€)</th>
              <th className="pb-3">Operaciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 last:border-0">
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.label}
                  </span>
                </td>
                <td className="py-3 pr-4 tabular-nums text-slate-700">
                  {row.pen.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 pr-4 tabular-nums text-slate-700">
                  {row.usd.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 pr-4 tabular-nums text-slate-700">
                  {row.eur.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 tabular-nums font-semibold text-slate-800">{row.operations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EstadisticasCard>
  );
}
