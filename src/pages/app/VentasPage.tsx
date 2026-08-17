import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ImportVentasReporteModal } from "@/components/app/ImportVentasReporteModal";
import { ModuleEmptyState } from "@/components/app/module-shell/ModuleEmptyState";
import { NuevaVentaModal } from "@/components/app/NuevaVentaModal";
import { ModuleFab } from "@/components/app/module-shell/ModuleFab";
import { VentasFilterBar } from "@/components/app/ventas/VentasFilterBar";
import { VentasComprobanteCard } from "@/components/app/ventas/VentasComprobanteCard";
import { VentasResumenDiaPanel } from "@/components/app/ventas/VentasResumenDiaPanel";
import { VentasPageHeader } from "@/components/app/ventas/VentasPageHeader";
import { useAccionQueryParam } from "@/hooks/useAccionQueryParam";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import { useVentas } from "@/hooks/useVentas";
import { MODULE_PAGE_BG } from "@/lib/module-page-theme";
import {
  isVentaRecordOnDate,
  matchesVentasFilterMode,
  ventasEmptyStateMessage,
  type VentasFilterMode,
} from "@/lib/ventas/ventas-page-utils";
import { toast } from "sonner";

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function VentasPage() {
  const {
    filteredRecords,
    search,
    setSearch,
    isLoading,
    createVenta,
    isCreating,
    importVentasReporte,
    isImporting,
    importVentasLegacyDb,
    isImportingLegacyDb,
    downloadComprobantePdf,
  } = useVentas();

  useSearchQueryParam(setSearch);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filterMode, setFilterMode] = useState<VentasFilterMode>("comprobantes");
  const [nuevaVentaOpen, setNuevaVentaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const openNuevaVenta = useCallback(() => setNuevaVentaOpen(true), []);
  useAccionQueryParam("nueva", openNuevaVenta);

  const dayRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return filteredRecords.filter((record) => {
      if (!isVentaRecordOnDate(record, selectedDate)) return false;
      if (!matchesVentasFilterMode(record, filterMode)) return false;
      if (!query) return true;
      return (
        record.client.toLowerCase().includes(query) ||
        record.ruc.includes(query) ||
        record.documentCode.toLowerCase().includes(query) ||
        record.seller.toLowerCase().includes(query)
      );
    });
  }, [filteredRecords, search, selectedDate, filterMode]);

  return (
    <div className="relative flex min-h-full flex-col" style={{ backgroundColor: MODULE_PAGE_BG }}>
      <VentasPageHeader
        selectedDate={selectedDate}
        onPreviousDay={() => setSelectedDate((current) => shiftDate(current, -1))}
        onNextDay={() => setSelectedDate((current) => shiftDate(current, 1))}
        search={search}
        onSearchChange={setSearch}
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

      <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 pb-24 pt-2 sm:px-6 xl:flex-row xl:items-start xl:pb-6">
        <div className="min-w-0 flex-1">
          <div className="mb-4">
            <VentasFilterBar mode={filterMode} onModeChange={setFilterMode} />
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : dayRecords.length === 0 ? (
              <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white">
                <ModuleEmptyState message={ventasEmptyStateMessage(filterMode)} />
              </div>
            ) : (
              dayRecords.map((record) => (
                <VentasComprobanteCard
                  key={record.id}
                  record={record}
                  onOpenPdf={() => {
                    void downloadComprobantePdf(record.id).then((ok) => {
                      if (!ok) toast.error("No hay ítems para generar el PDF");
                    });
                  }}
                />
              ))
            )}
          </div>
        </div>

        <VentasResumenDiaPanel records={dayRecords} className="xl:sticky xl:top-4" />
      </div>

      <ModuleFab onClick={() => setNuevaVentaOpen(true)} />
    </div>
  );
}
