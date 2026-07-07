import { withRealKpi } from "@/lib/kpi-utils";
import {
  cajaChicaKpis as staticKpis,
  cajaChicaTabs,
  formatCajaChicaAmount,
  getCajaChicaEstadoStyles,
  getCajaChicaTipoStyles,
  type CajaChicaRecord,
} from "@/lib/caja-chica/caja-chica-mock-data";

export type CajaChicaSnapshot = {
  records: CajaChicaRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number>;
  totalRecords: number;
  tipoSegments: { label: string; value: number; color: string }[];
  gastosPorCategoria: { category: string; amount: number }[];
  responsablesConSaldo: { name: string; balance: number }[];
};

function formatCurrency(amount: number) {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildSnapshot(records: CajaChicaRecord[]): CajaChicaSnapshot {
  const ingresos = records.filter((record) => record.type === "Ingreso");
  const egresos = records.filter((record) => record.type === "Egreso");
  const pendientes = records.filter((record) => record.status === "Pendiente").length;
  const totalIngresos = ingresos.reduce((sum, record) => sum + record.amount, 0);
  const totalEgresos = egresos.reduce((sum, record) => sum + record.amount, 0);
  const saldo = totalIngresos - totalEgresos;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, formatCurrency(saldo));
    if (index === 1) return withRealKpi(kpi, formatCurrency(totalIngresos));
    if (index === 2) return withRealKpi(kpi, formatCurrency(totalEgresos));
    return withRealKpi(kpi, String(pendientes));
  });

  return {
    records,
    kpis,
    tabCounts: {
      todos: records.length,
      ingresos: ingresos.length,
      egresos: egresos.length,
      pendientes,
      aprobados: records.filter((record) => record.status === "Aprobado").length,
      observados: records.filter((record) => record.status === "Observado").length,
    },
    totalRecords: records.length,
    tipoSegments: [],
    gastosPorCategoria: [],
    responsablesConSaldo: [],
  };
}

export async function fetchCajaChicaSnapshot(): Promise<CajaChicaSnapshot> {
  return buildSnapshot([]);
}

export function filterCajaChicaRecords(
  records: CajaChicaRecord[],
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
      (activeTab === "ingresos" && item.type === "Ingreso") ||
      (activeTab === "egresos" && item.type === "Egreso") ||
      (activeTab === "pendientes" && item.status === "Pendiente") ||
      (activeTab === "aprobados" && item.status === "Aprobado") ||
      (activeTab === "observados" && item.status === "Observado");

    const matchesSearch =
      !query ||
      item.responsible.toLowerCase().includes(query) ||
      item.concept.toLowerCase().includes(query) ||
      item.voucher.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });
}

export {
  cajaChicaTabs,
  formatCajaChicaAmount,
  getCajaChicaEstadoStyles,
  getCajaChicaTipoStyles,
};
