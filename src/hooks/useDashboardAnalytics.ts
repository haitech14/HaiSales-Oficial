import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAppPeriod } from "@/hooks/useAppPeriod";
import { fetchDashboardAnalytics } from "@/lib/dashboard/dashboard-analytics-service";

const QUERY_KEY = ["dashboard", "analytics"] as const;

export function useDashboardAnalytics() {
  const { user } = useAuth();
  const { range } = useAppPeriod();

  return useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest", range.start, range.end],
    queryFn: () => fetchDashboardAnalytics(user?.id ?? null, range),
    staleTime: 30_000,
  });
}
