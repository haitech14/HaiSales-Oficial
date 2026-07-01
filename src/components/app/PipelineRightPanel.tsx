import { Calendar, Phone, RefreshCw, Send, Video } from "lucide-react";
import {
  pipelineConversion,
  pipelineFunnel,
  pipelineUpcomingActivities,
} from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";

const activityIcons = [Phone, Video, Send, Calendar];

export function PipelineRightPanel({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ventas ganadas</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">34</p>
              <p className="mt-1 text-xs font-medium text-emerald-600">↑ 22.4% vs. mes anterior</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {pipelineFunnel.map((item) => (
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
                  <p className="mt-0.5 text-[10px] text-slate-400">{item.value.toLocaleString("es-PE")} S/</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-900">Conversión por etapa</h3>
          <ul className="mt-3 space-y-3">
            {pipelineConversion.map((item) => (
              <li key={item.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.percent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Actividades próximas</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {pipelineUpcomingActivities.map((activity, index) => {
              const Icon = activityIcons[index] ?? Calendar;

              return (
                <li key={activity.id} className="flex gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      activity.iconBg,
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", activity.iconColor)} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800">{activity.type}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{activity.opportunity}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{activity.date}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Actualizado: hace 15 minutos</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
