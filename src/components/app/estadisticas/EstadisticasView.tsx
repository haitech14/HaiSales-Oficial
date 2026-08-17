import { Loader2 } from "lucide-react";
import {
  EstadisticasCurrencyGrid,
  EstadisticasDailyTrendCard,
  EstadisticasDistribucionCard,
  EstadisticasDocumentSummaryCard,
  EstadisticasDocumentosPorTipoCard,
  EstadisticasEmisionKpiGrid,
  EstadisticasSection,
} from "@/components/app/estadisticas/estadisticas-ui";
import { useEstadisticas } from "@/hooks/useEstadisticas";

export function EstadisticasView() {
  const { data, isLoading } = useEstadisticas();

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Cargando estadísticas del periodo...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const centerLabel =
    data.distribucion.length === 1 && data.distribucion[0]?.name !== "Sin emisiones"
      ? `${data.distribucion[0]?.value ?? 0}%`
      : data.distribucionTotalLabel;

  return (
    <div className="space-y-10">
      <EstadisticasSection title="Emisiones">
        <EstadisticasEmisionKpiGrid items={data.emisionKpis} />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <EstadisticasDocumentosPorTipoCard items={data.documentosPorTipo} />
          <EstadisticasDistribucionCard slices={data.distribucion} centerLabel={centerLabel} />
        </div>
      </EstadisticasSection>

      <EstadisticasSection title="Ventas">
        <EstadisticasCurrencyGrid items={data.ventasCurrency} />
        <EstadisticasDailyTrendCard
          title="Tendencia diaria"
          subtitle="Comparativo por moneda"
          ventasData={data.ventasDailyTrend}
          proformasData={data.proformasDailyTrend}
          showModeToggle
        />
        <EstadisticasDocumentSummaryCard rows={data.ventasDocumentSummary} />
      </EstadisticasSection>

      <EstadisticasSection title="Compras">
        <EstadisticasCurrencyGrid items={data.comprasCurrency} />
        <EstadisticasDailyTrendCard
          title="Tendencia diaria"
          subtitle="Comparativo por moneda"
          ventasData={data.comprasDailyTrend}
        />
      </EstadisticasSection>
    </div>
  );
}
