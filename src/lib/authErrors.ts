import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase-env";

export function getSupabaseConfigError(): string | null {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (!url || url.includes("your-project")) {
    return "Falta VITE_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL en .env";
  }
  if (!key || key.includes("your_publishable")) {
    return "Falta VITE_SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env";
  }
  return null;
}

export function formatSupabaseError(error: unknown): string {
  if (error instanceof Error && error.message.includes("Failed to fetch")) {
    return "No se pudo conectar con Supabase. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env y reinicia el servidor.";
  }
  if (error instanceof Error) return error.message;
  return "Error desconocido de Supabase";
}
