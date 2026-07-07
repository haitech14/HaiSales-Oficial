import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  COLUMN_COPIES_STORAGE_KEY,
  getDefaultColumnCopies,
  type AnuncioArea,
} from "@/lib/anuncios/anuncios-mock-data";
import {
  buildKanbanColumns,
  fetchAnunciosSnapshot,
  filterAnuncioTasks,
  getProyeccionTasks,
} from "@/lib/anuncios/anuncios-service";

const QUERY_KEY = ["anuncios", "snapshot"] as const;

export type AnunciosViewMode = "kanban" | "proyeccion";

function loadColumnCopies(): Record<AnuncioArea, string> {
  if (typeof window === "undefined") return getDefaultColumnCopies();
  try {
    const raw = localStorage.getItem(COLUMN_COPIES_STORAGE_KEY);
    if (!raw) return getDefaultColumnCopies();
    return { ...getDefaultColumnCopies(), ...JSON.parse(raw) };
  } catch {
    return getDefaultColumnCopies();
  }
}

export function useAnuncios() {
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("todas");
  const [prioridadFilter, setPrioridadFilter] = useState("todas");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<AnunciosViewMode>("kanban");
  const [columnCopies, setColumnCopies] = useState(loadColumnCopies);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAnunciosSnapshot,
    staleTime: 30_000,
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_COPIES_STORAGE_KEY, JSON.stringify(columnCopies));
  }, [columnCopies]);

  const filteredTasks = useMemo(() => {
    if (!data) return [];
    return filterAnuncioTasks(data.tasks, {
      activeTab,
      search,
      areaFilter,
      prioridadFilter,
      estadoFilter,
    });
  }, [activeTab, areaFilter, data, estadoFilter, prioridadFilter, search]);

  const kanbanColumns = useMemo(
    () => buildKanbanColumns(filteredTasks, columnCopies),
    [columnCopies, filteredTasks],
  );

  const proyeccion = useMemo(
    () => getProyeccionTasks(filteredTasks),
    [filteredTasks],
  );

  const updateColumnCopy = useCallback((area: AnuncioArea, copy: string) => {
    setColumnCopies((prev) => ({ ...prev, [area]: copy }));
  }, []);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    snapshot: data,
    filteredTasks,
    kanbanColumns,
    proyeccion,
    columnCopies,
    updateColumnCopy,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    areaFilter,
    setAreaFilter,
    prioridadFilter,
    setPrioridadFilter,
    estadoFilter,
    setEstadoFilter,
    viewMode,
    setViewMode,
    isLoading,
    isFetching,
    refresh,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
