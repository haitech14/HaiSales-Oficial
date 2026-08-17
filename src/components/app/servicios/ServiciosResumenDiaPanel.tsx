import { useState } from "react";
import {
  BarChart3,
  Clock,
  FileText,
  Percent,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ServicioRecord } from "@/lib/servicios/servicios-mock-data";
import {
  buildServiciosPorTipoRows,
  buildServiciosResumen,
  formatServiciosSoles,
  type ServiciosResumenMoneda,
} from "@/lib/servicios/servicios-page-utils";
import { cn } from "@/lib/utils";

const MONEDA_TABS: Array<{ id: ServiciosResumenMoneda; label: string }> = [
  { id: "general", label: "General" },
  { id: "soles", label: "Soles" },
  { id: "dolares", label: "Dólares" },
  { id: "euros", label: "Euros" },
];

type ResumenMetricProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "purple" | "orange";
};

const METRIC_TONES = {
  green: {
    card: "bg-emerald-50",
    iconWrap: "bg-emerald-500",
  },
  blue: {
    card: "bg-sky-50",
    iconWrap: "bg-sky-500",
  },
  purple: {
    card: "bg-violet-50",
    iconWrap: "bg-violet-500",
  },
  orange: {
    card: "bg-orange-50",
    iconWrap: "bg-orange-500",
  },
} as const;

function ResumenMetricCard({ label, value, icon: Icon, tone }: ResumenMetricProps) {
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

type ServiciosResumenDiaPanelProps = {
  records: ServicioRecord[];
  className?: string;
};

export function ServiciosResumenDiaPanel({ records, className }: ServiciosResumenDiaPanelProps) {
  const [moneda, setMoneda] = useState<ServiciosResumenMoneda>("general");
  const resumen = buildServiciosResumen(records);
  const porTipoRows = buildServiciosPorTipoRows(records);

  const formatMonto = (amount: number) => {
    if (moneda === "dolares") return `$ ${amount.toFixed(2)}`;
    if (moneda === "euros") return `€ ${amount.toFixed(2)}`;
    return formatServiciosSoles(amount);
  };

  return (
    <aside
      className={cn(
        "flex w-full max-w-[380px] flex-col rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="border-b border-slate-100 px-5 pb-4 pt-5">
        <h2 className="text-[1.65rem] font-bold tracking-tight text-slate-900">Resumen del día</h2>

        <div className="mt-4 inline-flex rounded-full bg-slate-100 p-1">
          {MONEDA_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMoneda(tab.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                moneda === tab.id
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <ResumenMetricCard
            label="Total"
            value={formatMonto(resumen.total)}
            icon={Users}
            tone="green"
          />
          <ResumenMetricCard
            label="Órdenes"
            value={String(resumen.ordenes)}
            icon={FileText}
            tone="blue"
          />
          <ResumenMetricCard
            label="Promedio"
            value={formatMonto(resumen.promedio)}
            icon={BarChart3}
            tone="purple"
          />
          <ResumenMetricCard
            label="IGV"
            value={formatMonto(resumen.igv)}
            icon={Percent}
            tone="orange"
          />
        </div>

        <div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-100 pb-2 text-xs font-semibold text-slate-400">
            <span>Por tipo</span>
            <span className="text-center">Monto</span>
            <span className="text-right">#</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {porTipoRows.map((row) => (
              <li
                key={row.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5 text-sm"
              >
                <span className="text-slate-600">{row.label}</span>
                <span className="min-w-[72px] text-center font-medium text-slate-700">
                  {formatMonto(row.monto)}
                </span>
                <span className="min-w-6 text-right font-semibold text-slate-800">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Clock className="h-4 w-4" strokeWidth={2} />
          </span>
          <span>
            Última orden <strong className="font-bold text-slate-800">{resumen.ultimaOrden}</strong>
          </span>
        </div>
      </div>
    </aside>
  );
}
