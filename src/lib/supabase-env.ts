type EnvSource = Record<string, string | boolean | undefined>;

function readEnv(source: EnvSource, viteKey: string, nextKey: string): string {
  const viteValue = source[viteKey];
  if (typeof viteValue === "string" && viteValue.trim()) return viteValue.trim();

  const nextValue = source[nextKey];
  if (typeof nextValue === "string" && nextValue.trim()) return nextValue.trim();

  return "";
}

export function getSupabaseUrl(source: EnvSource = import.meta.env): string {
  return readEnv(source, "VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey(source: EnvSource = import.meta.env): string {
  return readEnv(source, "VITE_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export function getSupabaseProjectId(source: EnvSource = import.meta.env): string {
  const explicit = readEnv(source, "VITE_SUPABASE_PROJECT_ID", "NEXT_PUBLIC_SUPABASE_PROJECT_ID");
  if (explicit) return explicit;

  const url = getSupabaseUrl(source);
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? "";
}
