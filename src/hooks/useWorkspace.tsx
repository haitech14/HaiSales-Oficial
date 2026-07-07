import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { defaultEmpresaConfig, getEmpresaInitials } from "@/lib/parametros/empresa-service";
import type { EmpresaSede } from "@/lib/parametros/empresa-config-data";
import { loadWorkspaceScope, saveWorkspaceScope } from "@/lib/workspace/workspace-storage";
import {
  getDefaultWorkspaceScope,
  isValidWorkspaceScope,
  listWorkspaceSedes,
  resolveActiveSede,
  type WorkspaceScope,
} from "@/lib/workspace/workspace-utils";

type WorkspaceContextValue = {
  scope: WorkspaceScope;
  setScope: (scope: WorkspaceScope) => void;
  activeSede: EmpresaSede | null;
  sedes: EmpresaSede[];
  isEmpresaScope: boolean;
  empresaNombre: string;
  empresaRuc: string;
  empresaLogo: string;
  empresaIniciales: string;
  subtitle: string;
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: empresaConfig, isLoading } = useEmpresaConfig();
  const config = empresaConfig ?? defaultEmpresaConfig;
  const sedes = useMemo(() => listWorkspaceSedes(config), [config]);

  const [scope, setScopeState] = useState<WorkspaceScope>(() => {
    if (!userId) {
      return getDefaultWorkspaceScope();
    }

    const stored = loadWorkspaceScope(userId);
    if (stored && isValidWorkspaceScope(config, stored)) {
      return stored;
    }

    return getDefaultWorkspaceScope();
  });

  useEffect(() => {
    if (!userId) {
      setScopeState(getDefaultWorkspaceScope());
      return;
    }

    setScopeState((current) => {
      if (isValidWorkspaceScope(config, current)) {
        return current;
      }

      const stored = loadWorkspaceScope(userId);
      if (stored && isValidWorkspaceScope(config, stored)) {
        return stored;
      }

      return getDefaultWorkspaceScope();
    });
  }, [userId, config]);

  const setScope = useCallback(
    (nextScope: WorkspaceScope) => {
      setScopeState(nextScope);
      if (userId) {
        saveWorkspaceScope(userId, nextScope);
      }
    },
    [userId],
  );

  const activeSede = useMemo(() => resolveActiveSede(config, scope), [config, scope]);
  const empresaNombre = config.razonSocial || config.nombreComercial || "Mi empresa";
  const empresaRuc = config.ruc || "Sin RUC";
  const empresaLogo = config.logoUrl;
  const empresaIniciales = getEmpresaInitials(empresaNombre);
  const isEmpresaScope = scope.type === "empresa";
  const subtitle = activeSede ? activeSede.nombre : `RUC ${empresaRuc}`;

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      scope,
      setScope,
      activeSede,
      sedes,
      isEmpresaScope,
      empresaNombre,
      empresaRuc,
      empresaLogo,
      empresaIniciales,
      subtitle,
      isLoading,
    }),
    [
      scope,
      setScope,
      activeSede,
      sedes,
      isEmpresaScope,
      empresaNombre,
      empresaRuc,
      empresaLogo,
      empresaIniciales,
      subtitle,
      isLoading,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace debe usarse dentro de WorkspaceProvider");
  }

  return context;
}
