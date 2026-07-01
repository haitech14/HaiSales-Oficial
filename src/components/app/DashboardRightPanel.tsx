import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardRightPanel({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="text-sm font-bold text-slate-900">Distribución financiera</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="48 52" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="27 73" strokeDashoffset="-48" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="-75" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="-90" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
                <span className="text-[11px] font-bold leading-tight text-slate-900">S/ 811,000</span>
                <span className="text-[10px] text-slate-500">Total</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5 text-[11px]">
              {[
                ["Ingresos", "48%", "S/ 389,280", "bg-emerald-500"],
                ["Gastos", "27%", "S/ 218,970", "bg-red-500"],
                ["Utilidad", "15%", "S/ 121,650", "bg-blue-500"],
                ["Inversiones", "10%", "S/ 81,100", "bg-violet-500"],
              ].map(([label, percent, amount, color]) => (
                <li key={label} className="flex items-center justify-between gap-2 text-slate-600">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", color)} />
                    {label}
                  </span>
                  <span className="shrink-0 text-right font-semibold text-slate-800">
                    {percent}
                    <span className="block text-[10px] font-normal text-slate-400">{amount}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-900">Ingresos por línea</h3>
          <ul className="mt-3 space-y-3">
            {[
              ["Productos", "S/ 142,800", "58%"],
              ["Servicios", "S/ 68,400", "28%"],
              ["Proyectos", "S/ 24,300", "10%"],
              ["Suscripciones", "S/ 10,180", "4%"],
            ].map(([label, amount, width]) => (
              <li key={label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{label}</span>
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
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Alertas críticas</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {[
              ["Pagos por vencer", 18, "bg-red-500", "100%"],
              ["Cobranzas atrasadas", 12, "bg-red-500", "67%"],
              ["Stock bajo", 9, "bg-orange-500", "50%"],
              ["Planillas pendientes", 2, "bg-amber-400", "11%"],
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
          <span>Actualizado hace 15 minutos</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
