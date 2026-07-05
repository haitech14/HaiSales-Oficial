import { useState } from "react";
import { Outlet } from "react-router-dom";
import { OnboardingSetupOverlay } from "@/components/onboarding/OnboardingSetupOverlay";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { SupabaseHealthBanner } from "@/components/layout/SupabaseHealthBanner";
import { useEmpresaSetupStatus } from "@/hooks/useEmpresaConfig";
import { AppPeriodProvider } from "@/hooks/useAppPeriod";
import { GlobalSearchProvider } from "@/components/app/GlobalSearch";
import { cn } from "@/lib/utils";
import { AppMobileHeader, AppMobileNav, AppSidebar } from "./AppSidebar";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isSetupComplete, isLoading } = useEmpresaSetupStatus();
  const setupOpen = !isLoading && !isSetupComplete;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f4f6f9] md:flex-row">
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row",
          setupOpen && "pointer-events-none select-none",
        )}
      >
        <AppMobileHeader onOpenMenu={() => setMobileNavOpen(true)} />
        <AppMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <SupabaseHealthBanner />
          <ErrorBoundary fallbackTitle="Error en el módulo">
            <AppPeriodProvider>
              <GlobalSearchProvider>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <Outlet />
                </div>
              </GlobalSearchProvider>
            </AppPeriodProvider>
          </ErrorBoundary>
        </div>
      </div>

      {setupOpen && <OnboardingSetupOverlay />}
    </div>
  );
}
