import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CrmKpiCard } from "@/components/app/CrmShared";
import { DashboardDetalladoView } from "@/components/app/DashboardDetalladoView";
import { DashboardGeneralView } from "@/components/app/DashboardGeneralView";
import { DashboardPageHeader, type DashboardMode } from "@/components/app/DashboardPageHeader";
import { DashboardReportesView } from "@/components/app/DashboardReportesView";
import { DashboardRightPanel } from "@/components/app/DashboardRightPanel";
import { dashboardTabs, type DashboardTabId } from "@/lib/dashboard-mock-data";
import { reportesKpis } from "@/lib/dashboard-reportes-data";

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

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<DashboardMode>(() => parseMode(searchParams));
  const [activeTab, setActiveTab] = useState<DashboardTabId>(() => parseTab(searchParams));

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
          <div className="space-y-5 p-6">
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
          </div>
        </div>

        {mode === "detallado" && <DashboardRightPanel className="hidden xl:block" />}
      </div>
    </div>
  );
}
