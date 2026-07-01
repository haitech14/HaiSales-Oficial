import type { InboxKpi } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const polyline = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InboxKpiCards({ kpis }: { kpis: InboxKpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <article
          key={kpi.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{kpi.value}</p>
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  kpi.changePositive ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {kpi.change}
              </p>
            </div>
            <Sparkline points={kpi.sparkPoints} color={kpi.sparkColor} />
          </div>
        </article>
      ))}
    </div>
  );
}
