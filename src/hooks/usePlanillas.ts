import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { CreateTrabajadorInput } from "@/lib/planillas-form-data";
import {
  createTrabajador,
  fetchPlanillasSnapshot,
  validateTrabajadorDni,
} from "@/lib/planillas/planillas-service";
import type { PlanillasWorker } from "@/lib/planillas/types";

const PLANILLAS_QUERY_KEY = ["planillas", "snapshot"] as const;

export function usePlanillas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...PLANILLAS_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchPlanillasSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredWorkers = useMemo(() => {
    if (!data) return [] as PlanillasWorker[];

    const query = search.trim().toLowerCase();

    return data.workers.filter((worker) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "activos" && worker.estado === "Activo") ||
        (activeTab === "asistencia" && worker.asistenciaDias < worker.asistenciaTotal) ||
        (activeTab === "vacaciones" && worker.estado === "Vacaciones") ||
        (activeTab === "boletas" && worker.estado === "Activo") ||
        (activeTab === "cesados" && worker.estado === "Cesado");

      const matchesSearch =
        !query ||
        worker.nombre.toLowerCase().includes(query) ||
        worker.dni.includes(query) ||
        worker.cargo.toLowerCase().includes(query) ||
        worker.area.toLowerCase().includes(query) ||
        worker.id.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PLANILLAS_QUERY_KEY });
  }, [queryClient]);

  const validateDniMutation = useMutation({
    mutationFn: async (dni: string) => {
      if (!user?.id) {
        throw new Error("Inicia sesión para validar el DNI en Supabase");
      }
      return validateTrabajadorDni(user.id, dni);
    },
  });

  const createTrabajadorMutation = useMutation({
    mutationFn: async ({
      input,
    }: {
      input: CreateTrabajadorInput;
      mode: "draft" | "create";
    }) => {
      if (!user?.id) {
        throw new Error("Inicia sesión para registrar trabajadores en Supabase");
      }
      return createTrabajador(user.id, input);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const validateDni = useCallback(
    async (dni: string) => validateDniMutation.mutateAsync(dni),
    [validateDniMutation],
  );

  const submitNewTrabajador = useCallback(
    async (input: CreateTrabajadorInput, mode: "draft" | "create") => {
      await createTrabajadorMutation.mutateAsync({ input, mode });
    },
    [createTrabajadorMutation],
  );

  return {
    snapshot: data,
    filteredWorkers,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    validateDni,
    isValidatingDni: validateDniMutation.isPending,
    submitNewTrabajador,
    isCreatingTrabajador: createTrabajadorMutation.isPending,
  };
}
