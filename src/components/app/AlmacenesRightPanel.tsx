import { RefreshCw } from "lucide-react";
import type { AlmacenesSnapshot } from "@/lib/almacenes/almacenes-service";
import { cn } from "@/lib/utils";

type AlmacenesRightPanelProps = {
  className?: string;
  snapshot?: AlmacenesSnapshot | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function AlmacenesRightPanel({
  className,
  snapshot,
  onRefresh,
  isRefreshing,
}: AlmacenesRightPanelProps) {
  const movimientosPorTipo = snapshot?.movimientosPorTipo ?? [];
  const stockPorAlmacen = snapshot?.stockPorAlmacen ?? [];
  const alerts = snapshot?.alerts ?? [];
  const totalMovimientos = movimientosPorTipo.reduce((sum, item) => sum + item.count, 0);

  let dashOffset = 0;
  const donutSegments = movimientosPorTipo.map((item) => {
    const dash = `${item.percent} ${100 - item.percent}`;
    const offset = -dashOffset;
    dashOffset += item.percent;
    return { ...item, dash, offset };
  });

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Movimientos por tipo</h3>
          {totalMovimientos === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin movimientos registrados en kardex.</p>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  {donutSegments.map((segment) => (
                    <circle
                      key={segment.label}
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="3"
                      strokeDasharray={segment.dash}
                      strokeDashoffset={segment.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">{totalMovimientos}</span>
                  <span className="app-panel-meta">Total</span>
                </div>
              </div>
              <ul className="app-panel-list min-w-0 flex-1">
                {movimientosPorTipo.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-2 text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-800">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Stock por almacén</h3>
          {stockPorAlmacen.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin stock valorizado por almacén.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {stockPorAlmacen.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-slate-700">{item.label}</span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      S/ {item.amount.toLocaleString("es-PE")}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Alertas de almacén</h3>
          {alerts.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin alertas activas.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {alerts.map((alert) => (
                <li key={alert.label}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600">{alert.label}</span>
                    <span className="font-semibold text-slate-800">{alert.count}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full", alert.color)} style={{ width: alert.width }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Actualizar panel
          </button>
        )}
      </div>
    </aside>
  );
}
