import { useQuery } from "@tanstack/react-query";
import { Calendar, KeyRound, Package, ShoppingCart, Truck, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatImporte, getOrderStatusStyles } from "@/lib/logistica/logistica-service";
import type { PurchaseOrderDetail } from "@/lib/logistica/types";
import { cn } from "@/lib/utils";

type LogisticaOrderDetailSheetProps = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchDetail: (orderId: string) => Promise<PurchaseOrderDetail | null>;
  userId?: string | null;
};

export function LogisticaOrderDetailSheet({
  orderId,
  open,
  onOpenChange,
  fetchDetail,
  userId,
}: LogisticaOrderDetailSheetProps) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["logistica", "detail", userId ?? "guest", orderId],
    queryFn: () => (orderId ? fetchDetail(orderId) : Promise.resolve(null)),
    enabled: open && !!orderId,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        {isLoading || !order ? (
          <>
            <SheetHeader>
              <SheetTitle>Cargando orden...</SheetTitle>
              <SheetDescription>Obteniendo detalle desde Supabase</SheetDescription>
            </SheetHeader>
            <div className="mt-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl">{order.numero}</SheetTitle>
              <SheetDescription>{order.requisicionId}</SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  getOrderStatusStyles(order.estado),
                )}
              >
                {order.estado}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {order.tipo === "Compra" ? (
                  <ShoppingCart className="h-3 w-3" />
                ) : (
                  <KeyRound className="h-3 w-3" />
                )}
                {order.tipo}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div>
                <p className="text-xs text-slate-500">Importe total</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatImporte(order.importe)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Almacén destino</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <Package className="h-3.5 w-3.5 text-slate-400" />
                  {order.almacen}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Fecha de registro</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {order.fecha} · {order.hora}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Entrega estimada</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {order.fechaEntregaEstimada
                    ? new Date(order.fechaEntregaEstimada).toLocaleDateString("es-PE")
                    : "Por confirmar"}
                </p>
              </div>
            </div>

            <section className="mt-6">
              <h3 className="text-sm font-bold text-slate-900">Proveedor</h3>
              <div className="mt-2 rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{order.proveedor}</p>
                <p className="mt-1 text-sm text-slate-500">RUC {order.ruc}</p>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-bold text-slate-900">Responsable</h3>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-700">
                    {order.responsableInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {order.responsable}
                  </p>
                  <p className="text-xs text-slate-500">Compras / Logística</p>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-bold text-slate-900">
                Ítems de la orden ({order.items.length})
              </h3>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">Descripción</th>
                      <th className="px-3 py-2 text-right">Cant.</th>
                      <th className="px-3 py-2 text-right">P. unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2.5 text-slate-800">{item.descripcion}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{item.cantidad}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">
                          {formatImporte(item.precioUnitario)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                          {formatImporte(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">
                        Total
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                        {formatImporte(order.importe)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {order.notas && (
              <section className="mt-6">
                <h3 className="text-sm font-bold text-slate-900">Notas</h3>
                <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                  {order.notas}
                </p>
              </section>
            )}

            <section className="mt-6">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <Truck className="h-4 w-4 text-slate-400" />
                Seguimiento logístico
              </h3>
              <ul className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4">
                <li>
                  <p className="text-xs text-slate-400">{order.fecha} · {order.hora}</p>
                  <p className="text-sm font-medium text-slate-800">Orden registrada</p>
                </li>
                {order.estado !== "Aprobada" && order.estado !== "Emitida" && (
                  <li>
                    <p className="text-xs text-slate-400">En proceso</p>
                    <p className="text-sm font-medium text-slate-800">Estado: {order.estado}</p>
                  </li>
                )}
                {order.estado === "Recibida" && (
                  <li>
                    <p className="text-xs text-slate-400">Completado</p>
                    <p className="text-sm font-medium text-emerald-700">Recepción confirmada en almacén</p>
                  </li>
                )}
              </ul>
            </section>

            <div className="mt-8 flex gap-2">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-500">Actualizar estado</Button>
              <Button variant="outline" className="flex-1 border-slate-200">
                Descargar PDF
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
