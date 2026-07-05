import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import type { InventarioSnapshot } from "@/lib/inventario/types";
import { cn } from "@/lib/utils";

type InventarioRightPanelProps = {
  className?: string;
  snapshot?: InventarioSnapshot | null;
};

export function InventarioRightPanel({ className, snapshot }: InventarioRightPanelProps) {
  const stockByCategory = snapshot?.stockByCategory ?? [];
  const topRotationProducts = snapshot?.topRotationProducts ?? [];
  const inventoryAlerts = snapshot?.inventoryAlerts ?? [];
  const recentMovements = snapshot?.recentMovements ?? [];
  const totalInChart = stockByCategory.reduce((sum, item) => sum + item.count, 0);

  let dashOffset = 0;
  const donutSegments = stockByCategory.map((item) => {
    const dash = `${item.percent} ${100 - item.percent}`;
    const offset = -dashOffset;
    dashOffset += item.percent;
    return { ...item, dash, offset };
  });

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Stock por categoría</h3>
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
                <span className="text-xl font-bold text-slate-900">{totalInChart}</span>
                <span className="app-panel-meta">Total</span>
              </div>
            </div>
            <ul className="app-panel-list min-w-0 flex-1">
              {stockByCategory.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-2 text-slate-600">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-800">{item.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Productos con mayor rotación</h3>
          <ul className="mt-3 space-y-3">
            {topRotationProducts.map((product) => (
              <li key={product.name}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{product.name}</span>
                  <span className="shrink-0 font-semibold text-slate-900">{product.rotation}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${product.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="app-panel-title">Alertas de inventario</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {inventoryAlerts.map((alert) => (
              <li key={alert.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-slate-600">{alert.label}</span>
                  <span className="shrink-0 font-semibold text-slate-800">{alert.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn("h-full rounded-full", alert.color)} style={{ width: alert.width }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="app-panel-title">Movimientos recientes</h3>
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Kardex</span>
          </div>
          {recentMovements.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Sin movimientos aún. Al sincronizar ventas se registran salidas automáticamente.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {recentMovements.map((movement) => {
                const isEntrada = movement.tipo === "Entrada";
                return (
                  <li
                    key={movement.id}
                    className="rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-800">{movement.producto}</p>
                        <p className="truncate text-[10px] text-slate-500">
                          {movement.sku} · {movement.referencia}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-0.5 text-[10px] font-semibold",
                          isEntrada ? "text-emerald-600" : "text-red-600",
                        )}
                      >
                        {isEntrada ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        {isEntrada ? "+" : "−"}
                        {movement.cantidad} {movement.unidad}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {movement.fecha} {movement.hora} · {movement.almacen}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
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
