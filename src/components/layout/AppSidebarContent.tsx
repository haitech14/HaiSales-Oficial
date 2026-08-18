import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { EmpresaSucursalSwitcher } from "@/components/layout/EmpresaSucursalSwitcher";
import { SIDEBAR_BG, SIDEBAR_SECTION } from "@/components/layout/sidebar-theme";
import {
  sidebarEstadisticasTile,
  sidebarMuralTile,
  sidebarNavSections,
  sidebarPrimaryTiles,
  sidebarWikiTile,
  type SidebarNavEntry,
} from "@/lib/app-navigation";
import { filterSidebarNavSections } from "@/lib/auth/roles";
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

function prefetchModulePage(href: string) {
  if (href === "/app/clientes") {
    void import("@/pages/app/ClientesPage");
    return;
  }
  if (href === "/app/ventas") {
    void import("@/pages/app/VentasPage");
    return;
  }
  if (href === "/app/servicios") {
    void import("@/pages/app/ServiciosPage");
    return;
  }
  if (href === "/app/pipeline") {
    void import("@/pages/app/PipelinePage");
    return;
  }
  if (href === "/app/wiki") {
    void import("@/pages/app/AnunciosPage");
    return;
  }
  if (href === "/app/mural") {
    void import("@/pages/app/MuralPage");
  }
}

function SidebarModuleTile({
  entry,
  isActive,
  collapsed,
  onNavigate,
}: {
  entry: SidebarNavEntry;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = entry.icon;
  const tileRing = isActive ? "ring-2 ring-inset ring-white/85" : "";

  if (collapsed) {
    return (
      <Link
        to={entry.href}
        onClick={onNavigate}
        onMouseEnter={() => prefetchModulePage(entry.href)}
        title={entry.label}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-xl text-white shadow-sm transition hover:brightness-110",
          tileRing,
        )}
        style={{ backgroundColor: entry.color }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {entry.badge != null && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-0.5 text-[9px] font-bold text-slate-800">
            {entry.badge}
          </span>
        )}
      </Link>
    );
  }

  if (entry.wide || entry.pill) {
    return (
      <div
        className={cn(
          "relative min-w-0 rounded-xl shadow-sm transition hover:brightness-105",
          entry.wide && "col-span-2",
          isActive && "ring-2 ring-white/80",
        )}
        style={{ backgroundColor: entry.color }}
      >
        {entry.badge != null && (
          <span className="absolute right-2 top-2 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-slate-800">
            {entry.badge}
          </span>
        )}
        <Link
          to={entry.href}
          onClick={onNavigate}
          onMouseEnter={() => prefetchModulePage(entry.href)}
          aria-label={entry.label}
          className="absolute inset-0 z-0 rounded-xl"
        />
        <div className="relative z-10 flex min-h-[42px] w-full items-center gap-2 px-2.5 py-2 pointer-events-none">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-white">
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="min-w-0 truncate text-left text-[13px] font-bold leading-tight">{entry.label}</span>
          </div>
          {entry.quickAction ? (
            <Link
              to={entry.quickAction.href}
              onClick={(event) => {
                event.stopPropagation();
                onNavigate?.();
              }}
              className="pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-white transition hover:bg-white/35"
            >
              {entry.quickAction.showPlus !== false ? (
                <Plus className="h-3 w-3" strokeWidth={2.5} />
              ) : null}
              {entry.quickAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl shadow-sm transition hover:brightness-105",
        tileRing,
      )}
      style={{ backgroundColor: entry.color }}
    >
      {entry.badge != null && (
        <span className="absolute right-2 top-2 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-slate-800">
          {entry.badge}
        </span>
      )}
      <Link
        to={entry.href}
        onClick={onNavigate}
        onMouseEnter={() => prefetchModulePage(entry.href)}
        aria-label={entry.label}
        className="absolute inset-0 z-0 rounded-xl"
      />
      <div className="relative z-10 flex min-h-[80px] flex-col justify-end p-3 pointer-events-none">
        <div className="relative mb-1.5 h-7">
          <Icon
            className="absolute left-0 top-0 h-[22px] w-[22px] text-white"
            strokeWidth={1.75}
          />
          {entry.quickAction ? (
            <Link
              to={entry.quickAction.href}
              onClick={(event) => {
                event.stopPropagation();
                onNavigate?.();
              }}
              className="pointer-events-auto absolute right-0 top-0 inline-flex max-w-[calc(100%-28px)] items-center gap-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-white transition hover:bg-white/35"
            >
              {entry.quickAction.showPlus !== false ? (
                <Plus className="h-3 w-3 shrink-0" strokeWidth={2.5} />
              ) : null}
              <span className="truncate">{entry.quickAction.label}</span>
            </Link>
          ) : null}
        </div>
        <span className="text-left text-xs font-bold leading-tight text-white">{entry.label}</span>
      </div>
    </div>
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
  const navSections = filterSidebarNavSections(sidebarNavSections, role);

  const collapsedTiles: SidebarNavEntry[] = [
    ...sidebarPrimaryTiles,
    ...navSections.flatMap((section) => section.entries),
  ];

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      {showBrand && (
        <div className="flex items-center justify-center px-3 pb-1 pt-3">
          <HaiSalesLogo
            to="/app/dashboard"
            theme="onDark"
            iconOnly={collapsed}
            onClick={onNavigate}
            className="mx-auto"
            imageClassName={
              collapsed
                ? "h-7 w-7 object-contain object-center"
                : "h-7 w-auto max-w-[96px] object-contain object-center"
            }
          />
        </div>
      )}

      {showCompany && (
        <EmpresaSucursalSwitcher collapsed={collapsed} className="mb-3 mt-1" />
      )}

      <div className="flex min-h-0 flex-1 flex-col px-3">
        <nav className="scrollbar-sidebar flex-1 space-y-4 overflow-y-auto overflow-x-hidden pb-3">
          {collapsed ? (
            <div className="grid grid-cols-2 gap-2">
              {collapsedTiles.map((entry) => (
                <SidebarModuleTile
                  key={entry.href}
                  entry={entry}
                  isActive={isNavItemActive(entry.href, location.pathname, searchParams)}
                  collapsed
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <SidebarModuleTile
                  entry={sidebarEstadisticasTile}
                  isActive={isNavItemActive(sidebarEstadisticasTile.href, location.pathname, searchParams)}
                  collapsed={false}
                  onNavigate={onNavigate}
                />
                <div className="grid grid-cols-2 gap-2">
                  <SidebarModuleTile
                    entry={sidebarWikiTile}
                    isActive={isNavItemActive(sidebarWikiTile.href, location.pathname, searchParams)}
                    collapsed={false}
                    onNavigate={onNavigate}
                  />
                  <SidebarModuleTile
                    entry={sidebarMuralTile}
                    isActive={isNavItemActive(sidebarMuralTile.href, location.pathname, searchParams)}
                    collapsed={false}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>

              {navSections.map((section) => (
                <div key={section.title}>
                  <p
                    className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: SIDEBAR_SECTION }}
                  >
                    {section.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {section.entries.map((entry) => (
                      <SidebarModuleTile
                        key={entry.href}
                        entry={entry}
                        isActive={isNavItemActive(entry.href, location.pathname, searchParams)}
                        collapsed={false}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
