import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { NuevoClienteFormState } from "@/lib/clientes-form-data";
import { createCliente, fetchClientesSnapshot } from "@/lib/clientes/clientes-service";
import type { ClientRecord } from "@/lib/clientes-mock-data";

const CLIENTES_QUERY_KEY = ["clientes", "snapshot"] as const;

export function useClientes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...CLIENTES_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchClientesSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const filteredClients = useMemo(() => {
    if (!data) return [] as ClientRecord[];

    const query = search.trim().toLowerCase();

    return data.clients.filter((client) => {
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "activos" && client.estado === "Activo") ||
        (activeTab === "prospectos" && client.estado === "Prospecto") ||
        (activeTab === "morosos" && client.estado === "Con deuda") ||
        (activeTab === "inactivos" && client.estado === "Inactivo");

      const matchesSearch =
        !query ||
        client.razonSocial.toLowerCase().includes(query) ||
        client.ruc.includes(query) ||
        client.contacto.toLowerCase().includes(query) ||
        client.telefono.includes(query) ||
        client.ejecutivo.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, data, search]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: ({ form, esBorrador }: { form: NuevoClienteFormState; esBorrador: boolean }) => {
      if (!user?.id) throw new Error("Debes iniciar sesión para crear clientes");
      return createCliente(user.id, form, esBorrador);
    },
    onSuccess: () => invalidate(),
  });

  return {
    snapshot: data,
    filteredClients,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    createCliente: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
