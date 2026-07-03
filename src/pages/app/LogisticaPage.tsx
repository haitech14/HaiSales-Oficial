import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Filter,
  Loader2,
  PackageOpen,
  RefreshCw,
  Search,
  Star,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppTablePagination } from "@/components/app/AppTablePagination";
import { AppPageHeader, CrmKpiCard } from "@/components/app/CrmShared";
import { AppRightPanelSlot } from "@/components/app/AppRightPanelSlot";
import { GuiaTableRow } from "@/components/app/GuiaTableRow";
import { GuiasRemisionRightPanel } from "@/components/app/GuiasRemisionRightPanel";
import { GuiaRemisionDetailSheet } from "@/components/app/GuiaRemisionDetailSheet";
import { ImportGuiasModal } from "@/components/app/ImportGuiasModal";
import { RotuloEnvioModal } from "@/components/app/RotuloEnvioModal";
import { Button } from "@/components/ui/button";
import { useAppRightPanel } from "@/hooks/useAppRightPanel";
import { useAuth } from "@/hooks/useAuth";
import { useLogistica } from "@/hooks/useLogistica";
import { logisticaGuiaTabs } from "@/lib/logistica-mock-data";
import type { GuiaRemision } from "@/lib/logistica/types";
import { cn } from "@/lib/utils";

const kpiIcons = [ClipboardList, Truck, PackageOpen, Star];

const DEFAULT_CONDUCTOR_OPTIONS = [
  "SHALOM EMPRESARIAL S.A.C.",
  "EMP. DE TRANS. FLORES HNOS. SRL.",
  "EMPRESA DE SERVICIOS CHAN CHAN S.A.",
  "TURISMO DIAS S.A.",
];

export default function LogisticaPage() {
  const { user } = useAuth();
  const {
    snapshot,
    filteredGuias,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    selectedGuiaId,
    guiaDetailOpen,
    openGuiaDetail,
    closeGuiaDetail,
    updateGuiaField,
    importGuiasOpen,
    setImportGuiasOpen,
    importGuiasReporte,
    isImportingGuias,
    importGuiasLegacyDb,
    isImportingGuiasLegacyDb,
  } = useLogistica({ scope: "guias" });

  const { panelHidden, mobileOpen, setMobileOpen, togglePanel, isPanelVisible } = useAppRightPanel();
  const [rotuloGuia, setRotuloGuia] = useState<GuiaRemision | null>(null);
  const [rotuloOpen, setRotuloOpen] = useState(false);
  const tabCounts = snapshot?.guiaTabCounts;
  const recordCount = filteredGuias.length;
  const totalCount = snapshot?.totalGuias ?? 0;
  const conductorOptions = useMemo(() => {
    const options = new Set(DEFAULT_CONDUCTOR_OPTIONS);
    snapshot?.guias.forEach((guia) => {
      if (guia.conductor && guia.conductor !== "—") options.add(guia.conductor);
    });
    return [...options].sort((a, b) => a.localeCompare(b, "es"));
  }, [snapshot?.guias]);

  const handleGenerateRotulo = (guia: GuiaRemision) => {
    setRotuloGuia(guia);
    setRotuloOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Guías de Remisión / Envíos"
        subtitle="Gestiona traslados, seguimiento de envíos y vinculación con comprobantes de venta."
        showPanelToggle
        panelHidden={!isPanelVisible}
        onTogglePanel={togglePanel}
      />

      {snapshot?.source === "supabase" && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-2 text-xs text-emerald-700">
          Conectado a Supabase · {snapshot.totalGuias} guías de remisión registradas
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(snapshot?.guiasKpis ?? []).map((kpi, index) => {
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
                  {logisticaGuiaTabs.map((tab) => {
                    const count = tabCounts?.[tab.id] ?? null;
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
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-2"
                    onClick={() => setImportGuiasOpen(true)}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Importar guías
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
                    placeholder="Buscar por guía, destinatario, comprobante, conductor..."
                    className="app-search-input pl-9 pr-3"
                  />
                </div>
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
                <div className="flex items-center justify-center gap-2 py-16 text-[11px] text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cargando guías...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="app-table-body w-full min-w-[720px] text-left sm:min-w-[1280px]">
                    <thead>
                      <tr className="app-table-head-row">
                        <th className="app-table-cell">Fecha</th>
                        <th className="app-table-cell">Guía</th>
                        <th className="app-table-cell">Sucursal</th>
                        <th className="app-table-cell max-w-[165px] w-[165px]">Destinatario</th>
                        <th className="app-table-cell whitespace-nowrap">RUC</th>
                        <th className="app-table-cell">Contacto</th>
                        <th className="app-table-cell whitespace-nowrap">DNI</th>
                        <th className="app-table-cell whitespace-nowrap">Teléfono</th>
                        <th className="app-table-cell whitespace-nowrap">Motivo</th>
                        <th className="app-table-cell whitespace-nowrap">Traslado</th>
                        <th className="app-table-cell whitespace-nowrap">Comprobante</th>
                        <th className="app-table-cell">Ítems</th>
                        <th className="app-table-cell whitespace-nowrap">Estado</th>
                        <th className="app-table-cell">Conductor</th>
                        <th className="app-table-cell text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGuias.map((guia) => (
                        <GuiaTableRow
                          key={guia.id}
                          guia={guia}
                          conductorOptions={conductorOptions}
                          onOpenDetail={openGuiaDetail}
                          onSaveField={updateGuiaField}
                          onGenerateRotulo={handleGenerateRotulo}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <AppTablePagination shownCount={recordCount} totalCount={totalCount} />
            </section>
          </div>
        </div>

        <AppRightPanelSlot
          panelHidden={panelHidden}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          {snapshot && (
            <GuiasRemisionRightPanel
              guias={snapshot.guias}
              totalGuias={snapshot.totalGuias}
              onRefresh={() => void refresh()}
              isRefreshing={isFetching}
            />
          )}
        </AppRightPanelSlot>
      </div>

      <GuiaRemisionDetailSheet
        guiaId={selectedGuiaId}
        open={guiaDetailOpen}
        onOpenChange={(open) => !open && closeGuiaDetail()}
        userId={user?.id}
      />

      <ImportGuiasModal
        open={importGuiasOpen}
        onOpenChange={setImportGuiasOpen}
        onImport={importGuiasReporte}
        onImportLegacyDb={importGuiasLegacyDb}
        isImporting={isImportingGuias}
        isImportingLegacyDb={isImportingGuiasLegacyDb}
      />

      <RotuloEnvioModal
        guia={rotuloGuia}
        open={rotuloOpen}
        userId={user?.id}
        onOpenChange={(open) => {
          setRotuloOpen(open);
          if (!open) setRotuloGuia(null);
        }}
      />
    </div>
  );
}
