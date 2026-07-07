import { RefreshCw } from "lucide-react";
import type { ClientesAnalytics } from "@/lib/clientes/clientes-service";
import { formatDebtAmount } from "@/lib/clientes-mock-data";
import { cn } from "@/lib/utils";

function formatRelativeTime(date: Date | null) {
  if (!date) return "sin sincronizar";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));

  if (minutes < 60) return `hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} hora${hours === 1 ? "" : "s"}`;

  const days = Math.round(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}

function SegmentDonutChart({
  segments,
  total,
}: {
  segments: ClientesAnalytics["segments"];
  total: number;
}) {
  let offset = 0;
  const circumference = 2 * Math.PI * 15.5;

  if (segments.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
        Sin datos de segmento
      </div>
    );
  }

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
          <span className="text-xl font-bold text-slate-900">{total.toLocaleString("es-PE")}</span>
          <span className="app-panel-meta">Total</span>
        </div>
      </div>
      <ul className="app-panel-list min-w-0 flex-1">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-2 text-slate-600">
            <span className="flex items-center gap-1.5 truncate">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
            </span>
            <span className="shrink-0 font-semibold text-slate-800">
              {segment.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ClientesRightPanelProps = {
  className?: string;
  analytics: ClientesAnalytics | null;
  totalClients: number;
  lastUpdatedAt: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function ClientesRightPanel({
  className,
  analytics,
  totalClients,
  lastUpdatedAt,
  onRefresh,
  isRefreshing,
}: ClientesRightPanelProps) {
  const segments = analytics?.segments ?? [];
  const debtByAge = analytics?.debtByAge ?? [];
  const topExecutives = analytics?.topExecutives ?? [];
  const hasDebt = debtByAge.some((item) => item.amount > 0);

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Clientes por segmento</h3>
          <div className="mt-4">
            <SegmentDonutChart segments={segments} total={totalClients} />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Deuda por antigüedad</h3>
          {hasDebt ? (
            <ul className="mt-3 space-y-3">
              {debtByAge.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatDebtAmount(item.amount)}{" "}
                      <span className="font-normal text-slate-400">{item.percent}%</span>
                    </span>
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
          ) : (
            <p className="mt-3 text-sm text-slate-500">Sin cobranzas pendientes.</p>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Ejecutivos con más cartera</h3>
          {topExecutives.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {topExecutives.map((exec) => (
                <li key={exec.name}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-slate-700">{exec.name}</span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {exec.metricLabel === "clientes"
                        ? `${exec.portfolio} cliente${exec.portfolio === 1 ? "" : "s"}`
                        : formatDebtAmount(exec.portfolio)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${exec.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Sin ejecutivos asignados en los clientes.</p>
          )}
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
