import { RefreshCw } from "lucide-react";
import type { CrmSnapshot } from "@/lib/crm/crm-service";
import { cn } from "@/lib/utils";

type PipelineRightPanelProps = {
  className?: string;
  snapshot?: CrmSnapshot | null;
};

export function PipelineRightPanel({ className, snapshot }: PipelineRightPanelProps) {
  const columns = snapshot?.pipelineColumns ?? [];
  const wonCount = snapshot?.opportunities.filter((item) => item.stage === "Cierre ganado").length ?? 0;
  const wonValue = snapshot?.opportunities
    .filter((item) => item.stage === "Cierre ganado")
    .reduce((sum, item) => sum + item.value, 0) ?? 0;

  const funnel = columns.map((column, index) => ({
    stage: column.title,
    count: column.count,
    value: column.totalValue,
    color: ["#3b82f6", "#8b5cf6", "#f97316", "#ef4444", "#22c55e"][index] ?? "#3b82f6",
    width: columns[0]?.count ? `${Math.max(12, Math.round((column.count / columns[0].count) * 100))}%` : "0%",
  }));

  const conversion = columns.slice(0, -1).map((column, index) => {
    const next = columns[index + 1];
    const percent =
      column.count > 0 ? Math.round((next.count / column.count) * 100) : 0;
    return {
      label: `${column.title} → ${next.title}`,
      percent,
      color: "bg-blue-500",
    };
  });

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="app-panel-title">Ventas ganadas</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">{wonCount}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {wonValue > 0 ? `S/ ${Math.round(wonValue).toLocaleString("es-PE")}` : "Sin cierres en el periodo"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {funnel.length === 0 ? (
              <p className="text-xs text-slate-500">Sin oportunidades en el periodo seleccionado.</p>
            ) : (
              funnel.map((item) => (
                <div key={item.stage} className="flex items-center gap-2">
                  <div className="w-[72px] shrink-0 text-[10px] font-medium text-slate-600">{item.stage}</div>
                  <div className="min-w-0 flex-1">
                    <div className="h-5 overflow-hidden rounded-md bg-white">
                      <div
                        className="flex h-full items-center rounded-md px-2 text-[10px] font-semibold text-white"
                        style={{ width: item.width, backgroundColor: item.color }}
                      >
                        {item.count}
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{item.value.toLocaleString("es-PE")} S/</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Conversión por etapa</h3>
          <ul className="mt-3 space-y-3">
            {conversion.length === 0 ? (
              <li className="text-xs text-slate-500">Sin datos de conversión.</li>
            ) : (
              conversion.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.percent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.percent}%` }} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Resumen del periodo</h3>
          <p className="mt-2 text-xs text-slate-600">
            {snapshot?.totalRecords ?? 0} oportunidades activas en el filtro actual.
          </p>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Datos reales de Supabase</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
