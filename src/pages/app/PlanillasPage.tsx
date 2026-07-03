import { useState } from "react";
import {
  Banknote,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { NuevoTrabajadorModal } from "@/components/app/NuevoTrabajadorModal";
import { PlanillasRightPanel } from "@/components/app/PlanillasRightPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePlanillas } from "@/hooks/usePlanillas";
import {
  formatSalary,
  getAttendancePercent,
  getAttendanceStyles,
  getWorkerStatusStyles,
} from "@/lib/planillas/planillas-service";
import { planillasTabs } from "@/lib/planillas-mock-data";
import { cn } from "@/lib/utils";

const kpiIcons = [UserRound, Banknote, Clock, Wallet];

export default function PlanillasPage() {
  const {
    snapshot,
    filteredWorkers,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    validateDni,
    isValidatingDni,
    submitNewTrabajador,
    isCreatingTrabajador,
  } = usePlanillas();

  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const [nuevoTrabajadorOpen, setNuevoTrabajadorOpen] = useState(false);

  const tabsWithCounts = planillasTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));

  const totalRecords = snapshot?.totalRecords ?? filteredWorkers.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Planillas"
        subtitle="Administra trabajadores, asistencia, remuneraciones, beneficios y obligaciones laborales."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        actionLabel="Nuevo trabajador"
        showActionDropdown
        onActionClick={() => setNuevoTrabajadorOpen(true)}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} trabajadores sincronizados
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(snapshot?.kpis ?? []).map((kpi, index) => {
                const Icon = kpiIcons[index];
                return (
                  <CrmKpiCard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                    change={kpi.change}
                    sparkColor={kpi.sparkColor}
                    sparkPoints={kpi.sparkPoints}
                    changePositive={kpi.changePositive}
                    icon={Icon}
                    iconBg={kpi.iconBg}
                    iconColor={kpi.iconColor}
                  />
                );
              })}
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
                            "app-tab-badge",
                            activeTab === tab.id
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {tab.count.toLocaleString("es-PE")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <button
                    type="button"
                    className="app-toolbar-link"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Guardar vista
                  </button>
                  <button
                    type="button"
                    className="app-toolbar-link"
                  >
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
                    placeholder="Buscar por trabajador, DNI, cargo, área..."
                    className="app-search-input pl-9 pr-3"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Área: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Periodo: Junio 2026
                </Button>
                <button
                  type="button"
                  onClick={() => refresh()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
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
                      <th className="app-table-cell">Trabajador</th>
                      <th className="app-table-cell">DNI</th>
                      <th className="app-table-cell">Cargo</th>
                      <th className="app-table-cell">Área</th>
                      <th className="app-table-cell">Sueldo</th>
                      <th className="app-table-cell">Asistencia</th>
                      <th className="app-table-cell">Estado</th>
                      <th className="app-table-cell">Responsable</th>
                      <th className="app-table-cell text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                          Cargando trabajadores...
                        </td>
                      </tr>
                    ) : filteredWorkers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          No se encontraron trabajadores con los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                      filteredWorkers.map((worker) => {
                        const attendancePercent = getAttendancePercent(
                          worker.asistenciaDias,
                          worker.asistenciaTotal,
                        );

                        return (
                          <tr
                            key={worker.dbId ?? worker.id}
                            className="border-b border-slate-100 transition hover:bg-slate-50/60"
                          >
                            <td className="app-table-cell">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback
                                    className={cn(
                                      "text-[10px] font-semibold",
                                      worker.avatarBg,
                                      worker.avatarColor,
                                    )}
                                  >
                                    {worker.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-slate-800">{worker.nombre}</p>
                                  <p className="text-xs text-slate-400">{worker.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="app-table-cell text-slate-600">{worker.dni}</td>
                            <td className="app-table-cell text-slate-700">{worker.cargo}</td>
                            <td className="app-table-cell text-slate-600">{worker.area}</td>
                            <td className="app-table-cell font-medium text-slate-800">
                              {formatSalary(worker.sueldo)}
                            </td>
                            <td className="app-table-cell">
                              <p className="font-medium text-slate-800">
                                {worker.asistenciaDias}/{worker.asistenciaTotal}
                              </p>
                              <p className={cn("text-xs font-medium", getAttendanceStyles(attendancePercent))}>
                                {attendancePercent}%
                              </p>
                            </td>
                            <td className="app-table-cell">
                              <span
                                className={cn(
                                  "app-table-badge inline-flex rounded-full border",
                                  getWorkerStatusStyles(worker.estado),
                                )}
                              >
                                {worker.estado}
                              </span>
                            </td>
                            <td className="app-table-cell text-slate-700">{worker.responsable}</td>
                            <td className="app-table-cell text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50"
                                  aria-label="Ver boleta"
                                >
                                  <FileText className="h-4 w-4" />
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
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <AppTablePagination shownCount={filteredWorkers.length} totalCount={totalRecords} />
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <PlanillasRightPanel snapshot={snapshot} />
        </AppRightPanelSlot>
      </div>

      <NuevoTrabajadorModal
        open={nuevoTrabajadorOpen}
        onOpenChange={setNuevoTrabajadorOpen}
        onSubmit={submitNewTrabajador}
        onValidateDni={validateDni}
        isSubmitting={isCreatingTrabajador}
        isValidatingDni={isValidatingDni}
      />
    </div>
  );
}
