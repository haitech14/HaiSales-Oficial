import { withRealKpi } from "@/lib/kpi-utils";
import {
  formatServicioCurrency,
  getServicioEstadoStyles,
  getServicioTipoStyles,
  serviciosKpis as staticKpis,
  serviciosTabs,
  type ServicioRecord,
} from "@/lib/servicios/servicios-mock-data";

export type ServiciosSnapshot = {
  records: ServicioRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number>;
  totalRecords: number;
  estadoSegments: { label: string; value: number; color: string }[];
  antiguedadOrdenes: { label: string; count: number }[];
  tecnicosTop: { name: string; orders: number }[];
};

function buildSnapshot(records: ServicioRecord[]): ServiciosSnapshot {
  const enProceso = records.filter((record) => record.status === "En proceso").length;
  const finalizados = records.filter((record) => record.status === "Finalizado").length;
  const facturados = records.filter((record) => record.status === "Facturado").length;
  const garantia = records.filter((record) => record.status === "Garantía").length;
  const diagnostico = records.filter((record) => record.serviceType === "Diagnóstico").length;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(records.length));
    if (index === 1) return withRealKpi(kpi, String(enProceso));
    if (index === 2) return withRealKpi(kpi, String(finalizados));
    return withRealKpi(kpi, String(facturados));
  });

  return {
    records,
    kpis,
    tabCounts: {
      todos: records.length,
      diagnostico,
      "en-proceso": enProceso,
      finalizados,
      facturados,
      garantia,
    },
    totalRecords: records.length,
    estadoSegments: [],
    antiguedadOrdenes: [],
    tecnicosTop: [],
  };
}

export async function fetchServiciosSnapshot(): Promise<ServiciosSnapshot> {
  return buildSnapshot([]);
}

export function filterServicioRecords(
  records: ServicioRecord[],
  {
    activeTab,
    search,
  }: {
    activeTab: string;
    search: string;
  },
) {
  const query = search.trim().toLowerCase();

  return records.filter((item) => {
    const matchesTab =
      activeTab === "todos" ||
      (activeTab === "diagnostico" && item.serviceType === "Diagnóstico") ||
      (activeTab === "en-proceso" && item.status === "En proceso") ||
      (activeTab === "finalizados" && item.status === "Finalizado") ||
      (activeTab === "facturados" && item.status === "Facturado") ||
      (activeTab === "garantia" && item.status === "Garantía");

    const matchesSearch =
      !query ||
      item.client.toLowerCase().includes(query) ||
      item.technician.toLowerCase().includes(query) ||
      item.equipment.toLowerCase().includes(query) ||
      item.orderCode.toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });
}

export {
  formatServicioCurrency,
  getServicioEstadoStyles,
  getServicioTipoStyles,
  serviciosTabs,
};
