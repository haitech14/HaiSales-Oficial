import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import type { InboxAdvisorStat, InboxPendingStats, InboxStageStat } from "@/lib/inbox/types";

function StageDonut({ stats }: { stats: InboxStageStat[] }) {
  const total = stats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="relative h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={stats}
            dataKey="count"
            nameKey="label"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={2}
          >
            {stats.map((entry) => (
              <Cell key={entry.stage} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{total}</span>
        <span className="text-xs text-slate-500">Total</span>
      </div>
    </div>
  );
}

function PendingBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? `${(value / max) * 100}%` : "0%";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function InboxAnalyticsSidebar({
  stageStats,
  advisorStats,
  pending,
  updatedAt,
  onRefresh,
  isRefreshing,
}: {
  stageStats: InboxStageStat[];
  advisorStats: InboxAdvisorStat[];
  pending: InboxPendingStats;
  updatedAt: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const pendingMax = Math.max(pending.unanswered, pending.waitingCustomer, pending.assigned, 1);

  return (
    <aside className="space-y-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="app-panel-title">Leads por etapa</h3>
        <div className="mt-3">
          <StageDonut stats={stageStats} />
        </div>
        <ul className="mt-2 space-y-1.5">
          {stageStats.map((item) => (
            <li key={item.stage} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className="font-semibold text-slate-800">{item.count}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="app-panel-title">Respuesta por asesor</h3>
        <ul className="mt-4 space-y-3">
          {advisorStats.map((advisor) => (
            <li key={advisor.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold">
                    {advisor.initials}
                  </span>
                  {advisor.name}
                </span>
                <span className="font-semibold text-slate-900">{advisor.responseRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${advisor.responseRate}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="app-panel-title">Mensajes pendientes</h3>
        <div className="mt-4 space-y-3">
          <PendingBar
            label="Sin responder"
            value={pending.unanswered}
            max={pendingMax}
            color="#ef4444"
          />
          <PendingBar
            label="En espera de cliente"
            value={pending.waitingCustomer}
            max={pendingMax}
            color="#f97316"
          />
          <PendingBar
            label="Asignados a asesor"
            value={pending.assigned}
            max={pendingMax}
            color="#eab308"
          />
        </div>
        <button type="button" className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-500">
          Ver todos
        </button>
      </article>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <span>
          Actualizado:{" "}
          {updatedAt
            ? `hace ${Math.max(1, Math.round((Date.now() - updatedAt.getTime()) / 60000))} min`
            : "—"}
        </span>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>
    </aside>
  );
}
