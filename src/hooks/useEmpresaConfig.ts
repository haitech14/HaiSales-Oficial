import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  defaultEmpresaConfig,
  fetchEmpresaConfig,
  hasEmpresaRegistrada,
  type EmpresaConfig,
} from "@/lib/parametros/empresa-service";

export const empresaConfigQueryKey = (userId: string | undefined) =>
  ["empresa-config", userId] as const;

export function useEmpresaConfig() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: empresaConfigQueryKey(userId),
    queryFn: () => (userId ? fetchEmpresaConfig(userId) : Promise.resolve(defaultEmpresaConfig)),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useInvalidateEmpresaConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return () => {
    if (user?.id) {
      void queryClient.invalidateQueries({ queryKey: empresaConfigQueryKey(user.id) });
    }
  };
}

export function useEmpresaSetupStatus() {
  const query = useEmpresaConfig();
  const config = query.data ?? defaultEmpresaConfig;

  return {
    ...query,
    config,
    isSetupComplete: config.setupCompleted || hasEmpresaRegistrada(config),
  };
}

export type { EmpresaConfig };
