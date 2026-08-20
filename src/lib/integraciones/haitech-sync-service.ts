import { supabase } from "@/integrations/supabase/client";

export type HaitechSyncCounts = {
  clients: number;
  storeProducts: number;
  soporteInventory: number;
  soporteServices: number;
  products: number;
};

export type HaitechSyncResult = {
  ok: boolean;
  mode: "full" | "pull" | "push";
  pulled: HaitechSyncCounts;
  pushed: HaitechSyncCounts;
  errors: string[];
};

export function formatHaitechSyncSummary(result: HaitechSyncResult, direction: "pull" | "push" | "both" = "both"): string {
  const parts: string[] = [];
  if (direction === "pull" || direction === "both") {
    const p = result.pulled;
    parts.push(
      `↓ clientes ${p.clients}, tienda ${p.storeProducts}, inventario ${p.soporteInventory}, servicios ${p.soporteServices}`,
    );
  }
  if (direction === "push" || direction === "both") {
    const p = result.pushed;
    parts.push(
      `↑ clientes ${p.clients}, tienda ${p.storeProducts}, inventario ${p.soporteInventory}, servicios ${p.soporteServices}`,
    );
  }
  return parts.join(" · ");
}

const PUSH_DEBOUNCE_MS = 8_000;
const pendingPush = new Map<string, ReturnType<typeof setTimeout>>();

function formatEdgeFunctionError(error: { message?: string } | null): string {
  const message = error?.message ?? "Error desconocido";
  if (
    message.includes("Failed to send a request to the Edge Function") ||
    message.includes("FunctionsFetchError") ||
    message.includes("404")
  ) {
    return 'La función "haitech-sync" no está desplegada. Ejecuta scripts/deploy-haitech-sync.ps1.';
  }
  return message;
}

export async function syncHaitechStore(options?: {
  mode?: "full" | "pull" | "push";
  entityType?: "cliente" | "producto";
  entityId?: string;
}): Promise<HaitechSyncResult> {
  const { data, error } = await supabase.functions.invoke("haitech-sync", {
    body: {
      mode: options?.mode ?? "full",
      entityType: options?.entityType,
      entityId: options?.entityId,
    },
  });

  if (error) {
    throw new Error(formatEdgeFunctionError(error));
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return data as HaitechSyncResult;
}

/** Empuja un cambio local a HaiStore/Soporte (debounced). */
export function scheduleHaitechPush(entityType: "cliente" | "producto", entityId: string) {
  const key = `${entityType}:${entityId}`;
  const existing = pendingPush.get(key);
  if (existing) clearTimeout(existing);

  pendingPush.set(
    key,
    setTimeout(() => {
      pendingPush.delete(key);
      void syncHaitechStore({ mode: "push", entityType, entityId }).catch((err) => {
        console.warn("[haitech] push:", err instanceof Error ? err.message : err);
      });
    }, PUSH_DEBOUNCE_MS),
  );
}
