import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Filter,
  LineChart,
  Loader2,
  RefreshCw,
  Search,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { ClientesRightPanel } from "@/components/app/ClientesRightPanel";
import { ClientesToolbarFilter } from "@/components/app/ClientesToolbarFilter";
import { ClientesTableHeader } from "@/components/app/ClientesTableHeader";
import { ClientesTableRow } from "@/components/app/ClientesTableRow";
import { NuevoClienteModal } from "@/components/app/NuevoClienteModal";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/hooks/useClientes";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import { clientesTabs } from "@/lib/clientes/clientes-service";
import { cn } from "@/lib/utils";

const kpiIcons = [UserCheck, Users, AlertTriangle, LineChart];

export default function ClientesPage() {
  const {
    snapshot,
    filteredClients,
    hasActiveFilters,
    clearFilters,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    createCliente,
    isCreating,
    updateClienteField,
    lastUpdatedAt,
    columnFilterOptions,
    columnFilters,
    setColumnFilter,
    sortField,
    sortDirection,
    handleSort,
  } = useClientes();
  useSearchQueryParam(setSearch);
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);

  const tabsWithCounts = clientesTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));

  const totalRecords = snapshot?.totalRecords ?? filteredClients.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Clientes / Empresas"
        subtitle="Administra clientes, contactos, RUC, direcciones, historial comercial y estado financiero."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        actionLabel="+ Nuevo cliente"
        showActionDropdown
        onActionClick={() => setNuevoClienteOpen(true)}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} clientes sincronizados
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
                    placeholder="Buscar por razón social, RUC, contacto, teléfono..."
                    className="app-search-input pl-9 pr-3"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Tipo: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <ClientesToolbarFilter
                  label="Ciudad"
                  allLabel="Todas"
                  value={columnFilters.ciudad}
                  options={columnFilterOptions.ciudad}
                  onChange={(value) => setColumnFilter("ciudad", value)}
                />
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
                <table className="app-table-body w-full min-w-[720px] text-left sm:min-w-[2000px]">
                  <thead>
                    <tr className="app-table-head-row">
                      <ClientesTableHeader
                        label="Fecha"
                        columnKey="fechaAlta"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.fechaAlta}
                        filterOptions={columnFilterOptions.fechaAlta}
                        onFilterChange={(value) => setColumnFilter("fechaAlta", value)}
                      />
                      <ClientesTableHeader
                        label="RUC"
                        columnKey="ruc"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.ruc}
                        filterOptions={columnFilterOptions.ruc}
                        onFilterChange={(value) => setColumnFilter("ruc", value)}
                      />
                      <ClientesTableHeader
                        label="Razón social"
                        columnKey="razonSocial"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.razonSocial}
                        filterOptions={columnFilterOptions.razonSocial}
                        onFilterChange={(value) => setColumnFilter("razonSocial", value)}
                        className="w-[260px]"
                        columnMinWidth="min-w-[260px]"
                      />
                      <ClientesTableHeader
                        label="Tipo de Cliente"
                        columnKey="tipoCliente"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.tipoCliente}
                        filterOptions={columnFilterOptions.tipoCliente}
                        onFilterChange={(value) => setColumnFilter("tipoCliente", value)}
                      />
                      <ClientesTableHeader
                        label="Segmento"
                        columnKey="segmento"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.segmento}
                        filterOptions={columnFilterOptions.segmento}
                        onFilterChange={(value) => setColumnFilter("segmento", value)}
                      />
                      <ClientesTableHeader
                        label="Equipo/interés"
                        columnKey="equipoInteres"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.equipoInteres}
                        filterOptions={columnFilterOptions.equipoInteres}
                        onFilterChange={(value) => setColumnFilter("equipoInteres", value)}
                        className="w-[220px]"
                        columnMinWidth="min-w-[220px]"
                      />
                      <ClientesTableHeader
                        label="Producción Mensual"
                        columnKey="produccionMensual"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.produccionMensual}
                        filterOptions={columnFilterOptions.produccionMensual}
                        onFilterChange={(value) => setColumnFilter("produccionMensual", value)}
                      />
                      <ClientesTableHeader
                        label="Fecha Toner"
                        columnKey="fechaToner"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.fechaToner}
                        filterOptions={columnFilterOptions.fechaToner}
                        onFilterChange={(value) => setColumnFilter("fechaToner", value)}
                      />
                      <ClientesTableHeader
                        label="Contacto"
                        columnKey="contacto"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.contacto}
                        filterOptions={columnFilterOptions.contacto}
                        onFilterChange={(value) => setColumnFilter("contacto", value)}
                      />
                      <ClientesTableHeader
                        label="Teléfono"
                        columnKey="telefono"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.telefono}
                        filterOptions={columnFilterOptions.telefono}
                        onFilterChange={(value) => setColumnFilter("telefono", value)}
                      />
                      <ClientesTableHeader
                        label="Dirección"
                        columnKey="direccion"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.direccion}
                        filterOptions={columnFilterOptions.direccion}
                        onFilterChange={(value) => setColumnFilter("direccion", value)}
                      />
                      <ClientesTableHeader
                        label="Ciudad"
                        columnKey="ciudad"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.ciudad}
                        filterOptions={columnFilterOptions.ciudad}
                        onFilterChange={(value) => setColumnFilter("ciudad", value)}
                      />
                      <ClientesTableHeader
                        label="Provincia"
                        columnKey="provincia"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.provincia}
                        filterOptions={columnFilterOptions.provincia}
                        onFilterChange={(value) => setColumnFilter("provincia", value)}
                      />
                      <ClientesTableHeader
                        label="Distrito"
                        columnKey="distrito"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.distrito}
                        filterOptions={columnFilterOptions.distrito}
                        onFilterChange={(value) => setColumnFilter("distrito", value)}
                      />
                      <ClientesTableHeader
                        label="Correo"
                        columnKey="correo"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.correo}
                        filterOptions={columnFilterOptions.correo}
                        onFilterChange={(value) => setColumnFilter("correo", value)}
                      />
                      <ClientesTableHeader
                        label="Cumpleaños"
                        columnKey="cumpleanos"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.cumpleanos}
                        filterOptions={columnFilterOptions.cumpleanos}
                        onFilterChange={(value) => setColumnFilter("cumpleanos", value)}
                      />
                      <ClientesTableHeader
                        label="Última compra"
                        columnKey="ultimaCompra"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.ultimaCompra}
                        filterOptions={columnFilterOptions.ultimaCompra}
                        onFilterChange={(value) => setColumnFilter("ultimaCompra", value)}
                      />
                      <ClientesTableHeader
                        label="Frecuencia compra"
                        columnKey="frecuenciaCompra"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.frecuenciaCompra}
                        filterOptions={columnFilterOptions.frecuenciaCompra}
                        onFilterChange={(value) => setColumnFilter("frecuenciaCompra", value)}
                      />
                      <ClientesTableHeader
                        label="Ticket compra"
                        columnKey="ticketCompra"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.ticketCompra}
                        filterOptions={columnFilterOptions.ticketCompra}
                        onFilterChange={(value) => setColumnFilter("ticketCompra", value)}
                      />
                      <ClientesTableHeader
                        label="Modelos interés"
                        columnKey="modelosInteres"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.modelosInteres}
                        filterOptions={columnFilterOptions.modelosInteres}
                        onFilterChange={(value) => setColumnFilter("modelosInteres", value)}
                      />
                      <ClientesTableHeader
                        label="Observaciones"
                        columnKey="observaciones"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.observaciones}
                        filterOptions={columnFilterOptions.observaciones}
                        onFilterChange={(value) => setColumnFilter("observaciones", value)}
                      />
                      <th className="app-table-cell text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={22} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                          Cargando clientes...
                        </td>
                      </tr>
                    ) : filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={22} className="px-4 py-12 text-center text-slate-500">
                          <p className="text-sm font-medium text-slate-700">
                            No hay clientes que coincidan con los filtros
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Prueba con otro término o limpia los filtros activos.
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={clearFilters}
                              className="mt-4 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                    filteredClients.map((client) => (
                      <ClientesTableRow
                        key={client.id}
                        client={client}
                        onUpdateField={updateClienteField}
                      />
                    )))}
                  </tbody>
                </table>
              </div>

              <AppTablePagination
                shownCount={filteredClients.length}
                totalCount={totalRecords}
                filteredCount={hasActiveFilters ? filteredClients.length : totalRecords}
              />
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <ClientesRightPanel
            analytics={snapshot?.analytics ?? null}
            totalClients={totalRecords}
            lastUpdatedAt={lastUpdatedAt}
            onRefresh={() => void refresh()}
            isRefreshing={isFetching}
          />
        </AppRightPanelSlot>
      </div>

      <NuevoClienteModal
        open={nuevoClienteOpen}
        onOpenChange={setNuevoClienteOpen}
        onSubmit={(form, mode) => createCliente({ form, esBorrador: mode === "draft" })}
        isSubmitting={isCreating}
      />
    </div>
  );
}
