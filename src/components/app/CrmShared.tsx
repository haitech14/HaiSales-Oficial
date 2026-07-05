import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, ChevronDown, CircleHelp, Filter, PanelRightClose, Plus, RefreshCw } from "lucide-react";
import { AppPeriodFilter } from "@/components/app/AppPeriodFilter";
import { GlobalSearchTrigger } from "@/components/app/GlobalSearch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type AppPageHeaderActionItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
};

type AppPageHeaderProps = {
  title: string;
  subtitle: string;
  showPanelToggle?: boolean;
  panelHidden?: boolean;
  onTogglePanel?: () => void;
  panelToggleLabel?: string;
  panelToggleLabelHidden?: string;
  showDateRange?: boolean;
  showFiltersButton?: boolean;
  filtersButtonLabel?: string;
  hideHelp?: boolean;
  actionLabel?: string;
  showActionDropdown?: boolean;
  actionDropdownItems?: AppPageHeaderActionItem[];
  notificationCount?: number;
  onActionClick?: () => void;
};

export function AppPageHeader({
  title,
  subtitle,
  showPanelToggle = false,
  panelHidden = false,
  onTogglePanel,
  panelToggleLabel = "Ocultar panel",
  panelToggleLabelHidden = "Mostrar panel",
  showDateRange = false,
  showFiltersButton = false,
  filtersButtonLabel = "Filtros",
  hideHelp = false,
  actionLabel = "+ Nueva oportunidad",
  showActionDropdown = false,
  actionDropdownItems = [],
  notificationCount = 0,
  onActionClick,
}: AppPageHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="app-page-title">{title}</h1>
          <p className="app-page-subtitle">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GlobalSearchTrigger />

          {showDateRange && <AppPeriodFilter className="hidden sm:inline-flex" />}

          {showFiltersButton && (
            <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{filtersButtonLabel}</span>
            </Button>
          )}

          {showPanelToggle && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTogglePanel}
              className="h-9 gap-2 border-slate-200 text-slate-600"
            >
              <PanelRightClose className="h-4 w-4" />
              <span className="hidden sm:inline">
                {panelHidden ? panelToggleLabelHidden : panelToggleLabel}
              </span>
            </Button>
          )}
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>
          {!hideHelp && (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
              aria-label="Ayuda"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
          )}
          {showActionDropdown && actionDropdownItems.length > 0 ? (
            <div className="inline-flex items-stretch rounded-lg shadow-sm">
              <Button
                type="button"
                onClick={onActionClick}
                className="h-9 gap-2 rounded-r-none bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                {actionLabel}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    className="h-9 rounded-l-none border-l border-blue-500/30 bg-blue-600 px-2.5 hover:bg-blue-500"
                    aria-label="Más acciones"
                  >
                    <ChevronDown className="h-3.5 w-3.5 opacity-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {actionDropdownItems.map((item, index) => {
                    const Icon = item.icon;
                    const showSeparator = index > 0 && item.id === "download-template";

                    return (
                      <div key={item.id}>
                        {showSeparator && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          className="gap-2 text-slate-700 focus:text-slate-900"
                          onClick={item.onClick}
                        >
                          {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                          {item.label}
                        </DropdownMenuItem>
                      </div>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              type="button"
              onClick={onActionClick}
              className="h-9 gap-2 bg-blue-600 px-3 text-sm font-semibold hover:bg-blue-500 sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{actionLabel}</span>
              <span className="sm:hidden">Nuevo</span>
              {showActionDropdown && <ChevronDown className="h-3.5 w-3.5 opacity-80" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function KpiValueDisplay({ value }: { value: string }) {
  const match = value.match(/^(S\/|USD)\s+(.+)$/);
  if (match) {
    return (
      <p className="app-kpi-value flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-sm font-semibold text-slate-500 sm:text-base">{match[1]}</span>
        <span>{match[2]}</span>
      </p>
    );
  }
  return <p className="app-kpi-value whitespace-nowrap">{value}</p>;
}

export function CrmKpiCard({
  label,
  value,
  change,
  sparkColor,
  sparkPoints,
  changePositive = true,
  icon: Icon,
  iconBg,
  iconColor,
  note,
}: {
  label: string;
  value: string;
  change: string;
  sparkColor: string;
  sparkPoints: number[];
  changePositive?: boolean;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  note?: string;
}) {
  const max = Math.max(...sparkPoints);
  const min = Math.min(...sparkPoints);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const points = sparkPoints
    .map((point, index) => {
      const x = (index / (sparkPoints.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 6) + 3;
      return `${x},${y}`;
    })
    .join(" ");

  const card = (
    <article
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm",
        note && "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="app-kpi-label">{label}</p>
        {Icon && iconBg && iconColor && (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
            <Icon className={cn("h-4 w-4", iconColor)} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <KpiValueDisplay value={value} />
          <p
            className={cn(
              "app-kpi-change",
              changePositive ? "text-emerald-600" : "text-red-600",
            )}
          >
            {change}
          </p>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-[120px] shrink-0" aria-hidden="true">
          <polyline
            points={points}
            fill="none"
            stroke={sparkColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </article>
  );

  if (!note) {
    return card;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs leading-snug">
        Margen de utilidad: {note}
      </TooltipContent>
    </Tooltip>
  );
}

export function CrmRightPanel({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Pipeline por etapa</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="28 72" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="19 81" strokeDashoffset="-28" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="22 78" strokeDashoffset="-47" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="14 86" strokeDashoffset="-69" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="9 91" strokeDashoffset="-83" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">128</span>
                <span className="app-panel-meta">Total</span>
              </div>
            </div>
            <ul className="app-panel-list min-w-0 flex-1">
              {[
                ["Prospectos", "36", "28%"],
                ["Calificación", "24", "19%"],
                ["Propuesta", "28", "22%"],
                ["Negociación", "18", "14%"],
                ["Cierre ganado", "12", "9%"],
                ["Perdidas", "10", "8%"],
              ].map(([label, count, percent]) => (
                <li key={label} className="flex items-center justify-between gap-2 text-slate-600">
                  <span className="truncate">{label}</span>
                  <span className="shrink-0 font-semibold text-slate-800">
                    {count} <span className="font-normal text-slate-400">{percent}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Ventas por vendedor</h3>
          <ul className="mt-3 space-y-3">
            {[
              ["Jhelcen Romero", "S/ 186,400", "100%"],
              ["Ana Martínez", "S/ 152,800", "82%"],
              ["Juan Campos", "S/ 98,400", "53%"],
              ["María Gómez", "S/ 48,600", "26%"],
            ].map(([name, amount, width]) => (
              <li key={name}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{name}</span>
                  <span className="shrink-0 font-semibold text-slate-900">{amount}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Actividades pendientes</h3>
          <ul className="mt-3 space-y-3">
            {[
              ["Llamadas por realizar", 18, "bg-red-500", "100%"],
              ["Reuniones agendadas", 12, "bg-orange-500", "67%"],
              ["Correos por enviar", 9, "bg-amber-400", "50%"],
              ["Seguimientos pendientes", 7, "bg-emerald-500", "39%"],
            ].map(([label, count, color, width]) => (
              <li key={label as string}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{label as string}</span>
                  <span className="font-semibold text-slate-800">{count as number}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn("h-full rounded-full", color as string)} style={{ width: width as string }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Actualizado: hace 31 minutos</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
