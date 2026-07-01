import { RefreshCw } from "lucide-react";
import {
  cajaBancosAlerts,
  cajaBancosBankBalances,
  cajaBancosFlowByAccount,
  formatCajaAmount,
} from "@/lib/caja-bancos-mock-data";
import { cn } from "@/lib/utils";

export function CajaBancosRightPanel({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Flujo por cuenta</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="42 58" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="28 72" strokeDashoffset="-42" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="18 82" strokeDashoffset="-70" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="12 88" strokeDashoffset="-88" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
                <span className="text-sm font-bold leading-tight text-slate-900">S/ 202,170</span>
                <span className="app-panel-meta">Total</span>
              </div>
            </div>
            <ul className="app-panel-list min-w-0 flex-1">
              {cajaBancosFlowByAccount.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-2 text-slate-600">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-800">{item.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="app-panel-title">Saldos bancarios</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas las cuentas
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {cajaBancosBankBalances.map((account) => (
              <li key={account.number}>
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
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${account.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="app-panel-title">Alertas de tesorería</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {cajaBancosAlerts.map((alert) => (
              <li
                key={alert.label}
                className={cn("rounded-lg border-l-4 px-3 py-2 text-xs font-medium", alert.color)}
              >
                {alert.label}
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
