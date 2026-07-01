import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { BarChart3, ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { appNavSections } from "@/lib/app-navigation";
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
    return !searchParams.get("mode") && (!searchParams.get("tab") || searchParams.get("tab") === "resumen");
  }

  return true;
}

export function AppSidebar() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col bg-[#0b1220] transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[284px]",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link to="/app/dashboard" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          {!collapsed && <span className="truncate text-base font-bold text-white">HaiSales</span>}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mx-3 mb-4 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              HS
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">HAITECH S.A.C.</p>
              <p className="mt-0.5 text-xs text-slate-500">RUC 20600123456</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {appNavSections.map((section) => (
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
                      className={cn(
                        "app-sidebar-link",
                        isActive
                          ? "bg-blue-600 font-semibold text-white"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <item.icon
                        className={cn("mt-0.5 h-4 w-4 shrink-0", collapsed && "mt-0")}
                        strokeWidth={isActive ? 2 : 1.75}
                      />
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
    </aside>
  );
}
