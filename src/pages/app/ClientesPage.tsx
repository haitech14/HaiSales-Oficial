import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Filter,
  LineChart,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { ClientesRightPanel } from "@/components/app/ClientesRightPanel";
import { NuevoClienteModal } from "@/components/app/NuevoClienteModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/hooks/useClientes";
import {
  clientesTabs,
  getClientStatusStyles,
  getSegmentStyles,
} from "@/lib/clientes/clientes-service";
import { cn } from "@/lib/utils";

const kpiIcons = [UserCheck, Users, AlertTriangle, LineChart];

export default function ClientesPage() {
  const {
    snapshot,
    filteredClients,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
  } = useClientes();
  const [panelHidden, setPanelHidden] = useState(false);
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);

  const tabsWithCounts = clientesTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? tab.count,
  }));

  const totalRecords = snapshot?.totalRecords ?? filteredClients.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Clientes / Empresas"
        subtitle="Administra clientes, contactos, RUC, direcciones, historial comercial y estado financiero."
        showPanelToggle
        panelHidden={panelHidden}
        onTogglePanel={() => setPanelHidden((current) => !current)}
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
          <div className="space-y-5 p-6">
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
                <div className="flex flex-wrap gap-1">
                  {tabsWithCounts.map((tab) => (
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
                    placeholder="Buscar por razón social, RUC, contacto, teléfono..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
                <table className="w-full min-w-[1060px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Fecha alta</th>
                      <th className="px-4 py-3">RUC</th>
                      <th className="px-4 py-3">Razón social</th>
                      <th className="px-4 py-3">Contacto</th>
                      <th className="px-4 py-3">Teléfono</th>
                      <th className="px-4 py-3">Segmento</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Ejecutivo</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                          Cargando clientes...
                        </td>
                      </tr>
                    ) : (
                    filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3.5 font-medium text-slate-800">{client.fechaAlta}</td>
                        <td className="px-4 py-3.5 text-slate-600">{client.ruc}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{client.razonSocial}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-800">{client.contacto}</p>
                          <p className="text-xs text-slate-400">{client.cargo}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{client.telefono}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              getSegmentStyles(client.segmento),
                            )}
                          >
                            {client.segmento}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              getClientStatusStyles(client.estado),
                            )}
                          >
                            {client.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-blue-100 text-[10px] font-semibold text-blue-700">
                                {client.ejecutivoInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-700">{client.ejecutivo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Más acciones"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                <p>
                  Mostrando 1 a {filteredClients.length} de {totalRecords.toLocaleString("es-PE")} registros
                </p>
                <div className="flex items-center gap-1">
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
                    129
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

        {!panelHidden && <ClientesRightPanel className="hidden xl:block" />}
      </div>

      <NuevoClienteModal open={nuevoClienteOpen} onOpenChange={setNuevoClienteOpen} />
    </div>
  );
}
