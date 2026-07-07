import { AlertTriangle, RefreshCw } from "lucide-react";
import type { AnunciosSnapshot } from "@/lib/anuncios/anuncios-service";
import { anuncioAreas } from "@/lib/anuncios/anuncios-mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function formatRelativeTime(date: Date | null) {
  if (!date) return "sin sincronizar";
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours} hora${hours === 1 ? "" : "s"}`;
}

function AreaDonutChart({
  segments,
  total,
}: {
  segments: AnunciosSnapshot["pendientesPorArea"];
  total: number;
}) {
  let offset = 0;
  const circumference = 2 * Math.PI * 15.5;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          {segments.map((segment) => {
            const dash = (segment.percent / 100) * circumference;
            const circle = (
              <circle
                key={segment.label}
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={segment.color}
                strokeWidth="3"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{total}</span>
          <span className="app-panel-meta">Total</span>
        </div>
      </div>
      <ul className="app-panel-list min-w-0 flex-1">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-2 text-slate-600">
            <span className="truncate">{segment.label}</span>
            <span className="shrink-0 font-semibold text-slate-800">
              {segment.count} ({segment.percent}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type AnunciosRightPanelProps = {
  className?: string;
  snapshot?: AnunciosSnapshot | null;
  lastUpdatedAt: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function AnunciosRightPanel({
  className,
  snapshot,
  lastUpdatedAt,
  onRefresh,
  isRefreshing,
}: AnunciosRightPanelProps) {
  const total = snapshot?.totalTasks ?? 0;
  const avance = snapshot?.avancePorArea ?? [];
  const criticas = snapshot?.tareasCriticas ?? [];

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Pendientes por área</h3>
          <div className="mt-4">
            <AreaDonutChart segments={snapshot?.pendientesPorArea ?? []} total={total} />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Avance por área</h3>
          <ul className="mt-3 space-y-3">
            {avance.map((item) => (
              <li key={item.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.percent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn("h-full rounded-full", item.color)}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Tareas críticas</h3>
          <ul className="mt-3 space-y-2.5">
            {criticas.map((task) => {
              const area = anuncioAreas.find((item) => item.id === task.area);
              return (
                <li
                  key={task.title}
                  className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/40 px-2.5 py-2"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800">{task.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {task.dueDate}
                      {area ? ` · ${area.label}` : ""}
                    </p>
                  </div>
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                      {task.assigneeInitials}
                    </AvatarFallback>
                  </Avatar>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Actualizado: {formatRelativeTime(lastUpdatedAt)}</span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
