import { supabase } from "@/integrations/supabase/client";

const SYNC_TTL_MS = 12_000;
let lastSyncAt = 0;
let syncInFlight: Promise<number> | null = null;

export type ZavuSyncResult = {
  connected: boolean;
  projectName?: string;
  teamName?: string;
  isTestMode?: boolean;
  conversationsSynced?: number;
  opportunitiesSynced?: number;
};

function formatEdgeFunctionError(error: { message?: string } | null, functionName: string): string {
  const message = error?.message ?? "Error desconocido";

  if (
    message.includes("Failed to send a request to the Edge Function") ||
    message.includes("FunctionsFetchError") ||
    message.includes("404")
  ) {
    return `La función "${functionName}" no está desplegada. Ejecuta scripts/deploy-zavu.ps1.`;
  }

  return message;
}

export async function syncZavuConnection(): Promise<ZavuSyncResult> {
  const { data, error } = await supabase.functions.invoke("zavu-sync", {
    body: {},
  });

  if (error) {
    throw new Error(formatEdgeFunctionError(error, "zavu-sync"));
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  lastSyncAt = Date.now();
  return {
    connected: Boolean(data?.connected),
    projectName: data?.project?.name as string | undefined,
    teamName: data?.team?.name as string | undefined,
    isTestMode: Boolean(data?.isTestMode),
    conversationsSynced:
      typeof data?.conversationsSynced === "number" ? data.conversationsSynced : 0,
    opportunitiesSynced:
      typeof data?.opportunitiesSynced === "number" ? data.opportunitiesSynced : 0,
  };
}

/** Importa conversaciones WhatsApp, Facebook e Instagram desde Zavu. */
export async function syncZavuConversations(options?: { force?: boolean }): Promise<number> {
  if (!options?.force && syncInFlight) return syncInFlight;
  if (!options?.force && Date.now() - lastSyncAt < SYNC_TTL_MS) return 0;

  syncInFlight = (async () => {
    try {
      const result = await syncZavuConnection();
      return result.conversationsSynced ?? 0;
    } catch (error) {
      console.warn("[zavu] Sync conversaciones:", error instanceof Error ? error.message : error);
      return 0;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}
