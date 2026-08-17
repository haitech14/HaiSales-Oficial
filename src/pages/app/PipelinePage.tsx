import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Star,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { CrmResumenPanel } from "@/components/app/crm/CrmResumenPanel";
import { CrmViewBar } from "@/components/app/crm/CrmViewBar";
import { ModuleFab } from "@/components/app/module-shell/ModuleFab";
import { ModulePageHeader } from "@/components/app/module-shell/ModulePageHeader";
import { NuevoProspectoModal } from "@/components/app/NuevoProspectoModal";
import { PipelineInboxView } from "@/components/app/PipelineInboxView";
import { PipelineProspectDetailSheet } from "@/components/app/PipelineProspectDetailSheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAccionQueryParam } from "@/hooks/useAccionQueryParam";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { useCrm } from "@/hooks/useCrm";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import {
  formatCurrency,
  formatPipelineCurrency,
  getProbabilityStyles,
  getStageStyles,
  pipelineTabs,
  type CreateOportunidadInput,
} from "@/lib/crm/crm-service";
import { MODULE_PAGE_BG } from "@/lib/module-page-theme";
import type { PipelineCard } from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          {card.statusBadge && (
            <span
              className={cn(
                "mb-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
                card.statusBadge === "Ganada"
                  ? "bg-emerald-100 text-emerald-700"
                  : card.statusBadge === "WhatsApp"
                    ? "bg-green-100 text-green-700"
                    : card.statusBadge === "Facebook"
                      ? "bg-blue-100 text-blue-700"
                      : card.statusBadge === "Instagram"
                        ? "bg-pink-100 text-pink-700"
                        : "bg-slate-100 text-slate-600",
              )}
            >
              {card.statusBadge}
            </span>
          )}
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{card.title}</p>
          {card.intereses || card.ciudad ? (
            <div className="mt-0.5 space-y-0.5">
              {card.intereses && (
                <p className="line-clamp-2 text-xs leading-snug text-slate-600">{card.intereses}</p>
              )}
              {card.ciudad && (
                <p className="line-clamp-1 text-xs leading-snug text-slate-400">{card.ciudad}</p>
              )}
            </div>
          ) : (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">{card.company}</p>
          )}
        </div>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Mùs acciones"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-blue-600">{formatPipelineCurrency(card.value)}</p>
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-blue-100 text-[10px] font-semibold text-blue-700">
            {card.ownerInitials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const isConversacionesView = searchParams.get("vista") === "conversaciones";
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
    createOportunidad,
    isCreatingOportunidad,
  } = useCrm();
  useSearchQueryParam(setSearch);
  const { togglePanel, isPanelVisible } = useAppRightPanel();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [prospectDetailCodigo, setProspectDetailCodigo] = useState<string | null>(null);
  const [prospectDetailPreview, setProspectDetailPreview] = useState<PipelineCard | null>(null);
  const [prospectDetailOpen, setProspectDetailOpen] = useState(false);
  const [nuevoProspectoOpen, setNuevoProspectoOpen] = useState(false);

  const openProspectDetail = useCallback((codigo: string, preview?: PipelineCard) => {
    setProspectDetailCodigo(codigo);
    setProspectDetailPreview(preview ?? null);
    setProspectDetailOpen(true);
  }, []);

  const setCrmView = useCallback(
    (view: "pipeline" | "conversaciones") => {
      const next = new URLSearchParams(searchParams);
      if (view === "conversaciones") {
        next.set("vista", "conversaciones");
      } else {
        next.delete("vista");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openNuevoProspecto = useCallback(() => {
    setCrmView("pipeline");
    setNuevoProspectoOpen(true);
  }, [setCrmView]);

  const handleCrearOportunidad = useCallback(
    async (input: CreateOportunidadInput) => {
      if (!user?.id || isCreatingOportunidad) return;

      try {
        const opportunity = await createOportunidad(input);
        openProspectDetail(opportunity.id, {
          id: opportunity.id,
          title: opportunity.client,
          company: opportunity.subtitle || opportunity.title,
          value: opportunity.value,
          owner: opportunity.owner,
          ownerInitials: opportunity.ownerInitials,
          dueDate: opportunity.date,
        });
        toast.success("Oportunidad creada");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo crear la oportunidad");
        throw error;
      }
    },
    [createOportunidad, isCreatingOportunidad, openProspectDetail, user?.id],
  );

  useAccionQueryParam("nueva", openNuevoProspecto);

  const pipelineColumns = snapshot?.pipelineColumns ?? [];
  const tabsWithCounts = pipelineTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));
  const totalRecords = snapshot?.totalRecords ?? 0;

  return (
    <div className="relative flex min-h-full flex-col" style={{ backgroundColor: MODULE_PAGE_BG }}>
      <ModulePageHeader
        title="CRM"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar oportunidad, cliente..."
        showDateNav={false}
        onToggleResumen={togglePanel}
        resumenOpen={isPanelVisible}
      />

      <PipelineProspectDetailSheet
        codigo={prospectDetailCodigo}
        preview={prospectDetailPreview}
        open={prospectDetailOpen}
        onOpenChange={setProspectDetailOpen}
        userId={user?.id}
      />

      <NuevoProspectoModal
        open={nuevoProspectoOpen}
        onOpenChange={setNuevoProspectoOpen}
        onSubmit={handleCrearOportunidad}
        isSubmitting={isCreatingOportunidad}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 pb-24 pt-2 sm:px-6 xl:flex-row xl:items-start xl:pb-6">
        <div className="min-w-0 flex-1">
          <CrmViewBar
            activeView={isConversacionesView ? "conversaciones" : "pipeline"}
            onViewChange={setCrmView}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            className="mb-4"
          />

          {isConversacionesView ? (
            <div className="min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <PipelineInboxView />
            </div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                        Mùs filtros
                      </button>
                    </>
                  )}
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
                    <div className="flex h-[min(600px,calc(100vh-15rem))] gap-3">
                      {pipelineColumns.map((column) => (
                        <div
                          key={column.id}
                          className={cn(
                            "flex w-[280px] shrink-0 flex-col rounded-xl border border-slate-200 border-t-[3px] bg-slate-50/60",
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
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              {formatPipelineCurrency(column.totalValue)}
                            </p>
                          </div>

                          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-2.5">
                            {column.cards.map((card) => (
                              <PipelineKanbanCard
                                key={card.id}
                                card={card}
                                onSelect={(id) => openProspectDetail(id, card)}
                              />
                            ))}
                          </div>

                          {column.moreCount > 0 && (
                            <button
                              type="button"
                              className="border-t border-slate-100 px-3 py-2.5 text-left text-xs font-semibold text-blue-600 hover:text-blue-500"
                            >
                              + {column.moreCount} oportunidades m·s
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
                          <th className="px-4 py-2.5 text-right">Acciùn</th>
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
                              onClick={() =>
                                openProspectDetail(item.id, {
                                  id: item.id,
                                  title: item.stage === "Prospectos" ? item.client : item.title,
                                  company: item.subtitle || item.client,
                                  value: item.value,
                                  owner: item.owner,
                                  ownerInitials: item.ownerInitials,
                                  dueDate: item.date,
                                  intereses: item.intereses,
                                  ciudad: item.ciudad,
                                })
                              }
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
                                  aria-label="Mùs acciones"
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
          )}
        </div>

        {!isConversacionesView && isPanelVisible ? (
          <CrmResumenPanel snapshot={snapshot} className="xl:sticky xl:top-4" />
        ) : null}
      </div>

      {!isConversacionesView && (
        <ModuleFab
          onClick={openNuevoProspecto}
          label="NUEVO"
        />
      )}
    </div>
  );
}
