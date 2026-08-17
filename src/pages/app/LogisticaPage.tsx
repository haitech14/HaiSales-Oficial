import { useCallback, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { GuiaRemisionCard } from "@/components/app/guias/GuiaRemisionCard";
import { GuiasEmptyState } from "@/components/app/guias/GuiasEmptyState";
import { GuiasFilterBar } from "@/components/app/guias/GuiasFilterBar";
import { GuiasPageHeader } from "@/components/app/guias/GuiasPageHeader";
import { GuiaRemisionDetailSheet } from "@/components/app/GuiaRemisionDetailSheet";
import { ImportGuiasModal } from "@/components/app/ImportGuiasModal";
import { RotuloEnvioModal } from "@/components/app/RotuloEnvioModal";
import { useAccionQueryParam } from "@/hooks/useAccionQueryParam";
import { useAuth } from "@/hooks/useAuth";
import { useLogistica } from "@/hooks/useLogistica";
import { useSearchQueryParam } from "@/hooks/useSearchQueryParam";
import {
  isGuiaOnDate,
  matchesGuiaFilterMode,
  type GuiaFilterMode,
} from "@/lib/logistica/guias-page-utils";
import type { GuiaRemision } from "@/lib/logistica/types";

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function LogisticaPage() {
  const { user } = useAuth();
  const {
    filteredGuias,
    search,
    setSearch,
    isLoading,
    selectedGuiaId,
    guiaDetailOpen,
    openGuiaDetail,
    closeGuiaDetail,
    importGuiasOpen,
    setImportGuiasOpen,
    importGuiasReporte,
    isImportingGuias,
    importGuiasLegacyDb,
    isImportingGuiasLegacyDb,
  } = useLogistica({ scope: "guias" });

  useSearchQueryParam(setSearch);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filterMode, setFilterMode] = useState<GuiaFilterMode>("todos");
  const [rotuloGuia, setRotuloGuia] = useState<GuiaRemision | null>(null);
  const [rotuloOpen, setRotuloOpen] = useState(false);

  const openNuevaGuia = useCallback(() => setImportGuiasOpen(true), [setImportGuiasOpen]);
  useAccionQueryParam("nueva", openNuevaGuia);

  const dayGuias = useMemo(() => {
    return filteredGuias.filter(
      (guia) => isGuiaOnDate(guia, selectedDate) && matchesGuiaFilterMode(guia, filterMode),
    );
  }, [filteredGuias, filterMode, selectedDate]);

  return (
    <div className="relative flex min-h-full flex-col bg-[#f4f7f9]">
      <GuiasPageHeader
        selectedDate={selectedDate}
        onPreviousDay={() => setSelectedDate((current) => shiftDate(current, -1))}
        onNextDay={() => setSelectedDate((current) => shiftDate(current, 1))}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-24 pt-2 sm:px-6">
        <GuiasFilterBar mode={filterMode} onModeChange={setFilterMode} className="mb-4" />

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : dayGuias.length === 0 ? (
          <GuiasEmptyState />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-3">
            {dayGuias.map((guia) => (
              <GuiaRemisionCard
                key={guia.id}
                guia={guia}
                onOpen={() => openGuiaDetail(guia.id)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setImportGuiasOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-3 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-500"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        NUEVO
      </button>

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
