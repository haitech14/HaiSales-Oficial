import { RefreshCw } from "lucide-react";
import type { DashboardSnapshot } from "@/lib/dashboard/dashboard-service";
import { cn } from "@/lib/utils";

export function DashboardRightPanel({
  className,
  snapshot,
}: {
  className?: string;
  snapshot?: DashboardSnapshot | null;
}) {
  const records = snapshot?.records ?? [];
  const totalVentas = records.reduce((sum, record) => sum + (record.amount ?? 0), 0);

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Resumen financiero</h3>
          {records.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Sin datos consolidados. Los indicadores se actualizarán cuando haya ventas y movimientos
              sincronizados.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="flex justify-between">
                <span>Operaciones registradas</span>
                <span className="font-semibold text-slate-800">{records.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Monto acumulado</span>
                <span className="font-semibold text-slate-800">
                  S/ {Math.round(totalVentas).toLocaleString("es-PE")}
                </span>
              </li>
            </ul>
          )}
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Datos en tiempo real desde Supabase</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
