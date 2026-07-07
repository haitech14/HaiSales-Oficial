import { Link, Outlet, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { configuracionNavGroup } from "@/lib/app-navigation";
import { filterNavGroupByRole } from "@/lib/auth/roles";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

function isConfigItemActive(href: string, pathname: string): boolean {
  return pathname === href.split("?")[0];
}

export function ConfiguracionLayout() {
  const location = useLocation();
  const { role } = useUserRole();
  const configGroup = filterNavGroupByRole(configuracionNavGroup, role);

  if (!configGroup) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <Settings className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
          <span className="text-sm font-semibold text-slate-800">Configuración</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Configuración">
          <ul className="space-y-0.5">
            {configGroup.items.map((item) => {
              const isActive = isConfigItemActive(item.href, location.pathname);
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex w-full rounded-lg px-3 py-2 text-sm leading-snug transition",
                      isActive
                        ? "bg-blue-600 font-semibold text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="border-b border-slate-200 bg-white md:hidden">
        <nav className="flex gap-1 overflow-x-auto px-4" aria-label="Configuración">
          {configGroup.items.map((item) => {
            const isActive = isConfigItemActive(item.href, location.pathname);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "app-tab shrink-0",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
