import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { appNavSections, anunciosNavItem, dashboardNavGroup } from "@/lib/app-navigation";
import { filterNavSectionsByRole } from "@/lib/auth/roles";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { useUserRole } from "@/hooks/useUserRole";
import { getEmpresaInitials } from "@/lib/parametros/empresa-service";
import { cn } from "@/lib/utils";

function isNavItemActive(href: string | undefined, pathname: string, searchParams: URLSearchParams): boolean {
  if (!href) return false;

  const [path, query = ""] = href.split("?");
  if (pathname !== path) return false;

  if (query) {
    const expected = new URLSearchParams(query);
    for (const [key, value] of expected.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  }

  if (pathname === "/app/dashboard") {
    const mode = searchParams.get("mode");
    if (mode === "reportes" || mode === "resumen" || mode === "detallado") {
      return false;
    }
    return true;
  }

  return true;
}

type AppSidebarContentProps = {
  collapsed?: boolean;
  showBrand?: boolean;
  showCompany?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebarContent({
  collapsed = false,
  showBrand = true,
  showCompany = true,
  onNavigate,
  className,
}: AppSidebarContentProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { role } = useUserRole();
  const { data: empresaConfig, isLoading: isEmpresaLoading } = useEmpresaConfig();
  const navSections = filterNavSectionsByRole(appNavSections, role);
  const empresaNombre = empresaConfig?.razonSocial || "Mi empresa";
  const empresaRuc = empresaConfig?.ruc || "Sin RUC";
  const empresaIniciales = getEmpresaInitials(empresaNombre);
  const empresaLogo = empresaConfig?.logoUrl;
  const isDashboardSectionActive =
    location.pathname === "/app/dashboard" ||
    dashboardNavGroup.items.some((item) => isNavItemActive(item.href, location.pathname, searchParams));
  const isDashboardGraphsActive = isNavItemActive(
    dashboardNavGroup.href,
    location.pathname,
    searchParams,
  );
  const isAnunciosActive = isNavItemActive(anunciosNavItem.href, location.pathname, searchParams);
  const [dashboardExpanded, setDashboardExpanded] = useState(
    () => location.pathname === "/app/dashboard",
  );

  useEffect(() => {
    if (location.pathname === "/app/dashboard") {
      setDashboardExpanded(true);
    }
  }, [location.pathname]);

  return (
    <div className={cn("flex h-full flex-col bg-[#0b1220]", className)}>
      {showBrand && (
        <div className="flex items-center gap-2 px-3 py-3">
          <HaiSalesLogo
            to="/app/dashboard"
            iconOnly={collapsed}
            onClick={onNavigate}
            imageClassName={collapsed ? "h-8 w-8 object-cover object-left" : "h-10 max-w-[220px]"}
          />
        </div>
      )}

      {!collapsed && showCompany && (
        <div className="mx-2.5 mb-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] p-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {isEmpresaLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : empresaLogo ? (
                <img src={empresaLogo} alt="" className="h-full w-full object-cover" />
              ) : (
                empresaIniciales
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{empresaNombre}</p>
              <p className="mt-0.5 text-xs text-slate-500">RUC {empresaRuc}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2.5 pb-3">
        <ul className="space-y-0.5">
          <li>
            {collapsed ? (
              <Link
                to={dashboardNavGroup.href ?? "/app/dashboard"}
                title={dashboardNavGroup.label}
                onClick={onNavigate}
                className={cn(
                  "app-sidebar-link",
                  isDashboardSectionActive
                    ? "bg-blue-600 font-semibold text-white"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
                  "justify-center px-2",
                )}
              >
                <dashboardNavGroup.icon className="h-4 w-4 shrink-0" strokeWidth={isDashboardSectionActive ? 2 : 1.75} />
              </Link>
            ) : (
              <div className="space-y-0.5">
                <div className="flex items-center gap-0.5">
                  <Link
                    to={dashboardNavGroup.href ?? "/app/dashboard"}
                    onClick={onNavigate}
                    className={cn(
                      "app-sidebar-link min-w-0 flex-1",
                      isDashboardGraphsActive
                        ? "bg-blue-600 font-semibold text-white"
                        : isDashboardSectionActive
                          ? "text-white"
                          : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-200",
                    )}
                  >
                    <dashboardNavGroup.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="app-sidebar-label font-semibold">{dashboardNavGroup.label}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDashboardExpanded((current) => !current)}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                      isDashboardSectionActive
                        ? "text-slate-300 hover:bg-white/10 hover:text-white"
                        : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300",
                    )}
                    aria-label={dashboardExpanded ? "Plegar menú Dashboard" : "Desplegar menú Dashboard"}
                    aria-expanded={dashboardExpanded}
                  >
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        dashboardExpanded && "rotate-90",
                      )}
                    />
                  </button>
                </div>
                {dashboardExpanded && (
                  <ul className="ml-3 space-y-0.5 border-l border-white/10 pl-2">
                    {dashboardNavGroup.items.map((item) => {
                      const isActive = isNavItemActive(item.href, location.pathname, searchParams);
                      return (
                        <li key={item.label}>
                          <Link
                            to={item.href}
                            onClick={onNavigate}
                            className={cn(
                              "app-sidebar-sublink",
                              isActive
                                ? "bg-blue-600 font-semibold text-white"
                                : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
                            )}
                          >
                            <span className="app-sidebar-label">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </li>
          <li>
            <Link
              to={anunciosNavItem.href ?? "/app/anuncios"}
              title={collapsed ? anunciosNavItem.label : undefined}
              onClick={onNavigate}
              className={cn(
                "app-sidebar-link",
                isAnunciosActive
                  ? "bg-blue-600 font-semibold text-white"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
                collapsed && "justify-center px-2",
              )}
            >
              <anunciosNavItem.icon className="h-4 w-4 shrink-0" strokeWidth={isAnunciosActive ? 2 : 1.75} />
              {!collapsed && (
                <span className="app-sidebar-label font-semibold">{anunciosNavItem.label}</span>
              )}
            </Link>
          </li>
        </ul>

        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && <p className="app-sidebar-section">{section.title}</p>}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = isNavItemActive(item.href, location.pathname, searchParams);

                return (
                  <li key={item.label}>
                    <Link
                      to={item.href ?? "#"}
                      title={collapsed ? item.label : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "app-sidebar-link",
                        isActive
                          ? "bg-blue-600 font-semibold text-white"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                      {!collapsed && (
                        <>
                          <span className="app-sidebar-label">{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={cn(
                                "app-sidebar-badge",
                                isActive ? "bg-white/20 text-white" : "bg-white/[0.08] text-slate-400",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
