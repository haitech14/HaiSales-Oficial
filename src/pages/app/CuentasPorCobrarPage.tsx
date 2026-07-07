import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { CuentasPorCobrarRightPanel } from "@/components/app/CuentasPorCobrarRightPanel";
import { Button } from "@/components/ui/button";
import { useCuentasCobrar } from "@/hooks/useCuentasCobrar";
import {
  cuentasCobrarTabs,
  formatCurrency,
  getCobroStatusStyles,
} from "@/lib/cuentas-cobrar/cuentas-cobrar-service";
import { cn } from "@/lib/utils";

export default function CuentasPorCobrarPage() {
  const {
    snapshot,
    filteredRecords,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
  } = useCuentasCobrar();
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();

  const tabsWithCounts = cuentasCobrarTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));

  const totalRecords = snapshot?.totalRecords ?? filteredRecords.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Cobranzas"
        subtitle="Gestiona y controla tus cobranzas y el estado de tus clientes."
        showDateRange
        showFiltersButton
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        hideHelp
        actionLabel="+ Nuevo cobro"
        showActionDropdown
        notificationCount={5}
        onActionClick={() => undefined}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} registros sincronizados
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {(snapshot?.kpis ?? []).map((kpi) => (
                <CrmKpiCard key={kpi.label} {...kpi} />
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 pt-3">
                <div className="flex gap-1 overflow-x-auto pb-1">
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
                            activeTab === tab.id ? "text-blue-600" : "text-slate-400",
                          )}
                        >
                          {" "}({tab.count})
                        </span>
                      )}
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
                    placeholder="Buscar por cliente, documento, factura..."
                    className="app-search-input pl-9 pr-3"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Vencimiento: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Vendedor: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  <Filter className="h-3.5 w-3.5" />
                  Más filtros
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
                <table className="app-table-body w-full min-w-[720px] text-left sm:min-w-[1200px]">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="app-table-cell">Fecha</th>
                      <th className="app-table-cell">Documento</th>
                      <th className="app-table-cell">Cliente</th>
                      <th className="app-table-cell">Referencia</th>
                      <th className="app-table-cell">Vencimiento</th>
                      <th className="app-table-cell text-right">Total</th>
                      <th className="app-table-cell text-right">Saldo</th>
                      <th className="app-table-cell text-center">Días vencido</th>
                      <th className="app-table-cell">Estado</th>
                      <th className="app-table-cell">Vendedor</th>
                      <th className="app-table-cell text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                          Cargando cobranzas...
                        </td>
                      </tr>
                    ) : (
                    filteredRecords.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                        <td className="app-table-cell font-medium text-slate-800">{item.date}</td>
                        <td className="app-table-cell">
                          <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                            {item.document}
                          </a>
                        </td>
                        <td className="app-table-cell font-medium text-slate-800">{item.client}</td>
                        <td className="app-table-cell max-w-[180px]">
                          <p className="truncate text-slate-600">{item.reference}</p>
                        </td>
                        <td className="app-table-cell">
                          <span
                            className={cn(
                              "font-medium",
                              item.dueDateOverdue ? "text-red-600" : "text-slate-800",
                            )}
                          >
                            {item.dueDate}
                          </span>
                        </td>
                        <td className="app-table-cell text-right font-semibold text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="app-table-cell text-right font-semibold text-slate-900">
                          {formatCurrency(item.balance)}
                        </td>
                        <td className="app-table-cell text-center text-slate-600">
                          {item.daysOverdue ?? "—"}
                        </td>
                        <td className="app-table-cell">
                          <span
                            className={cn(
                              "app-table-badge inline-flex rounded-full border",
                              getCobroStatusStyles(item.status),
                            )}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="app-table-cell text-slate-700">{item.seller}</td>
                        <td className="app-table-cell text-right">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Acciones"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              <AppTablePagination shownCount={filteredRecords.length} totalCount={totalRecords} />
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <CuentasPorCobrarRightPanel snapshot={snapshot} />
        </AppRightPanelSlot>
      </div>
    </div>
  );
}

