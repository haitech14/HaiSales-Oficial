export function getSupabaseConfigError(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || url.includes("your-project")) {
    return "Falta VITE_SUPABASE_URL en .env";
  }
  if (!key || key.includes("your_publishable")) {
    return "Falta VITE_SUPABASE_PUBLISHABLE_KEY en .env";
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
