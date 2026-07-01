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
import { ChevronDown, RefreshCw } from "lucide-react";
import { CrmKpiCard } from "@/components/app/CrmShared";
import { Button } from "@/components/ui/button";
import {
  flujoCajaChart,
  gastosDistribucion,
  generalKpis,
  indicadoresFinancieros,
  ingresosDistribucion,
  resumenFinancieroChart,
  topClientesGeneral,
  topProductosGeneral,
  utilidadEvolucion,
} from "@/lib/dashboard-general-data";
import { cn } from "@/lib/utils";

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
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="app-panel-title">{title}</h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2} strokeWidth={0}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-slate-900">{total}</span>
            <span className="text-[10px] text-slate-500">{totalLabel}</span>
          </div>
        </div>
        <ul className="app-panel-list min-w-0 flex-1">
          {data.map((item) => (
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

function MiniDonut({
  title,
  fijo,
  variable,
  fijoColor,
  variableColor,
}: {
  title: string;
  fijo: number;
  variable: number;
  fijoColor: string;
  variableColor: string;
}) {
  const data = [
    { name: "Fijos", value: fijo, color: fijoColor },
    { name: "Variables", value: variable, color: variableColor },
  ];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="app-panel-title">{title}</h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="h-24 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={2} strokeWidth={0}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fijoColor }} />
            {title.includes("Ingresos") ? "Ingresos fijos" : "Gastos fijos"} ({fijo}%)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: variableColor }} />
            {title.includes("Ingresos") ? "Ingresos variables" : "Gastos variables"} ({variable}%)
          </li>
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
}: {
  title: string;
  nameHeader: string;
  valueHeader: string;
  rows: { name: string; value: number; participacion: number }[];
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
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-slate-50">
                <td className="max-w-[140px] truncate py-2 pr-2 font-medium text-slate-700">{row.name}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function DashboardGeneralView() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {generalKpis.map((kpi) => (
          <CrmKpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="app-panel-title">Resumen financiero</h3>
              <p className="text-xs text-slate-500">Ingresos, gastos y utilidad neta</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-slate-600">
              Mensual
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={resumenFinancieroChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <DonutCard title="Distribución de ingresos" total="S/ 248,450" totalLabel="Total" data={ingresosDistribucion} />
          <DonutCard title="Distribución de gastos" total="S/ 187,230" totalLabel="Total" data={gastosDistribucion} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniDonut title="Ingresos: Fijos vs Variables" fijo={35} variable={65} fijoColor="#3b82f6" variableColor="#93c5fd" />
        <MiniDonut title="Gastos: Fijos vs Variables" fijo={58} variable={42} fijoColor="#ef4444" variableColor="#fca5a5" />

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="app-panel-title">Evolución de la utilidad neta</h3>
            <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-slate-600">
              Mensual
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-3 h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={utilidadEvolucion} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="utilidadFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="utilidad" stroke="#22c55e" strokeWidth={2} dot={false} fill="url(#utilidadFill)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="app-panel-title">Indicadores financieros</h3>
          <ul className="mt-3 space-y-2.5">
            {indicadoresFinancieros.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate text-slate-600">{item.label}</p>
                  <p className="font-semibold text-slate-900">{item.value}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    item.tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                    item.tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
                  )}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RankingTable
          title="Top 10 clientes por facturación"
          nameHeader="Cliente"
          valueHeader="Facturación"
          rows={topClientesGeneral.map((r) => ({ name: r.cliente, value: r.facturacion, participacion: r.participacion }))}
        />
        <RankingTable
          title="Top 10 productos / servicios"
          nameHeader="Producto / Servicio"
          valueHeader="Ventas"
          rows={topProductosGeneral.map((r) => ({ name: r.producto, value: r.ventas, participacion: r.participacion }))}
        />

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="app-panel-title">Flujo de caja</h3>
            <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-slate-600">
              Mensual
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={flujoCajaChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        <span>Actualizado: hace 31 minutos</span>
        <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>
    </div>
  );
}
