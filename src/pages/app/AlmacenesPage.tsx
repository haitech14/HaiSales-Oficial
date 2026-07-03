import { useState } from "react";

import {

  ArrowDownToLine,

  ArrowLeftRight,

  ArrowUpFromLine,

  Calendar,

  ChevronDown,

  ChevronLeft,

  ChevronRight,

  Filter,

  Loader2,

  Package,

  RefreshCw,

  Search,

  Star,

  TrendingDown,

  TrendingUp,

  Warehouse,

  Wallet,

} from "lucide-react";

import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";

import { AppTablePagination } from "@/components/app/AppTablePagination";

import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";

import { useAppRightPanel } from "@/hooks/useAppRightPanel";

import { AlmacenesRightPanel } from "@/components/app/AlmacenesRightPanel";

import { NuevoMovimientoAlmacenModal } from "@/components/app/NuevoMovimientoAlmacenModal";

import { Button } from "@/components/ui/button";

import { useAlmacenes } from "@/hooks/useAlmacenes";

import {

  almacenesTabs,

  formatKardexCost,

  getMovimientoEstadoStyles,

  getMovimientoStyles,

} from "@/lib/almacenes/almacenes-service";

import type { KardexMovement } from "@/lib/almacenes-mock-data";

import { cn } from "@/lib/utils";



const kpiIcons = [Wallet, TrendingUp, TrendingDown, Package];



function MovimientoIcon({ tipo }: { tipo: KardexMovement["tipo"] }) {

  if (tipo === "Entrada") return <ArrowDownToLine className="h-4 w-4 text-emerald-600" />;

  if (tipo === "Salida") return <ArrowUpFromLine className="h-4 w-4 text-red-600" />;

  return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;

}



export default function AlmacenesPage() {

  const {

    snapshot,

    filteredMovements,

    activeTab,

    setActiveTab,

    search,

    setSearch,

    isLoading,

    isFetching,

    refresh,

    createMovimiento,

    isCreatingMovimiento,

  } = useAlmacenes();

  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();

  const [movimientoOpen, setMovimientoOpen] = useState(false);



  const tabsWithCounts = almacenesTabs.map((tab) => ({

    ...tab,

    count: snapshot?.tabCounts[tab.id] ?? null,

  }));



  const totalRecords = snapshot?.totalRecords ?? filteredMovements.length;



  return (

    <div className="flex min-h-screen flex-col">

      <AppPageHeader

        title="Almacenes / Kardex"

        subtitle="Controla entradas, salidas, transferencias y trazabilidad de stock por ubicación."

        showPanelToggle

        panelHidden={!isPanelVisible}

        onTogglePanel={togglePanel}

        actionLabel="+ Nuevo movimiento"

        onActionClick={() => setMovimientoOpen(true)}

      />



      {snapshot?.source === "supabase" && (

        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">

          Conectado a Supabase · {snapshot.totalRecords} movimientos sincronizados

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

                    placeholder="Buscar por producto, SKU, almacén, referencia..."

                    className="app-search-input pl-9 pr-3"

                  />

                </div>

                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">

                  <Warehouse className="h-3.5 w-3.5" />

                  Almacén: Todos

                  <ChevronDown className="h-3.5 w-3.5" />

                </Button>

                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">

                  <Calendar className="h-3.5 w-3.5" />

                  Periodo: Junio 2026

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

                <table className="app-table-body w-full min-w-[720px] text-left sm:min-w-[1200px]">

                  <thead>

                    <tr className="app-table-head-row">

                      <th className="app-table-cell">Fecha</th>

                      <th className="app-table-cell">Movimiento</th>

                      <th className="app-table-cell">Producto</th>

                      <th className="app-table-cell">Cantidad</th>

                      <th className="app-table-cell">Almacén</th>

                      <th className="app-table-cell">Ubicación</th>

                      <th className="app-table-cell">Costo</th>

                      <th className="app-table-cell">Referencia</th>

                      <th className="app-table-cell">Estado</th>

                    </tr>

                  </thead>

                  <tbody>

                    {isLoading ? (

                      <tr>

                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">

                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />

                          Cargando movimientos...

                        </td>

                      </tr>

                    ) : filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          No hay movimientos de kardex registrados.
                        </td>
                      </tr>
                    ) : (
                    filteredMovements.map((movement) => (

                      <tr

                        key={movement.id}

                        className="border-b border-slate-100 transition hover:bg-slate-50/60"

                      >

                        <td className="app-table-cell">

                          <p className="font-medium text-slate-800">{movement.fecha}</p>

                          <p className="text-xs text-slate-400">{movement.hora}</p>

                        </td>

                        <td className="app-table-cell">

                          <span

                            className={cn(

                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",

                              getMovimientoStyles(movement.tipo),

                            )}

                          >

                            <MovimientoIcon tipo={movement.tipo} />

                            {movement.tipo}

                          </span>

                        </td>

                        <td className="app-table-cell">

                          <p className="font-semibold text-slate-800">{movement.producto}</p>

                          <p className="text-xs text-slate-400">{movement.sku}</p>

                        </td>

                        <td className="app-table-cell font-medium text-slate-800">

                          {movement.cantidad} {movement.unidad}

                        </td>

                        <td className="app-table-cell text-slate-700">{movement.almacen}</td>

                        <td className="app-table-cell text-slate-600">{movement.ubicacion}</td>

                        <td className="app-table-cell font-semibold text-slate-900">

                          {formatKardexCost(movement.costo)}

                        </td>

                        <td className="app-table-cell text-slate-600">{movement.referencia}</td>

                        <td className="app-table-cell">

                          <span

                            className={cn(

                              "app-table-badge inline-flex rounded-full border",

                              getMovimientoEstadoStyles(movement.estado),

                            )}

                          >

                            {movement.estado}

                          </span>

                        </td>

                      </tr>

                    )))}

                  </tbody>

                </table>

              </div>



              <AppTablePagination shownCount={filteredMovements.length} totalCount={totalRecords} />

            </section>

          </div>

        </div>



        <AppRightPanelSlot

          panelHidden={panelHidden}

          mobileOpen={mobileOpen}

          onMobileOpenChange={setMobileOpen}

        >

          <AlmacenesRightPanel
            snapshot={snapshot}
            onRefresh={() => void refresh()}
            isRefreshing={isFetching}
          />

        </AppRightPanelSlot>

      </div>



      <NuevoMovimientoAlmacenModal
        open={movimientoOpen}
        onOpenChange={setMovimientoOpen}
        isSubmitting={isCreatingMovimiento}
        onRegister={async (form, esBorrador) => {
          await createMovimiento({ form, esBorrador });
        }}
      />

    </div>

  );

}


