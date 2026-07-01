import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { AppPageHeader, CrmKpiCard, CrmRightPanel } from "@/components/app/CrmShared";
import { NuevaVentaModal } from "@/components/app/NuevaVentaModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCrm } from "@/hooks/useCrm";
import {
  formatCurrency,
  getProbabilityStyles,
  getStageStyles,
  pipelineTabs,
} from "@/lib/crm/crm-service";
import { cn } from "@/lib/utils";

export default function VentasCrmPage() {
  const {
    snapshot,
    filteredOpportunities,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
  } = useCrm();
  const [panelHidden, setPanelHidden] = useState(false);
  const [nuevaVentaOpen, setNuevaVentaOpen] = useState(false);

  const tabsWithCounts = pipelineTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? tab.count,
  }));

  const totalRecords = snapshot?.totalRecords ?? filteredOpportunities.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Leads"
        subtitle="Gestiona oportunidades, actividades comerciales, cotizaciones y cierres de venta de principio a fin."
        showPanelToggle
        panelHidden={panelHidden}
        onTogglePanel={() => setPanelHidden((current) => !current)}
        actionLabel="Nueva venta"
        onActionClick={() => setNuevaVentaOpen(true)}
      />

      <NuevaVentaModal open={nuevaVentaOpen} onOpenChange={setNuevaVentaOpen} />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} oportunidades sincronizadas
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(snapshot?.kpis ?? []).map((kpi) => (
                <CrmKpiCard key={kpi.label} {...kpi} />
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 pt-3">
                <div className="flex flex-wrap gap-1">
                  {tabsWithCounts.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "app-tab",
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-800",
                      )}
                    >
                      {tab.label}
                      {tab.count !== null && (
                        <span
                          className={cn(
                            "app-tab-badge",
                            activeTab === tab.id ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
                    <Star className="h-3.5 w-3.5" />
                    Guardar vista
                  </button>
                  <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
                    <Filter className="h-3.5 w-3.5" />
                    Más filtros
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por cliente, vendedor, oportunidad..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Etapa: Todas
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Vendedor: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Rango de fechas
                </Button>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={isFetching}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Actualizar"
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-xs">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="px-4 py-2.5">Fecha</th>
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Cliente</th>
                      <th className="px-4 py-2.5">Oportunidad</th>
                      <th className="px-4 py-2.5">Valor</th>
                      <th className="px-4 py-2.5">Etapa</th>
                      <th className="px-4 py-2.5">Probabilidad</th>
                      <th className="px-4 py-2.5">Responsable</th>
                      <th className="px-4 py-2.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                          Cargando oportunidades...
                        </td>
                      </tr>
                    ) : (
                    filteredOpportunities.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.date}</p>
                          <p className="text-xs text-slate-400">{item.time}</p>
                        </td>
                        <td className="px-4 py-3">
                          <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                            {item.id}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.client}</p>
                          <p className="text-xs text-slate-400">RUC {item.ruc}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-400">{item.subtitle}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(item.value)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                              getStageStyles(item.stage),
                            )}
                          >
                            {item.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                              getProbabilityStyles(item.probability),
                            )}
                          >
                            {item.probability}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                                {item.ownerInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-700">{item.owner}</span>
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
                    )))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                <p>Mostrando 1 a {filteredOpportunities.length} de {totalRecords} registros</p>
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
        </div>

        {!panelHidden && <CrmRightPanel className="hidden xl:block" />}
      </div>
    </div>
  );
}
