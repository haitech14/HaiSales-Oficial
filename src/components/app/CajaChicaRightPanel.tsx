import { RefreshCw } from "lucide-react";
import { formatCajaChicaAmount } from "@/lib/caja-chica/caja-chica-mock-data";
import type { CajaChicaSnapshot } from "@/lib/caja-chica/caja-chica-service";
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

function TipoDonutChart({
  segments,
  total,
}: {
  segments: CajaChicaSnapshot["tipoSegments"];
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
            <span className="shrink-0 font-semibold text-slate-800">{segment.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CajaChicaRightPanelProps = {
  className?: string;
  snapshot?: CajaChicaSnapshot | null;
  lastUpdatedAt: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function CajaChicaRightPanel({
  className,
  snapshot,
  lastUpdatedAt,
  onRefresh,
  isRefreshing,
}: CajaChicaRightPanelProps) {
  const total = snapshot?.totalRecords ?? 0;
  const categorias = snapshot?.gastosPorCategoria ?? [];
  const responsables = snapshot?.responsablesConSaldo ?? [];

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Movimientos por tipo</h3>
          <div className="mt-4">
            <TipoDonutChart segments={snapshot?.tipoSegments ?? []} total={total} />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Gastos por categoría</h3>
          <ul className="mt-3 space-y-3">
            {categorias.map((item) => (
              <li key={item.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="shrink-0 font-semibold text-slate-900">{item.percent}%</span>
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
          <h3 className="app-panel-title">Responsables con saldo</h3>
          <ul className="mt-3 space-y-2.5">
            {responsables.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="truncate font-medium text-slate-700">{item.name}</span>
                <span className="shrink-0 font-semibold text-emerald-600">
                  {formatCajaChicaAmount(item.balance, false)}
                </span>
              </li>
            ))}
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
