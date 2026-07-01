import { useQuery } from "@tanstack/react-query";
import { checkSupabaseConnection, supabaseConfigError } from "@/integrations/supabase/client";

export function useSupabaseHealth() {
  return useQuery({
    queryKey: ["supabase-health"],
    queryFn: checkSupabaseConnection,
    enabled: !supabaseConfigError,
    retry: 1,
    staleTime: 60_000,
  });
}
