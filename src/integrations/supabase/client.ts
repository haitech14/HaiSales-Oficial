import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getSupabaseConfigError } from "@/lib/authErrors";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase-env";

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = getSupabasePublishableKey();

export const supabaseConfigError = getSupabaseConfigError();

// Evita pantalla en blanco si falta .env: createClient exige URL/key no vacías.
const clientUrl = SUPABASE_URL || "https://placeholder.supabase.co";
const clientKey = SUPABASE_PUBLISHABLE_KEY || "public-anon-key";

export const supabase: SupabaseClient<Database> = createClient<Database>(
  clientUrl,
  clientKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (supabaseConfigError) {
    return { ok: false, message: supabaseConfigError };
  }

  const { error } = await supabase.from("profiles").select("id").limit(1);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: "Conexión con Supabase correcta" };
}
