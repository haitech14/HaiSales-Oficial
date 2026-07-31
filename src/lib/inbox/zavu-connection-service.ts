import { supabase } from "@/integrations/supabase/client";

export type ZavuSyncResult = {
  connected: boolean;
  projectName?: string;
  teamName?: string;
  isTestMode?: boolean;
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

  return {
    connected: Boolean(data?.connected),
    projectName: data?.project?.name as string | undefined,
    teamName: data?.team?.name as string | undefined,
    isTestMode: Boolean(data?.isTestMode),
  };
}
