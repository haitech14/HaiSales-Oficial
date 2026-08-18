import { Calendar, ChevronDown, Globe, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import { formatEstadisticasPeriodLabel } from "@/lib/estadisticas/estadisticas-service";
import type { EstadisticasScope } from "@/lib/estadisticas/estadisticas-types";
import { cn } from "@/lib/utils";

type EstadisticasPageHeaderProps = {
  scope: EstadisticasScope;
  onScopeChange: (scope: EstadisticasScope) => void;
};

export function EstadisticasPageHeader({ scope, onScopeChange }: EstadisticasPageHeaderProps) {
  const { preset, salesMonthKey, range, setPreset, setSalesMonth, options, salesMonthOptions } =
    useAppPeriod();

  return (
    <header className="border-b border-slate-200/80 bg-[#f3f4f6] px-6 py-5 sm:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Estadísticas</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            En vivo
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => onScopeChange("establecimiento")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                scope === "establecimiento"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              <Home className="h-4 w-4" />
              Establecimiento
            </button>
            <button
              type="button"
              onClick={() => onScopeChange("global")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                scope === "global"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              <Globe className="h-4 w-4" />
              Global
            </button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              {formatEstadisticasPeriodLabel(range)}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[min(420px,70vh)] w-64 overflow-y-auto">
            <DropdownMenuLabel>Periodo de análisis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {options.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setPreset(option.id)}
                className={cn(!salesMonthKey && preset === option.id && "bg-blue-50 text-blue-700")}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
            {salesMonthOptions.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Meses con ventas</DropdownMenuLabel>
                {salesMonthOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.key}
                    onClick={() => setSalesMonth(option.key)}
                    className={cn(salesMonthKey === option.key && "bg-blue-50 text-blue-700")}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
