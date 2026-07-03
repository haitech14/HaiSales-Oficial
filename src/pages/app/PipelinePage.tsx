import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard, CrmRightPanel } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { NuevaVentaModal } from "@/components/app/NuevaVentaModal";
import { PipelineProspectDetailSheet } from "@/components/app/PipelineProspectDetailSheet";
import { PipelineRightPanel } from "@/components/app/PipelineRightPanel";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCrm } from "@/hooks/useCrm";
import {
  formatCurrency,
  formatPipelineCurrency,
  getProbabilityStyles,
  getStageStyles,
  pipelineTabs,
} from "@/lib/crm/crm-service";
import type { PipelineCard } from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "tabla";

function PipelineKanbanCard({
  card,
  onSelect,
}: {
  card: PipelineCard;
  onSelect?: (id: string) => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(card.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(card.id);
        }
      }}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          {card.statusBadge && (
            <span
              className={cn(
                "mb-1 inline-flex rounded-full px-1.5 py-0 text-[10px] font-semibold leading-4",
                card.statusBadge === "Ganada"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {card.statusBadge}
            </span>
          )}
          <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-900">{card.title}</p>
          {card.intereses || card.ciudad ? (
            <div className="mt-0.5 space-y-0.5">
              {card.intereses && (
                <p className="line-clamp-2 text-[10px] leading-snug text-slate-600">{card.intereses}</p>
              )}
              {card.ciudad && (
                <p className="line-clamp-1 text-[10px] leading-snug text-slate-400">{card.ciudad}</p>
              )}
            </div>
          ) : (
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">{card.company}</p>
          )}
        </div>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Más acciones"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-blue-600">{formatPipelineCurrency(card.value)}</p>
        <Avatar className="h-5 w-5">
          <AvatarFallback className="bg-blue-100 text-[8px] font-semibold text-blue-700">
            {card.ownerInitials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
        <span className="truncate text-slate-500">{card.owner}</span>
        <span className={cn("shrink-0", card.dueDateUrgent ? "font-medium text-red-500" : "text-slate-400")}>
          {card.dueDate}
        </span>
      </div>
    </article>
  );
}

export default function PipelinePage() {
  const { user } = useAuth();
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
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [nuevaVentaOpen, setNuevaVentaOpen] = useState(false);
  const [prospectDetailCodigo, setProspectDetailCodigo] = useState<string | null>(null);
  const [prospectDetailOpen, setProspectDetailOpen] = useState(false);

  const openProspectDetail = (codigo: string) => {
    setProspectDetailCodigo(codigo);
    setProspectDetailOpen(true);
  };

  const pipelineColumns = snapshot?.pipelineColumns ?? [];
  const tabsWithCounts = pipelineTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));
  const totalRecords = snapshot?.totalRecords ?? 0;
  const kpis = snapshot?.pipelineKpis ?? snapshot?.kpis ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Pipeline de ventas"
        subtitle="Gestiona oportunidades en kanban o tabla, con actividades, cotizaciones y cierres."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        panelToggleLabel="Ocultar Panel lateral derecho"
        panelToggleLabelHidden="Mostrar Panel lateral derecho"
        showDateRange
        showFiltersButton
        hideHelp
        notificationCount={0}
        actionLabel="Nueva oportunidad"
        onActionClick={() => setNuevaVentaOpen(true)}
      />

      <NuevaVentaModal open={nuevaVentaOpen} onOpenChange={setNuevaVentaOpen} />
      <PipelineProspectDetailSheet
        codigo={prospectDetailCodigo}
        open={prospectDetailOpen}
        onOpenChange={setProspectDetailOpen}
        userId={user?.id}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {totalRecords} oportunidades sincronizadas
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <CrmKpiCard key={kpi.label} {...kpi} />
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("kanban")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
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
                      onClick={() => setViewMode("tabla")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
                        viewMode === "tabla"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                      Tabla
                    </button>
                  </div>

                  {viewMode === "kanban" ? (
                    <>
                      <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-xs text-slate-600">
                        Equipo: Todos
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-xs text-slate-600">
                        Responsable: Todos
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
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
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {viewMode === "tabla" && (
                    <>
                      <button type="button" className="app-toolbar-link">
                        <Star className="h-3.5 w-3.5" />
                        Guardar vista
                      </button>
                      <button type="button" className="app-toolbar-link">
                        <Filter className="h-3.5 w-3.5" />
                        Más filtros
                      </button>
                    </>
                  )}
                  <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={
                        viewMode === "kanban"
                          ? "Buscar oportunidad, cliente o empresa..."
                          : "Buscar por cliente, vendedor, oportunidad..."
                      }
                      className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                </div>
              </div>

              {viewMode === "tabla" && (
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
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
              )}

              {viewMode === "kanban" ? (
                isLoading ? (
                  <div className="flex items-center justify-center py-20 text-[11px] text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Cargando pipeline...
                  </div>
                ) : (
                  <div className="overflow-x-auto p-4">
                    <div className="flex h-[min(520px,calc(100vh-16rem))] gap-3">
                      {pipelineColumns.map((column) => (
                        <div
                          key={column.id}
                          className={cn(
                            "flex w-[236px] shrink-0 flex-col rounded-xl border border-slate-200 border-t-[3px] bg-slate-50/60",
                            column.borderColor,
                          )}
                        >
                          <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className={cn("text-sm font-bold", column.headerColor)}>{column.title}</h3>
                              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", column.badgeBg)}>
                                {column.count}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                              {formatPipelineCurrency(column.totalValue)}
                            </p>
                          </div>

                          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-2">
                            {column.cards.map((card) => (
                              <PipelineKanbanCard
                                key={card.id}
                                card={card}
                                onSelect={openProspectDetail}
                              />
                            ))}
                          </div>

                          {column.moreCount > 0 && (
                            <button
                              type="button"
                              className="border-t border-slate-100 px-3 py-2.5 text-left text-xs font-semibold text-blue-600 hover:text-blue-500"
                            >
                              + {column.moreCount} oportunidades más
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-xs sm:min-w-[980px]">
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
                            <tr
                              key={item.id}
                              className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/60"
                              onClick={() => openProspectDetail(item.id)}
                            >
                              <td className="app-table-cell">
                                <p className="font-medium text-slate-800">{item.date}</p>
                                <p className="text-xs text-slate-400">{item.time}</p>
                              </td>
                              <td className="app-table-cell">
                                <span className="font-semibold text-blue-600">{item.id}</span>
                              </td>
                              <td className="app-table-cell">
                                <p className="font-medium text-slate-800">{item.client}</p>
                                <p className="text-xs text-slate-400">RUC {item.ruc}</p>
                              </td>
                              <td className="app-table-cell">
                                <p className="font-medium text-slate-800">{item.title}</p>
                                <p className="text-xs text-slate-400">{item.subtitle}</p>
                              </td>
                              <td className="app-table-cell font-semibold text-slate-900">
                                {formatCurrency(item.value)}
                              </td>
                              <td className="app-table-cell">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                                    getStageStyles(item.stage),
                                  )}
                                >
                                  {item.stage}
                                </span>
                              </td>
                              <td className="app-table-cell">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                                    getProbabilityStyles(item.probability),
                                  )}
                                >
                                  {item.probability}%
                                </span>
                              </td>
                              <td className="app-table-cell">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                                      {item.ownerInitials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-slate-700">{item.owner}</span>
                                </div>
                              </td>
                              <td className="app-table-cell text-right">
                                <button
                                  type="button"
                                  onClick={(event) => event.stopPropagation()}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                  aria-label="Más acciones"
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

                  <AppTablePagination
                    shownCount={filteredOpportunities.length}
                    totalCount={totalRecords}
                  />
                </>
              )}
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          {viewMode === "kanban" ? <PipelineRightPanel snapshot={snapshot} /> : <CrmRightPanel />}
        </AppRightPanelSlot>
      </div>
    </div>
  );
}
