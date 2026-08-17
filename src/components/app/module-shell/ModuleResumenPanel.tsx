import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ResumenMetricTone = "green" | "blue" | "purple" | "orange";

export type ResumenMetric = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: ResumenMetricTone;
};

export type ResumenBreakdownRow = {
  label: string;
  amount: string;
  count: string | number;
};

const METRIC_TONES = {
  green: { card: "bg-emerald-50", iconWrap: "bg-emerald-500" },
  blue: { card: "bg-sky-50", iconWrap: "bg-sky-500" },
  purple: { card: "bg-violet-50", iconWrap: "bg-violet-500" },
  orange: { card: "bg-orange-50", iconWrap: "bg-orange-500" },
} as const;

function ResumenMetricCard({ label, value, icon: Icon, tone }: ResumenMetric) {
  const styles = METRIC_TONES[tone];

  return (
    <div className={cn("rounded-2xl p-3", styles.card)}>
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white",
            styles.iconWrap,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-0.5 truncate text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

type ModuleResumenPanelProps = {
  title?: string;
  tabs?: Array<{ id: string; label: string }>;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  metrics: ResumenMetric[];
  breakdownTitle?: string;
  breakdownRows: ResumenBreakdownRow[];
  footer?: ReactNode;
  className?: string;
};

export function ModuleResumenPanel({
  title = "Resumen del día",
  tabs,
  activeTab,
  onTabChange,
  metrics,
  breakdownTitle = "Por tipo",
  breakdownRows,
  footer,
  className,
}: ModuleResumenPanelProps) {
  const showTabs = Boolean(tabs && tabs.length > 1);

  return (
    <aside
      className={cn(
        "flex w-full max-w-[380px] flex-col rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="border-b border-slate-100 px-5 pb-4 pt-5">
        <h2 className="text-[1.65rem] font-bold tracking-tight text-slate-900">{title}</h2>

        {showTabs ? (
          <div className="mt-4 inline-flex rounded-full bg-slate-100 p-1">
            {tabs?.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  activeTab === tab.id
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <ResumenMetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-100 pb-2 text-xs font-semibold text-slate-400">
            <span>{breakdownTitle}</span>
            <span className="text-center">Monto</span>
            <span className="text-right">#</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {breakdownRows.map((row) => (
              <li
                key={row.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5 text-sm"
              >
                <span className="text-slate-600">{row.label}</span>
                <span className="min-w-[72px] text-center font-medium text-slate-700">{row.amount}</span>
                <span className="min-w-6 text-right font-semibold text-slate-800">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {footer ? <div className="mt-auto border-t border-slate-100 px-5 py-4">{footer}</div> : null}
    </aside>
  );
}
