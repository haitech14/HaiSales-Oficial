const RECENT_CLIENTES_KEY = "haisales:recent-clientes";
const MAX_RECENT = 20;

function storageKey(userId: string) {
  return `${RECENT_CLIENTES_KEY}:${userId}`;
}

export function readRecentClienteIds(userId: string | null | undefined): string[] {
  if (!userId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function rememberRecentClienteId(userId: string | null | undefined, clienteId: string) {
  if (!userId || !clienteId || typeof window === "undefined") return;
  const next = [clienteId, ...readRecentClienteIds(userId).filter((id) => id !== clienteId)].slice(
    0,
    MAX_RECENT,
  );
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}
