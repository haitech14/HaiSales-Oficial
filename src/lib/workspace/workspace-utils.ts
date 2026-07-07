import type { EmpresaSede } from "@/lib/parametros/empresa-config-data";
import type { EmpresaConfig } from "@/lib/parametros/empresa-service";

export const WORKSPACE_EMPRESA_SCOPE = "empresa" as const;

export type WorkspaceScope =
  | { type: typeof WORKSPACE_EMPRESA_SCOPE }
  | { type: "sucursal"; sedeId: string };

export function listWorkspaceSedes(config: EmpresaConfig): EmpresaSede[] {
  return config.sedes.filter((sede) => sede.nombre.trim().length > 0);
}

export function resolveActiveSede(config: EmpresaConfig, scope: WorkspaceScope): EmpresaSede | null {
  if (scope.type === WORKSPACE_EMPRESA_SCOPE) {
    return null;
  }

  return config.sedes.find((sede) => sede.id === scope.sedeId) ?? null;
}

export function isValidWorkspaceScope(config: EmpresaConfig, scope: WorkspaceScope): boolean {
  if (scope.type === WORKSPACE_EMPRESA_SCOPE) {
    return true;
  }

  return config.sedes.some((sede) => sede.id === scope.sedeId && sede.nombre.trim().length > 0);
}

export function getDefaultWorkspaceScope(): WorkspaceScope {
  return { type: WORKSPACE_EMPRESA_SCOPE };
}

export function workspaceScopeToValue(scope: WorkspaceScope): string {
  return scope.type === WORKSPACE_EMPRESA_SCOPE ? WORKSPACE_EMPRESA_SCOPE : `sede:${scope.sedeId}`;
}

export function workspaceValueToScope(value: string): WorkspaceScope {
  if (value === WORKSPACE_EMPRESA_SCOPE) {
    return { type: WORKSPACE_EMPRESA_SCOPE };
  }

  if (value.startsWith("sede:")) {
    return { type: "sucursal", sedeId: value.slice(5) };
  }

  return getDefaultWorkspaceScope();
}
