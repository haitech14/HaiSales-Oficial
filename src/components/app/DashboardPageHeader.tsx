import { Bell, Calendar, ChevronDown, CircleHelp, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardMode = "general" | "detallado" | "reportes";

const subtitles: Record<DashboardMode, string> = {
  general: "Resumen de la gestión financiera, comercial y operativa de tu empresa.",
  detallado: "Resumen ejecutivo y análisis de la gestión empresarial.",
  reportes: "Consulta, genera y exporta reportes de todas las áreas de tu empresa.",
};

type DashboardPageHeaderProps = {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
};

export function DashboardPageHeader({ mode, onModeChange }: DashboardPageHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Dashboard General</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitles[mode]}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
            <Calendar className="h-4 w-4" />
            01/06/2026 - 30/06/2026
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>

          {mode === "general" && (
            <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
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
              8
            </span>
          </button>

          {mode === "general" && (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
              aria-label="Información"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
          )}

          <Button
            type="button"
            variant={mode === "detallado" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("detallado")}
            className={cn(
              "h-9 px-3 text-sm font-semibold",
              mode === "detallado"
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "border-slate-200 text-slate-600",
            )}
          >
            Modo Detallado
          </Button>

          <Button
            type="button"
            variant={mode === "reportes" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("reportes")}
            className={cn(
              "h-9 px-3 text-sm font-semibold",
              mode === "reportes"
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "border-slate-200 text-slate-600",
            )}
          >
            Modo Reportes
          </Button>

          {mode !== "general" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onModeChange("general")}
              className="h-9 border-slate-200 px-3 text-sm font-semibold text-slate-600"
            >
              Vista resumida
            </Button>
          )}

          <Button className="h-9 gap-2 bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500">
            <Plus className="h-4 w-4" />
            Nuevo registro
            {mode === "general" && <ChevronDown className="h-3.5 w-3.5 opacity-80" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
