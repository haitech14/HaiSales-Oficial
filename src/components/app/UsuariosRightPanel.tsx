import { RefreshCw } from "lucide-react";
import type { UsuariosSnapshot } from "@/lib/usuarios/usuarios-service";
import { cn } from "@/lib/utils";

const ROLE_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#ef4444"];

export function UsuariosRightPanel({
  className,
  snapshot,
}: {
  className?: string;
  snapshot?: UsuariosSnapshot | null;
}) {
  const users = snapshot?.users ?? [];
  const roleTotals = users.reduce((map, user) => {
    map.set(user.rol, (map.get(user.rol) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  const roles = [...roleTotals.entries()].map(([label, count], index) => ({
    label,
    count,
    percent: users.length > 0 ? Math.round((count / users.length) * 100) : 0,
    color: ROLE_COLORS[index % ROLE_COLORS.length],
  }));

  let dashOffset = 0;
  const donutSegments = roles.map((role) => {
    const dash = `${role.percent} ${100 - role.percent}`;
    const offset = -dashOffset;
    dashOffset += role.percent;
    return { ...role, dash, offset };
  });

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Usuarios por rol</h3>
          {users.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin usuarios sincronizados.</p>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  {donutSegments.map((role) => (
                    <circle
                      key={role.label}
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={role.color}
                      strokeWidth="3"
                      strokeDasharray={role.dash}
                      strokeDashoffset={role.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">{users.length}</span>
                  <span className="app-panel-meta">Total</span>
                </div>
              </div>
              <ul className="app-panel-list min-w-0 flex-1">
                {roles.map((role) => (
                  <li key={role.label} className="flex items-center justify-between gap-2 text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      {role.label}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-800">{role.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Resumen de acceso</h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            <li className="flex justify-between">
              <span>Activos</span>
              <span className="font-semibold text-slate-800">
                {users.filter((user) => user.estado === "Activo").length}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Invitados</span>
              <span className="font-semibold text-slate-800">
                {users.filter((user) => user.estado === "Invitado").length}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Inactivos</span>
              <span className="font-semibold text-slate-800">
                {users.filter((user) => user.estado === "Inactivo").length}
              </span>
            </li>
          </ul>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>{users.length} usuarios sincronizados</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
