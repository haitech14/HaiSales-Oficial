import { RefreshCw } from "lucide-react";
import { formatCajaAmount } from "@/lib/caja-bancos-mock-data";
import type { CajaBancosSnapshot } from "@/lib/caja-bancos/caja-bancos-service";
import { cn } from "@/lib/utils";

export function CajaBancosRightPanel({
  className,
  snapshot,
}: {
  className?: string;
  snapshot?: CajaBancosSnapshot;
}) {
  const flowByAccount = snapshot?.flowByAccount ?? [];
  const bankBalances = snapshot?.bankBalances ?? [];
  const alerts = snapshot?.alerts ?? [];
  const flowTotal = flowByAccount.reduce((sum, item) => sum + item.amount, 0);

  let dashOffset = 0;
  const donutSegments = flowByAccount.map((item) => {
    const dash = `${item.percent} ${100 - item.percent}`;
    const offset = -dashOffset;
    dashOffset += item.percent;
    return { ...item, dash, offset };
  });

  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Flujo por cuenta</h3>
          {flowByAccount.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin movimientos de tesorería registrados.</p>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  {donutSegments.map((segment) => (
                    <circle
                      key={segment.label}
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="3"
                      strokeDasharray={segment.dash}
                      strokeDashoffset={segment.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
                  <span className="text-sm font-bold leading-tight text-slate-900">
                    {formatCajaAmount(flowTotal)}
                  </span>
                  <span className="app-panel-meta">Total</span>
                </div>
              </div>
              <ul className="app-panel-list min-w-0 flex-1">
                {flowByAccount.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-2 text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-800">{item.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Saldos bancarios</h3>
          {bankBalances.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin cuentas de tesorería configuradas.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {bankBalances.map((account) => (
                <li key={`${account.name}-${account.number}`}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700">{account.name}</p>
                      <p className="truncate text-xs text-slate-400">{account.number}</p>
                    </div>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatCajaAmount(account.balance)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${account.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Alertas de tesorería</h3>
          {alerts.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Sin alertas activas.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {alerts.map((alert) => (
                <li
                  key={alert.label}
                  className={cn("rounded-lg border-l-4 px-3 py-2 text-xs font-medium", alert.color)}
                >
                  {alert.label}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>{snapshot?.totalRecords ?? 0} movimientos sincronizados</span>
          <button type="button" className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  );
}
