import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContabilidadRightPanel({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Distribución contable</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="32 68" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="24 76" strokeDashoffset="-32" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="18 82" strokeDashoffset="-56" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="14 86" strokeDashoffset="-74" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="12 88" strokeDashoffset="-88" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">18</span>
                <span className="app-panel-meta">Total</span>
              </div>
            </div>
            <ul className="app-panel-list min-w-0 flex-1">
              {[
                ["Activos", "6", "33%", "bg-blue-500"],
                ["Pasivos", "4", "22%", "bg-violet-500"],
                ["Patrimonio", "3", "17%", "bg-emerald-500"],
                ["Ingresos", "3", "17%", "bg-orange-500"],
                ["Gastos", "2", "11%", "bg-red-500"],
              ].map(([label, count, percent, color]) => (
                <li key={label} className="flex items-center justify-between gap-2 text-slate-600">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", color)} />
                    {label}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-800">
                    {count} <span className="font-normal text-slate-400">{percent}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Flujo de caja</h3>
          <ul className="mt-3 space-y-3">
            {[
              ["Cuentas por cobrar", "S/ 86,400", "100%"],
              ["Cuentas por pagar", "S/ 54,200", "63%"],
              ["Efectivo disponible", "S/ 32,800", "38%"],
              ["Inversiones corto plazo", "S/ 18,500", "21%"],
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
            <h3 className="app-panel-title">Alertas financieras</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {[
              ["Conciliación bancaria pendiente", 3, "bg-red-500", "100%"],
              ["Asientos sin publicar", 5, "bg-orange-500", "83%"],
              ["Cuentas sin clasificar", 2, "bg-amber-400", "40%"],
              ["Periodos abiertos", 1, "bg-slate-400", "20%"],
            ].map(([label, count, color, width]) => (
              <li key={label as string}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-slate-600">{label as string}</span>
                  <span className="shrink-0 font-semibold text-slate-800">{count as number}</span>
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
