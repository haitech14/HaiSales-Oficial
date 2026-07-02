import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ChevronsLeft, ChevronsRight, Menu } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppSidebarContent } from "@/components/layout/AppSidebarContent";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col bg-[#0b1220] transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-[300px]",
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

      <AppSidebarContent collapsed={collapsed} showBrand={false} />
    </aside>
  );
}

type AppMobileHeaderProps = {
  onOpenMenu: () => void;
};

export function AppMobileHeader({ onOpenMenu }: AppMobileHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0b1220] px-4 md:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-sm font-bold text-white">HaiSales</span>
      <div className="h-10 w-10" aria-hidden="true" />
    </header>
  );
}

type AppMobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AppMobileNav({ open, onOpenChange }: AppMobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(100vw,300px)] border-none p-0 md:hidden">
        <AppSidebarContent onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
