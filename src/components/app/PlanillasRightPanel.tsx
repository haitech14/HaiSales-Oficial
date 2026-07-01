import { RefreshCw } from "lucide-react";
import {
  formatLaborCost,
  laborAlerts,
  laborCostByArea,
  staffByArea,
} from "@/lib/planillas-mock-data";
import { cn } from "@/lib/utils";

function StaffDonutChart() {
  const total = 86;
  let offset = 0;
  const circumference = 2 * Math.PI * 15.5;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          {staffByArea.map((area) => {
            const dash = (area.percent / 100) * circumference;
            const circle = (
              <circle
                key={area.label}
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={area.color}
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
  );
}

export function PlanillasRightPanel({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Personal por área</h3>
          <div className="mt-4">
            <StaffDonutChart />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Costo laboral por área</h3>
          <ul className="mt-3 space-y-3">
            {laborCostByArea.map((item) => (
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
        </section>

        <section className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="app-panel-title">Alertas laborales</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {laborAlerts.map((alert) => (
              <li key={alert.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{alert.label}</span>
                  <span className="font-semibold text-slate-800">{alert.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn("h-full rounded-full", alert.color)}
                    style={{ width: alert.width }}
                  />
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
