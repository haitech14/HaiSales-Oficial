import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { CajaBancosRightPanel } from "@/components/app/CajaBancosRightPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  cajaBancosKpis,
  cajaBancosRecords,
  cajaBancosTabs,
  formatCajaAmount,
  getMovimientoEstadoStyles,
  type MovimientoTipo,
} from "@/lib/caja-bancos-mock-data";
import { cn } from "@/lib/utils";

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
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", config.className)}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {config.label}
    </span>
  );
}

export default function CajaBancosPage() {
  const [activeTab, setActiveTab] = useState("todos");
  const [panelHidden, setPanelHidden] = useState(false);
  const [search, setSearch] = useState("");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cajaBancosRecords.filter((item) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "ingresos" && item.tipo === "ingreso") ||
        (activeTab === "egresos" && item.tipo === "egreso") ||
        (activeTab === "transferencias" && item.tipo === "transferencia") ||
        (activeTab === "pendientes" && item.estado === "Pendiente") ||
        (activeTab === "conciliados" && item.estado === "Conciliado");

      const matchesSearch =
        !query ||
        item.concepto.toLowerCase().includes(query) ||
        item.cuenta.toLowerCase().includes(query) ||
        item.cuentaNumero.includes(query) ||
        item.documento.toLowerCase().includes(query) ||
        item.responsable.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Caja y Bancos"
        subtitle="Controla ingresos, egresos, transferencias, conciliaciones y saldos por cuenta."
        showPanelToggle
        panelHidden={panelHidden}
        onTogglePanel={() => setPanelHidden((current) => !current)}
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
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cajaBancosKpis.map((kpi) => (
                <CrmKpiCard key={kpi.label} {...kpi} />
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 pt-3">
                <div className="flex flex-wrap gap-1">
                  {cajaBancosTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition",
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-800",
                      )}
                    >
                      {tab.label}
                      {tab.count !== null && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
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
                  <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
                    <Star className="h-3.5 w-3.5" />
                    Guardar vista
                  </button>
                  <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
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
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Cuenta: Todas
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Tipo: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Rango de fechas
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
                <table className="w-full min-w-[1200px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
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
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.date}</p>
                          <p className="text-[10px] text-slate-400">{item.time}</p>
                        </td>
                        <td className="px-4 py-3">
                          <OperacionBadge tipo={item.tipo} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.cuenta}</p>
                          <p className="text-[10px] text-slate-400">{item.cuentaNumero}</p>
                        </td>
                        <td className="px-4 py-3">
                          <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                            {item.documento}
                          </a>
                        </td>
                        <td className="max-w-[200px] px-4 py-3">
                          <p className="line-clamp-2 text-slate-600">{item.concepto}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">
                          {formatCajaAmount(item.ingreso)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-red-600">
                          {formatCajaAmount(item.egreso)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatCajaAmount(item.saldo)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                                {item.responsableInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-700">{item.responsable}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              getMovimientoEstadoStyles(item.estado),
                            )}
                          >
                            {item.estado}
                          </span>
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

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                <p>Mostrando 1 a {filteredRecords.length} de 128 registros</p>
                <div className="flex items-center gap-1">
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
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
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100">
                    13
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

        {!panelHidden && <CajaBancosRightPanel className="hidden xl:block" />}
      </div>
    </div>
  );
}
