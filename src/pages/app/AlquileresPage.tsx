import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";
import { AlquileresRightPanel } from "@/components/app/AlquileresRightPanel";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { Button } from "@/components/ui/button";
import { useAlquileres } from "@/hooks/useAlquileres";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import {
  alquileresTabs,
  formatAlquilerCurrency,
  getAlquilerStatusStyles,
} from "@/lib/alquileres/alquileres-service";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function AlquileresPage() {
  const {
    snapshot,
    paginatedRecords,
    filteredRecords,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    isLoading,
    isFetching,
    refresh,
    lastUpdatedAt,
  } = useAlquileres();
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();

  const totalRecords = snapshot?.totalRecords ?? 0;
  const filteredCount = filteredRecords.length;
  const startIndex = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, filteredCount);

  const visiblePages = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [page - 2, page - 1, page, page + 1, page + 2];
  })();

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Alquileres"
        subtitle="Gestiona contratos, equipos alquilados, renovaciones y facturación recurrente."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        hideHelp
        actionLabel="+ Nuevo alquiler"
        onActionClick={() => undefined}
      />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(snapshot?.kpis ?? []).map((kpi) => (
                <CrmKpiCard key={kpi.label} {...kpi} />
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 pt-3">
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {alquileresTabs.map((tab) => {
                    const count = snapshot?.tabCounts[tab.id];
                    return (
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
                        {typeof count === "number" && tab.id !== "todos" && (
                          <span
                            className={cn(
                              activeTab === tab.id ? "text-blue-600" : "text-slate-400",
                            )}
                          >
                            {" "}({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por cliente, equipo, serie o contrato..."
                    className="app-search-input pl-9 pr-3"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Tipo de equipo: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Rango de fechas
                  <ChevronDown className="h-3.5 w-3.5" />
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
                <table className="app-table-body w-full min-w-[720px] text-left sm:min-w-[1100px]">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="app-table-cell">Fecha</th>
                      <th className="app-table-cell">Cliente</th>
                      <th className="app-table-cell">Equipo</th>
                      <th className="app-table-cell">Serie</th>
                      <th className="app-table-cell">Inicio</th>
                      <th className="app-table-cell">Vencimiento</th>
                      <th className="app-table-cell">Estado</th>
                      <th className="app-table-cell text-right">Monto mensual</th>
                      <th className="app-table-cell text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                          Cargando alquileres...
                        </td>
                      </tr>
                    ) : paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          Sin resultados para los filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50/60"
                        >
                          <td className="app-table-cell font-medium text-slate-800">{item.date}</td>
                          <td className="app-table-cell font-medium text-slate-800">{item.client}</td>
                          <td className="app-table-cell text-slate-700">{item.equipment}</td>
                          <td className="app-table-cell font-mono text-xs text-slate-600">{item.serial}</td>
                          <td className="app-table-cell text-slate-700">{item.startDate}</td>
                          <td className="app-table-cell">
                            <span
                              className={cn(
                                "font-medium",
                                item.status === "Vencido" || item.status === "Por vencer"
                                  ? "text-red-600"
                                  : "text-slate-800",
                              )}
                            >
                              {item.endDate}
                            </span>
                          </td>
                          <td className="app-table-cell">
                            <span
                              className={cn(
                                "app-table-badge inline-flex rounded-full border",
                                getAlquilerStatusStyles(item.status),
                              )}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="app-table-cell text-right font-semibold text-slate-900">
                            {formatAlquilerCurrency(item.monthlyAmount)}
                          </td>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="app-pagination-bar flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5">
                <p>
                  {filteredCount === 0
                    ? `Sin resultados · ${totalRecords.toLocaleString("es-PE")} en total`
                    : `Mostrando ${startIndex.toLocaleString("es-PE")} a ${endIndex.toLocaleString("es-PE")} de ${filteredCount.toLocaleString("es-PE")} resultados`}
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {visiblePages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium",
                        pageNumber === page
                          ? "bg-blue-600 font-semibold text-white"
                          : "text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <>
                      <span className="px-1 text-slate-400">...</span>
                      <button
                        type="button"
                        onClick={() => setPage(totalPages)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Filas por página:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                      className="h-8 appearance-none rounded-md border border-slate-200 bg-white pl-2 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    >
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <AlquileresRightPanel
            snapshot={snapshot}
            lastUpdatedAt={lastUpdatedAt}
            onRefresh={() => void refresh()}
            isRefreshing={isFetching}
          />
        </AppRightPanelSlot>
      </div>
    </div>
  );
}
