import type { WorkspaceScope } from "@/lib/workspace/workspace-utils";

const STORAGE_PREFIX = "hai-workspace-scope";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadWorkspaceScope(userId: string): WorkspaceScope | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<WorkspaceScope>;
    if (parsed.type === "empresa") {
      return { type: "empresa" };
    }

    if (parsed.type === "sucursal" && typeof parsed.sedeId === "string") {
      return { type: "sucursal", sedeId: parsed.sedeId };
    }
  } catch {
    return null;
  }

  return null;
}

export function saveWorkspaceScope(userId: string, scope: WorkspaceScope) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(userId), JSON.stringify(scope));
}
