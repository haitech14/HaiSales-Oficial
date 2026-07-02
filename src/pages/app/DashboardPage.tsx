import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { DashboardPageHeader, type DashboardMode } from "@/components/app/DashboardPageHeader";
import { DashboardRightPanel } from "@/components/app/DashboardRightPanel";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { dashboardTabs, type DashboardTabId } from "@/lib/dashboard-mock-data";
import { reportesKpis } from "@/lib/dashboard-reportes-data";

const DashboardGeneralView = lazy(() =>
  import("@/components/app/DashboardGeneralView").then((module) => ({
    default: module.DashboardGeneralView,
  })),
);
const DashboardDetalladoView = lazy(() =>
  import("@/components/app/DashboardDetalladoView").then((module) => ({
    default: module.DashboardDetalladoView,
  })),
);
const DashboardReportesView = lazy(() =>
  import("@/components/app/DashboardReportesView").then((module) => ({
    default: module.DashboardReportesView,
  })),
);

const validTabs = new Set<DashboardTabId>(dashboardTabs.map((tab) => tab.id));
const validModes = new Set<DashboardMode>(["general", "detallado", "reportes"]);

function parseMode(searchParams: URLSearchParams): DashboardMode {
  const mode = searchParams.get("mode");
  const tab = searchParams.get("tab");

  if (mode && validModes.has(mode as DashboardMode)) {
    return mode as DashboardMode;
  }
  if (tab === "reportes") {
    return "reportes";
  }
  return "general";
}

function parseTab(searchParams: URLSearchParams): DashboardTabId {
  const tab = searchParams.get("tab");

  if (tab && validTabs.has(tab as DashboardTabId) && tab !== "reportes") {
    return tab as DashboardTabId;
  }
  return "resumen";
}

function ViewFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  );
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<DashboardMode>(() => parseMode(searchParams));
  const [activeTab, setActiveTab] = useState<DashboardTabId>(() => parseTab(searchParams));
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();

  useEffect(() => {
    setMode(parseMode(searchParams));
    setActiveTab(parseTab(searchParams));
  }, [searchParams]);

  const handleModeChange = (nextMode: DashboardMode) => {
    setMode(nextMode);

    const params: Record<string, string> = {};
    if (nextMode !== "general") {
      params.mode = nextMode;
    }
    if (nextMode === "detallado" && activeTab !== "resumen") {
      params.tab = activeTab;
    }
    setSearchParams(params);
  };

  const handleTabChange = (tab: DashboardTabId) => {
    setActiveTab(tab);
    const params: Record<string, string> = { mode: "detallado" };
    if (tab !== "resumen") {
      params.tab = tab;
    }
    setSearchParams(params);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardPageHeader mode={mode} onModeChange={handleModeChange} />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <Suspense fallback={<ViewFallback />}>
              {mode === "general" && <DashboardGeneralView />}

              {mode === "detallado" && (
                <DashboardDetalladoView activeTab={activeTab} onTabChange={handleTabChange} />
              )}

              {mode === "reportes" && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {reportesKpis.map((kpi) => (
                      <CrmKpiCard key={kpi.label} {...kpi} />
                    ))}
                  </div>
                  <DashboardReportesView />
                </>
              )}
            </Suspense>
          </div>
        </div>

        {mode === "detallado" && (
          <AppRightPanelSlot
            panelHidden={panelHidden}
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
          >
            <DashboardRightPanel />
          </AppRightPanelSlot>
        )}
      </div>

      {mode === "detallado" && !isPanelVisible && (
        <button
          type="button"
          onClick={togglePanel}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg xl:hidden"
        >
          Mostrar panel
        </button>
      )}
    </div>
  );
}
