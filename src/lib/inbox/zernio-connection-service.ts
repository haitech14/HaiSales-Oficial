import { supabase } from "@/integrations/supabase/client";

const SYNC_TTL_MS = 2 * 60_000;
let lastSyncAt = 0;
let syncInFlight: Promise<number> | null = null;

export type ZernioSyncResult = {
  accounts: number;
  conversationsSynced: number;
  opportunitiesSynced: number;
};

function formatEdgeFunctionError(error: { message?: string } | null): string {
  const message = error?.message ?? "Error desconocido";
  if (
    message.includes("Failed to send a request to the Edge Function") ||
    message.includes("FunctionsFetchError") ||
    message.includes("404")
  ) {
    return 'La función "zernio-inbox-sync" no está desplegada. Ejecuta scripts/deploy-zernio.ps1.';
  }
  return message;
}

export async function syncZernioConnection(): Promise<ZernioSyncResult> {
  const { data, error } = await supabase.functions.invoke("zernio-inbox-sync", {
    body: {},
  });

  if (error) {
    throw new Error(formatEdgeFunctionError(error));
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }

  lastSyncAt = Date.now();
  return {
    accounts: typeof data?.accounts === "number" ? data.accounts : 0,
    conversationsSynced: typeof data?.conversationsSynced === "number" ? data.conversationsSynced : 0,
    opportunitiesSynced: typeof data?.opportunitiesSynced === "number" ? data.opportunitiesSynced : 0,
  };
}

/** Importa conversaciones WhatsApp, Facebook e Instagram desde Zernio. */
export async function syncZernioConversations(options?: { force?: boolean }): Promise<number> {
  if (!options?.force && syncInFlight) return syncInFlight;
  if (!options?.force && Date.now() - lastSyncAt < SYNC_TTL_MS) return 0;

  syncInFlight = (async () => {
    try {
      const result = await syncZernioConnection();
      return result.conversationsSynced;
    } catch (error) {
      console.warn("[zernio] Sync conversaciones:", error instanceof Error ? error.message : error);
      return 0;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}
