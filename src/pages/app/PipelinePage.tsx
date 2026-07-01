import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  PanelRightClose,
  Search,
} from "lucide-react";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { PipelineRightPanel } from "@/components/app/PipelineRightPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCrm } from "@/hooks/useCrm";
import { formatPipelineCurrency } from "@/lib/crm/crm-service";
import type { PipelineCard } from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "lista";

function PipelineKanbanCard({ card }: { card: PipelineCard }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {card.statusBadge && (
            <span
              className={cn(
                "mb-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                card.statusBadge === "Ganada"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {card.statusBadge}
            </span>
          )}
          <p className="text-xs font-semibold leading-snug text-slate-900">{card.title}</p>
          <p className="mt-1 text-[11px] text-slate-500">{card.company}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Más acciones"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-sm font-bold text-blue-600">{formatPipelineCurrency(card.value)}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-slate-500">{card.owner}</span>
        <span
          className={cn(
            "shrink-0 text-[11px] font-medium",
            card.dueDateUrgent ? "text-red-500" : "text-slate-400",
          )}
        >
          {card.dueDate}
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
            {card.ownerInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </article>
  );
}

export default function PipelinePage() {
  const {
    snapshot,
    filteredPipelineCards,
    search,
    setSearch,
    isLoading,
  } = useCrm();
  const [panelHidden, setPanelHidden] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const pipelineColumns = snapshot?.pipelineColumns ?? [];
  const filteredList = filteredPipelineCards;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Pipeline de ventas"
        subtitle="Visualiza y gestiona todas tus oportunidades comerciales."
        showPanelToggle
        panelHidden={panelHidden}
        onTogglePanel={() => setPanelHidden((current) => !current)}
        panelToggleLabel="Ocultar Panel lateral derecho"
        panelToggleLabelHidden="Mostrar Panel lateral derecho"
        showDateRange
        showFiltersButton
        hideHelp
        notificationCount={0}
        actionLabel="Nueva oportunidad"
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} oportunidades en pipeline
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(snapshot?.pipelineKpis ?? []).map((kpi) => (
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
                      onClick={() => setViewMode("lista")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
                        viewMode === "lista"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                      Lista
                    </button>
                  </div>

                  <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-xs text-slate-600">
                    Equipo: Todos
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-xs text-slate-600">
                    Responsable: Todos
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar oportunidad, cliente o empresa..."
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              {viewMode === "kanban" ? (
                isLoading ? (
                  <div className="flex items-center justify-center py-20 text-sm text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Cargando pipeline...
                  </div>
                ) : (
                <div className="overflow-x-auto p-4">
                  <div className="flex min-h-[520px] gap-3">
                    {pipelineColumns.map((column) => (
                      <div
                        key={column.id}
                        className={cn(
                          "flex w-[260px] shrink-0 flex-col rounded-xl border border-slate-200 border-t-[3px] bg-slate-50/60",
                          column.borderColor,
                        )}
                      >
                        <div className="border-b border-slate-100 px-3 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className={cn("text-sm font-bold", column.headerColor)}>{column.title}</h3>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                column.badgeBg,
                              )}
                            >
                              {column.count}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-slate-500">
                            {formatPipelineCurrency(column.totalValue)}
                          </p>
                        </div>

                        <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
                          {column.cards.map((card) => (
                            <PipelineKanbanCard key={card.id} card={card} />
                          ))}
                        </div>

                        <button
                          type="button"
                          className="border-t border-slate-100 px-3 py-2.5 text-left text-xs font-semibold text-blue-600 hover:text-blue-500"
                        >
                          + {column.moreCount} oportunidades más
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-2.5">Oportunidad</th>
                        <th className="px-4 py-2.5">Empresa</th>
                        <th className="px-4 py-2.5">Etapa</th>
                        <th className="px-4 py-2.5">Valor</th>
                        <th className="px-4 py-2.5">Responsable</th>
                        <th className="px-4 py-2.5">Cierre</th>
                        <th className="px-4 py-2.5 text-right" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{item.title}</p>
                            <p className="text-[10px] text-blue-600">{item.id}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{item.company}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {item.stage}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {formatPipelineCurrency(item.value)}
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
                          <td
                            className={cn(
                              "px-4 py-3 font-medium",
                              item.dueDateUrgent ? "text-red-500" : "text-slate-500",
                            )}
                          >
                            {item.dueDate}
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
              )}
            </section>

            {!panelHidden && (
              <div className="xl:hidden">
                <PipelineRightPanel className="w-full rounded-xl border border-slate-200" />
              </div>
            )}
          </div>
        </div>

        {!panelHidden && (
          <div className="relative hidden shrink-0 xl:block">
            <PipelineRightPanel />
            <button
              type="button"
              onClick={() => setPanelHidden(true)}
              className="absolute left-0 top-4 z-10 flex -translate-x-full items-center gap-1.5 rounded-l-lg border border-r-0 border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Ocultar Panel lateral derecho"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
              Ocultar
            </button>
          </div>
        )}
      </div>

      {panelHidden && (
        <button
          type="button"
          onClick={() => setPanelHidden(false)}
          className="fixed bottom-6 right-6 z-20 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-lg hover:bg-slate-50 xl:inline-flex"
        >
          <PanelRightClose className="h-4 w-4" />
          Mostrar Panel lateral derecho
        </button>
      )}

      <div className="border-t border-slate-100 bg-white px-6 py-2 text-center text-xs text-slate-400 xl:hidden">
        <Link to="/app/ventas-crm" className="font-medium text-blue-600 hover:text-blue-500">
          Ver vista completa en Leads
        </Link>
      </div>
    </div>
  );
}
