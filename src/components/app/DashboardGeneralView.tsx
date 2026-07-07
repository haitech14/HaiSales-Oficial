import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, RefreshCw, Loader2 } from "lucide-react";
import { CrmKpiCard } from "@/components/app/CrmShared";
import { Button } from "@/components/ui/button";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { cn } from "@/lib/utils";

function parseCurrencyTotal(total: string) {
  const match = total.match(/^(S\/|USD)\s+(.+)$/);
  if (match) {
    return { currency: match[1], amount: match[2] };
  }
  return { currency: null, amount: total };
}

function DonutCard({
  title,
  total,
  totalLabel,
  data,
}: {
  title: string;
  total: string;
  totalLabel: string;
  data: { name: string; value: number; color: string }[];
}) {
  const { currency, amount } = parseCurrencyTotal(total);
  const slices = data.length > 0 ? data : [{ name: "Sin datos", value: 100, color: "#e2e8f0" }];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="app-panel-title">{title}</h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2} strokeWidth={0}>
                {slices.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
            <div className="flex items-baseline justify-center gap-0.5 whitespace-nowrap">
              {currency && (
                <span className="text-[9px] font-semibold text-slate-500">{currency}</span>
              )}
              <span className="text-[11px] font-bold leading-none text-slate-900">{amount}</span>
            </div>
            <span className="mt-0.5 text-[10px] text-slate-500">{totalLabel}</span>
          </div>
        </div>
        <ul className="app-panel-list min-w-0 flex-1">
          {slices.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-2 text-slate-600">
              <span className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="shrink-0 font-semibold text-slate-800">{item.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function RankingTable({
  title,
  nameHeader,
  valueHeader,
  rows,
  nameMaxWidthClass = "max-w-[140px]",
}: {
  title: string;
  nameHeader: string;
  valueHeader: string;
  rows: { name: string; value: number; participacion: number }[];
  nameMaxWidthClass?: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="app-panel-title">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="pb-2 pr-2">{nameHeader}</th>
              <th className="pb-2 pr-2">{valueHeader}</th>
              <th className="pb-2">Participación</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-400">
                  Sin datos en el periodo seleccionado
                </td>
              </tr>
            ) : (
              rows.map((row) => (
              <tr key={row.name} className="border-b border-slate-50">
                <td className={cn("truncate py-2 pr-2 font-medium text-slate-700", nameMaxWidthClass)} title={row.name}>
                  {row.name}
                </td>
                <td className="whitespace-nowrap py-2 pr-2 font-semibold text-slate-900">
                  S/ {row.value.toLocaleString("es-PE")}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${row.participacion * 5}%` }} />
                    </div>
                    <span className="text-slate-500">{row.participacion}%</span>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function DashboardGeneralView() {
  const { data: analytics, isLoading, refetch, isFetching } = useDashboardAnalytics();
  const { range } = useAppPeriod();

  if (isLoading && !analytics) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
        Cargando indicadores del periodo...
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const ingresosTotal = analytics.ingresosDistribucion.reduce((sum, item) => sum + item.value, 0);
  const gastosTotal = analytics.gastosDistribucion.reduce((sum, item) => sum + item.value, 0);
  const ingresosAmount = analytics.generalKpis[0]?.value ?? "S/ 0";
  const gastosAmount = analytics.generalKpis[1]?.value ?? "S/ 0";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        Mostrando datos de <span className="font-semibold">{analytics.periodLabel}</span>
        {analytics.source === "empty" && " · Sin movimientos registrados en este periodo"}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
        {analytics.generalKpis.map((kpi) => (
          <CrmKpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="app-panel-title">Resumen financiero</h3>
              <p className="text-xs text-slate-500">Ingresos, gastos y utilidad — {range.label}</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
              {range.shortLabel}
            </span>
          </div>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.resumenFinancieroChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line type="monotone" dataKey="utilidad" name="Utilidad neta" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-6">
          <DonutCard
            title="Distribución de ingresos"
            total={ingresosTotal > 0 ? ingresosAmount : "S/ 0"}
            totalLabel="Total periodo"
            data={analytics.ingresosDistribucion}
          />
          <DonutCard
            title="Distribución de gastos"
            total={gastosTotal > 0 ? gastosAmount : "S/ 0"}
            totalLabel="Total periodo"
            data={analytics.gastosDistribucion}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RankingTable
          title="Top 10 clientes por facturación"
          nameHeader="Cliente"
          valueHeader="Facturación"
          rows={analytics.topClientes}
        />
        <RankingTable
          title="Top 10 productos / servicios"
          nameHeader="Producto / Servicio"
          valueHeader="Ventas"
          nameMaxWidthClass="max-w-[240px]"
          rows={analytics.topProductos}
        />

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="app-panel-title">Flujo de caja</h3>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
              {range.shortLabel}
            </span>
          </div>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.flujoCajaChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="entradas" name="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="salidas" name="Salidas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Line type="monotone" dataKey="neto" name="Flujo neto" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
        <span>
          {analytics.source === "empty"
            ? "Sin ventas en este periodo. Prueba un mes con ventas en el filtro de periodo."
            : "Indicadores sincronizados con comprobantes del periodo seleccionado."}
        </span>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Actualizar
        </button>
      </div>
    </div>
  );
}
