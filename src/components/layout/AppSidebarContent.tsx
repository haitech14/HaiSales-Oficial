import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { EmpresaSucursalSwitcher } from "@/components/layout/EmpresaSucursalSwitcher";
import {
  appNavSections,
  anunciosNavItem,
  configuracionNavGroup,
  dashboardNavGroup,
  isConfiguracionRoute,
  loadSidebarViewMode,
  saveSidebarViewMode,
  type AppModuleTile,
  type NavGroup,
  type SidebarViewMode,
} from "@/lib/app-navigation";
import { filterNavGroupByRole, filterNavSectionsByRole } from "@/lib/auth/roles";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const MODULE_TILE_COLORS = [
  "bg-[#7cb342]",
  "bg-[#00897b]",
  "bg-[#43a047]",
  "bg-[#7e57c2]",
  "bg-[#d81b60]",
  "bg-[#00acc1]",
  "bg-[#e64a19]",
  "bg-[#1e88e5]",
  "bg-[#1976d2]",
  "bg-[#fb8c00]",
  "bg-[#ec407a]",
  "bg-[#c0ca33]",
  "bg-[#5e35b1]",
  "bg-[#039be5]",
  "bg-[#8e24aa]",
  "bg-[#f4511e]",
  "bg-[#6d4c41]",
  "bg-[#546e7a]",
] as const;

function toModuleTiles(
  entries: Array<{ id: string; label: string; href: string; icon: LucideIcon; wide?: boolean }>,
  colorOffset = 0,
): AppModuleTile[] {
  return entries.map((entry, index) => ({
    ...entry,
    color: MODULE_TILE_COLORS[(colorOffset + index) % MODULE_TILE_COLORS.length],
  }));
}

function ModuleTileLink({
  tile,
  pathname,
  searchParams,
  onNavigate,
}: {
  tile: AppModuleTile;
  pathname: string;
  searchParams: URLSearchParams;
  onNavigate?: () => void;
}) {
  const isActive = isNavItemActive(tile.href, pathname, searchParams);
  const Icon = tile.icon;

  return (
    <Link
      to={tile.href}
      onClick={onNavigate}
      title={tile.label}
      className={cn(
        "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-center text-white shadow-sm transition hover:brightness-110",
        tile.color,
        tile.wide && "col-span-2 min-h-[48px] flex-row gap-2",
        isActive && "ring-2 ring-white/70 ring-offset-1 ring-offset-[#15233b]",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      <span className="line-clamp-2 text-[10px] font-semibold leading-tight">{tile.label}</span>
    </Link>
  );
}

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
  viewMode?: SidebarViewMode;
  onViewModeChange?: (mode: SidebarViewMode) => void;
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebarContent({
  collapsed = false,
  showBrand = true,
  showCompany = true,
  viewMode: viewModeProp,
  onViewModeChange,
  onNavigate,
  className,
}: AppSidebarContentProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { role } = useUserRole();
  const [internalViewMode, setInternalViewMode] = useState<SidebarViewMode>(() => loadSidebarViewMode());
  const viewMode = viewModeProp ?? internalViewMode;
  const setViewMode = (mode: SidebarViewMode) => {
    saveSidebarViewMode(mode);
    onViewModeChange?.(mode);
    if (viewModeProp === undefined) setInternalViewMode(mode);
  };

  const navSections = filterNavSectionsByRole(appNavSections, role);
  const configuracionGroup = filterNavGroupByRole(configuracionNavGroup, role);

  let colorOffset = 0;
  const generalModuleTiles = toModuleTiles(
    [
      {
        id: "dashboard",
        label: dashboardNavGroup.label,
        href: dashboardNavGroup.href ?? "/app/dashboard",
        icon: dashboardNavGroup.icon,
      },
      {
        id: "wiki",
        label: anunciosNavItem.label,
        href: anunciosNavItem.href ?? "/app/anuncios",
        icon: anunciosNavItem.icon,
      },
    ],
    colorOffset,
  );
  colorOffset += generalModuleTiles.length;

  const moduleSections = navSections.map((section) => {
    const entries = [
      ...section.items
        .filter((item): item is typeof item & { href: string } => Boolean(item.href))
        .map((item) => ({
          id: item.href,
          label: item.label,
          href: item.href,
          icon: item.icon,
        })),
      ...(section.groups ?? []).flatMap((group) => {
        const href = group.href ?? group.items[0]?.href;
        if (!href) return [];
        return [
          {
            id: href,
            label: group.label,
            href,
            icon: group.icon,
          },
        ];
      }),
    ];
    const tiles = toModuleTiles(entries, colorOffset);
    colorOffset += tiles.length;
    return { title: section.title, tiles };
  });

  const configModuleTiles = configuracionGroup
    ? toModuleTiles(
        [
          {
            id: "configuracion",
            label: configuracionGroup.label,
            href: configuracionGroup.href ?? configuracionGroup.items[0]?.href ?? "/app/parametros",
            icon: configuracionGroup.icon,
          },
        ],
        colorOffset,
      )
    : [];

  const isAnunciosActive = isNavItemActive(anunciosNavItem.href, location.pathname, searchParams);
  const showModules = !collapsed && viewMode === "modulos";

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-[#15233b]", className)}>
      {showBrand && (
        <div className="flex items-center gap-2 px-3 py-3">
          <HaiSalesLogo
            to="/app/dashboard"
            theme="onDark"
            iconOnly={collapsed}
            onClick={onNavigate}
            imageClassName={collapsed ? "h-7 w-7 object-contain object-left" : "h-9 w-auto max-w-[170px]"}
          />
        </div>
      )}

      {showCompany && (
        <EmpresaSucursalSwitcher collapsed={collapsed} className="mx-2 mb-2" />
      )}

      {!collapsed && (
        <div className="mx-2 mb-2 flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("lista")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[10px] font-semibold transition",
              viewMode === "lista"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
            aria-pressed={viewMode === "lista"}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode("modulos")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[10px] font-semibold transition",
              viewMode === "modulos"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
            aria-pressed={viewMode === "modulos"}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Módulos
          </button>
        </div>
      )}

      {showModules ? (
        <nav className="scrollbar-sidebar flex-1 space-y-2.5 overflow-y-auto overflow-x-hidden px-2 pb-3">
          <div>
            <p className="app-sidebar-section mb-1.5">General</p>
            <div className="grid grid-cols-2 gap-1.5">
              {generalModuleTiles.map((tile) => (
                <ModuleTileLink
                  key={tile.id}
                  tile={tile}
                  pathname={location.pathname}
                  searchParams={searchParams}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>

          {moduleSections.map((section) => (
            <div key={section.title}>
              <p className="app-sidebar-section mb-1.5">{section.title}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {section.tiles.map((tile) => (
                  <ModuleTileLink
                    key={tile.id}
                    tile={tile}
                    pathname={location.pathname}
                    searchParams={searchParams}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}

          {configModuleTiles.length > 0 && (
            <div>
              <p className="app-sidebar-section mb-1.5">Sistema</p>
              <div className="grid grid-cols-2 gap-1.5">
                {configModuleTiles.map((tile) => (
                  <ModuleTileLink
                    key={tile.id}
                    tile={tile}
                    pathname={location.pathname}
                    searchParams={searchParams}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>
      ) : (
        <>
          <nav className="flex-1 space-y-2.5 overflow-y-auto overflow-x-hidden px-2 pb-3">
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
                  <anunciosNavItem.icon
                    className="h-[18px] w-[18px] shrink-0"
                    strokeWidth={isAnunciosActive ? 2 : 1.75}
                  />
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
                          <item.icon
                            className="h-[18px] w-[18px] shrink-0"
                            strokeWidth={isActive ? 2 : 1.75}
                          />
                          {!collapsed && (
                            <>
                              <span className="app-sidebar-label">{item.label}</span>
                              {item.badge !== undefined && (
                                <span
                                  className={cn(
                                    "app-sidebar-badge",
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : "bg-white/[0.08] text-slate-400",
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
            <div className="shrink-0 border-t border-white/10 px-2 py-2">
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
                      <span className="app-sidebar-label font-semibold">
                        {configuracionGroup.label}
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
