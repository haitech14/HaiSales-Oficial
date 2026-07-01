import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchCrmSnapshot } from "@/lib/crm/crm-service";
import type { Opportunity } from "@/lib/crm-mock-data";
import type { PipelineCard } from "@/lib/pipeline-mock-data";

const CRM_QUERY_KEY = ["crm", "snapshot"] as const;

export function useCrm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...CRM_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchCrmSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredOpportunities = useMemo(() => {
    if (!data) return [] as Opportunity[];

    const query = search.trim().toLowerCase();

    return data.opportunities.filter((item) => {
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
  }, [activeTab, data, search]);

  const allPipelineCards = useMemo(() => {
    if (!data) return [] as (PipelineCard & { stage: string })[];

    return data.pipelineColumns.flatMap((column) =>
      column.cards.map((card) => ({ ...card, stage: column.title })),
    );
  }, [data]);

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
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CRM_QUERY_KEY });
  }, [queryClient]);

  return {
    snapshot: data,
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
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
