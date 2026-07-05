import { supabase } from "@/integrations/supabase/client";

export type ClientePurchaseStats = {
  equipos: Set<string>;
  toners: Set<string>;
  repuestos: Set<string>;
  productos: Set<string>;
  tonerFechas: string[];
};

/** @deprecated Use ClientePurchaseStats */
export type GuiaClienteStats = ClientePurchaseStats;

export type GuiasStatsMaps = {
  byRuc: Map<string, ClientePurchaseStats>;
};

const TONER_PATTERN = /\btoner\b|tóner|tolva/i;
const EQUIPO_PATTERN =
  /impresora|multifuncional|copiadora|\bpc\b|optiplex|finisher|plotter|esc[aá]ner|scanner|ricoh\s+(?:im|mp|sp|m\s*c)\b|pantum|canon|konica/i;
const CONSUMABLE_PATTERN =
  /cilindro|rodillo|roller|rueda|cuchilla|pcdu|unidad itb|filtro de laser|servicio|mantenimiento|diagn[oó]stico|instalaci[oó]n|faja|banda|revelador|sensor|kit de|uña|pickup|separation|feed/i;

const PLACEHOLDER_VENTA_ITEM =
  /^(Factura|Boleta|Nota de crédito|Nota de Credito|FACTURA|BOLETA|NOTA DE CR[EÉ]DITO)\s*·\s*/i;

export function isTonerItem(descripcion: string) {
  return TONER_PATTERN.test(descripcion);
}

export function isConsumableItem(descripcion: string) {
  return CONSUMABLE_PATTERN.test(descripcion.toLowerCase());
}

export function isEquipoItem(descripcion: string) {
  const lower = descripcion.toLowerCase();
  if (isTonerItem(descripcion)) return false;
  if (isConsumableItem(descripcion)) return false;
  return EQUIPO_PATTERN.test(lower);
}

export function isPlaceholderVentaItem(descripcion: string) {
  return PLACEHOLDER_VENTA_ITEM.test(descripcion.trim());
}

export function shortenEquipoLabel(descripcion: string) {
  const ricoh = descripcion.match(
    /\b(?:RICOH|Ricoh)\s+(?:IM|MP|SP|M\s*C)[A-Z0-9][^\s,.(]*/i,
  );
  if (ricoh) {
    return ricoh[0].replace(/\s+/g, " ").trim().toUpperCase();
  }

  const pc = descripcion.match(/\bPC\s+[^\n,.(]+/i);
  if (pc) return pc[0].trim();

  const pantum = descripcion.match(/\bPantum\s+[^\n,.(]+/i);
  if (pantum) return pantum[0].trim();

  const cut = descripcion.split(/[.,(]/)[0]?.trim() ?? descripcion.trim();
  if (cut.length > 72) return `${cut.slice(0, 69)}...`;
  return cut;
}

export function shortenProductoLabel(descripcion: string) {
  if (isEquipoItem(descripcion)) return shortenEquipoLabel(descripcion);
  const cut = descripcion.split(/[.,(]/)[0]?.trim() ?? descripcion.trim();
  if (cut.length > 60) return `${cut.slice(0, 57)}...`;
  return cut;
}

export function createEmptyPurchaseStats(): ClientePurchaseStats {
  return {
    equipos: new Set(),
    toners: new Set(),
    repuestos: new Set(),
    productos: new Set(),
    tonerFechas: [],
  };
}

export function resolvePurchaseItemDescripcion(input: {
  descripcion: string;
  codigo?: string | null;
  producto?: { nombre: string; sku: string | null } | null;
}): string | null {
  if (input.producto?.nombre) {
    const sku = input.producto.sku?.trim();
    return sku ? `${input.producto.nombre} (${sku})` : input.producto.nombre;
  }

  const trimmed = input.descripcion.trim();
  if (!trimmed || isPlaceholderVentaItem(trimmed)) {
    return null;
  }

  const codigo = input.codigo?.trim();
  return codigo ? `${codigo} · ${trimmed}` : trimmed;
}

export function addPurchaseItemToStats(
  stats: ClientePurchaseStats,
  fecha: string | null | undefined,
  descripcion: string,
) {
  const trimmed = descripcion.trim();
  if (!trimmed || isPlaceholderVentaItem(trimmed)) return;

  const label = shortenProductoLabel(trimmed);

  if (isTonerItem(trimmed)) {
    stats.toners.add(label);
    if (fecha) stats.tonerFechas.push(fecha);
    return;
  }

  if (isEquipoItem(trimmed)) {
    stats.equipos.add(shortenEquipoLabel(trimmed));
    return;
  }

  if (isConsumableItem(trimmed)) {
    stats.repuestos.add(label);
    return;
  }

  stats.productos.add(label);
}

export function mergePurchaseStats(
  a: ClientePurchaseStats,
  b: ClientePurchaseStats,
): ClientePurchaseStats {
  return {
    equipos: new Set([...a.equipos, ...b.equipos]),
    toners: new Set([...a.toners, ...b.toners]),
    repuestos: new Set([...a.repuestos, ...b.repuestos]),
    productos: new Set([...a.productos, ...b.productos]),
    tonerFechas: [...a.tonerFechas, ...b.tonerFechas].sort(),
  };
}

export function purchaseStatsToLabels(stats: ClientePurchaseStats): Set<string> {
  return new Set([
    ...stats.equipos,
    ...stats.toners,
    ...stats.repuestos,
    ...stats.productos,
  ]);
}

export function formatEquipoInteres(stats: ClientePurchaseStats | null | undefined) {
  if (!stats) return "—";

  const items = [
    ...stats.equipos,
    ...stats.toners,
    ...stats.repuestos,
    ...stats.productos,
  ];

  if (items.length === 0) return "—";
  return [...new Set(items)].slice(0, 8).join(", ");
}

/** @deprecated Use formatEquipoInteres */
export function formatEquiposInteres(stats: ClientePurchaseStats | null | undefined) {
  return formatEquipoInteres(stats);
}

export function formatUltimaFechaToner(fechas: string[] | undefined) {
  if (!fechas || fechas.length === 0) return null;
  return fechas[fechas.length - 1] ?? null;
}

async function ensureGuiasLegacyImported(userId: string): Promise<void> {
  const { error } = await supabase.rpc("import_guias_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[clientes] Import guías legacy:", error.message);
  }
}

export async function loadGuiasStatsMaps(userId: string): Promise<GuiasStatsMaps> {
  await ensureGuiasLegacyImported(userId);

  const { data, error } = await supabase
    .from("guias_remision")
    .select("destinatario_ruc, fecha_emision, guia_remision_items(descripcion)")
    .eq("user_id", userId)
    .neq("estado", "anulada")
    .order("fecha_emision", { ascending: true });

  const byRuc = new Map<string, ClientePurchaseStats>();

  if (error) {
    console.warn("[clientes] Error al cargar guías para clientes:", error.message);
    return { byRuc };
  }

  for (const guia of data ?? []) {
    const ruc = guia.destinatario_ruc?.trim();
    if (!ruc) continue;

    const stats = byRuc.get(ruc) ?? createEmptyPurchaseStats();
    const items = guia.guia_remision_items as { descripcion: string }[] | null;

    for (const item of items ?? []) {
      addPurchaseItemToStats(stats, guia.fecha_emision, item.descripcion);
    }

    byRuc.set(ruc, stats);
  }

  return { byRuc };
}

export function getGuiaClienteStats(ruc: string | null | undefined, maps: GuiasStatsMaps) {
  const value = ruc?.trim();
  if (!value || value === "—") return null;
  return maps.byRuc.get(value) ?? null;
}
