import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function VentasRightPanel({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="text-sm font-bold text-slate-900">Distribución por tipo</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="44 56" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="30 70" strokeDashoffset="-44" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="12 88" strokeDashoffset="-74" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">328</span>
                <span className="text-[10px] text-slate-500">Total</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5 text-[11px]">
              {[
                ["Facturas", "144", "44%", "bg-blue-500"],
                ["Boletas", "98", "30%", "bg-violet-500"],
                ["Notas crédito", "28", "9%", "bg-orange-500"],
                ["Otros", "58", "17%", "bg-slate-400"],
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
          <h3 className="text-sm font-bold text-slate-900">Emisión por estado</h3>
          <ul className="mt-3 space-y-3">
            {[
              ["Aceptados", 313, "bg-emerald-500", "95%"],
              ["Pendientes", 12, "bg-amber-400", "4%"],
              ["Rechazados", 3, "bg-red-500", "1%"],
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

        <section className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Errores SUNAT</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {[
              ["RUC no existe", 5, "bg-red-500", "100%"],
              ["Serie no registrada", 3, "bg-orange-500", "60%"],
              ["Monto inválido", 2, "bg-amber-400", "40%"],
              ["Fecha fuera de rango", 1, "bg-slate-400", "20%"],
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
