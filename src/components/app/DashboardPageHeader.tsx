import { Bell, ChevronDown, CircleHelp, Filter, Plus } from "lucide-react";
import { AppPeriodFilter } from "@/components/app/AppPeriodFilter";
import { GlobalSearchTrigger } from "@/components/app/GlobalSearch";
import { Button } from "@/components/ui/button";
export type DashboardView = "dashboard" | "resumen" | "reportes";

const titles: Record<DashboardView, string> = {
  dashboard: "Dashboard",
  resumen: "Resumen",
  reportes: "Reportes",
};

const subtitles: Record<DashboardView, string> = {
  dashboard: "Gráficos e indicadores de la gestión financiera, comercial y operativa.",
  resumen: "Detalle ejecutivo y análisis por área de tu empresa.",
  reportes: "Consulta, genera y exporta reportes de todas las áreas de tu empresa.",
};

type DashboardPageHeaderProps = {
  view: DashboardView;
};

export function DashboardPageHeader({ view }: DashboardPageHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="app-page-title sm:text-base">
            {titles[view]}
          </h1>
          <p className="app-page-subtitle">{subtitles[view]}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GlobalSearchTrigger />
          <AppPeriodFilter />

          {view === "dashboard" && (            <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
              <Filter className="h-4 w-4" />
              Ocultar filtros
            </Button>
          )}

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              0
            </span>          </button>

          {view === "dashboard" && (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
              aria-label="Información"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
          )}

          <Button className="h-9 gap-2 bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500">
            <Plus className="h-4 w-4" />
            Nuevo registro
            {view === "dashboard" && <ChevronDown className="h-3.5 w-3.5 opacity-80" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
