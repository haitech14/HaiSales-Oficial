import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type KapsoPhoneNumber = {
  id?: string;
  phone_number_id?: string;
  display_phone_number?: string;
  name?: string;
  business_account_id?: string;
};

type ConnectionConfig = {
  phone_number_id: string;
  display_phone_number?: string;
  business_account_id?: string;
  provider: "kapso";
  webhook_url?: string;
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

function platformBaseUrl(): string {
  const raw = (Deno.env.get("KAPSO_API_BASE_URL") ?? "https://api.kapso.ai").replace(/\/$/, "");
  if (raw.endsWith("/platform/v1")) return raw.slice(0, -"/platform/v1".length);
  return raw;
}

async function kapsoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getEnv("KAPSO_API_KEY");
  const url = `${platformBaseUrl()}/platform/v1/${path.replace(/^\//, "")}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Kapso API ${response.status}: ${JSON.stringify(data)}`);
  }
  return data as T;
}

async function listKapsoPhoneNumbers(): Promise<KapsoPhoneNumber[]> {
  const payload = await kapsoRequest<{ data?: { data?: KapsoPhoneNumber[] } | KapsoPhoneNumber[] }>(
    "whatsapp/phone_numbers?per_page=50",
  );

  const nested = payload.data;
  if (Array.isArray(nested)) return nested;
  if (nested && Array.isArray(nested.data)) return nested.data;
  return [];
}

async function ensureKapsoWebhook(phoneNumberId: string, webhookUrl: string, verifyToken: string) {
  type WebhookRow = { id: string; url?: string; active?: boolean };
  const existing = await kapsoRequest<{ data?: WebhookRow[] }>(
    `whatsapp/phone_numbers/${phoneNumberId}/webhooks`,
  );
  const rows = existing.data ?? [];
  const match = rows.find((row) => row.url === webhookUrl);

  if (match?.active) return match.id;

  const created = await kapsoRequest<{ data?: WebhookRow }>(
    `whatsapp/phone_numbers/${phoneNumberId}/webhooks`,
    {
      method: "POST",
      body: JSON.stringify({
        whatsapp_webhook: {
          url: webhookUrl,
          kind: "meta",
          payload_version: "v2",
          active: true,
          events: ["whatsapp.message.received", "whatsapp.message.sent"],
          secret_key: verifyToken,
        },
      }),
    },
  );

  return created.data?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const webhookUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/whatsapp-webhook`;
    const verifyToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") ?? "";
    const defaultPhoneNumberId = Deno.env.get("DEFAULT_WHATSAPP_PHONE_NUMBER_ID") ?? "597907523413541";

    let numbers = await listKapsoPhoneNumbers();

    if (numbers.length === 0 && defaultPhoneNumberId) {
      numbers = [{ phone_number_id: defaultPhoneNumberId, display_phone_number: defaultPhoneNumberId }];
    }

    const synced: Array<{ id: string; phoneNumberId: string; displayLabel: string }> = [];

    for (const number of numbers) {
      const phoneNumberId = number.phone_number_id ?? number.id;
      if (!phoneNumberId) continue;

      const displayLabel = number.display_phone_number ?? number.name ?? phoneNumberId;
      const config: ConnectionConfig = {
        phone_number_id: phoneNumberId,
        display_phone_number: number.display_phone_number,
        business_account_id: number.business_account_id,
        provider: "kapso",
        webhook_url: webhookUrl,
      };

      const { data: row, error: upsertError } = await admin
        .from("inbox_channel_connections")
        .upsert(
          {
            user_id: authData.user.id,
            channel: "whatsapp",
            display_name: displayLabel,
            external_account_id: phoneNumberId,
            webhook_secret: verifyToken || null,
            status: "connected",
            error_message: null,
            last_sync_at: new Date().toISOString(),
            config,
          },
          { onConflict: "user_id,channel,external_account_id" },
        )
        .select("id")
        .single();

      if (upsertError || !row) {
        console.error("[kapso-whatsapp-sync] upsert:", upsertError?.message);
        continue;
      }

      if (verifyToken) {
        try {
          await ensureKapsoWebhook(phoneNumberId, webhookUrl, verifyToken);
        } catch (webhookError) {
          console.warn("[kapso-whatsapp-sync] webhook:", webhookError);
        }
      }

      synced.push({ id: row.id as string, phoneNumberId, displayLabel });
    }

    return new Response(JSON.stringify({ success: true, connections: synced }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[kapso-whatsapp-sync]", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error al sincronizar Kapso" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
