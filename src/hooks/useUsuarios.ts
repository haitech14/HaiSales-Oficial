import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { NuevoUsuarioFormData } from "@/lib/nuevo-usuario-types";
import {
  createUsuario,
  fetchUsuariosSnapshot,
  formToCreateUsuarioInput,
  updateUsuario,
  validateCreateUsuarioInput,
  validateUpdateUsuarioInput,
} from "@/lib/usuarios/usuarios-service";
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

  const createUsuarioMutation = useMutation({
    mutationFn: async ({
      form,
      sedeNombre,
      mode,
    }: {
      form: NuevoUsuarioFormData;
      sedeNombre: string;
      mode: "draft" | "create";
    }) => {
      if (!user?.id) {
        throw new Error("Inicia sesión para registrar usuarios en Supabase");
      }

      const input = formToCreateUsuarioInput(form, sedeNombre, mode);
      const validationError = validateCreateUsuarioInput(input, mode);
      if (validationError) {
        throw new Error(validationError);
      }

      return createUsuario(user.id, input);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const updateUsuarioMutation = useMutation({
    mutationFn: async ({
      usuarioId,
      form,
      sedeNombre,
    }: {
      usuarioId: string;
      form: NuevoUsuarioFormData;
      sedeNombre: string;
    }) => {
      if (!user?.id) {
        throw new Error("Inicia sesión para actualizar usuarios en Supabase");
      }

      const input = formToCreateUsuarioInput(form, sedeNombre, "create");
      const validationError = validateUpdateUsuarioInput(input);
      if (validationError) {
        throw new Error(validationError);
      }

      return updateUsuario(user.id, usuarioId, input);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const submitNewUsuario = useCallback(
    async (form: NuevoUsuarioFormData, sedeNombre: string, mode: "draft" | "create") => {
      await createUsuarioMutation.mutateAsync({ form, sedeNombre, mode });
    },
    [createUsuarioMutation],
  );

  const submitUpdateUsuario = useCallback(
    async (usuarioId: string, form: NuevoUsuarioFormData, sedeNombre: string) => {
      await updateUsuarioMutation.mutateAsync({ usuarioId, form, sedeNombre });
    },
    [updateUsuarioMutation],
  );

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
    submitNewUsuario,
    submitUpdateUsuario,
    isCreatingUsuario: createUsuarioMutation.isPending,
    isUpdatingUsuario: updateUsuarioMutation.isPending,
  };
}
