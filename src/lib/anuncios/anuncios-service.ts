import { withRealKpi } from "@/lib/kpi-utils";
import {
  anuncioAreas,
  anunciosKpis as staticKpis,
  anunciosTabs,
  getEstadoStyles,
  getPrioridadStyles,
  type AnuncioArea,
  type AnuncioTask,
} from "@/lib/anuncios/anuncios-mock-data";

export type AnunciosSnapshot = {
  tasks: AnuncioTask[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number>;
  totalTasks: number;
  pendientesPorArea: { area: string; count: number }[];
  avancePorArea: { area: string; percent: number }[];
  tareasCriticas: AnuncioTask[];
};

export type KanbanColumnData = {
  area: (typeof anuncioAreas)[number];
  tasks: AnuncioTask[];
  count: number;
};

function buildSnapshot(tasks: AnuncioTask[]): AnunciosSnapshot {
  const porEjecutar = tasks.filter((task) => task.estado === "Por ejecutar").length;
  const enProceso = tasks.filter((task) => task.estado === "En proceso").length;
  const enRevision = tasks.filter((task) => task.estado === "En revisión").length;
  const completados = tasks.filter((task) => task.estado === "Completado").length;
  const criticas = tasks.filter((task) => task.prioridad === "Alta");

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(tasks.length));
    if (index === 1) return withRealKpi(kpi, String(porEjecutar));
    if (index === 2) return withRealKpi(kpi, String(enProceso));
    return withRealKpi(kpi, String(criticas.length));
  });

  return {
    tasks,
    kpis,
    tabCounts: {
      todos: tasks.length,
      "por-ejecutar": porEjecutar,
      "en-proceso": enProceso,
      "en-revision": enRevision,
      completados,
    },
    totalTasks: tasks.length,
    pendientesPorArea: [],
    avancePorArea: [],
    tareasCriticas: criticas,
  };
}

export async function fetchAnunciosSnapshot(): Promise<AnunciosSnapshot> {
  return buildSnapshot([]);
}

export function filterAnuncioTasks(
  tasks: AnuncioTask[],
  {
    activeTab,
    search,
    areaFilter,
    prioridadFilter,
    estadoFilter,
  }: {
    activeTab: string;
    search: string;
    areaFilter: string;
    prioridadFilter: string;
    estadoFilter: string;
  },
) {
  const query = search.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesTab =
      activeTab === "todos" ||
      (activeTab === "por-ejecutar" && task.estado === "Por ejecutar") ||
      (activeTab === "en-proceso" && task.estado === "En proceso") ||
      (activeTab === "en-revision" && task.estado === "En revisión") ||
      (activeTab === "completados" && task.estado === "Completado");

    const matchesArea = areaFilter === "todas" || task.area === areaFilter;
    const matchesPrioridad = prioridadFilter === "todas" || task.prioridad === prioridadFilter;
    const matchesEstado = estadoFilter === "todos" || task.estado === estadoFilter;

    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.assignee.toLowerCase().includes(query);

    return matchesTab && matchesArea && matchesPrioridad && matchesEstado && matchesSearch;
  });
}

export function buildKanbanColumns(
  tasks: AnuncioTask[],
  columnCopies: Record<AnuncioArea, string>,
): (KanbanColumnData & { copy: string })[] {
  return anuncioAreas.map((area) => {
    const areaTasks = tasks.filter((task) => task.area === area.id);
    return {
      area,
      tasks: areaTasks,
      count: areaTasks.length,
      copy: columnCopies[area.id] ?? area.defaultCopy,
    };
  });
}

export function getProyeccionTasks(tasks: AnuncioTask[]) {
  const porHacer = tasks.filter((task) => task.estado === "Por ejecutar");
  const pendientes = tasks.filter(
    (task) => task.estado === "En proceso" || task.prioridad === "Alta",
  );
  return { porHacer, pendientes };
}

export { anuncioAreas, anunciosTabs, getEstadoStyles, getPrioridadStyles };
