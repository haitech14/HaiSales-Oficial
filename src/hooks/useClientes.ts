import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { NuevoClienteFormState } from "@/lib/clientes-form-data";
import {
  createCliente,
  fetchClientesSnapshot,
  normalizeTipoClienteKey,
  updateClienteField,
  type ClienteEditableField,
} from "@/lib/clientes/clientes-service";
import type { ClientRecord } from "@/lib/clientes-mock-data";

const CLIENTES_QUERY_KEY = ["clientes", "snapshot"] as const;

export type ClienteColumnKey = keyof Pick<
  ClientRecord,
  | "fechaAlta"
  | "ruc"
  | "razonSocial"
  | "tipoCliente"
  | "equipoInteres"
  | "produccionMensual"
  | "fechaToner"
  | "segmento"
  | "contacto"
  | "telefono"
  | "direccion"
  | "ciudad"
  | "provincia"
  | "distrito"
  | "correo"
  | "cumpleanos"
  | "ultimaCompra"
  | "frecuenciaCompra"
  | "ticketCompra"
  | "modelosInteres"
  | "observaciones"
>;

export type ClienteSortDirection = "asc" | "desc" | null;

export type ClientesColumnFilters = Record<ClienteColumnKey, string>;

const COLUMN_KEYS: ClienteColumnKey[] = [
  "fechaAlta",
  "ruc",
  "razonSocial",
  "tipoCliente",
  "equipoInteres",
  "produccionMensual",
  "fechaToner",
  "segmento",
  "contacto",
  "telefono",
  "direccion",
  "ciudad",
  "provincia",
  "distrito",
  "correo",
  "cumpleanos",
  "ultimaCompra",
  "frecuenciaCompra",
  "ticketCompra",
  "modelosInteres",
  "observaciones",
];

function createDefaultColumnFilters(): ClientesColumnFilters {
  return COLUMN_KEYS.reduce(
    (filters, key) => {
      filters[key] = "todos";
      return filters;
    },
    {} as ClientesColumnFilters,
  );
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter((value) => value && value !== "—"))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

function splitFilterTokens(value: string) {
  if (!value || value === "—") return [] as string[];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildColumnFilterOptions(clients: ClientRecord[]) {
  return COLUMN_KEYS.reduce(
    (options, key) => {
      if (key === "equipoInteres" || key === "modelosInteres") {
        options[key] = uniqueSorted(clients.flatMap((client) => splitFilterTokens(client[key])));
        return options;
      }

      options[key] = uniqueSorted(clients.map((client) => client[key]));
      return options;
    },
    {} as Record<ClienteColumnKey, string[]>,
  );
}

function matchesColumnFilter(client: ClientRecord, key: ClienteColumnKey, filterValue: string) {
  if (filterValue === "todos") return true;

  const cellValue = client[key] ?? "—";
  if (cellValue === "—") return false;

  if (key === "equipoInteres" || key === "modelosInteres") {
    const normalizedCell = cellValue.toLowerCase();
    const normalizedFilter = filterValue.toLowerCase();
    return (
      normalizedCell === normalizedFilter ||
      splitFilterTokens(cellValue).some((token) => token.toLowerCase() === normalizedFilter)
    );
  }

  return cellValue === filterValue;
}

function fieldIncludesQuery(value: string | undefined, query: string) {
  return (value ?? "—").toLowerCase().includes(query);
}

function parseDisplayDate(value: string) {
  if (!value || value === "—") return 0;
  const parts = value.split("/");
  if (parts.length !== 3) return 0;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return 0;
  return new Date(year, month - 1, day).getTime();
}

function parseTicket(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return Number(digits) || 0;
}

function getSortValue(client: ClientRecord, field: ClienteColumnKey) {
  const value = client[field];
  if (field === "fechaAlta" || field === "cumpleanos" || field === "ultimaCompra" || field === "fechaToner") {
    return parseDisplayDate(value);
  }
  if (field === "ticketCompra") {
    return parseTicket(value);
  }
  return value.toLowerCase();
}

export function useClientes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<ClientesColumnFilters>(createDefaultColumnFilters);
  const [sortField, setSortField] = useState<ClienteColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<ClienteSortDirection>(null);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [...CLIENTES_QUERY_KEY, user?.id ?? "guest"],
    queryFn: () => fetchClientesSnapshot(user?.id ?? null),
    staleTime: 30_000,
  });

  const columnFilterOptions = useMemo(() => {
    const clients = data?.clients ?? [];
    return buildColumnFilterOptions(clients);
  }, [data?.clients]);

  const hasActiveFilters = useMemo(() => {
    const hasColumnFilters = COLUMN_KEYS.some((key) => columnFilters[key] !== "todos");
    return activeTab !== "todos" || search.trim().length > 0 || hasColumnFilters;
  }, [activeTab, columnFilters, search]);

  const filteredClients = useMemo(() => {
    if (!data) return [] as ClientRecord[];

    const query = search.trim().toLowerCase();

    const filtered = data.clients.filter((client) => {
      const matchesTab =
        activeTab === "todos" ||
        normalizeTipoClienteKey(client.tipoCliente) === activeTab;

      const matchesColumns = COLUMN_KEYS.every((key) =>
        matchesColumnFilter(client, key, columnFilters[key]),
      );

      const matchesSearch =
        !query ||
        fieldIncludesQuery(client.razonSocial, query) ||
        fieldIncludesQuery(client.ruc, query) ||
        fieldIncludesQuery(client.contacto, query) ||
        fieldIncludesQuery(client.correo, query) ||
        fieldIncludesQuery(client.telefono, query) ||
        fieldIncludesQuery(client.direccion, query) ||
        fieldIncludesQuery(client.ciudad, query) ||
        fieldIncludesQuery(client.provincia, query) ||
        fieldIncludesQuery(client.distrito, query) ||
        fieldIncludesQuery(client.tipoCliente, query) ||
        fieldIncludesQuery(client.equipoInteres, query) ||
        fieldIncludesQuery(client.produccionMensual, query) ||
        fieldIncludesQuery(client.fechaToner, query) ||
        fieldIncludesQuery(client.segmento, query) ||
        fieldIncludesQuery(client.cumpleanos, query) ||
        fieldIncludesQuery(client.ultimaCompra, query) ||
        fieldIncludesQuery(client.frecuenciaCompra, query) ||
        fieldIncludesQuery(client.ticketCompra, query) ||
        fieldIncludesQuery(client.modelosInteres, query) ||
        fieldIncludesQuery(client.observaciones, query);

      return matchesTab && matchesColumns && matchesSearch;
    });

    if (!sortField || !sortDirection) {
      return filtered;
    }

    const direction = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((left, right) => {
      const leftValue = getSortValue(left, sortField);
      const rightValue = getSortValue(right, sortField);

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * direction;
      }

      return String(leftValue).localeCompare(String(rightValue), "es") * direction;
    });
  }, [activeTab, columnFilters, data, search, sortDirection, sortField]);

  const setActiveTabWithReset = useCallback((tab: string) => {
    setActiveTab(tab);
    setColumnFilters((current) => ({ ...current, tipoCliente: "todos" }));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveTab("todos");
    setSearch("");
    setColumnFilters(createDefaultColumnFilters());
    setSortField(null);
    setSortDirection(null);
  }, []);

  const setColumnFilter = useCallback((key: ClienteColumnKey, value: string) => {
    setColumnFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSort = useCallback((field: ClienteColumnKey, direction: ClienteSortDirection) => {
    if (!direction) {
      setSortField(null);
      setSortDirection(null);
      return;
    }
    setSortField(field);
    setSortDirection(direction);
  }, []);

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

  const updateMutation = useMutation({
    mutationFn: ({
      clientId,
      field,
      value,
      currentClient,
    }: {
      clientId: string;
      field: ClienteEditableField;
      value: string;
      currentClient?: Pick<ClientRecord, "ciudad" | "provincia" | "distrito">;
    }) => {
      if (!user?.id) throw new Error("Debes iniciar sesión para editar clientes");
      return updateClienteField(user.id, clientId, field, value, currentClient);
    },
    onMutate: async ({ clientId, field, value, currentClient }) => {
      const queryKey = [...CLIENTES_QUERY_KEY, user?.id ?? "guest"];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchClientesSnapshot>>>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          clients: previous.clients.map((client) => {
            if (client.id !== clientId) return client;

            if (field === "ciudad" || field === "provincia" || field === "distrito") {
              const next = {
                ciudad: field === "ciudad" ? value : currentClient?.ciudad ?? client.ciudad,
                provincia: field === "provincia" ? value : currentClient?.provincia ?? client.provincia,
                distrito: field === "distrito" ? value : currentClient?.distrito ?? client.distrito,
              };
              return { ...client, ...next };
            }

            return { ...client, [field]: value };
          }),
        });
      }

      return { previous, queryKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el cambio");
    },
    onSuccess: () => {
      toast.success("Cliente actualizado");
      invalidate();
    },
  });

  const updateClienteFieldHandler = useCallback(
    async (clientId: string, field: ClienteEditableField, value: string) => {
      const currentClient = data?.clients.find((client) => client.id === clientId);
      await updateMutation.mutateAsync({
        clientId,
        field,
        value,
        currentClient,
      });
    },
    [data?.clients, updateMutation],
  );

  return {
    snapshot: data,
    filteredClients,
    hasActiveFilters,
    columnFilterOptions,
    columnFilters,
    setColumnFilter,
    sortField,
    sortDirection,
    handleSort,
    activeTab,
    setActiveTab: setActiveTabWithReset,
    clearFilters,
    search,
    setSearch,
    isLoading,
    isFetching,
    refresh,
    invalidate,
    createCliente: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateClienteField: updateClienteFieldHandler,
    isUpdating: updateMutation.isPending,
    lastUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
