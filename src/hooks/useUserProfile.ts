import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[profile] No se pudo cargar perfil:", error.message);
    return null;
  }

  return data as { full_name: string | null; avatar_url: string | null; email: string | null } | null;
}

export function useUserProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", user?.id ?? "guest"],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const metaName = typeof meta?.full_name === "string" ? meta.full_name : null;
  const metaAvatar =
    (typeof meta?.avatar_url === "string" ? meta.avatar_url : null) ??
    (typeof meta?.picture === "string" ? meta.picture : null);

  const displayName =
    profile?.full_name?.trim() || metaName?.trim() || user?.email?.split("@")[0] || "Usuario";

  const avatarUrl = profile?.avatar_url?.trim() || metaAvatar || null;
  const email = profile?.email?.trim() || user?.email || "";

  return {
    displayName,
    avatarUrl,
    email,
    initials: buildInitials(displayName),
    isLoading,
  };
}
