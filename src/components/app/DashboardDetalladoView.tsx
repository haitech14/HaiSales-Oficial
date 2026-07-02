import { useMemo, useState } from "react";
import { Calendar, ChevronDown, Filter, Loader2, MoreHorizontal, Search } from "lucide-react";
import { CrmKpiCard } from "@/components/app/CrmShared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import {
  dashboardTabs,
  formatAmountCell,
  getDashboardStatusStyles,
  type DashboardTabId,
} from "@/lib/dashboard-mock-data";
import { cn } from "@/lib/utils";

type DashboardDetalladoViewProps = {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
};

export function DashboardDetalladoView({ activeTab, onTabChange }: DashboardDetalladoViewProps) {
  const [search, setSearch] = useState("");
  const { snapshot, isLoading } = useDashboard();

  const filteredRecords = useMemo(() => {
    const records = snapshot?.records ?? [];
    const query = search.trim().toLowerCase();

    return records.filter((item) => {
      const matchesTab = activeTab === "resumen" || item.tab === activeTab;
      const matchesSearch =
        !query ||
        item.document.toLowerCase().includes(query) ||
        item.area.toLowerCase().includes(query) ||
        item.detail.toLowerCase().includes(query) ||
        item.responsible.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, snapshot?.records]);

  const dashboardKpis = snapshot?.kpis ?? [];
  const detailTabs = dashboardTabs.filter((tab) => tab.id !== "reportes");

  return (
    <div className="space-y-5">
      {snapshot?.source === "supabase" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Actividad agregada desde Supabase
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {dashboardKpis.map((kpi) => (
          <CrmKpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 pt-3">
          <div className="flex flex-wrap gap-1">
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-sm font-medium transition",
                  activeTab === tab.id
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
              placeholder="Buscar por documento, área, responsable o detalle..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
            Área: Todas
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
            Estado: Todos
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
            <Calendar className="h-3.5 w-3.5" />
            01/06/2026 - 30/06/2026
          </Button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            aria-label="Filtros"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-xs">
            <thead>
              <tr className="app-table-head-row">
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5">Área</th>
                <th className="px-4 py-2.5">Documento</th>
                <th className="px-4 py-2.5">Detalle</th>
                <th className="px-4 py-2.5">Monto</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5">Responsable</th>
                <th className="px-4 py-2.5 text-right" />
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{item.date}</p>
                    <p className="text-xs text-slate-400">{item.time}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{item.area}</td>
                  <td className="px-4 py-3">
                    <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                      {item.document}
                    </a>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="line-clamp-2 text-slate-600">{item.detail}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatAmountCell(item.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                        getDashboardStatusStyles(item.status),
                      )}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-slate-100 text-[9px] font-semibold text-slate-600">
                          {item.responsibleInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-slate-700">{item.responsible}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Más acciones"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <p>Mostrando 1 a {filteredRecords.length} de 128 registros</p>
          <div className="flex items-center gap-1">
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
              1
            </button>
            {[2, 3].map((page) => (
              <button
                key={page}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {page}
              </button>
            ))}
            <span className="px-1 text-slate-400">...</span>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100">
              13
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
