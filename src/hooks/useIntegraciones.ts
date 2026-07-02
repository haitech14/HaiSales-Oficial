import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchIntegracionesSnapshot } from "@/lib/integraciones/integraciones-service";

const QUERY_KEY = ["integraciones", "snapshot"] as const;

export function useIntegraciones() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchIntegracionesSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  return {
    snapshot: data,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
