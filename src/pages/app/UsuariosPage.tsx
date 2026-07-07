import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { NuevoUsuarioModal } from "@/components/app/NuevoUsuarioModal";
import { UsuariosRightPanel } from "@/components/app/UsuariosRightPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsuarios } from "@/hooks/useUsuarios";
import type { UsuarioRecord } from "@/lib/usuarios-mock-data";
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
    submitNewUsuario,
    submitUpdateUsuario,
    isCreatingUsuario,
    isUpdatingUsuario,
  } = useUsuarios();
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const [usuarioModalOpen, setUsuarioModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioRecord | null>(null);

  const openCreateModal = () => {
    setEditingUsuario(null);
    setUsuarioModalOpen(true);
  };

  const openEditModal = (usuario: UsuarioRecord) => {
    setEditingUsuario(usuario);
    setUsuarioModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setUsuarioModalOpen(open);
    if (!open) {
      setEditingUsuario(null);
    }
  };

  const totalRecords = snapshot?.totalRecords ?? filteredUsers.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Usuarios/Planillas"
        subtitle="Administra accesos, roles, permisos, sucursales, seguridad e historial de actividad."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        actionLabel="Nuevo usuario"
        showActionDropdown
        onActionClick={openCreateModal}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} usuarios sincronizados
        </div>
      )}

      <NuevoUsuarioModal
        open={usuarioModalOpen}
        onOpenChange={handleModalOpenChange}
        usuarioToEdit={editingUsuario}
        onSubmit={submitNewUsuario}
        onUpdate={submitUpdateUsuario}
        isSubmitting={isCreatingUsuario || isUpdatingUsuario}
      />

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
                      className="app-search-input pl-9 pr-3"
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

              <div className="overflow-x-auto">
                <table className="app-table-body w-full min-w-[720px] text-left sm:min-w-[980px]">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="app-table-cell">Usuario</th>
                      <th className="app-table-cell">Correo</th>
                      <th className="app-table-cell">Rol</th>
                      <th className="app-table-cell">Sucursal</th>
                      <th className="app-table-cell">Estado</th>
                      <th className="app-table-cell text-center">2FA</th>
                      <th className="app-table-cell text-right">Acción</th>
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
                        <td className="app-table-cell">
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
                        <td className="app-table-cell text-slate-600">{usuario.correo}</td>
                        <td className="app-table-cell text-slate-700">{usuario.rol}</td>
                        <td className="app-table-cell text-slate-600">{usuario.sede}</td>
                        <td className="app-table-cell">
                          <span
                            className={cn(
                              "app-table-badge inline-flex rounded-full border",
                              getUsuarioEstadoStyles(usuario.estado),
                            )}
                          >
                            {usuario.estado}
                          </span>
                        </td>
                        <td className="app-table-cell text-center">
                          {usuario.has2fa ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="app-table-cell text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Más acciones"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => openEditModal(usuario)}
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              <AppTablePagination shownCount={filteredUsers.length} totalCount={totalRecords} />
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <UsuariosRightPanel snapshot={snapshot} />
        </AppRightPanelSlot>
      </div>
    </div>
  );
}

