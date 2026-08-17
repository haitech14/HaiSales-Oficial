import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ModuleEmptyState } from "@/components/app/module-shell/ModuleEmptyState";
import { ModuleFab } from "@/components/app/module-shell/ModuleFab";
import { ServiciosFilterBar } from "@/components/app/servicios/ServiciosFilterBar";
import { ServiciosOrdenCard } from "@/components/app/servicios/ServiciosOrdenCard";
import { ServiciosPageHeader } from "@/components/app/servicios/ServiciosPageHeader";
import { ServiciosResumenDiaPanel } from "@/components/app/servicios/ServiciosResumenDiaPanel";
import { useAccionQueryParam } from "@/hooks/useAccionQueryParam";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import { useServicios } from "@/hooks/useServicios";
import { MODULE_PAGE_BG } from "@/lib/module-page-theme";
import {
  isServicioRecordOnDate,
  matchesServiciosFilterMode,
  serviciosEmptyStateMessage,
  type ServiciosFilterMode,
} from "@/lib/servicios/servicios-page-utils";
import { toast } from "sonner";

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function ServiciosPage() {
  const { filteredRecords, search, setSearch, isLoading } = useServicios();

  useSearchQueryParam(setSearch);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filterMode, setFilterMode] = useState<ServiciosFilterMode>("ordenes");

  const openNuevoServicio = useCallback(() => {
    toast.info("Registro de servicio próximamente.");
  }, []);
  useAccionQueryParam("nueva", openNuevoServicio);

  const dayRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return filteredRecords.filter((record) => {
      if (!isServicioRecordOnDate(record, selectedDate)) return false;
      if (!matchesServiciosFilterMode(record, filterMode)) return false;
      if (!query) return true;
      return (
        record.client.toLowerCase().includes(query) ||
        record.orderCode.toLowerCase().includes(query) ||
        record.technician.toLowerCase().includes(query) ||
        record.equipment.toLowerCase().includes(query)
      );
    });
  }, [filteredRecords, search, selectedDate, filterMode]);

  return (
    <div className="relative flex min-h-full flex-col" style={{ backgroundColor: MODULE_PAGE_BG }}>
      <ServiciosPageHeader
        selectedDate={selectedDate}
        onPreviousDay={() => setSelectedDate((current) => shiftDate(current, -1))}
        onNextDay={() => setSelectedDate((current) => shiftDate(current, 1))}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 pb-24 pt-2 sm:px-6 xl:flex-row xl:items-start xl:pb-6">
        <div className="min-w-0 flex-1">
          <div className="mb-4">
            <ServiciosFilterBar mode={filterMode} onModeChange={setFilterMode} />
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : dayRecords.length === 0 ? (
              <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white">
                <ModuleEmptyState message={serviciosEmptyStateMessage(filterMode)} />
              </div>
            ) : (
              dayRecords.map((record) => (
                <ServiciosOrdenCard key={record.id} record={record} />
              ))
            )}
          </div>
        </div>

        <ServiciosResumenDiaPanel records={dayRecords} className="xl:sticky xl:top-4" />
      </div>

      <ModuleFab onClick={openNuevoServicio} />
    </div>
  );
}
