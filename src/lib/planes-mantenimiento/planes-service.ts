import { withRealKpi } from "@/lib/kpi-utils";
import {
  formatPlanCurrency,
  getFrequencyStyles,
  getPlanStatusStyles,
  planesKpis as staticKpis,
  planesTabs,
  type PlanMantenimientoRecord,
} from "@/lib/planes-mantenimiento/planes-mock-data";

export type PlanesMantenimientoSnapshot = {
  records: PlanMantenimientoRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number>;
  totalRecords: number;
  tipoSegments: { label: string; value: number; color: string }[];
  renovacionesProximas: { client: string; plan: string; daysLeft: number }[];
  consumiblesCriticos: { item: string; stock: number }[];
};

function buildSnapshot(records: PlanMantenimientoRecord[]): PlanesMantenimientoSnapshot {
  const mantenimiento = records.filter((record) => record.category === "mantenimiento").length;
  const suministro = records.filter((record) => record.category === "suministro").length;
  const mixtos = records.filter((record) => record.category === "mixtos").length;
  const porRenovar = records.filter((record) => record.status === "Por renovar").length;
  const suspendidos = records.filter((record) => record.status === "Suspendido").length;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(records.length));
    if (index === 1) return withRealKpi(kpi, String(mantenimiento + mixtos));
    if (index === 2) return withRealKpi(kpi, String(suministro + mixtos));
    return withRealKpi(kpi, String(porRenovar));
  });

  return {
    records,
    kpis,
    tabCounts: {
      todos: records.length,
      mantenimiento,
      suministro,
      mixtos,
      "por-renovar": porRenovar,
      suspendidos,
    },
    totalRecords: records.length,
    tipoSegments: [],
    renovacionesProximas: [],
    consumiblesCriticos: [],
  };
}

export async function fetchPlanesMantenimientoSnapshot(): Promise<PlanesMantenimientoSnapshot> {
  return buildSnapshot([]);
}

export function filterPlanRecords(
  records: PlanMantenimientoRecord[],
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
      (activeTab === "mantenimiento" && item.category === "mantenimiento") ||
      (activeTab === "suministro" && item.category === "suministro") ||
      (activeTab === "mixtos" && item.category === "mixtos") ||
      (activeTab === "por-renovar" && item.status === "Por renovar") ||
      (activeTab === "suspendidos" && item.status === "Suspendido");

    const matchesSearch =
      !query ||
      item.client.toLowerCase().includes(query) ||
      item.equipment.toLowerCase().includes(query) ||
      item.planName.toLowerCase().includes(query) ||
      item.planCode.toLowerCase().includes(query) ||
      item.ruc.includes(query);

    return matchesTab && matchesSearch;
  });
}

export {
  formatPlanCurrency,
  getFrequencyStyles,
  getPlanStatusStyles,
  planesTabs,
};
