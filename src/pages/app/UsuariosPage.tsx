import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { NuevoUsuarioModal } from "@/components/app/NuevoUsuarioModal";
import { UsuariosRightPanel } from "@/components/app/UsuariosRightPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUsuarios } from "@/hooks/useUsuarios";
import { getUsuarioEstadoStyles } from "@/lib/usuarios/usuarios-service";
import { cn } from "@/lib/utils";

const kpiIcons = [UserRound, Users, Shield, AlertTriangle];

export default function UsuariosPage() {
  const {
    snapshot,
    filteredUsers,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
  } = useUsuarios();
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const [nuevoUsuarioOpen, setNuevoUsuarioOpen] = useState(false);

  const totalRecords = snapshot?.totalRecords ?? filteredUsers.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Usuarios, Roles y Permisos"
        subtitle="Administra accesos, roles, permisos, sedes, seguridad e historial de actividad."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        actionLabel="Nuevo usuario"
        showActionDropdown
        onActionClick={() => setNuevoUsuarioOpen(true)}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} usuarios sincronizados
        </div>
      )}

      <NuevoUsuarioModal open={nuevoUsuarioOpen} onOpenChange={setNuevoUsuarioOpen} />

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
                <div className="flex flex-1 flex-wrap items-center gap-2 pb-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar por usuario, correo, rol..."
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
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

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm sm:min-w-[980px]">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Correo</th>
                      <th className="px-4 py-3">Rol</th>
                      <th className="px-4 py-3">Sede</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-center">2FA</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : (
                    filteredUsers.map((usuario) => (
                      <tr
                        key={usuario.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback
                                className={cn(
                                  "text-[10px] font-semibold",
                                  usuario.avatarBg,
                                  usuario.avatarColor,
                                )}
                              >
                                {usuario.initials}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-slate-800">{usuario.nombre}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{usuario.correo}</td>
                        <td className="px-4 py-3.5 text-slate-700">{usuario.rol}</td>
                        <td className="px-4 py-3.5 text-slate-600">{usuario.sede}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              getUsuarioEstadoStyles(usuario.estado),
                            )}
                          >
                            {usuario.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {usuario.has2fa ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
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
                  Mostrando 1 a {filteredUsers.length} de {totalRecords.toLocaleString("es-PE")} registros
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {[1, 2, 3, 4, 5].map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium",
                        page === 1
                          ? "bg-blue-600 font-semibold text-white"
                          : "text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {page}
                    </button>
                  ))}
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

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <UsuariosRightPanel />
        </AppRightPanelSlot>
      </div>
    </div>
  );
}
