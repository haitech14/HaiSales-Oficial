import {
  BellRing,
  Download,
  FileBarChart,
  HandCoins,
  RefreshCw,
} from "lucide-react";
import {
  agingDistribution,
  formatCurrency,
  topClientesPorSaldo,
} from "@/lib/cuentas-cobrar-mock-data";
import { cn } from "@/lib/utils";

function AgingDonutChart() {
  const totalLabel = "S/ 202,170";
  let offset = 0;
  const circumference = 2 * Math.PI * 15.5;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          {agingDistribution.map((segment) => {
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
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
          <span className="text-sm font-bold leading-tight text-slate-900">{totalLabel}</span>
          <span className="app-panel-meta">Total</span>
        </div>
      </div>
      <ul className="app-panel-list min-w-0 flex-1">
        {agingDistribution.map((segment) => (
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

const quickActions = [
  {
    label: "Registrar cobro",
    icon: HandCoins,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Enviar recordatorio de pago",
    icon: BellRing,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Generar reporte de cobranzas",
    icon: FileBarChart,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Exportar cuentas por cobrar",
    icon: Download,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

export function CuentasPorCobrarRightPanel({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="app-panel-title">Antigüedad de saldos</h3>
          <div className="mt-4">
            <AgingDonutChart />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Top clientes por saldo</h3>
          <ul className="mt-3 space-y-3">
            {topClientesPorSaldo.map((client) => (
              <li key={client.name}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{client.name}</span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {formatCurrency(client.balance)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${client.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-500">
            Ver todos los clientes
          </button>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="app-panel-title">Acciones rápidas</h3>
          <ul className="mt-3 space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.label}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        action.iconBg,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", action.iconColor)} />
                    </span>
                    {action.label}
                  </button>
                </li>
              );
            })}
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
