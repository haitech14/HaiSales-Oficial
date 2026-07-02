import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { normalizeRole, type UserRole } from "@/lib/auth/roles";
import { supabase } from "@/integrations/supabase/client";

async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("rol")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[roles] No se pudo cargar rol:", error.message);
    return "admin";
  }

  return normalizeRole((data as { rol?: string } | null)?.rol);
}

export function useUserRole() {
  const { user } = useAuth();

  const { data: role = "admin", isLoading } = useQuery({
    queryKey: ["user-role", user?.id ?? "guest"],
    queryFn: () => fetchUserRole(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 120_000,
  });

  return { role, isLoading };
}
