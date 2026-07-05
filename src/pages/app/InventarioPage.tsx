import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Filter,
  Loader2,
  MoreHorizontal,
  Package,
  RefreshCw,
  RotateCw,
  Search,
  Star,
  Upload,
  Wallet,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { ImportProductosModal } from "@/components/app/ImportProductosModal";
import { InventarioRightPanel } from "@/components/app/InventarioRightPanel";
import { NuevoProductoModal } from "@/components/app/NuevoProductoModal";
import { Button } from "@/components/ui/button";
import { useInventario } from "@/hooks/useInventario";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import {
  formatProductCurrency,
  getProductStatusStyles,
  isLowStock,
} from "@/lib/inventario/inventario-service";
import { inventarioTabs } from "@/lib/inventario-mock-data";
import { downloadProductoPlantilla } from "@/lib/inventario/producto-import";
import { cn } from "@/lib/utils";

const kpiIcons = [Package, Wallet, AlertTriangle, RotateCw];

export default function InventarioPage() {
  const {
    snapshot,
    filteredProducts,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    submitNewProduct,
    importProducts,
    isCreatingProduct,
    isImportingProducts,
  } = useInventario();
  useSearchQueryParam(setSearch);

  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const inventarioActionItems = useMemo(
    () => [
      {
        id: "import-products",
        label: "Importar productos",
        icon: Upload,
        onClick: () => setImportModalOpen(true),
      },
      {
        id: "download-template",
        label: "Descargar plantilla CSV",
        icon: Download,
        onClick: downloadProductoPlantilla,
      },
    ],
    [],
  );

  const tabsWithCounts = inventarioTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));

  const totalRecords = snapshot?.totalRecords ?? filteredProducts.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Productos / Inventario"
        subtitle="Controla productos, stock, almacenes, costos, lotes y movimientos en tiempo real."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        actionLabel="+ Nuevo producto"
        showActionDropdown
        actionDropdownItems={inventarioActionItems}
        notificationCount={0}
        onActionClick={() => setProductModalOpen(true)}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} productos sincronizados
        </div>
      )}

      {snapshot?.importError && snapshot.totalRecords === 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-900">
          No se pudo cargar el catálogo: {snapshot.importError}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
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
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {tabsWithCounts.map((tab) => (
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
                      {tab.count !== null && (
                        <span
                          className={cn(
                            "app-tab-badge",
                            activeTab === tab.id
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {tab.count.toLocaleString("es-PE")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <button
                    type="button"
                    className="app-toolbar-link"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Guardar vista
                  </button>
                  <button
                    type="button"
                    className="app-toolbar-link"
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
                    placeholder="Buscar por SKU, producto, marca, categoría, almacén..."
                    className="app-search-input pl-9 pr-3"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Categoría: Todas
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Almacén: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <button
                  type="button"
                  onClick={() => refresh()}
                  disabled={isFetching}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Actualizar"
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-16 text-[11px] text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cargando inventario...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="app-table-body w-full min-w-[720px] text-left sm:min-w-[1240px]">
                    <thead>
                      <tr className="app-table-head-row">
                        <th className="app-table-cell">SKU</th>
                        <th className="app-table-cell">Producto</th>
                        <th className="app-table-cell">Marca</th>
                        <th className="app-table-cell">Categoría</th>
                        <th className="app-table-cell">Almacén</th>
                        <th className="app-table-cell">Stock</th>
                        <th className="app-table-cell">Costo</th>
                        <th className="app-table-cell">Precio venta</th>
                        <th className="app-table-cell">Estado</th>
                        <th className="app-table-cell text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const Icon = product.icon;
                        const lowStock = isLowStock(product.stock, product.status);

                        return (
                          <tr
                            key={product.id}
                            className="border-b border-slate-100 transition hover:bg-slate-50/60"
                          >
                            <td className="app-table-cell">
                              <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                                {product.sku}
                              </a>
                            </td>
                            <td className="app-table-cell">
                              <div className="flex items-start gap-3">
                                <span
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                    product.iconBg,
                                  )}
                                >
                                  <Icon className={cn("h-4 w-4", product.iconColor)} strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800">{product.name}</p>
                                  <p className="app-table-meta">{product.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="app-table-cell text-slate-700">{product.marca}</td>
                            <td className="app-table-cell text-slate-700">{product.category}</td>
                            <td className="app-table-cell text-slate-600">{product.warehouse}</td>
                            <td className="app-table-cell">
                              {product.type === "service" ? (
                                <span className="text-slate-400">—</span>
                              ) : (
                                <span
                                  className={cn(
                                    "font-medium",
                                    lowStock ? "text-red-600" : "text-slate-800",
                                  )}
                                >
                                  {product.stock} {product.unit}
                                </span>
                              )}
                            </td>
                            <td className="app-table-cell text-slate-700">
                              {formatProductCurrency(product.cost, product.moneda)}
                            </td>
                            <td className="app-table-cell font-semibold text-slate-900">
                              {formatProductCurrency(product.price, product.moneda)}
                            </td>
                            <td className="app-table-cell">
                              <span
                                className={cn(
                                  "app-table-badge inline-flex rounded-full border",
                                  getProductStatusStyles(product.status),
                                )}
                              >
                                {product.status}
                              </span>
                            </td>
                            <td className="app-table-cell text-right">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Más acciones"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <AppTablePagination shownCount={filteredProducts.length} totalCount={totalRecords} />
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <InventarioRightPanel snapshot={snapshot} />
        </AppRightPanelSlot>
      </div>

      <NuevoProductoModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onSubmit={submitNewProduct}
        isSubmitting={isCreatingProduct}
      />

      <ImportProductosModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={importProducts}
        isImporting={isImportingProducts}
      />
    </div>
  );
}
