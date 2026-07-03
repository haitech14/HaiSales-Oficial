import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { CajaBancosRightPanel } from "@/components/app/CajaBancosRightPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCajaBancos } from "@/hooks/useCajaBancos";
import {
  cajaBancosTabs,
  formatCajaAmount,
  getMovimientoEstadoStyles,
  type MovimientoTipo,
} from "@/lib/caja-bancos/caja-bancos-service";
import { cn } from "@/lib/utils";
import { formatPeriodMonth } from "@/lib/ventas-mock-data";

function OperacionBadge({ tipo }: { tipo: MovimientoTipo }) {
  const config = {
    ingreso: {
      label: "Ingreso",
      icon: ArrowUpRight,
      className: "text-emerald-600 bg-emerald-50",
    },
    egreso: {
      label: "Egreso",
      icon: ArrowDownLeft,
      className: "text-red-600 bg-red-50",
    },
    transferencia: {
      label: "Transferencia",
      icon: ArrowLeftRight,
      className: "text-blue-600 bg-blue-50",
    },
  }[tipo];

  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold", config.className)}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {config.label}
    </span>
  );
}

export default function CajaBancosPage() {
  const {
    snapshot,
    filteredRecords,
    availableMonths,
    availableCuentas,
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    selectedCuenta,
    setSelectedCuenta,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
  } = useCajaBancos();
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();

  const kpis = snapshot?.kpis ?? [];
  const tabs = cajaBancosTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Caja y Bancos"
        subtitle="Controla ingresos, egresos, transferencias, conciliaciones y saldos por cuenta."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        panelToggleLabel="Ocultar Panel lateral derecho"
        panelToggleLabelHidden="Mostrar Panel lateral derecho"
        showDateRange
        showFiltersButton
        filtersButtonLabel="Ocultar filtros"
        actionLabel="Nuevo movimiento"
        showActionDropdown
      />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
            {snapshot?.source === "supabase" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                Datos en vivo desde Supabase
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <CrmKpiCard key={kpi.label} {...kpi} />
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 pt-3">
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {tabs.map((tab) => (
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
                  <button type="button" className="app-toolbar-link">
                    <Star className="h-3.5 w-3.5" />
                    Guardar vista
                  </button>
                  <button type="button" className="app-toolbar-link">
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
                    placeholder="Buscar por concepto, cuenta, documento..."
                    className="app-search-input pl-9 pr-3"
                  />
                </div>
                <div className="relative">
                  <select
                    value={selectedCuenta}
                    onChange={(event) => setSelectedCuenta(event.target.value)}
                    className="h-9 max-w-[220px] appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700"
                  >
                    <option value="todos">Cuenta: Todas</option>
                    {availableCuentas.map((cuenta) => (
                      <option key={cuenta} value={cuenta}>
                        {cuenta}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700"
                  >
                    <option value="todos">Mes: Todos</option>
                    {availableMonths.map((month) => (
                      <option key={month} value={month}>
                        {formatPeriodMonth(month)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Actualizar"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs sm:min-w-[1200px]">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="px-4 py-2.5">Fecha</th>
                      <th className="px-4 py-2.5">Operación</th>
                      <th className="px-4 py-2.5">Cuenta</th>
                      <th className="px-4 py-2.5">Documento</th>
                      <th className="px-4 py-2.5">Concepto</th>
                      <th className="px-4 py-2.5">Ingreso</th>
                      <th className="px-4 py-2.5">Egreso</th>
                      <th className="px-4 py-2.5">Saldo</th>
                      <th className="px-4 py-2.5">Responsable</th>
                      <th className="px-4 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                        <td className="app-table-cell">
                          <p className="font-medium text-slate-800">{item.date}</p>
                          <p className="text-xs text-slate-400">{item.time}</p>
                        </td>
                        <td className="app-table-cell">
                          <OperacionBadge tipo={item.tipo} />
                        </td>
                        <td className="app-table-cell">
                          <p className="font-medium text-slate-800">{item.cuenta}</p>
                          <p className="text-xs text-slate-400">{item.cuentaNumero}</p>
                        </td>
                        <td className="app-table-cell">
                          <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                            {item.documento}
                          </a>
                        </td>
                        <td className="app-table-cell max-w-[200px]">
                          <p className="line-clamp-2 text-slate-600">{item.concepto}</p>
                        </td>
                        <td className="app-table-cell font-semibold text-emerald-600">
                          {formatCajaAmount(item.ingreso)}
                        </td>
                        <td className="app-table-cell font-semibold text-red-600">
                          {formatCajaAmount(item.egreso)}
                        </td>
                        <td className="app-table-cell font-semibold text-slate-900">
                          {formatCajaAmount(item.saldo)}
                        </td>
                        <td className="app-table-cell">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                                {item.responsableInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-700">{item.responsable}</span>
                          </div>
                        </td>
                        <td className="app-table-cell">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                              getMovimientoEstadoStyles(item.estado),
                            )}
                          >
                            {item.estado}
                          </span>
                        </td>
                        <td className="app-table-cell text-right">
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

              <AppTablePagination
                shownCount={filteredRecords.length}
                totalCount={snapshot?.totalRecords ?? filteredRecords.length}
              />
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <CajaBancosRightPanel snapshot={snapshot} />
        </AppRightPanelSlot>
      </div>
    </div>
  );
}
