#!/usr/bin/env node
/**
 * Sincroniza todos los datos legacy (Excel → staging → tablas operativas).
 *
 * Uso:
 *   $env:SUPABASE_IMPORT_EMAIL="tu@email.com"
 *   $env:SUPABASE_IMPORT_PASSWORD="tu-clave"
 *   node scripts/run-legacy-sync.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const RPC_STEPS = [
  { name: "import_clientes_legacy_for_user", label: "Clientes" },
  { name: "import_productos_legacy_for_user", label: "Productos" },
  { name: "import_ventas_legacy_for_user", label: "Ventas" },
  { name: "import_venta_items_legacy_for_user", label: "Ítems de venta" },
  { name: "import_guias_legacy_for_user", label: "Guías" },
  { name: "sync_prospeccion_sin_compra_for_user", label: "Prospección CRM" },
];

function loadEnv() {
  const envPath = resolve(ROOT, ".env");
  try {
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

async function createClientFromEnv() {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.SUPABASE_IMPORT_EMAIL;
  const password = process.env.SUPABASE_IMPORT_PASSWORD;
  const publishable =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) throw new Error("Falta VITE_SUPABASE_URL en .env");

  if (serviceRole) {
    const userId = process.env.IMPORT_USER_ID;
    if (!userId) throw new Error("Falta IMPORT_USER_ID junto a SUPABASE_SERVICE_ROLE_KEY");
    return { supabase: createClient(url, serviceRole), userId };
  }

  if (!email || !password) {
    throw new Error(
      "Define SUPABASE_IMPORT_EMAIL y SUPABASE_IMPORT_PASSWORD, o SUPABASE_SERVICE_ROLE_KEY + IMPORT_USER_ID",
    );
  }

  if (!publishable) throw new Error("Falta VITE_SUPABASE_PUBLISHABLE_KEY en .env");

  const supabase = createClient(url, publishable);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(error?.message ?? "No se pudo iniciar sesión");
  return { supabase, userId: data.user.id };
}

async function main() {
  loadEnv();
  const { supabase, userId } = await createClientFromEnv();
  console.log(`Sincronizando legacy para usuario ${userId}...`);

  const summary = {};

  for (const step of RPC_STEPS) {
    const { data, error } = await supabase.rpc(step.name, { p_user_id: userId });
    if (error) {
      console.error(`✗ ${step.label}: ${error.message}`);
      summary[step.label] = `error: ${error.message}`;
      continue;
    }
    const count = typeof data === "number" ? data : "ok";
    console.log(`✓ ${step.label}: ${count}`);
    summary[step.label] = count;
  }

  console.log("\nResumen:", summary);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
