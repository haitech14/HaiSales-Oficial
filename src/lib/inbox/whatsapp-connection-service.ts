import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_WHATSAPP_PHONE_NUMBER_ID,
  getWhatsAppPhoneNumberId,
  getWhatsAppWebhookUrl,
  getWhatsAppWebhookVerifyToken,
} from "@/lib/inbox/whatsapp-webhook-config";

export type WhatsAppSyncResult = {
  connections: Array<{
    id: string;
    phoneNumberId: string;
    displayLabel: string;
  }>;
};

export type WhatsAppWebhookActivation = {
  webhookUrl: string;
  verifyToken: string;
  status: "connected";
  connections: WhatsAppSyncResult["connections"];
};

function formatEdgeFunctionError(error: { message?: string } | null, functionName: string): string {
  const message = error?.message ?? "Error desconocido";

  if (
    message.includes("Failed to send a request to the Edge Function") ||
    message.includes("FunctionsFetchError") ||
    message.includes("404")
  ) {
    return `La función "${functionName}" no está desplegada en Supabase. Ejecuta scripts/deploy-whatsapp-kapso.ps1 (requiere supabase login y KAPSO_API_KEY).`;
  }

  return message;
}

async function upsertLocalWhatsAppConnection(userId: string): Promise<WhatsAppWebhookActivation> {
  const verifyToken = getWhatsAppWebhookVerifyToken();
  const webhookUrl = getWhatsAppWebhookUrl();
  const phoneNumberId = getWhatsAppPhoneNumberId() || DEFAULT_WHATSAPP_PHONE_NUMBER_ID;

  const payload = {
    user_id: userId,
    channel: "whatsapp" as const,
    display_name: phoneNumberId,
    external_account_id: phoneNumberId,
    webhook_secret: verifyToken,
    status: "connected" as const,
    error_message: null,
    last_sync_at: new Date().toISOString(),
    config: {
      webhook_url: webhookUrl,
      verify_token_configured: true,
      phone_number_id: phoneNumberId,
      provider: "kapso",
    },
  };

  const { data: row, error } = await supabase
    .from("inbox_channel_connections")
    .upsert(payload as never, { onConflict: "user_id,channel,external_account_id" })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    webhookUrl,
    verifyToken,
    status: "connected",
    connections: [
      {
        id: row.id,
        phoneNumberId,
        displayLabel: phoneNumberId,
      },
    ],
  };
}

export async function syncKapsoWhatsAppNumbers(): Promise<WhatsAppSyncResult> {
  const { data, error } = await supabase.functions.invoke("kapso-whatsapp-sync", {
    body: {},
  });

  if (error) {
    throw new Error(formatEdgeFunctionError(error, "kapso-whatsapp-sync"));
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return {
    connections: (data?.connections ?? []) as WhatsAppSyncResult["connections"],
  };
}

export async function activateWhatsAppWebhook(userId: string): Promise<WhatsAppWebhookActivation> {
  try {
    const syncResult = await syncKapsoWhatsAppNumbers();

    if (syncResult.connections.length > 0) {
      return {
        webhookUrl: getWhatsAppWebhookUrl(),
        verifyToken: getWhatsAppWebhookVerifyToken(),
        status: "connected",
        connections: syncResult.connections,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const canFallbackLocally =
      message.includes("no está desplegada") ||
      message.includes("KAPSO_API_KEY") ||
      message.includes("Kapso API");

    if (!canFallbackLocally) {
      throw error;
    }
  }

  return upsertLocalWhatsAppConnection(userId);
}

export async function deactivateWhatsAppWebhook(userId: string) {
  const { error } = await supabase
    .from("inbox_channel_connections")
    .update({
      status: "disconnected",
      error_message: null,
    })
    .eq("user_id", userId)
    .eq("channel", "whatsapp");

  if (error) {
    throw new Error(error.message);
  }
}
