import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { SupabaseHealthBanner } from "@/components/layout/SupabaseHealthBanner";
import { AppMobileHeader, AppMobileNav, AppSidebar } from "./AppSidebar";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9] md:flex-row">
      <AppMobileHeader onOpenMenu={() => setMobileNavOpen(true)} />
      <AppMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SupabaseHealthBanner />
        <ErrorBoundary fallbackTitle="Error en el módulo">
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
}
