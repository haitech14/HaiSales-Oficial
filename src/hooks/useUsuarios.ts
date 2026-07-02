import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchUsuariosSnapshot } from "@/lib/usuarios/usuarios-service";
import type { UsuarioRecord } from "@/lib/usuarios-mock-data";

const QUERY_KEY = ["usuarios", "snapshot"] as const;

export function useUsuarios() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchUsuariosSnapshot(user?.id ?? null, user?.email ?? null),
    staleTime: 30_000,
  });

  const filteredUsers = useMemo(() => {
    if (!data) return [] as UsuarioRecord[];
    const query = search.trim().toLowerCase();

    return data.users.filter(
      (item) =>
        !query ||
        item.nombre.toLowerCase().includes(query) ||
        item.correo.toLowerCase().includes(query) ||
        item.rol.toLowerCase().includes(query) ||
        item.sede.toLowerCase().includes(query),
    );
  }, [data, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  return {
    snapshot: data,
    filteredUsers,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
