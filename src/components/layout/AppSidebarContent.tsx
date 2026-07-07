import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { EmpresaSucursalSwitcher } from "@/components/layout/EmpresaSucursalSwitcher";
import {
  appNavSections,
  anunciosNavItem,
  configuracionNavGroup,
  dashboardNavGroup,
  isConfiguracionRoute,
  type NavGroup,
} from "@/lib/app-navigation";
import { filterNavGroupByRole, filterNavSectionsByRole } from "@/lib/auth/roles";
import { useUserRole } from "@/hooks/useUserRole";
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

function isNavGroupSectionActive(
  group: NavGroup,
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  const isParentActive = group.href
    ? isNavItemActive(group.href, pathname, searchParams)
    : false;

  return (
    isParentActive ||
    group.items.some((item) => isNavItemActive(item.href, pathname, searchParams))
  );
}

type CollapsibleNavGroupProps = {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  searchParams: URLSearchParams;
  onNavigate?: () => void;
};

function CollapsibleNavGroup({
  group,
  collapsed,
  pathname,
  searchParams,
  onNavigate,
}: CollapsibleNavGroupProps) {
  const isSectionActive = isNavGroupSectionActive(group, pathname, searchParams);
  const isParentActive = group.href
    ? isNavItemActive(group.href, pathname, searchParams)
    : false;
  const [expanded, setExpanded] = useState(() =>
    group.items.some((item) => isNavItemActive(item.href, pathname, searchParams)),
  );

  useEffect(() => {
    const onSubItem = group.items.some((item) =>
      isNavItemActive(item.href, pathname, searchParams),
    );
    if (onSubItem) {
      setExpanded(true);
    }
  }, [group.items, pathname, searchParams]);

  const GroupIcon = group.icon;

  return (
    <li>
      {collapsed ? (
        <Link
          to={group.href ?? group.items[0]?.href ?? "#"}
          title={group.label}
          onClick={onNavigate}
          className={cn(
            "app-sidebar-link",
            isSectionActive
              ? "bg-blue-600 font-semibold text-white"
              : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
            "justify-center px-2",
          )}
        >
          <GroupIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={isSectionActive ? 2 : 1.75} />
        </Link>
      ) : (
        <div className="space-y-0.5">
          <div className="flex items-center gap-0.5">
            <Link
              to={group.href ?? group.items[0]?.href ?? "#"}
              onClick={onNavigate}
              className={cn(
                "app-sidebar-link min-w-0 flex-1",
                isParentActive
                  ? "bg-blue-600 font-semibold text-white"
                  : isSectionActive
                    ? "text-white"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-200",
              )}
            >
              <GroupIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span className="app-sidebar-label font-semibold">{group.label}</span>
            </Link>
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                isSectionActive
                  ? "text-slate-300 hover:bg-white/10 hover:text-white"
                  : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300",
              )}
              aria-label={expanded ? `Plegar menú ${group.label}` : `Desplegar menú ${group.label}`}
              aria-expanded={expanded}
            >
              <ChevronRight
                className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")}
              />
            </button>
          </div>
          {expanded && (
            <ul className="ml-3 space-y-0.5 border-l border-white/10 pl-2">
              {group.items.map((item) => {
                const isActive = isNavItemActive(item.href, pathname, searchParams);
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
  );
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
  const navSections = filterNavSectionsByRole(appNavSections, role);
  const configuracionGroup = filterNavGroupByRole(configuracionNavGroup, role);
  const isAnunciosActive = isNavItemActive(anunciosNavItem.href, location.pathname, searchParams);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-[#0b1220]", className)}>
      {showBrand && (
        <div className="flex items-center gap-2 px-3 py-3">
          <HaiSalesLogo
            to="/app/dashboard"
            theme="onDark"
            iconOnly={collapsed}
            onClick={onNavigate}
            imageClassName={collapsed ? "h-8 w-8 object-contain object-left" : "h-11 w-auto max-w-[210px]"}
          />
        </div>
      )}

      {showCompany && (
        <EmpresaSucursalSwitcher collapsed={collapsed} className="mx-2.5 mb-2.5" />
      )}

      <nav className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2.5 pb-3">
        <ul className="space-y-0.5">
          <CollapsibleNavGroup
            group={dashboardNavGroup}
            collapsed={collapsed}
            pathname={location.pathname}
            searchParams={searchParams}
            onNavigate={onNavigate}
          />
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
              <anunciosNavItem.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isAnunciosActive ? 2 : 1.75} />
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
                      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2 : 1.75} />
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
              {section.groups?.map((group) => (
                <CollapsibleNavGroup
                  key={group.label}
                  group={group}
                  collapsed={collapsed}
                  pathname={location.pathname}
                  searchParams={searchParams}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {configuracionGroup && (
        <div className="shrink-0 border-t border-white/10 px-2.5 py-2">
          <ul className="space-y-0.5">
            <li>
              <Link
                to={configuracionGroup.href ?? configuracionGroup.items[0]?.href ?? "#"}
                title={collapsed ? configuracionGroup.label : undefined}
                onClick={onNavigate}
                className={cn(
                  "app-sidebar-link",
                  isConfiguracionRoute(location.pathname)
                    ? "bg-blue-600 font-semibold text-white"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
                  collapsed && "justify-center px-2",
                )}
              >
                <configuracionGroup.icon
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={isConfiguracionRoute(location.pathname) ? 2 : 1.75}
                />
                {!collapsed && (
                  <span className="app-sidebar-label font-semibold">{configuracionGroup.label}</span>
                )}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
