import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Filter,
  KeyRound,
  Loader2,
  MoreHorizontal,
  PackageOpen,
  RefreshCw,
  Search,
  ShoppingCart,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { LogisticaOrderDetailSheet } from "@/components/app/LogisticaOrderDetailSheet";
import { LogisticaRightPanel } from "@/components/app/LogisticaRightPanel";
import { NuevaOrdenCompraModal } from "@/components/app/NuevaOrdenCompraModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLogistica } from "@/hooks/useLogistica";
import { formatImporte, getOrderStatusStyles } from "@/lib/logistica/logistica-service";
import { comprasTabs } from "@/lib/logistica-mock-data";
import { cn } from "@/lib/utils";

const kpiIcons = [ClipboardList, Wallet, PackageOpen, Truck];

export default function ComprasPage() {
  const { user } = useAuth();
  const {
    snapshot,
    filteredOrders,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    selectedOrderId,
    detailOpen,
    openOrderDetail,
    closeOrderDetail,
    fetchDetail,
  } = useLogistica();

  const [panelHidden, setPanelHidden] = useState(false);
  const [nuevaOrdenOpen, setNuevaOrdenOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Compras"
        subtitle="Gestiona requisiciones, órdenes de compra, proveedores y aprobaciones de compra."
        showPanelToggle
        panelHidden={panelHidden}
        onTogglePanel={() => setPanelHidden((current) => !current)}
        actionLabel="+ Nueva orden"
        onActionClick={() => setNuevaOrdenOpen(true)}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} órdenes sincronizadas
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(snapshot?.kpis ?? []).map((kpi, index) => {
                const Icon = kpiIcons[index];
                return (
                  <CrmKpiCard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                    change={kpi.change}
                    sparkColor={kpi.sparkColor}
                    sparkPoints={kpi.sparkPoints}
                    changePositive={kpi.changePositive}
                    icon={Icon}
                    iconBg={kpi.iconBg}
                    iconColor={kpi.iconColor}
                  />
                );
              })}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 pt-3">
                <div className="flex flex-wrap gap-1">
                  {comprasTabs.map((tab) => {
                    const count = snapshot?.tabCounts[tab.id] ?? tab.count;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "app-tab",
                          activeTab === tab.id
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-800",
                        )}
                      >
                        {tab.label}
                        {count !== null && (
                          <span
                            className={cn(
                              "app-tab-badge",
                              activeTab === tab.id
                                ? "bg-blue-50 text-blue-600"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Guardar vista
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Más filtros
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por orden, proveedor, producto, almacén..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Proveedor: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Rango de fechas
                </Button>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Actualizar"
                >
                  <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cargando órdenes...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="app-table-body w-full min-w-[1100px] text-left">
                    <thead>
                      <tr className="app-table-head-row">
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Orden</th>
                        <th className="px-4 py-3">Proveedor</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Almacén</th>
                        <th className="px-4 py-3">Importe</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Responsable</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50/60"
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-800">{order.fecha}</p>
                            <p className="text-xs text-slate-400">{order.hora}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => openOrderDetail(order.id)}
                              className="font-semibold text-blue-600 hover:text-blue-500"
                            >
                              {order.numero}
                            </button>
                            <p className="text-xs text-slate-400">{order.requisicionId}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-slate-800">{order.proveedor}</p>
                            <p className="text-xs text-slate-400">RUC {order.ruc}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2 text-slate-700">
                              {order.tipo === "Compra" ? (
                                <ShoppingCart className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                              ) : (
                                <KeyRound className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                              )}
                              {order.tipo}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">{order.almacen}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {formatImporte(order.importe)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                getOrderStatusStyles(order.estado),
                              )}
                            >
                              {order.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-blue-100 text-[11px] font-semibold text-blue-700">
                                  {order.responsableInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-slate-700">{order.responsable}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openOrderDetail(order.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Ver orden"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Más acciones"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                <p>
                  Mostrando 1 a {filteredOrders.length} de {snapshot?.totalRecords ?? 0} registros
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white"
                  >
                    1
                  </button>
                  {[2, 3].map((page) => (
                    <button
                      key={page}
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {page}
                    </button>
                  ))}
                  <span className="px-1 text-slate-400">...</span>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    8
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-slate-600">
                  10 por página
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </section>
          </div>
        </div>

        {!panelHidden && snapshot && (
          <LogisticaRightPanel
            className="hidden xl:block"
            ordersByStatus={snapshot.ordersByStatus}
            purchasesBySupplier={snapshot.purchasesBySupplier}
            logisticsRisks={snapshot.logisticsRisks}
            totalRecords={snapshot.totalRecords}
            onRefresh={() => void refresh()}
            isRefreshing={isFetching}
          />
        )}
      </div>

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
