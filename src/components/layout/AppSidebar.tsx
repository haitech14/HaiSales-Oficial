import { useState } from "react";
import { ChevronsLeft, ChevronsRight, Menu } from "lucide-react";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppSidebarContent } from "@/components/layout/AppSidebarContent";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col bg-[#0b1220] transition-[width] duration-200 md:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <HaiSalesLogo
          to="/app/dashboard"
          iconOnly={collapsed}
          imageClassName={collapsed ? "h-8 w-8 object-cover object-left" : "h-10 max-w-[220px]"}
        />
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
      <HaiSalesLogo to="/app/dashboard" iconOnly imageClassName="h-8 w-8 object-cover object-left" />
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
      <SheetContent side="left" className="w-[min(100vw,248px)] border-none p-0 md:hidden">
        <AppSidebarContent onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
