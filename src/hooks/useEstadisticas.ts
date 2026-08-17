import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import { fetchEstadisticas } from "@/lib/estadisticas/estadisticas-service";

const QUERY_KEY = ["estadisticas"] as const;

export function useEstadisticas() {
  const { user } = useAuth();
  const { range } = useAppPeriod();

  return useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest", range.start, range.end],
    queryFn: () => fetchEstadisticas(user?.id ?? null, range),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });
}
