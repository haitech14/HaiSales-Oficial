import { withRealKpi } from "@/lib/kpi-utils";
import {
  alquileresKpis as staticKpis,
  alquileresTabs,
  formatAlquilerCurrency,
  getAlquilerStatusStyles,
  type AlquilerRecord,
} from "@/lib/alquileres/alquileres-mock-data";

export type AlquileresSnapshot = {
  records: AlquilerRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number>;
  totalRecords: number;
  statusSegments: { label: string; value: number; color: string }[];
  vencimientosProximos: { client: string; equipment: string; daysLeft: number }[];
  equiposRotacion: { equipment: string; contracts: number }[];
  monthlyRevenue: number;
};

function formatCurrency(amount: number) {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function buildSnapshot(records: AlquilerRecord[]): AlquileresSnapshot {
  const activos = records.filter((record) => record.status === "Activo").length;
  const porVencer = records.filter((record) => record.status === "Por vencer").length;
  const vencidos = records.filter((record) => record.status === "Vencido").length;
  const finalizados = records.filter((record) => record.status === "Finalizado").length;
  const monthlyRevenue = records
    .filter((record) => record.status === "Activo" || record.status === "Por vencer")
    .reduce((sum, record) => sum + record.monthlyAmount, 0);

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(activos));
    if (index === 1) return withRealKpi(kpi, String(records.length));
    if (index === 2) return withRealKpi(kpi, formatCurrency(monthlyRevenue));
    return withRealKpi(kpi, String(porVencer));
  });

  return {
    records,
    kpis,
    tabCounts: {
      todos: records.length,
      activos,
      "por-vencer": porVencer,
      vencidos,
      finalizados,
    },
    totalRecords: records.length,
    statusSegments: [],
    vencimientosProximos: [],
    equiposRotacion: [],
    monthlyRevenue,
  };
}

export async function fetchAlquileresSnapshot(): Promise<AlquileresSnapshot> {
  return buildSnapshot([]);
}

export function filterAlquilerRecords(
  records: AlquilerRecord[],
  {
    activeTab,
    search,
    statusFilter,
    equipmentTypeFilter,
  }: {
    activeTab: string;
    search: string;
    statusFilter: string;
    equipmentTypeFilter: string;
  },
) {
  const query = search.trim().toLowerCase();

  return records.filter((item) => {
    const matchesTab =
      activeTab === "todos" ||
      (activeTab === "activos" && item.status === "Activo") ||
      (activeTab === "por-vencer" && item.status === "Por vencer") ||
      (activeTab === "vencidos" && item.status === "Vencido") ||
      (activeTab === "finalizados" && item.status === "Finalizado");

    const matchesSearch =
      !query ||
      item.client.toLowerCase().includes(query) ||
      item.equipment.toLowerCase().includes(query) ||
      item.serial.toLowerCase().includes(query) ||
      item.contractCode.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;
    const matchesEquipment =
      equipmentTypeFilter === "todos" || item.equipmentType === equipmentTypeFilter;

    return matchesTab && matchesSearch && matchesStatus && matchesEquipment;
  });
}

export {
  alquileresTabs,
  formatAlquilerCurrency,
  getAlquilerStatusStyles,
};
