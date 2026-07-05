import { useState } from "react";
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppPeriodFilter } from "@/components/app/AppPeriodFilter";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { ImportVentasReporteModal } from "@/components/app/ImportVentasReporteModal";
import { NuevaVentaModal } from "@/components/app/NuevaVentaModal";
import { VentasRightPanel } from "@/components/app/VentasRightPanel";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useVentas } from "@/hooks/useVentas";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import {
  formatCurrency,
  formatPeriodMonth,
  formatPeriodMonthShort,
  getBusinessStatusStyles,
  getDocumentTypeStyles,
  getSunatStatusStyles,
  ventasTabs,
} from "@/lib/ventas/ventas-service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VentasPage() {
  const {
    snapshot,
    filteredRecords,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    createVenta,
    isCreating,
    importVentasReporte,
    isImporting,
    importVentasLegacyDb,
    isImportingLegacyDb,
    downloadComprobantePdf,
  } = useVentas();
  useSearchQueryParam(setSearch);
  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const [nuevaVentaOpen, setNuevaVentaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const tabsWithCounts = ventasTabs.map((tab) => ({
    ...tab,
    count: snapshot?.tabCounts[tab.id] ?? null,
  }));

  const totalRecords = snapshot?.totalRecords ?? filteredRecords.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Comprobantes"
        subtitle="Emite, valida y controla comprobantes electrónicos conectados a ventas y contabilidad."
        showDateRange
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
        actionLabel="Nueva venta"
        showActionDropdown
        onActionClick={() => setNuevaVentaOpen(true)}
      />

      <NuevaVentaModal
        open={nuevaVentaOpen}
        onOpenChange={setNuevaVentaOpen}
        onRegister={createVenta}
        isSubmitting={isCreating}
      />

      <ImportVentasReporteModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={importVentasReporte}
        onImportLegacyDb={importVentasLegacyDb}
        isImporting={isImporting}
        isImportingLegacyDb={isImportingLegacyDb}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalRecords} comprobantes sincronizados
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(snapshot?.kpis ?? []).map((kpi) => (
                <CrmKpiCard key={kpi.label} {...kpi} />
              ))}
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
                            activeTab === tab.id ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-slate-200 text-slate-600"
                    onClick={() => setImportOpen(true)}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Importar reporte
                  </Button>
                  <button type="button" className="app-toolbar-link">
                    <Star className="h-3.5 w-3.5" />
                    Guardar vista
                  </button>
                  <button type="button" className="app-toolbar-link">
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
                    placeholder="Buscar por cliente, RUC, serie, forma de pago..."
                    className="app-search-input pl-9 pr-3"
                  />
                </div>
                <AppPeriodFilter />
                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                  Estado SUNAT: Todos
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <button
                  type="button"
                  onClick={() => void refresh()}
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

              <div className="overflow-x-auto">
                <table className="app-table-body w-full min-w-[720px] text-left sm:min-w-[1280px]">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="app-table-cell">Fecha</th>
                      <th className="app-table-cell">Periodo</th>
                      <th className="app-table-cell">Comprobante</th>
                      <th className="app-table-cell">Cliente</th>
                      <th className="app-table-cell">RUC</th>
                      <th className="app-table-cell">Importe</th>
                      <th className="app-table-cell">Forma de pago</th>
                      <th className="app-table-cell">Estado</th>
                      <th className="app-table-cell">Estado SUNAT</th>
                      <th className="app-table-cell">CDR</th>
                      <th className="app-table-cell">Vendedor</th>
                      <th className="app-table-cell text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                          Cargando comprobantes...
                        </td>
                      </tr>
                    ) : (
                    filteredRecords.map((item) => {
                      const businessStatus = item.businessStatus ?? "Activa";
                      return (
                      <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                        <td className="app-table-cell">
                          <p className="font-medium text-slate-800">{item.date}</p>
                          <p className="app-table-meta">{item.time}</p>
                        </td>
                        <td className="app-table-cell text-slate-700">
                          {item.periodMonth ? (
                            <span title={formatPeriodMonth(item.periodMonth)}>
                              {formatPeriodMonthShort(item.periodMonth)}
                            </span>
                          ) : (
                            <span className="app-table-meta">—</span>
                          )}
                        </td>
                        <td className="app-table-cell">
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <div>
                              <a
                                href="#"
                                className={cn("font-semibold hover:opacity-80", getDocumentTypeStyles(item.documentType))}
                              >
                                {item.documentCode}
                              </a>
                              <p className="app-table-meta">{item.documentType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="app-table-cell font-medium text-slate-800">{item.client}</td>
                        <td className="app-table-cell text-slate-600">{item.ruc}</td>
                        <td className="app-table-cell font-semibold text-slate-900">
                          <span className={cn(businessStatus === "Anulada" && "text-slate-400 line-through")}>
                            {formatCurrency(item.amount)}
                          </span>
                        </td>
                        <td className="app-table-cell">
                          {item.formaPago ? (
                            <div>
                              <p className="text-slate-700">{item.formaPago}</p>
                              {item.cuentaCobro && (
                                <p className="app-table-meta">{item.cuentaCobro}</p>
                              )}
                            </div>
                          ) : (
                            <span className="app-table-meta">—</span>
                          )}
                        </td>
                        <td className="app-table-cell">
                          <span className={cn("app-table-badge", getBusinessStatusStyles(businessStatus))}>
                            {businessStatus}
                          </span>
                        </td>
                        <td className="app-table-cell">
                          <span className={cn("app-table-badge", getSunatStatusStyles(item.status))}>
                            {item.status}
                          </span>
                        </td>
                        <td className="app-table-cell">
                          <button
                            type="button"
                            onClick={() => {
                              void downloadComprobantePdf(item.id).then((ok) => {
                                if (!ok) toast.error("No hay ítems para generar el PDF");
                              });
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-500"
                          >
                            <FileText className="h-3 w-3" />
                            PDF
                          </button>
                        </td>
                        <td className="app-table-cell">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-100 text-[10px] font-semibold text-blue-700">
                                {item.sellerInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-700">{item.seller}</span>
                          </div>
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
                    })
                    )}
                  </tbody>
                </table>
              </div>

              <AppTablePagination shownCount={filteredRecords.length} totalCount={totalRecords} />
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <VentasRightPanel snapshot={snapshot} />
        </AppRightPanelSlot>
      </div>
    </div>
  );
}
