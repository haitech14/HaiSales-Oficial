import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  Copy,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { CrmTipoClienteFilter } from "@/components/app/crm/CrmTipoClienteFilter";
import { CrmResumenPanel } from "@/components/app/crm/CrmResumenPanel";
import { CrmViewBar } from "@/components/app/crm/CrmViewBar";
import { PipelineKanbanBoard } from "@/components/app/crm/PipelineKanbanBoard";
import { ModuleFab } from "@/components/app/module-shell/ModuleFab";
import { ModulePageHeader } from "@/components/app/module-shell/ModulePageHeader";
import { NuevoProspectoModal } from "@/components/app/NuevoProspectoModal";
import { PipelineInboxView } from "@/components/app/PipelineInboxView";
import { PipelineProspectDetailSheet } from "@/components/app/PipelineProspectDetailSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useAccionQueryParam } from "@/hooks/useAccionQueryParam";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { useCrm } from "@/hooks/useCrm";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import type { Opportunity } from "@/lib/crm-mock-data";
import { pickHumanContactName } from "@/lib/crm/contact-display-name";
import {
  formatCurrency,
  getProbabilityStyles,
  getStageStyles,
  pipelineTabs,
  type CreateOportunidadInput,
  buildCrmSnapshotFromOpportunities,
  CRM_TIPO_CLIENTE_FILTERS,
  CRM_FUENTE_FILTERS,
  matchesCrmTipoClienteFilter,
  matchesCrmFuenteFilter,
  OPPORTUNITY_STAGE_LABELS,
} from "@/lib/crm/crm-service";
import { MODULE_PAGE_BG } from "@/lib/module-page-theme";
import type { PipelineCard, PipelineColumn, PipelineStage } from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "kanban" | "tabla";

function opportunityToPreview(item: Opportunity): PipelineCard {
  const socialBadge = item.id.startsWith("WA-") ? "WhatsApp" as const : undefined;
  return {
    id: item.id,
    title: item.stage === "Prospectos" ? (item.contactPhone && !pickHumanContactName(item.client) ? item.contactPhone : item.client) : item.title,
    company: item.subtitle || item.client,
    value: item.value,
    owner: item.owner,
    ownerInitials: item.ownerInitials,
    dueDate: item.date,
    intereses: item.intereses,
    ciudad: item.ciudad,
    tipoCliente: item.tipoCliente,
    lastMessage: item.lastMessage,
    lastContactAt: item.lastContactAt,
    contactPhone: item.contactPhone,
    contactName: pickHumanContactName(item.client) || undefined,
    statusBadge: socialBadge,
  };
}

function filterPipelineColumns(
  columns: PipelineColumn[],
  query: string,
  tipoFilter: string,
  fuenteFilter: string,
): PipelineColumn[] {
  const normalized = query.trim().toLowerCase();

  return columns.map((column) => {
    const cards = column.cards.filter((card) => {
      const matchesTipo = matchesCrmTipoClienteFilter(card.tipoClienteKey, tipoFilter);
      const matchesFuente = matchesCrmFuenteFilter(card.fuenteKey, fuenteFilter);
      if (!matchesTipo || !matchesFuente) return false;
      if (!normalized) return true;
      return (
        card.title.toLowerCase().includes(normalized) ||
        card.company.toLowerCase().includes(normalized) ||
        card.owner.toLowerCase().includes(normalized) ||
        card.id.toLowerCase().includes(normalized) ||
        (card.tipoCliente ?? "").toLowerCase().includes(normalized) ||
        (card.lastMessage ?? "").toLowerCase().includes(normalized) ||
        (card.contactPhone ?? "").toLowerCase().includes(normalized)
      );
    });
    const totalValue = cards.reduce((sum, card) => sum + card.value, 0);
    return { ...column, cards, count: cards.length, totalValue };
  });
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
    tipoClienteFilter,
    setTipoClienteFilter,
    fuenteFilter,
    setFuenteFilter,
    isLoading,
    isFetching,
    refresh,
    createOportunidad,
    isCreatingOportunidad,
    moveCard,
    removeCard,
    duplicateCard,
    patchCard,
    updateCard,
  } = useCrm();
  useSearchQueryParam(setSearch);
  const { isPanelVisible } = useAppRightPanel();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [prospectDetailCodigo, setProspectDetailCodigo] = useState<string | null>(null);
  const [prospectDetailPreview, setProspectDetailPreview] = useState<PipelineCard | null>(null);
  const [prospectDetailOpen, setProspectDetailOpen] = useState(false);
  const [nuevoProspectoOpen, setNuevoProspectoOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Opportunity | PipelineCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const findOpportunity = useCallback(
    (codigo: string) =>
      snapshot?.opportunities.find((item) => item.id === codigo) ??
      filteredOpportunities.find((item) => item.id === codigo) ??
      null,
    [filteredOpportunities, snapshot?.opportunities],
  );

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
    setEditingOpportunity(null);
    setCrmView("pipeline");
    setNuevoProspectoOpen(true);
  }, [setCrmView]);

  const openEditOpportunity = useCallback(
    (codigo: string) => {
      const opportunity = findOpportunity(codigo);
      if (!opportunity) {
        toast.error("No se encontró la oportunidad");
        return;
      }
      setEditingOpportunity(opportunity);
      setNuevoProspectoOpen(true);
    },
    [findOpportunity],
  );

  const handleSubmitOportunidad = useCallback(
    async (input: CreateOportunidadInput) => {
      if (!user?.id || isSaving || isCreatingOportunidad) return;

      setIsSaving(true);
      try {
        if (editingOpportunity) {
          await updateCard(editingOpportunity.id, input);
          toast.success("Oportunidad actualizada");
          setEditingOpportunity(null);
          return;
        }
        await createOportunidad(input);
        toast.success("Oportunidad creada");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo guardar la oportunidad");
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [createOportunidad, editingOpportunity, isCreatingOportunidad, isSaving, updateCard, user?.id],
  );

  const handlePatchCard = useCallback(
    async (
      card: PipelineCard,
      patch: { title?: string; value?: number; owner?: string; ownerInitials?: string; tipoCliente?: string },
    ) => {
      try {
        if (patch.tipoCliente) {
          await patchCard(card.id, { tipoCliente: patch.tipoCliente });
          toast.success("Tipo de cliente actualizado");
          return;
        }
        await patchCard(card.id, {
          ...(patch.title
            ? { clienteNombre: patch.title, titulo: patch.title }
            : {}),
          ...(patch.value != null ? { valor: patch.value } : {}),
          ...(patch.owner
            ? { responsableNombre: patch.owner, responsableIniciales: patch.ownerInitials }
            : {}),
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo guardar el cambio");
      }
    },
    [patchCard],
  );

  const handleMoveCard = useCallback(
    async (codigo: string, stage: PipelineStage) => {
      try {
        await moveCard(codigo, stage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo mover la oportunidad");
      }
    },
    [moveCard],
  );

  const handleDuplicateCard = useCallback(
    async (codigo: string) => {
      try {
        await duplicateCard(codigo);
        toast.success("Oportunidad duplicada");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo duplicar la oportunidad");
      }
    },
    [duplicateCard],
  );

  const handleDeleteById = useCallback(
    async (codigo: string) => {
      try {
        await removeCard(codigo);
        toast.success("Oportunidad eliminada");
        setPendingDelete(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo eliminar la oportunidad");
      }
    },
    [removeCard],
  );

  useAccionQueryParam("nueva", openNuevoProspecto);

  const tipoClienteCounts = useMemo(() => {
    const cards = snapshot?.pipelineColumns.flatMap((column) => column.cards) ?? [];
    const counts: Record<string, number> = {};
    for (const tab of CRM_TIPO_CLIENTE_FILTERS) {
      counts[tab.id] =
        tab.id === "todos"
          ? cards.length
          : cards.filter((card) => matchesCrmTipoClienteFilter(card.tipoClienteKey, tab.id)).length;
    }
    return counts;
  }, [snapshot?.pipelineColumns]);

  const fuenteCounts = useMemo(() => {
    const cards = snapshot?.pipelineColumns.flatMap((column) => column.cards) ?? [];
    const counts: Record<string, number> = {};
    for (const tab of CRM_FUENTE_FILTERS) {
      counts[tab.id] =
        tab.id === "todas"
          ? cards.length
          : cards.filter((card) => matchesCrmFuenteFilter(card.fuenteKey, tab.id)).length;
    }
    return counts;
  }, [snapshot?.pipelineColumns]);

  const pipelineColumns = useMemo(
    () =>
      filterPipelineColumns(
        snapshot?.pipelineColumns ?? buildCrmSnapshotFromOpportunities([]).pipelineColumns,
        search,
        tipoClienteFilter,
        fuenteFilter,
      ),
    [search, snapshot?.pipelineColumns, tipoClienteFilter, fuenteFilter],
  );
  const tabsWithCounts = pipelineTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));
  const totalRecords = snapshot?.totalRecords ?? 0;

  return (
    <div className="relative flex h-full max-h-full min-h-0 flex-1 flex-col overflow-hidden" style={{ backgroundColor: MODULE_PAGE_BG }}>
      <ModulePageHeader
        title="CRM"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar..."
        showDateNav={false}
        showSearchField
      />

      <PipelineProspectDetailSheet
        codigo={prospectDetailCodigo}
        preview={prospectDetailPreview}
        open={prospectDetailOpen}
        onOpenChange={setProspectDetailOpen}
        onEdit={(codigo) => {
          setProspectDetailOpen(false);
          openEditOpportunity(codigo);
        }}
        userId={user?.id}
      />

      <NuevoProspectoModal
        open={nuevoProspectoOpen}
        onOpenChange={(open) => {
          setNuevoProspectoOpen(open);
          if (!open) setEditingOpportunity(null);
        }}
        onSubmit={handleSubmitOportunidad}
        isSubmitting={isSaving || isCreatingOportunidad}
        opportunity={editingOpportunity}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar oportunidad</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar {pendingDelete?.title}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              onClick={() => pendingDelete && void handleDeleteById(pendingDelete.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 pt-2 sm:px-6",
          !isConversacionesView && "xl:flex-row",
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <CrmViewBar
            activeView={isConversacionesView ? "conversaciones" : "pipeline"}
            onViewChange={setCrmView}
            className="mb-4 shrink-0"
          />

          {isConversacionesView ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <PipelineInboxView />
            </div>
          ) : (
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("kanban")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                        viewMode === "kanban"
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Kanban
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("tabla")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                        viewMode === "tabla"
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                      Tabla
                    </button>
                  </div>

                  <CrmTipoClienteFilter
                    value={tipoClienteFilter}
                    onChange={setTipoClienteFilter}
                    counts={tipoClienteCounts}
                    fuenteValue={fuenteFilter}
                    onFuenteChange={setFuenteFilter}
                    fuenteCounts={fuenteCounts}
                  />

                  {viewMode === "tabla" ? (
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
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {viewMode === "kanban" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full border-slate-200 px-3 text-xs font-medium text-slate-600"
                      >
                        Equipo: Todos
                        <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full border-slate-200 px-3 text-xs font-medium text-slate-600"
                      >
                        Responsable: Todos
                        <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
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
                <PipelineKanbanBoard
                  columns={pipelineColumns}
                  isLoading={isLoading}
                  onSelectCard={(card) => openProspectDetail(card.id, card)}
                  onMoveCard={(codigo, stage) => void handleMoveCard(codigo, stage)}
                  onEditCard={(card) => openEditOpportunity(card.id)}
                  onDuplicateCard={(card) => void handleDuplicateCard(card.id)}
                  onDeleteCard={(card) => void handleDeleteById(card.id)}
                  onPatchCard={(card, patch) => void handlePatchCard(card, patch)}
                />
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[720px] text-left text-xs sm:min-w-[980px]">
                      <thead>
                        <tr className="app-table-head-row">
                          <th className="px-4 py-2.5">Fecha</th>
                          <th className="px-4 py-2.5">Código</th>
                          <th className="px-4 py-2.5">Cliente</th>
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
                            <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                              Cargando oportunidades...
                            </td>
                          </tr>
                        ) : (
                          filteredOpportunities.map((item) => (
                            <tr
                              key={item.id}
                              className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/60"
                              onClick={() => openProspectDetail(item.id, opportunityToPreview(item))}
                            >
                              <td className="app-table-cell">
                                <p className="font-medium text-slate-800">{item.date}</p>
                              </td>
                              <td className="app-table-cell">
                                <span className="font-semibold text-blue-600">{item.id}</span>
                              </td>
                              <td className="app-table-cell">
                                <p className="font-medium text-slate-800">{item.client}</p>
                                <p className="text-xs text-slate-400">RUC {item.ruc}</p>
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
                                  {OPPORTUNITY_STAGE_LABELS[item.stage] ?? item.stage}
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(event) => event.stopPropagation()}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                      aria-label="Más acciones"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-40"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <DropdownMenuItem
                                      onSelect={() => openEditOpportunity(item.id)}
                                    >
                                      <Pencil className="mr-2 h-3.5 w-3.5" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => void handleDuplicateCard(item.id)}>
                                      <Copy className="mr-2 h-3.5 w-3.5" />
                                      Duplicar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onSelect={() => setPendingDelete(item)}
                                    >
                                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
