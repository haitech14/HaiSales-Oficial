import { useState } from "react";
import { ChevronsLeft, ChevronsRight, Menu } from "lucide-react";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppSidebarContent } from "@/components/layout/AppSidebarContent";
import { AppSidebarHeaderActions } from "@/components/layout/AppSidebarHeaderActions";
import { SIDEBAR_BG, SIDEBAR_WIDTH } from "@/components/layout/sidebar-theme";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col self-start transition-[width] duration-200 md:flex",
        collapsed && "w-[72px]",
      )}
      style={{
        backgroundColor: SIDEBAR_BG,
        width: collapsed ? 72 : SIDEBAR_WIDTH,
      }}
    >
      <div className="flex items-center justify-between gap-1 border-b border-white/10 px-2 py-2.5">
        <HaiSalesLogo
          to="/app/dashboard"
          theme="onDark"
          iconOnly={collapsed}
          className="min-w-0 shrink"
          imageClassName={
            collapsed
              ? "h-7 w-7 object-contain object-left"
              : "h-7 w-auto max-w-[96px] object-contain object-left"
          }
        />
        <div className="flex shrink-0 items-center gap-0.5">
          {!collapsed ? <AppSidebarHeaderActions iconClassName="h-[17px] w-[17px]" /> : null}
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white/90"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <AppSidebarContent
        collapsed={collapsed}
        showBrand={false}
        className="min-h-0 flex-1"
      />
    </aside>
  );
}

type AppMobileHeaderProps = {
  onOpenMenu: () => void;
};

export function AppMobileHeader({ onOpenMenu }: AppMobileHeaderProps) {
  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 md:hidden"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <HaiSalesLogo
          to="/app/dashboard"
          theme="onDark"
          iconOnly={false}
          className="min-w-0"
          imageClassName="h-7 w-auto max-w-[96px] object-contain object-left"
        />
      </div>
      <AppSidebarHeaderActions />
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
      <SheetContent
        side="left"
        className="border-none p-0 md:hidden"
        style={{ backgroundColor: SIDEBAR_BG, width: `min(100vw, ${SIDEBAR_WIDTH}px)` }}
      >
        <AppSidebarContent onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
