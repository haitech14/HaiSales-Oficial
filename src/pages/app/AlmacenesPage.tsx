import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
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
import { AlmacenesRightPanel } from "@/components/app/AlmacenesRightPanel";
import { NuevoMovimientoAlmacenModal } from "@/components/app/NuevoMovimientoAlmacenModal";
import { Button } from "@/components/ui/button";
import {
  almacenesKpis,
  almacenesTabs,
  formatKardexCost,
  getMovimientoEstadoStyles,
  getMovimientoStyles,
  kardexMovements,
  type KardexMovement,
} from "@/lib/almacenes-mock-data";
import { cn } from "@/lib/utils";

const kpiIcons = [Wallet, TrendingUp, TrendingDown, Package];

function MovimientoIcon({ tipo }: { tipo: KardexMovement["tipo"] }) {
  if (tipo === "Entrada") return <ArrowDownToLine className="h-4 w-4 text-emerald-600" />;
  if (tipo === "Salida") return <ArrowUpFromLine className="h-4 w-4 text-red-600" />;
  return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
}

export default function AlmacenesPage() {
  const [activeTab, setActiveTab] = useState("todos");
  const [panelHidden, setPanelHidden] = useState(false);
  const [search, setSearch] = useState("");
  const [movimientoOpen, setMovimientoOpen] = useState(false);

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return kardexMovements.filter((movement) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "entradas" && movement.tipo === "Entrada") ||
        (activeTab === "salidas" && movement.tipo === "Salida") ||
        (activeTab === "transferencias" && movement.tipo === "Transferencia");

      const matchesSearch =
        !query ||
        movement.producto.toLowerCase().includes(query) ||
        movement.sku.toLowerCase().includes(query) ||
        movement.almacen.toLowerCase().includes(query) ||
        movement.referencia.toLowerCase().includes(query) ||
        movement.id.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Almacenes / Kardex"
        subtitle="Controla entradas, salidas, transferencias y trazabilidad de stock por ubicación."
        showPanelToggle
        panelHidden={panelHidden}
        onTogglePanel={() => setPanelHidden((current) => !current)}
        actionLabel="+ Nuevo movimiento"
        onActionClick={() => setMovimientoOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {almacenesKpis.map((kpi, index) => {
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
                <div className="flex flex-wrap gap-1">
                  {almacenesTabs.map((tab) => (
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
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Guardar vista
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
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
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Actualizar"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="app-table-body w-full min-w-[1200px] text-left">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Movimiento</th>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Cantidad</th>
                      <th className="px-4 py-3">Almacén</th>
                      <th className="px-4 py-3">Ubicación</th>
                      <th className="px-4 py-3">Costo</th>
                      <th className="px-4 py-3">Referencia</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-800">{movement.fecha}</p>
                          <p className="text-xs text-slate-400">{movement.hora}</p>
                        </td>
                        <td className="px-4 py-3.5">
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
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{movement.producto}</p>
                          <p className="text-xs text-slate-400">{movement.sku}</p>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {movement.cantidad} {movement.unidad}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">{movement.almacen}</td>
                        <td className="px-4 py-3.5 text-slate-600">{movement.ubicacion}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {formatKardexCost(movement.costo)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{movement.referencia}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              getMovimientoEstadoStyles(movement.estado),
                            )}
                          >
                            {movement.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                <p>
                  Mostrando 1 a {filteredMovements.length} de 328 registros
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white"
                  >
                    1
                  </button>
                  {[2, 3].map((page) => (
                    <button
                      key={page}
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {page}
                    </button>
                  ))}
                  <span className="px-1 text-slate-400">...</span>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    33
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-slate-600">
                  10 por página
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </section>
          </div>
        </div>

        {!panelHidden && <AlmacenesRightPanel className="hidden xl:block" />}
      </div>

      <NuevoMovimientoAlmacenModal open={movimientoOpen} onOpenChange={setMovimientoOpen} />
    </div>
  );
}
