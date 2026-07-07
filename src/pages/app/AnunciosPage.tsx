import {
  Calendar,
  ChevronDown,
  Filter,
  GanttChart,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { AnunciosKanbanColumn } from "@/components/app/anuncios/AnunciosKanbanColumn";
import { AnunciosOrgChart } from "@/components/app/anuncios/AnunciosOrgChart";
import { AnunciosProyeccionView } from "@/components/app/anuncios/AnunciosProyeccionView";
import { AnunciosRightPanel } from "@/components/app/anuncios/AnunciosRightPanel";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { Button } from "@/components/ui/button";
import { useAnuncios } from "@/hooks/useAnuncios";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { anunciosTabs } from "@/lib/anuncios/anuncios-service";
import { cn } from "@/lib/utils";

export default function AnunciosPage() {
  const {
    snapshot,
    kanbanColumns,
    proyeccion,
    updateColumnCopy,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    viewMode,
    setViewMode,
    isLoading,
    isFetching,
    refresh,
    lastUpdatedAt,
  } = useAnuncios();
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Anuncios"
        subtitle="Organiza pendientes, responsables, proyectos y comunicados por área de la empresa."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        hideHelp
        actionLabel="+ Nuevo pendiente"
        showActionDropdown
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
                  {anunciosTabs.map((tab) => {
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
                            {" "}
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                      viewMode === "kanban"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Kanban
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("proyeccion")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                      viewMode === "proyeccion"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <GanttChart className="h-3.5 w-3.5" />
                    Proyección
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 px-4 py-3">
                <div className="flex w-full min-w-[min(100%,220px)] flex-1 flex-col items-start gap-2">
                  <AnunciosOrgChart />
                  <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar tareas o responsables..."
                      className="app-search-input pl-9 pr-3"
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Área: Todas
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Prioridad: Todas
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Fecha límite
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
                <Button variant="ghost" size="sm" className="ml-auto h-9 gap-1.5 text-slate-600">
                  <Filter className="h-3.5 w-3.5" />
                  Más filtros
                </Button>
              </div>

              {viewMode === "kanban" ? (
                isLoading ? (
                  <div className="flex items-center justify-center py-20 text-sm text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Cargando pendientes...
                  </div>
                ) : (
                  <div className="overflow-x-auto p-4">
                    <div className="flex h-[min(520px,calc(100vh-20rem))] gap-3">
                      {kanbanColumns.map((column) => (
                        <AnunciosKanbanColumn
                          key={column.area.id}
                          column={column}
                          onCopyChange={updateColumnCopy}
                        />
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <AnunciosProyeccionView
                  porHacer={proyeccion.porHacer}
                  pendientes={proyeccion.pendientes}
                />
              )}
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <AnunciosRightPanel
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
