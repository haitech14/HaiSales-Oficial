import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { EstadisticasPageHeader } from "@/components/app/estadisticas/EstadisticasPageHeader";
import { DashboardPageHeader, type DashboardView } from "@/components/app/DashboardPageHeader";
import { DashboardRightPanel } from "@/components/app/DashboardRightPanel";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { dashboardTabs, type DashboardTabId } from "@/lib/dashboard-mock-data";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import type { EstadisticasScope } from "@/lib/estadisticas/estadisticas-types";

const EstadisticasView = lazy(() =>
  import("@/components/app/estadisticas/EstadisticasView").then((module) => ({
    default: module.EstadisticasView,
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

function parseView(searchParams: URLSearchParams): DashboardView {
  const mode = searchParams.get("mode");
  if (mode === "reportes") return "reportes";
  if (mode === "resumen" || mode === "detallado") return "resumen";
  return "dashboard";
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
  const view = parseView(searchParams);
  const [activeTab, setActiveTab] = useState<DashboardTabId>(() => parseTab(searchParams));
  const [estadisticasScope, setEstadisticasScope] = useState<EstadisticasScope>("establecimiento");
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const { data: analytics } = useDashboardAnalytics();
  const { range } = useAppPeriod();

  useEffect(() => {
    setActiveTab(parseTab(searchParams));
  }, [searchParams]);

  const handleTabChange = (tab: DashboardTabId) => {
    setActiveTab(tab);
    const params: Record<string, string> = { mode: "resumen" };
    if (tab !== "resumen") {
      params.tab = tab;
    }
    setSearchParams(params);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f4f6]">
      {view === "dashboard" ? (
        <EstadisticasPageHeader scope={estadisticasScope} onScopeChange={setEstadisticasScope} />
      ) : (
        <DashboardPageHeader view={view} />
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="app-page-body">
            <Suspense fallback={<ViewFallback />}>
              {view === "dashboard" && <EstadisticasView />}

              {view === "resumen" && (
                <DashboardDetalladoView activeTab={activeTab} onTabChange={handleTabChange} />
              )}

              {view === "reportes" && (
                <>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-800">
                    Reportes y gráficos del periodo <span className="font-semibold">{range.label}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {(analytics?.reportesKpis ?? []).map((kpi) => (
                      <CrmKpiCard key={kpi.label} {...kpi} />
                    ))}
                  </div>
                  <DashboardReportesView />
                </>
              )}
            </Suspense>
          </div>
        </div>

        {view === "resumen" && (
          <AppRightPanelSlot
            panelHidden={panelHidden}
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
          >
            <DashboardRightPanel />
          </AppRightPanelSlot>
        )}
      </div>

      {view === "resumen" && !isPanelVisible && (
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
