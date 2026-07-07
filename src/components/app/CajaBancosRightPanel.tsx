import { RefreshCw } from "lucide-react";
import { formatCajaAmount } from "@/lib/caja-bancos-mock-data";
import type { CajaBancosSnapshot } from "@/lib/caja-bancos/caja-bancos-service";
import { cn } from "@/lib/utils";

function formatRelativeTime(date: Date | null) {
  if (!date) return "sin sincronizar";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));

  if (minutes < 60) return `hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} hora${hours === 1 ? "" : "s"}`;

  const days = Math.round(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}

function BancoDonutChart({
  segments,
  total,
}: {
  segments: CajaBancosSnapshot["movimientosPorBanco"];
  total: number;
}) {
  let offset = 0;
  const circumference = 2 * Math.PI * 15.5;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          {segments.map((segment) => {
            const dash = (segment.percent / 100) * circumference;
            const circle = (
              <circle
                key={segment.label}
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={segment.color}
                strokeWidth="3"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{total.toLocaleString("es-PE")}</span>
          <span className="app-panel-meta">Total</span>
        </div>
      </div>
      <ul className="app-panel-list min-w-0 flex-1">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-2 text-slate-600">
            <span className="flex items-center gap-1.5 truncate">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
            </span>
            <span className="shrink-0 font-semibold text-slate-800">{segment.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CajaBancosRightPanelProps = {
  className?: string;
  snapshot?: CajaBancosSnapshot | null;
  lastUpdatedAt: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function CajaBancosRightPanel({
  className,
  snapshot,
  lastUpdatedAt,
  onRefresh,
  isRefreshing,
}: CajaBancosRightPanelProps) {
  const total = snapshot?.totalRecords ?? 0;
  const conciliacion = snapshot?.conciliacionMensual ?? [];
  const cuentas = snapshot?.cuentasMayorSaldo ?? [];

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Movimientos por banco</h3>
          <div className="mt-4">
            <BancoDonutChart segments={snapshot?.movimientosPorBanco ?? []} total={total} />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Conciliación mensual</h3>
          <ul className="mt-3 space-y-3">
            {conciliacion.map((item) => (
              <li key={item.bank}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700">{item.bank}</span>
                  <span className="shrink-0 font-semibold text-slate-900">{item.percent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn("h-full rounded-full", item.color)}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-500"
          >
            Ver detalle de conciliación →
          </button>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Cuentas con mayor saldo</h3>
          <ul className="mt-3 space-y-2.5">
            {cuentas.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="truncate font-medium text-slate-700">{item.name}</span>
                <span className="shrink-0 font-semibold text-emerald-600">
                  {formatCajaAmount(item.balance)}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-500"
          >
            Ver todas las cuentas →
          </button>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Actualizado: {formatRelativeTime(lastUpdatedAt)}</span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
