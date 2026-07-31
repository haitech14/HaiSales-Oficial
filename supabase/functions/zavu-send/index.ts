import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = getEnv("ZAVUDEV_API_KEY");
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Sesión inválida" }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as {
      to?: string;
      text?: string;
      channel?: string;
      senderId?: string;
    };

    const to = body.to?.trim();
    const text = body.text?.trim();
    if (!to || !text) {
      return jsonResponse({ error: "Se requieren 'to' y 'text'" }, 400);
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (body.senderId?.trim()) {
      headers["Zavu-Sender"] = body.senderId.trim();
    }

    const payload: Record<string, unknown> = {
      to,
      text,
    };
    if (body.channel?.trim()) {
      payload.channel = body.channel.trim();
    }

    const response = await fetch("https://api.zavu.dev/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return jsonResponse(
        { error: `Zavu API ${response.status}`, details: data },
        502,
      );
    }

    return jsonResponse({ ok: true, message: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return jsonResponse({ error: message }, 500);
  }
});
