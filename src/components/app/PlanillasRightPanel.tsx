import { RefreshCw } from "lucide-react";
import { formatLaborCost } from "@/lib/planillas-mock-data";
import type { PlanillasSnapshot } from "@/lib/planillas/types";
import { cn } from "@/lib/utils";

const AREA_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#ef4444"];

export function PlanillasRightPanel({
  className,
  snapshot,
}: {
  className?: string;
  snapshot?: PlanillasSnapshot | null;
}) {
  const workers = snapshot?.workers ?? [];
  const activos = workers.filter((worker) => worker.estado === "Activo" && !worker.esBorrador);

  const staffByArea = [...activos.reduce((map, worker) => {
    map.set(worker.area, (map.get(worker.area) ?? 0) + 1);
    return map;
  }, new Map<string, number>())].map(([label, count], index) => ({
    label,
    count,
    percent: activos.length > 0 ? Math.round((count / activos.length) * 100) : 0,
    color: AREA_COLORS[index % AREA_COLORS.length],
  }));

  const laborCostByArea = [...activos.reduce((map, worker) => {
    map.set(worker.area, (map.get(worker.area) ?? 0) + worker.sueldo);
    return map;
  }, new Map<string, number>())].map(([label, amount]) => ({ label, amount }));

  const totalLabor = laborCostByArea.reduce((sum, item) => sum + item.amount, 0);
  const laborRows = laborCostByArea.map((item) => ({
    ...item,
    percent: totalLabor > 0 ? Math.round((item.amount / totalLabor) * 100) : 0,
  }));

  const asistenciaPendiente = workers.filter(
    (worker) => worker.asistenciaDias < worker.asistenciaTotal,
  ).length;

  let dashOffset = 0;
  const donutSegments = staffByArea.map((area) => {
    const dash = `${area.percent} ${100 - area.percent}`;
    const offset = -dashOffset;
    dashOffset += area.percent;
    return { ...area, dash, offset };
  });

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Personal por área</h3>
          {activos.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin trabajadores activos registrados.</p>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  {donutSegments.map((area) => (
                    <circle
                      key={area.label}
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={area.color}
                      strokeWidth="3"
                      strokeDasharray={area.dash}
                      strokeDashoffset={area.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">{activos.length}</span>
                  <span className="app-panel-meta">Total</span>
                </div>
              </div>
              <ul className="app-panel-list min-w-0 flex-1">
                {staffByArea.map((area) => (
                  <li key={area.label} className="flex items-center justify-between gap-2 text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      {area.label}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-800">
                      {area.count}{" "}
                      <span className="font-normal text-slate-400">({area.percent}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Costo laboral por área</h3>
          {laborRows.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin costos laborales registrados.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {laborRows.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-slate-700">{item.label}</span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatLaborCost(item.amount)}{" "}
                      <span className="font-normal text-slate-400">({item.percent}%)</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Alertas laborales</h3>
          {asistenciaPendiente === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin alertas activas.</p>
          ) : (
            <p className="mt-3 text-xs text-slate-600">
              {asistenciaPendiente} trabajador{asistenciaPendiente === 1 ? "" : "es"} con asistencia
              pendiente de registrar.
            </p>
          )}
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>{workers.length} trabajadores sincronizados</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
