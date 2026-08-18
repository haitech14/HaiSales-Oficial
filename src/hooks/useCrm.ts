import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import {
  buildCrmSnapshotFromOpportunities,
  createOportunidad,
  deleteOportunidad,
  duplicateOportunidad,
  fetchCrmSnapshot,
  PIPELINE_TO_ETAPA,
  syncCrmSources,
  updateOportunidad,
  updateOportunidadEtapa,
  patchOportunidad,
  updateOportunidadTipoCliente,
  type CreateOportunidadInput,
  resolveOpportunityTipoCliente,
  resolveOpportunityFuente,
  matchesCrmTipoClienteFilter,
  matchesCrmFuenteFilter,
} from "@/lib/crm/crm-service";
import type { Opportunity } from "@/lib/crm-mock-data";
import { formatTipoClienteLabel } from "@/lib/clientes-mock-data";
import { isIsoDateInRange } from "@/lib/period-filter";
import type { PipelineCard, PipelineStage } from "@/lib/pipeline-mock-data";

const CRM_QUERY_KEY = ["crm", "snapshot"] as const;

export function useCrm() {
  const { user } = useAuth();
  const { range } = useAppPeriod();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [tipoClienteFilter, setTipoClienteFilter] = useState("todos");
  const [fuenteFilter, setFuenteFilter] = useState("todas");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...CRM_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchCrmSnapshot(user?.id ?? null),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    void (async () => {
      const synced = await syncCrmSources(user.id);
      if (cancelled || synced <= 0) return;
      const snapshot = await fetchCrmSnapshot(user.id);
      if (cancelled) return;
      queryClient.setQueryData([...CRM_QUERY_KEY, user.id], snapshot);
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient, user?.id]);

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

      const matchesTipo = matchesCrmTipoClienteFilter(
        resolveOpportunityTipoCliente(item).key,
        tipoClienteFilter,
      );
      const matchesFuente = matchesCrmFuenteFilter(
        resolveOpportunityFuente(item),
        fuenteFilter,
      );

      const matchesSearch =
        !query ||
        item.client.toLowerCase().includes(query) ||
        item.owner.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query);

      return matchesTab && matchesTipo && matchesFuente && matchesSearch;
    });
  }, [activeTab, data, periodOpportunities, search, tipoClienteFilter, fuenteFilter]);

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
        card.id.toLowerCase().includes(query) ||
        (card.lastMessage ?? "").toLowerCase().includes(query) ||
        (card.contactPhone ?? "").toLowerCase().includes(query),
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

  const setCachedOpportunities = useCallback(
    (updater: (opportunities: Opportunity[]) => Opportunity[]) => {
      if (!user?.id) return;
      queryClient.setQueryData([...CRM_QUERY_KEY, user.id], (current: ReturnType<typeof buildCrmSnapshotFromOpportunities> | undefined) => {
        if (!current) return current;
        return buildCrmSnapshotFromOpportunities(updater(current.opportunities));
      });
    },
    [queryClient, user?.id],
  );

  const moveCard = useCallback(
    async (codigo: string, stage: PipelineStage) => {
      if (!user?.id) return;
      const etapa = PIPELINE_TO_ETAPA[stage];
      const previous = data;
      setCachedOpportunities((opportunities) =>
        opportunities.map((item) => (item.id === codigo ? { ...item, stage: etapa } : item)),
      );
      try {
        await updateOportunidadEtapa(user.id, codigo, etapa);
      } catch (error) {
        if (previous) queryClient.setQueryData([...CRM_QUERY_KEY, user.id], previous);
        throw error;
      }
    },
    [data, queryClient, setCachedOpportunities, user?.id],
  );

  const removeCard = useCallback(
    async (codigo: string) => {
      if (!user?.id) return;
      const previous = data;
      setCachedOpportunities((opportunities) => opportunities.filter((item) => item.id !== codigo));
      try {
        await deleteOportunidad(user.id, codigo);
      } catch (error) {
        if (previous) queryClient.setQueryData([...CRM_QUERY_KEY, user.id], previous);
        throw error;
      }
    },
    [data, queryClient, setCachedOpportunities, user?.id],
  );

  const duplicateCard = useCallback(
    async (codigo: string) => {
      if (!user?.id) throw new Error("Debes iniciar sesión");
      const copy = await duplicateOportunidad(user.id, codigo);
      setCachedOpportunities((opportunities) => {
        const source = opportunities.find((item) => item.id === codigo);
        return [{ ...copy, tipoCliente: copy.tipoCliente || source?.tipoCliente }, ...opportunities];
      });
      return copy;
    },
    [setCachedOpportunities, user?.id],
  );

  const patchCard = useCallback(
    async (
      codigo: string,
      patch: {
        clienteNombre?: string;
        titulo?: string;
        valor?: number;
        responsableNombre?: string;
        responsableIniciales?: string;
        tipoCliente?: string;
      },
    ) => {
      if (!user?.id) throw new Error("Debes iniciar sesión");

      if (patch.tipoCliente != null) {
        const updated = await updateOportunidadTipoCliente(user.id, codigo, patch.tipoCliente);
        setCachedOpportunities((opportunities) =>
          opportunities.map((item) =>
            item.id === codigo
              ? {
                  ...item,
                  ...updated,
                  tipoCliente: updated.tipoCliente || formatTipoClienteLabel(patch.tipoCliente),
                }
              : item,
          ),
        );
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
        return updated;
      }

      const updated = await patchOportunidad(user.id, codigo, patch);
      setCachedOpportunities((opportunities) =>
        opportunities.map((item) =>
          item.id === codigo
            ? {
                ...updated,
                tipoCliente: updated.tipoCliente || item.tipoCliente,
                lastMessage: updated.lastMessage || item.lastMessage,
                lastContactAt: updated.lastContactAt || item.lastContactAt,
                intereses: item.intereses,
                ciudad: item.ciudad,
              }
            : item,
        ),
      );
      return updated;
    },
    [queryClient, setCachedOpportunities, user?.id],
  );

  const updateCard = useCallback(
    async (codigo: string, input: CreateOportunidadInput) => {
      if (!user?.id) throw new Error("Debes iniciar sesión");
      const updated = await updateOportunidad(user.id, codigo, input);
      setCachedOpportunities((opportunities) =>
        opportunities.map((item) =>
          item.id === codigo ? { ...updated, tipoCliente: updated.tipoCliente || item.tipoCliente } : item,
        ),
      );
      return updated;
    },
    [setCachedOpportunities, user?.id],
  );

  return {
    snapshot: displaySnapshot,
    filteredOpportunities,
    filteredPipelineCards,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    tipoClienteFilter,
    setTipoClienteFilter,
    fuenteFilter,
    setFuenteFilter,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    createOportunidad: createMutation.mutateAsync,
    isCreatingOportunidad: createMutation.isPending,
    moveCard,
    removeCard,
    duplicateCard,
    updateCard,
    patchCard,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
