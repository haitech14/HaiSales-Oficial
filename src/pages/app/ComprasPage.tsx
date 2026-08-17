import { useCallback, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { CompraOrdenCard } from "@/components/app/compras/CompraOrdenCard";
import { ComprasFilterBar } from "@/components/app/compras/ComprasFilterBar";
import { ComprasPageHeader } from "@/components/app/compras/ComprasPageHeader";
import { GuiasEmptyState } from "@/components/app/guias/GuiasEmptyState";
import { LogisticaOrderDetailSheet } from "@/components/app/LogisticaOrderDetailSheet";
import { NuevaOrdenCompraModal } from "@/components/app/NuevaOrdenCompraModal";
import { useAccionQueryParam } from "@/hooks/useAccionQueryParam";
import { useAuth } from "@/hooks/useAuth";
import { useLogistica } from "@/hooks/useLogistica";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import {
  isCompraOnDate,
  matchesComprasFilterMode,
  type ComprasFilterMode,
} from "@/lib/logistica/compras-page-utils";

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function ComprasPage() {
  const { user } = useAuth();
  const {
    filteredOrders,
    search,
    setSearch,
    isLoading,
    selectedOrderId,
    detailOpen,
    openOrderDetail,
    closeOrderDetail,
    fetchDetail,
  } = useLogistica();

  useSearchQueryParam(setSearch);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filterMode, setFilterMode] = useState<ComprasFilterMode>("compras");
  const [nuevaOrdenOpen, setNuevaOrdenOpen] = useState(false);

  const openNuevaOrden = useCallback(() => setNuevaOrdenOpen(true), []);
  useAccionQueryParam("nueva", openNuevaOrden);

  const dayOrders = useMemo(() => {
    return filteredOrders.filter(
      (order) => isCompraOnDate(order, selectedDate) && matchesComprasFilterMode(order, filterMode),
    );
  }, [filteredOrders, filterMode, selectedDate]);

  return (
    <div className="relative flex min-h-full flex-col bg-[#f4f7f9]">
      <ComprasPageHeader
        selectedDate={selectedDate}
        onPreviousDay={() => setSelectedDate((current) => shiftDate(current, -1))}
        onNextDay={() => setSelectedDate((current) => shiftDate(current, 1))}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-24 pt-2 sm:px-6">
        <ComprasFilterBar mode={filterMode} onModeChange={setFilterMode} className="mb-4" />

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : dayOrders.length === 0 ? (
          <GuiasEmptyState message="No se encontraron órdenes de compra en esta fecha" />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-3">
            {dayOrders.map((order) => (
              <CompraOrdenCard
                key={order.id}
                order={order}
                onOpen={() => openOrderDetail(order.id)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setNuevaOrdenOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-3 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-500"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        NUEVO
      </button>

      <LogisticaOrderDetailSheet
        orderId={selectedOrderId}
        open={detailOpen}
        onOpenChange={(open) => !open && closeOrderDetail()}
        fetchDetail={fetchDetail}
        userId={user?.id}
      />

      <NuevaOrdenCompraModal open={nuevaOrdenOpen} onOpenChange={setNuevaOrdenOpen} />
    </div>
  );
}
