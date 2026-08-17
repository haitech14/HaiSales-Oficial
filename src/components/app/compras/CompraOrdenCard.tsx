import { Calendar, ShoppingCart, User, Warehouse } from "lucide-react";
import type { PurchaseOrder } from "@/lib/logistica/types";
import {
  formatCompraCardDateTime,
  formatCompraMockAmount,
} from "@/lib/logistica/compras-page-utils";
import { getOrderStatusStyles } from "@/lib/logistica/logistica-service";
import { cn } from "@/lib/utils";

type CompraOrdenCardProps = {
  order: PurchaseOrder;
  onOpen?: () => void;
};

export function CompraOrdenCard({ order, onOpen }: CompraOrdenCardProps) {
  const proveedorLine = `${order.proveedor}${order.ruc ? ` (${order.ruc})` : ""}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
          <p className="text-[15px] font-bold text-slate-900">Orden de Compra</p>
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-400">{order.numero}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <User className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
        <span className="truncate">{proveedorLine}</span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
        <Warehouse className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
        <span className="truncate">{order.almacen}</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
          <span>{formatCompraCardDateTime(order.fecha, order.hora)}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-base font-bold text-[#2563eb]">{formatCompraMockAmount(order.importe)}</p>
          <span className={cn("app-table-badge text-[11px]", getOrderStatusStyles(order.estado))}>
            {order.estado}
          </span>
        </div>
      </div>
    </button>
  );
}
