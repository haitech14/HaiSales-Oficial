import { RefreshCw } from "lucide-react";
import type { LogisticsRisk, OrderStatusCount, SupplierPurchase } from "@/lib/logistica/types";
import { cn } from "@/lib/utils";

function OrdersDonutChart({ ordersByStatus, total }: { ordersByStatus: OrderStatusCount[]; total: number }) {
  let offset = 0;
  const circumference = 2 * Math.PI * 15.5;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          {ordersByStatus.map((item) => {
            if (item.count === 0) return null;
            const dash = (item.count / Math.max(total, 1)) * circumference;
            const circle = (
              <circle
                key={item.label}
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={item.color}
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
          <span className="text-xl font-bold text-slate-900">{total}</span>
          <span className="text-[10px] text-slate-500">Total</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-[11px]">
        {ordersByStatus.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-2 text-slate-600">
            <span className="flex items-center gap-1.5 truncate">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <span className="shrink-0 font-semibold text-slate-800">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type LogisticaRightPanelProps = {
  className?: string;
  ordersByStatus: OrderStatusCount[];
  purchasesBySupplier: SupplierPurchase[];
  logisticsRisks: LogisticsRisk[];
  totalRecords: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function LogisticaRightPanel({
  className,
  ordersByStatus,
  purchasesBySupplier,
  logisticsRisks,
  totalRecords,
  onRefresh,
  isRefreshing,
}: LogisticaRightPanelProps) {
  return (
    <aside className={cn("w-[300px] shrink-0 border-l border-slate-200 bg-white", className)}>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="text-sm font-bold text-slate-900">Órdenes por estado</h3>
          <div className="mt-4">
            <OrdersDonutChart ordersByStatus={ordersByStatus} total={totalRecords} />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-900">Compras por proveedor</h3>
          <ul className="mt-3 space-y-3">
            {purchasesBySupplier.map((supplier) => (
              <li key={supplier.name}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{supplier.name}</span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    S/ {supplier.amount.toLocaleString("es-PE")}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${supplier.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Riesgos logísticos</h3>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {logisticsRisks.map((risk) => (
              <li key={risk.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{risk.label}</span>
                  <span className="font-semibold text-slate-800">{risk.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn("h-full rounded-full", risk.color)}
                    style={{ width: risk.width }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Actualizado: hace 31 minutos</span>
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
