import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import {
  buildCrmSnapshotFromOpportunities,
  createOportunidad,
  fetchCrmSnapshot,
  type CreateOportunidadInput,
} from "@/lib/crm/crm-service";
import type { Opportunity } from "@/lib/crm-mock-data";
import { isIsoDateInRange } from "@/lib/period-filter";
import type { PipelineCard } from "@/lib/pipeline-mock-data";

const CRM_QUERY_KEY = ["crm", "snapshot"] as const;

export function useCrm() {
  const { user } = useAuth();
  const { range } = useAppPeriod();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...CRM_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchCrmSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const periodOpportunities = useMemo(() => {
    if (!data) return [] as Opportunity[];

    return data.opportunities.filter(
      (item) =>
        item.stage === "Prospectos" || isIsoDateInRange(item.fechaIso, range),
    );
  }, [data, range]);

  const displaySnapshot = useMemo(() => {
    if (!data) return data;
    return buildCrmSnapshotFromOpportunities(periodOpportunities);
  }, [data, periodOpportunities]);

  const filteredOpportunities = useMemo(() => {
    if (!data) return [] as Opportunity[];

    const query = search.trim().toLowerCase();

    return periodOpportunities.filter((item) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "prospectos" && item.stage === "Prospectos") ||
        (activeTab === "calificacion" && item.stage === "Calificación") ||
        (activeTab === "propuesta" && item.stage === "Propuesta") ||
        (activeTab === "negociacion" && item.stage === "Negociación") ||
        (activeTab === "cierre" && item.stage === "Cierre ganado");

      const matchesSearch =
        !query ||
        item.client.toLowerCase().includes(query) ||
        item.owner.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, periodOpportunities, search]);

  const allPipelineCards = useMemo(() => {
    if (!displaySnapshot) return [] as (PipelineCard & { stage: string })[];

    return displaySnapshot.pipelineColumns.flatMap((column) =>
      column.cards.map((card) => ({ ...card, stage: column.title })),
    );
  }, [displaySnapshot]);

  const filteredPipelineCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allPipelineCards;

    return allPipelineCards.filter(
      (card) =>
        card.title.toLowerCase().includes(query) ||
        card.company.toLowerCase().includes(query) ||
        card.owner.toLowerCase().includes(query) ||
        card.id.toLowerCase().includes(query),
    );
  }, [allPipelineCards, search]);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      await refetch();
      return;
    }
    const snapshot = await fetchCrmSnapshot(user.id, { forceWhatsAppSync: true });
    queryClient.setQueryData([...CRM_QUERY_KEY, user.id], snapshot);
  }, [queryClient, refetch, user?.id]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CRM_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (input: CreateOportunidadInput) => {
      if (!user?.id) throw new Error("Debes iniciar sesión para crear oportunidades");
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const responsableNombre =
        typeof meta?.full_name === "string" && meta.full_name.trim()
          ? meta.full_name.trim()
          : user.email?.split("@")[0] ?? "Sin asignar";
      return createOportunidad(user.id, input, { responsableNombre });
    },
    onSuccess: () => invalidate(),
  });

  return {
    snapshot: displaySnapshot,
    filteredOpportunities,
    filteredPipelineCards,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    createOportunidad: createMutation.mutateAsync,
    isCreatingOportunidad: createMutation.isPending,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
