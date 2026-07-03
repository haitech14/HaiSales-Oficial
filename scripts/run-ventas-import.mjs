#!/usr/bin/env node
/**
 * Importa comprobantes desde public/data/ventas-legacy-bundle.json
 *
 * Uso:
 *   $env:SUPABASE_IMPORT_EMAIL="tu@email.com"
 *   $env:SUPABASE_IMPORT_PASSWORD="tu-clave"
 *   node scripts/run-ventas-import.mjs
 *
 * Solo abril 2026 (Abril2025.xlsx):
 *   node scripts/run-ventas-import.mjs --abril2025
 *
 * Vía RPC legacy (requiere migraciones desplegadas):
 *   node scripts/run-ventas-import.mjs --rpc
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const BUNDLE_PATH = resolve(ROOT, "public/data/ventas-legacy-bundle.json");

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

function mapBundleRow(row) {
  const documento =
    row.tipo_comprobante === "boleta"
      ? "BOLETA DE VENTA"
      : row.tipo_comprobante === "nota_credito"
        ? "NOTA DE CREDITO"
        : "FACTURA";

  return {
    fechaEmision: row.fecha,
    fechaVencimiento: row.fecha_vencimiento ?? row.fecha,
    documento,
    serie: row.serie,
    numero: row.numero_correlativo,
    codigoComprobante: row.codigo_comprobante,
    ruc: row.cliente_ruc ?? "",
    cliente: row.cliente_nombre,
    vendedor: row.vendedor_nombre ?? "Sin asignar",
    usuario: row.usuario_emision ?? "",
    moneda: row.moneda_origen === "USD" ? "USD" : "PEN",
    totalDocumento: row.total,
    tipoCambio: row.tipo_cambio ?? 1,
    importeSoles: row.total,
    formaPago: row.forma_pago ?? "",
    cuentaCobro: row.cuenta_cobro ?? "",
    numeroOperacion: row.numero_operacion ?? "",
    anulada: row.estado === "anulada" || row.anulada === true,
    periodoMes: row.periodo_mes,
    tipoComprobante: row.tipo_comprobante,
    archivoOrigen: row.fuente_archivo,
  };
}

function initialsFromName(name) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SA"
  );
}

function calcTotals(importeSoles, anulada) {
  const total = anulada ? 0 : importeSoles;
  const subtotal = total > 0 ? Math.round((total / 1.18) * 100) / 100 : 0;
  const igv = total > 0 ? Math.round((total - subtotal) * 100) / 100 : 0;
  return { subtotal, igv, total };
}

function buildNotas(row) {
  return [
    `Importado desde ${row.archivoOrigen}`,
    row.formaPago ? `Forma de pago: ${row.formaPago}` : null,
    row.cuentaCobro ? `Cuenta: ${row.cuentaCobro}` : null,
    row.numeroOperacion ? `Operación: ${row.numeroOperacion}` : null,
    row.usuario ? `Usuario: ${row.usuario}` : null,
    row.anulada ? "Documento anulado en reporte legacy" : null,
  ]
    .filter(Boolean)
    .join(" · ");
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

async function importRows(supabase, userId, rows) {
  const summary = {
    insertadas: 0,
    actualizadas: 0,
    omitidas: 0,
    anulados: rows.filter((row) => row.anulada).length,
  };

  const codigos = rows.map((row) => row.codigoComprobante);
  const { data: existingVentas } = await supabase
    .from("ventas")
    .select("id, codigo_comprobante")
    .eq("user_id", userId)
    .in("codigo_comprobante", codigos);

  const existingMap = new Map((existingVentas ?? []).map((v) => [v.codigo_comprobante, v.id]));

  for (const row of rows.sort((a, b) => a.fechaEmision.localeCompare(b.fechaEmision))) {
    const existingId = existingMap.get(row.codigoComprobante);
    const { subtotal, igv, total } = calcTotals(row.importeSoles, row.anulada);
    const payload = {
      user_id: userId,
      numero: `LEG-${row.serie}-${row.numero}`,
      fecha: row.fechaEmision,
      hora_emision: "12:00:00",
      estado: row.anulada ? "anulada" : "confirmada",
      moneda: row.moneda,
      subtotal,
      igv,
      total,
      tipo_comprobante: row.tipoComprobante,
      codigo_comprobante: row.codigoComprobante,
      estado_sunat: row.anulada ? "rechazado" : "aceptado",
      vendedor_nombre: row.vendedor,
      vendedor_iniciales: initialsFromName(row.vendedor),
      cliente_nombre: row.cliente,
      cliente_ruc: row.ruc || null,
      notas: buildNotas(row),
      tiene_cdr: !row.anulada,
    };

    if (existingId) {
      const { error } = await supabase.from("ventas").update(payload).eq("id", existingId);
      if (error) summary.omitidas += 1;
      else summary.actualizadas += 1;
      continue;
    }

    const { data, error } = await supabase.from("ventas").insert(payload).select("id").single();
    if (error || !data) {
      summary.omitidas += 1;
      continue;
    }

    summary.insertadas += 1;
    await supabase.from("venta_items").insert({
      venta_id: data.id,
      descripcion: `${row.documento} · ${row.cliente}`,
      cantidad: 1,
      precio_unitario: subtotal,
      subtotal,
    });
  }

  return summary;
}

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const abrilOnly = args.includes("--abril2025");
  const useRpc = args.includes("--rpc");
  const dryRun = args.includes("--dry-run");

  const bundle = JSON.parse(readFileSync(BUNDLE_PATH, "utf8"));
  let rows = bundle.rows.map(mapBundleRow);

  if (abrilOnly) {
    rows = rows.filter((row) => row.archivoOrigen === "Abril2025.xlsx");
  }

  console.log(`Comprobantes a importar: ${rows.length}`);
  if (abrilOnly) {
    console.log(`Periodo: 2026-04 · Anulados: ${rows.filter((r) => r.anulada).length}`);
  }

  if (dryRun) {
    console.log("Dry-run: no se escribió en la base de datos.");
    return;
  }

  const { supabase, userId } = await createClientFromEnv();
  console.log(`Usuario: ${userId}`);

  if (useRpc) {
    const { data, error } = await supabase.rpc("import_ventas_legacy_for_user", {
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
    console.log(`RPC import_ventas_legacy_for_user → ${data} comprobantes`);
    return;
  }

  const summary = await importRows(supabase, userId, rows);
  console.log("Importación completada:", summary);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
