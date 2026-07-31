import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ZavuMeResponse = {
  project?: { id?: string; name?: string; isSubAccount?: boolean };
  team?: { id?: string; name?: string };
  apiKey?: { id?: string };
  isTestMode?: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ZAVUDEV_API_KEY")?.trim();
    if (!apiKey) {
      return jsonResponse({ error: "Falta ZAVUDEV_API_KEY en secrets de Supabase" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey || !serviceRole) {
      return jsonResponse({ error: "Faltan variables SUPABASE_*" }, 500);
    }

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

    const meResponse = await fetch("https://api.zavu.dev/v1/me", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const me = (await meResponse.json().catch(() => ({}))) as ZavuMeResponse;
    if (!meResponse.ok) {
      return jsonResponse(
        {
          error: `Zavu API ${meResponse.status}: ${JSON.stringify(me)}`,
        },
        502,
      );
    }

    const projectId = me.project?.id ?? "zavu-default";
    const projectName = me.project?.name ?? "Zavu";
    const teamName = me.team?.name ?? "Zavu";

    const admin = createClient(supabaseUrl, serviceRole);
    const payload = {
      user_id: user.id,
      channel: "zavu",
      display_name: `${teamName} · ${projectName}`,
      external_account_id: projectId,
      webhook_secret: null,
      status: "connected",
      error_message: null,
      last_sync_at: new Date().toISOString(),
      config: {
        provider: "zavu",
        api_base_url: "https://api.zavu.dev",
        project_id: projectId,
        project_name: projectName,
        team_id: me.team?.id ?? null,
        team_name: teamName,
        api_key_id: me.apiKey?.id ?? null,
        is_test_mode: Boolean(me.isTestMode),
      },
    };

    const { data: row, error: upsertError } = await admin
      .from("inbox_channel_connections")
      .upsert(payload, { onConflict: "user_id,channel,external_account_id" })
      .select("id, display_name, status, last_sync_at, config")
      .single();

    if (upsertError) {
      return jsonResponse({ error: upsertError.message }, 500);
    }

    return jsonResponse({
      connected: true,
      connection: row,
      project: me.project,
      team: me.team,
      isTestMode: Boolean(me.isTestMode),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return jsonResponse({ error: message }, 500);
  }
});
