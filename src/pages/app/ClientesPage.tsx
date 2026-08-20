import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ClientesFilterBar } from "@/components/app/clientes/ClientesFilterBar";
import { ClientesResumenPanel } from "@/components/app/clientes/ClientesResumenPanel";
import { ClientesTableSkeleton } from "@/components/app/clientes/ClientesTableSkeleton";
import { ClientesToolbarFilter } from "@/components/app/ClientesToolbarFilter";
import { ClientesDateRangeFilter } from "@/components/app/clientes/ClientesDateRangeFilter";
import { ClientesTableHeader } from "@/components/app/ClientesTableHeader";
import { ClientesTableRow } from "@/components/app/ClientesTableRow";
import { ModuleEmptyState } from "@/components/app/module-shell/ModuleEmptyState";
import { ModuleFab } from "@/components/app/module-shell/ModuleFab";
import { ModulePageHeader } from "@/components/app/module-shell/ModulePageHeader";
import { NuevoClienteModal } from "@/components/app/NuevoClienteModal";
import { useClientes } from "@/hooks/useClientes";
import { useAccionQueryParam } from "@/hooks/useAccionQueryParam";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import { MODULE_PAGE_BG } from "@/lib/module-page-theme";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [25, 50, 100];
export default function ClientesPage() {
  const {
    snapshot,
    filteredClients,
    paginatedClients,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
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
    dateFrom,
    dateTo,
    setDateRange,
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

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [page - 2, page - 1, page, page + 1, page + 2];
  }, [page, totalPages]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden" style={{ backgroundColor: MODULE_PAGE_BG }}>
      <ModulePageHeader
        title="Contactos"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por razon social, RUC, contacto..."
        showDateNav={false}
        onToggleResumen={togglePanel}
        resumenOpen={isPanelVisible}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-4 pb-6 pt-2 sm:px-6 xl:flex-row xl:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ClientesFilterBar
            activeTab={activeTab}
            tabCounts={snapshot?.tabCounts ?? {}}
            onTabChange={setActiveTab}
            className="mb-4 shrink-0"
          />

          {isEnriching ? (
            <p className="mb-3 text-xs font-medium text-slate-500">
              Sincronizando ventas y analytics en segundo plano...
            </p>
          ) : null}

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-4 py-2.5">
                <ClientesToolbarFilter
                  label="Tipo"
                  value={columnFilters.tipoCliente}
                  options={columnFilterOptions.tipoCliente}
                  onChange={(value) => setColumnFilter("tipoCliente", value)}
                />
                <ClientesToolbarFilter
                  label="Estado"
                  value={columnFilters.estado}
                  options={columnFilterOptions.estado}
                  onChange={(value) => setColumnFilter("estado", value)}
                />
                <ClientesToolbarFilter
                  label="Ciudad"
                  allLabel="Todas"
                  value={columnFilters.ciudad}
                  options={columnFilterOptions.ciudad}
                  onChange={(value) => setColumnFilter("ciudad", value)}
                />
                <ClientesDateRangeFilter from={dateFrom} to={dateTo} onChange={setDateRange} />
                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    void refresh();
                  }}
                  disabled={isFetching}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Actualizar y limpiar filtros"
                  title="Actualizar y limpiar filtros"
                >
                  {isFetching ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <table className="app-table-body app-table-compact w-full min-w-[720px] text-left text-[12px] sm:min-w-[2100px]">
                  <thead className="sticky top-0 z-20 bg-slate-50">
                    <tr className="app-table-head-row">
                      <ClientesTableHeader
                        label="Fecha de último contacto"
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
                        label="Razon social"
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
                        label="Contacto"
                        columnKey="contacto"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.contacto}
                        filterOptions={columnFilterOptions.contacto}
                        onFilterChange={(value) => setColumnFilter("contacto", value)}
                        className="w-[180px]"
                        columnMinWidth="min-w-[160px]"
                      />
                      <ClientesTableHeader
                        label="DNI"
                        columnKey="dni"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.dni}
                        filterOptions={columnFilterOptions.dni}
                        onFilterChange={(value) => setColumnFilter("dni", value)}
                      />
                      <ClientesTableHeader
                        label="Celular"
                        columnKey="telefono"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.telefono}
                        filterOptions={columnFilterOptions.telefono}
                        onFilterChange={(value) => setColumnFilter("telefono", value)}
                        className="w-[160px]"
                        columnMinWidth="min-w-[140px]"
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
                        label="Rubro"
                        columnKey="segmento"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.segmento}
                        filterOptions={columnFilterOptions.segmento}
                        onFilterChange={(value) => setColumnFilter("segmento", value)}
                      />
                      <ClientesTableHeader
                        label="Direccion"
                        columnKey="direccion"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.direccion}
                        filterOptions={columnFilterOptions.direccion}
                        onFilterChange={(value) => setColumnFilter("direccion", value)}
                        className="w-[220px]"
                        columnMinWidth="min-w-[220px]"
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
                        className="w-[200px]"
                        columnMinWidth="min-w-[200px]"
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
                        label="Pais"
                        columnKey="pais"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.pais}
                        filterOptions={columnFilterOptions.pais}
                        onFilterChange={(value) => setColumnFilter("pais", value)}
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
                        label="Equipos interés"
                        columnKey="equipoInteres"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.equipoInteres}
                        filterOptions={columnFilterOptions.equipoInteres}
                        onFilterChange={(value) => setColumnFilter("equipoInteres", value)}
                        className="w-[240px]"
                        columnMinWidth="min-w-[220px]"
                      />
                      <ClientesTableHeader
                        label="Productos comprados"
                        columnKey="modelosInteres"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.modelosInteres}
                        filterOptions={columnFilterOptions.modelosInteres}
                        onFilterChange={(value) => setColumnFilter("modelosInteres", value)}
                        className="w-[280px]"
                        columnMinWidth="min-w-[240px]"
                      />
                      <ClientesTableHeader
                        label="Último tóner"
                        columnKey="fechaToner"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.fechaToner}
                        filterOptions={columnFilterOptions.fechaToner}
                        onFilterChange={(value) => setColumnFilter("fechaToner", value)}
                      />
                      <ClientesTableHeader
                        label="Produccion mensual"
                        columnKey="produccionMensual"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.produccionMensual}
                        filterOptions={columnFilterOptions.produccionMensual}
                        onFilterChange={(value) => setColumnFilter("produccionMensual", value)}
                      />
                      <ClientesTableHeader
                        label="Cumpleanos"
                        columnKey="cumpleanos"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.cumpleanos}
                        filterOptions={columnFilterOptions.cumpleanos}
                        onFilterChange={(value) => setColumnFilter("cumpleanos", value)}
                      />
                      <ClientesTableHeader
                        label="Ultima compra"
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
                        label="Observaciones"
                        columnKey="observaciones"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        filterValue={columnFilters.observaciones}
                        filterOptions={columnFilterOptions.observaciones}
                        onFilterChange={(value) => setColumnFilter("observaciones", value)}
                      />
                      <th className="app-table-cell text-right">Accion</th>
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
                            hint="Prueba con otro termino o limpia los filtros activos."
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
                    ? `Sin resultados · ${totalRecords.toLocaleString("es-PE")} en total`
                    : `Mostrando ${startIndex.toLocaleString("es-PE")} a ${endIndex.toLocaleString("es-PE")} de ${filteredCount.toLocaleString("es-PE")} contactos`}
                </p>

                {filteredCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      aria-label="Pagina anterior"
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
                    {totalPages > 5 && page < totalPages - 2 ? (
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
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page >= totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      aria-label="Pagina siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

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
                        {option} por pagina
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
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
