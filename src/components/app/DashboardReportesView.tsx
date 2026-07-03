import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppPeriodFilter } from "@/components/app/AppPeriodFilter";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import {
  dashboardReports,
  getReportFormatStyles,
  reportCategoryFilters,
} from "@/lib/dashboard-reportes-data";
import { cn } from "@/lib/utils";

export function DashboardReportesView() {
  const { range } = useAppPeriod();
  const { data: analytics } = useDashboardAnalytics();
  const [category, setCategory] =
    useState<(typeof reportCategoryFilters)[number]["id"]>("todos");
  const [search, setSearch] = useState("");

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dashboardReports.filter((report) => {
      const matchesCategory = category === "todos" || report.category === category;
      const matchesSearch =
        !query ||
        report.name.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const ventasMensualesChart = analytics?.ventasMensualesChart ?? [];
  const topClientesReporte = analytics?.topClientes ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="app-panel-title">Ingresos del periodo</h3>
              <p className="text-xs text-slate-500">{range.label}</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
              {range.shortLabel}
            </span>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasMensualesChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `${Math.round(value / 1000)}K`}
                />
                <Tooltip
                  formatter={(value: number) => [`S/ ${value.toLocaleString("es-PE")}`, "Ingresos"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="monto" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="app-panel-title">Top clientes</h3>
              <p className="text-xs text-slate-500">Participación en ventas del periodo</p>
            </div>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver reporte completo
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {topClientesReporte.length === 0 ? (
              <li className="py-6 text-center text-xs text-slate-400">Sin clientes en el periodo</li>
            ) : (
              topClientesReporte.map((item) => (
              <li key={item.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{item.name}</span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    S/ {item.value.toLocaleString("es-PE")}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${item.participacion * 5}%` }}
                  />
                </div>
              </li>
              ))
            )}
          </ul>
        </article>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 pt-3">
          <div className="flex flex-wrap gap-1">
            {reportCategoryFilters.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-sm font-medium transition",
                  category === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar reporte por nombre o descripción..."
              className="app-search-input pl-9 pr-3"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
            Categoría: Todas
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
            Formato: Todos
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <AppPeriodFilter />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            aria-label="Filtros"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead>
              <tr className="app-table-head-row">
                <th className="px-4 py-2.5">Reporte</th>
                <th className="px-4 py-2.5">Descripción</th>
                <th className="px-4 py-2.5">Última ejecución</th>
                <th className="px-4 py-2.5">Formato</th>
                <th className="px-4 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const Icon = report.icon;

                return (
                  <tr key={report.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            report.iconBg,
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5", report.iconColor)} strokeWidth={2} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{report.name}</p>
                          {report.featured && (
                            <span className="text-[10px] font-medium text-blue-600">Destacado</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="line-clamp-2 text-slate-600">{report.description}</p>
                    </td>
                    <td className="app-table-cell text-slate-600">{report.lastRun}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                          getReportFormatStyles(report.format),
                        )}
                      >
                        {report.format}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Exportar
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Más acciones"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="app-pagination-bar flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5">
          <p>Mostrando 1 a {filteredReports.length} de {dashboardReports.length} reportes</p>
          <div className="flex items-center gap-1">
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
              1
            </button>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100">
              2
            </button>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-slate-600">
            10 por página
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
