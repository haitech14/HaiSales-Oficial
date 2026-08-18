import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import { supabase } from "@/integrations/supabase/client";
import { fetchEstadisticas } from "@/lib/estadisticas/estadisticas-service";

export const ESTADISTICAS_QUERY_KEY = ["estadisticas"] as const;

export function useEstadisticas() {
  const { user } = useAuth();
  const { range } = useAppPeriod();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...ESTADISTICAS_QUERY_KEY, user?.id ?? "guest", range.start, range.end],
    queryFn: () => fetchEstadisticas(user?.id ?? null, range),
    enabled: Boolean(user?.id),
    staleTime: 3_000,
    gcTime: 5 * 60_000,
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!user?.id) return;

    const invalidateLiveStats = () => {
      void queryClient.invalidateQueries({ queryKey: ESTADISTICAS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["ventas", "available-months"] });
      void queryClient.invalidateQueries({ queryKey: ["ventas", "snapshot"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] });
    };

    const channel = supabase
      .channel(`estadisticas-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ventas",
          filter: `user_id=eq.${user.id}`,
        },
        invalidateLiveStats,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}
