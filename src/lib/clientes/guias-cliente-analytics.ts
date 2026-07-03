import { supabase } from "@/integrations/supabase/client";

export type GuiaClienteStats = {
  equipos: Set<string>;
  productos: Set<string>;
  tonerFechas: string[];
};

export type GuiasStatsMaps = {
  byRuc: Map<string, GuiaClienteStats>;
};

const TONER_PATTERN = /\btoner\b|tóner|tolva/i;
const EQUIPO_PATTERN =
  /impresora|multifuncional|\bpc\b|optiplex|finisher|plotter|esc[aá]ner|scanner|ricoh\s+(?:im|mp|sp|m\s*c)\b|pantum|canon|konica/i;
const CONSUMABLE_PATTERN =
  /cilindro|rodillo|cuchilla|pcdu|unidad itb|filtro de laser|servicio|mantenimiento|diagn[oó]stico|instalaci[oó]n/i;

export function isTonerItem(descripcion: string) {
  return TONER_PATTERN.test(descripcion);
}

export function isEquipoItem(descripcion: string) {
  const lower = descripcion.toLowerCase();
  if (isTonerItem(descripcion)) return false;
  if (CONSUMABLE_PATTERN.test(lower)) return false;
  return EQUIPO_PATTERN.test(lower);
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

function createEmptyGuiaStats(): GuiaClienteStats {
  return { equipos: new Set(), productos: new Set(), tonerFechas: [] };
}

function shortenProductoLabel(descripcion: string) {
  if (isEquipoItem(descripcion)) return shortenEquipoLabel(descripcion);
  const cut = descripcion.split(/[.,(]/)[0]?.trim() ?? descripcion.trim();
  if (cut.length > 60) return `${cut.slice(0, 57)}...`;
  return cut;
}

function addGuiaItemToStats(stats: GuiaClienteStats, fecha: string, descripcion: string) {
  const trimmed = descripcion.trim();
  if (!trimmed) return;

  const label = shortenProductoLabel(trimmed);
  stats.productos.add(label);

  if (isTonerItem(trimmed)) {
    stats.tonerFechas.push(fecha);
    return;
  }

  if (isEquipoItem(trimmed)) {
    stats.equipos.add(shortenEquipoLabel(trimmed));
  }
}

export function formatEquiposInteres(stats: GuiaClienteStats | null | undefined) {
  if (!stats) return "—";

  const source =
    stats.equipos.size > 0
      ? Array.from(stats.equipos)
      : Array.from(stats.productos).filter((item) => !isTonerItem(item));

  if (source.length === 0) return "—";
  return source.slice(0, 6).join(", ");
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

  const byRuc = new Map<string, GuiaClienteStats>();

  if (error) {
    console.warn("[clientes] Error al cargar guías para clientes:", error.message);
    return { byRuc };
  }

  for (const guia of data ?? []) {
    const ruc = guia.destinatario_ruc?.trim();
    if (!ruc) continue;

    const stats = byRuc.get(ruc) ?? createEmptyGuiaStats();
    const items = guia.guia_remision_items as { descripcion: string }[] | null;

    for (const item of items ?? []) {
      addGuiaItemToStats(stats, guia.fecha_emision, item.descripcion);
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
