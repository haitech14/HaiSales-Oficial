import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Star,
} from "lucide-react";
import { ClientesFilterBar } from "@/components/app/clientes/ClientesFilterBar";
import { ClientesResumenPanel } from "@/components/app/clientes/ClientesResumenPanel";
import { ClientesTableSkeleton } from "@/components/app/clientes/ClientesTableSkeleton";
import { ClientesToolbarFilter } from "@/components/app/ClientesToolbarFilter";
import { ClientesTableHeader } from "@/components/app/ClientesTableHeader";
import { ClientesTableRow } from "@/components/app/ClientesTableRow";
import { ModuleEmptyState } from "@/components/app/module-shell/ModuleEmptyState";
import { ModuleFab } from "@/components/app/module-shell/ModuleFab";
import { ModulePageHeader } from "@/components/app/module-shell/ModulePageHeader";
import { NuevoClienteModal } from "@/components/app/NuevoClienteModal";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/hooks/useClientes";
import { useAccionQueryParam } from "@/hooks/useAccionQueryParam";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import { MODULE_PAGE_BG } from "@/lib/module-page-theme";
export default function ClientesPage() {
  const {
    snapshot,
    filteredClients,
    paginatedClients,
    page,
    setPage,
    totalPages,
    pageSize,
    hasActiveFilters,
    clearFilters,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    isEnriching,
    refresh,
    createCliente,
    isCreating,
    updateClienteField,
    columnFilterOptions,
    columnFilters,
    setColumnFilter,
    sortField,
    sortDirection,
    handleSort,
  } = useClientes();
  const { togglePanel, isPanelVisible } = useAppRightPanel();
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);
  useSearchQueryParam(setSearch);
  useAccionQueryParam("nueva", () => setNuevoClienteOpen(true));

  const totalRecords = snapshot?.totalRecords ?? filteredClients.length;
  const filteredCount = filteredClients.length;
  const startIndex = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, filteredCount);

  return (
    <div className="relative flex min-h-full flex-col" style={{ backgroundColor: MODULE_PAGE_BG }}>
      <ModulePageHeader
        title="Contactos"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por raz?n social, RUC, contacto..."
        showDateNav={false}
        onToggleResumen={togglePanel}
        resumenOpen={isPanelVisible}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 pb-24 pt-2 sm:px-6 xl:flex-row xl:items-start xl:pb-6">
        <div className="min-w-0 flex-1">
          <ClientesFilterBar
            activeTab={activeTab}
            tabCounts={snapshot?.tabCounts ?? {}}
            onTabChange={setActiveTab}
            className="mb-4"
          />

          {isEnriching ? (
            <p className="mb-3 text-xs font-medium text-slate-500">
              Sincronizando ventas y analytics en segundo plano...
            </p>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-100 px-4 py-3">
                <button type="button" className="app-toolbar-link">
                  <Star className="h-3.5 w-3.5" />
                  Guardar vista
                </button>
                <button type="button" className="app-toolbar-link">
                  <Filter className="h-3.5 w-3.5" />
                  M?s filtros
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
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
                <table className="app-table-body app-table-compact w-full min-w-[720px] text-left text-[12px] sm:min-w-[2100px]">
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
                        label="Raz?n social"
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
                        label="Equipo/inter?s"
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
                        label="Producci?n Mensual"
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
                        label="WhatsApp"
                        columnKey="telefono"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.telefono}
                        filterOptions={columnFilterOptions.telefono}
                        onFilterChange={(value) => setColumnFilter("telefono", value)}
                        className="w-[150px]"
                        columnMinWidth="min-w-[130px]"
                      />
                      <ClientesTableHeader
                        label="Tel?fono"
                        columnKey="telefono"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.telefono}
                        filterOptions={columnFilterOptions.telefono}
                        onFilterChange={(value) => setColumnFilter("telefono", value)}
                      />
                      <ClientesTableHeader
                        label="Direcci?n"
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
                        label="Cumplea?os"
                        columnKey="cumpleanos"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.cumpleanos}
                        filterOptions={columnFilterOptions.cumpleanos}
                        onFilterChange={(value) => setColumnFilter("cumpleanos", value)}
                      />
                      <ClientesTableHeader
                        label="?ltima compra"
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
                        label="Modelos inter?s"
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
                      <th className="app-table-cell text-right">Acci?n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={23} className="p-0">
                          <ClientesTableSkeleton />
                        </td>
                      </tr>
                    ) : filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={23} className="p-0">
                          <ModuleEmptyState
                            compact
                            message="No hay contactos que coincidan con los filtros"
                            hint="Prueba con otro t?rmino o limpia los filtros activos."
                          />
                          {hasActiveFilters ? (
                            <div className="pb-6 text-center">
                              <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Limpiar filtros
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ) : (
                      paginatedClients.map((client) => (
                        <ClientesTableRow
                          key={client.id}
                          client={client}
                          onUpdateField={updateClienteField}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="app-pagination-bar flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5">
                <p>
                  {filteredCount === 0
                    ? `Sin resultados ? ${totalRecords.toLocaleString("es-PE")} en total`
                    : `Mostrando ${startIndex.toLocaleString("es-PE")} a ${endIndex.toLocaleString("es-PE")} de ${filteredCount.toLocaleString("es-PE")} contactos`}
                </p>

                {totalPages > 1 ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      aria-label="P?gina anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-xs font-medium text-slate-600">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page >= totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      aria-label="P?gina siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
          </section>
        </div>

        {isPanelVisible ? (
          <ClientesResumenPanel snapshot={snapshot} className="xl:sticky xl:top-4" />
        ) : null}
      </div>

      <ModuleFab onClick={() => setNuevoClienteOpen(true)} />

      <NuevoClienteModal
        open={nuevoClienteOpen}
        onOpenChange={setNuevoClienteOpen}
        onSubmit={(form, mode) => createCliente({ form, esBorrador: mode === "draft" })}
        isSubmitting={isCreating}
      />
    </div>
  );
}
