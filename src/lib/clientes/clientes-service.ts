import { supabase } from "@/integrations/supabase/client";
import { joinUbicacion, parseUbicacion } from "@/lib/clientes/location-utils";
import {
  formatEquiposInteres,
  formatUltimaFechaToner,
  getGuiaClienteStats,
  loadGuiasStatsMaps,
  type GuiasStatsMaps,
} from "@/lib/clientes/guias-cliente-analytics";
import { withRealKpi } from "@/lib/kpi-utils";
import type { Database } from "@/integrations/supabase/types";
import {
  buildExecutiveChart,
  buildSegmentChart,
  clientesKpis as staticKpis,
  clientesTabs,
  demoClienteRucs,
  emptyDebtByAge,
  formatTipoClienteLabel,
  normalizeTipoClienteKey,
  type ClientRecord,
  type ClientSegment,
  type ClientStatus,
  type DebtAgeChartItem,
  type ExecutiveChartItem,
  type SegmentChartItem,
} from "@/lib/clientes-mock-data";

async function ensureVentaItemsLegacyImported(userId: string): Promise<void> {
  const { error } = await supabase.rpc("import_venta_items_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[clientes] Import ítems venta legacy:", error.message);
  }
}

type ClienteRow = Database["public"]["Tables"]["clientes"]["Row"];

export type ClientesAnalytics = {
  segments: SegmentChartItem[];
  debtByAge: DebtAgeChartItem[];
  topExecutives: ExecutiveChartItem[];
};

export type ClientesSnapshot = {
  clients: ClientRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  analytics: ClientesAnalytics;
  source: "supabase";
};

const ESTADO_FROM_DB: Record<string, ClientStatus> = {
  activo: "Activo",
  prospecto: "Prospecto",
  con_deuda: "Con deuda",
  inactivo: "Inactivo",
};

function formatDate(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatBirthday(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return `S/ ${Math.round(value).toLocaleString("es-PE")}`;
}

function mapRowToClient(row: ClienteRow): ClientRecord {
  const ejecutivo = row.ejecutivo_nombre ?? "Sin asignar";
  const ubicacion = parseUbicacion(row.ciudad ?? row.distrito);
  return {
    id: row.id,
    fechaAlta: formatDate(row.fecha_alta),
    ruc: row.ruc ?? "—",
    razonSocial: row.razon_social,
    correo: row.correo ?? row.email ?? "—",
    telefono: row.telefono ?? "—",
    direccion: row.direccion ?? "—",
    ciudad: ubicacion.ciudad,
    provincia: ubicacion.provincia,
    distrito: ubicacion.distrito,
    tipoCliente: formatTipoClienteLabel(row.tipo_cliente ?? "Público"),
    equipoInteres: "—",
    produccionMensual: row.produccion_mensual?.trim() || "—",
    fechaToner: row.fecha_toner ? formatBirthday(row.fecha_toner) : "—",
    ultimaCompra: "—",
    cumpleanos: row.cumpleanos ? formatBirthday(row.cumpleanos) : "—",
    frecuenciaCompra: "—",
    ticketCompra: "—",
    modelosInteres: row.modelos_interes?.trim() || "—",
    observaciones: row.observaciones ?? row.notas ?? "—",
    contacto: row.contacto_nombre ?? "—",
    cargo: row.contacto_cargo ?? "—",
    segmento: row.segmento as ClientSegment,
    estado: ESTADO_FROM_DB[row.estado_comercial] ?? "Activo",
    ejecutivo,
    ejecutivoInitials:
      row.ejecutivo_iniciales ?? ejecutivo.slice(0, 2).toUpperCase(),
  };
}

async function purgeDemoClientesRemnants(userId: string): Promise<void> {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("user_id", userId)
    .in("ruc", demoClienteRucs);

  if (error) {
    console.warn("[clientes] No se pudieron eliminar clientes demo:", error.message);
  }
}

async function importLegacyClientesIfNeeded(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("import_clientes_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[clientes] Import legacy:", error.message);
    return false;
  }

  return typeof data === "number" && data > 0;
}

function buildSnapshot(
  clients: ClientRecord[],
  analytics: ClientesAnalytics,
  avgTicket: number,
): ClientesSnapshot {
  const tabCounts: Record<string, number | null> = {
    todos: null,
    publico: 0,
    distribuidor: 0,
    tecnico: 0,
    mayorista: 0,
    proveedor: 0,
    gobierno: 0,
  };

  for (const client of clients) {
    const key = normalizeTipoClienteKey(client.tipoCliente);
    if (key in tabCounts && key !== "todos") {
      tabCounts[key] = (tabCounts[key] ?? 0) + 1;
    }
  }

  const activos = clients.filter((c) => c.estado === "Activo").length;
  const prospectos = clients.filter((c) => c.estado === "Prospecto").length;
  const morosos = clients.filter((c) => c.estado === "Con deuda").length;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) {
      return { ...kpi, value: activos.toLocaleString("es-PE"), change: "Datos sincronizados" };
    }
    if (index === 1) {
      return { ...kpi, value: prospectos.toLocaleString("es-PE"), change: "Datos sincronizados" };
    }
    if (index === 2) {
      return { ...kpi, value: morosos.toLocaleString("es-PE"), change: "Datos sincronizados" };
    }
    return {
      ...kpi,
      value: avgTicket > 0 ? formatCurrency(avgTicket) : "—",
      change: avgTicket > 0 ? "Promedio de ventas" : "Sin ventas registradas",
    };
  });

  return {
    clients,
    kpis,
    tabCounts,
    totalRecords: clients.length,
    analytics,
    source: "supabase",
  };
}

function emptyAnalytics(): ClientesAnalytics {
  return {
    segments: [],
    debtByAge: emptyDebtByAge,
    topExecutives: [],
  };
}

type ClientVentasStats = {
  fechas: string[];
  totalSum: number;
  modelos: Set<string>;
};

type VentasStatsMaps = {
  byClientId: Map<string, ClientVentasStats>;
  byRuc: Map<string, ClientVentasStats>;
  ventaCount: number;
  ventaTotalSum: number;
};

const DEBT_AGE_BUCKETS = [
  { label: "0-30 días", min: 0, max: 30, color: "bg-emerald-500" },
  { label: "31-60 días", min: 31, max: 60, color: "bg-amber-500" },
  { label: "61-90 días", min: 61, max: 90, color: "bg-red-500" },
  { label: "91-120 días", min: 91, max: 120, color: "bg-violet-500" },
  { label: "Más de 120 días", min: 121, max: Number.POSITIVE_INFINITY, color: "bg-blue-600" },
] as const;

async function loadDebtByAge(userId: string): Promise<DebtAgeChartItem[]> {
  const { data, error } = await supabase
    .from("cuentas_cobrar")
    .select("dias_mora, saldo_pendiente")
    .eq("user_id", userId)
    .gt("saldo_pendiente", 0);

  if (error) {
    console.warn("[clientes] Error al cargar deuda:", error.message);
    return emptyDebtByAge;
  }

  const amounts = DEBT_AGE_BUCKETS.map(() => 0);
  for (const row of data ?? []) {
    const dias = row.dias_mora ?? 0;
    const bucketIndex = DEBT_AGE_BUCKETS.findIndex(
      (bucket) => dias >= bucket.min && dias <= bucket.max,
    );
    if (bucketIndex >= 0) {
      amounts[bucketIndex] += row.saldo_pendiente;
    }
  }

  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (total === 0) return emptyDebtByAge;

  return DEBT_AGE_BUCKETS.map((bucket, index) => ({
    label: bucket.label,
    amount: amounts[index],
    percent: Math.round((amounts[index] / total) * 100),
    color: bucket.color,
  }));
}

function buildAnalytics(
  clients: ClientRecord[],
  maps: VentasStatsMaps,
  debtByAge: DebtAgeChartItem[],
): ClientesAnalytics {
  const portfolioByClientId = new Map<string, number>();
  for (const [clientId, stats] of maps.byClientId.entries()) {
    portfolioByClientId.set(clientId, stats.totalSum);
  }

  return {
    segments: buildSegmentChart(clients),
    debtByAge,
    topExecutives: buildExecutiveChart(clients, portfolioByClientId),
  };
}

function createEmptyVentasStats(): ClientVentasStats {
  return { fechas: [], totalSum: 0, modelos: new Set() };
}

function isValidRuc(ruc: string | null | undefined) {
  const value = ruc?.trim();
  return Boolean(value && value !== "—" && value !== "00000000");
}

function addVentaToStats(
  stats: ClientVentasStats,
  fecha: string,
  total: number,
  items: { descripcion: string }[] | null,
) {
  stats.fechas.push(fecha);
  stats.totalSum += total;

  for (const item of items ?? []) {
    const descripcion = item.descripcion?.trim();
    if (descripcion) stats.modelos.add(descripcion);
  }
}

function getClientVentasStats(client: ClientRecord, maps: VentasStatsMaps): ClientVentasStats | null {
  const byId = maps.byClientId.get(client.id);
  if (byId && byId.fechas.length > 0) return byId;

  if (isValidRuc(client.ruc)) {
    const byRuc = maps.byRuc.get(client.ruc.trim());
    if (byRuc && byRuc.fechas.length > 0) return byRuc;
  }

  return byId ?? null;
}

function formatFrecuenciaCompra(stats: ClientVentasStats | null): string {
  if (!stats || stats.fechas.length === 0) return "—";

  const count = stats.fechas.length;
  if (count === 1) return "1 compra";

  const first = new Date(`${stats.fechas[0]}T12:00:00`).getTime();
  const last = new Date(`${stats.fechas[stats.fechas.length - 1]}T12:00:00`).getTime();
  const avgDays = Math.max(1, Math.round((last - first) / (count - 1) / 86_400_000));

  return `${count} compras · c/${avgDays} días`;
}

function formatTicketCompra(stats: ClientVentasStats | null): string {
  if (!stats || stats.fechas.length === 0) return "—";
  return formatCurrency(stats.totalSum / stats.fechas.length);
}

function mergeModelosInteres(stored: string, purchased: Set<string>): string {
  const modelos = new Set<string>();

  if (stored && stored !== "—") {
    for (const part of stored.split(/[,;|]/)) {
      const value = part.trim();
      if (value) modelos.add(value);
    }
  }

  for (const modelo of purchased) {
    modelos.add(modelo);
  }

  if (modelos.size === 0) return "—";
  return Array.from(modelos).slice(0, 5).join(", ");
}

async function loadVentasStatsMaps(userId: string): Promise<VentasStatsMaps> {
  const { data, error } = await supabase
    .from("ventas")
    .select("cliente_id, cliente_ruc, fecha, total, venta_items(descripcion)")
    .eq("user_id", userId)
    .neq("estado", "anulada")
    .order("fecha", { ascending: true });

  const byClientId = new Map<string, ClientVentasStats>();
  const byRuc = new Map<string, ClientVentasStats>();
  let ventaCount = 0;
  let ventaTotalSum = 0;

  if (error) {
    console.warn("[clientes] Error al cargar estadísticas de ventas:", error.message);
    return { byClientId, byRuc, ventaCount, ventaTotalSum };
  }

  for (const venta of data ?? []) {
    ventaCount += 1;
    ventaTotalSum += venta.total;
    const items = venta.venta_items as { descripcion: string }[] | null;

    if (venta.cliente_id) {
      const stats = byClientId.get(venta.cliente_id) ?? createEmptyVentasStats();
      addVentaToStats(stats, venta.fecha, venta.total, items);
      byClientId.set(venta.cliente_id, stats);
    }

    if (isValidRuc(venta.cliente_ruc)) {
      const ruc = venta.cliente_ruc!.trim();
      const stats = byRuc.get(ruc) ?? createEmptyVentasStats();
      addVentaToStats(stats, venta.fecha, venta.total, items);
      byRuc.set(ruc, stats);
    }
  }

  return { byClientId, byRuc, ventaCount, ventaTotalSum };
}

function enrichClientWithGuiasStats(client: ClientRecord, maps: GuiasStatsMaps): ClientRecord {
  const stats = getGuiaClienteStats(client.ruc, maps);
  const tonerAuto = formatUltimaFechaToner(stats?.tonerFechas);
  const fechaTonerStored = client.fechaToner !== "—";

  return {
    ...client,
    equipoInteres: formatEquiposInteres(stats),
    fechaToner: fechaTonerStored
      ? client.fechaToner
      : tonerAuto
        ? formatDate(tonerAuto)
        : "—",
  };
}

function enrichClientWithVentasStats(client: ClientRecord, maps: VentasStatsMaps): ClientRecord {
  const stats = getClientVentasStats(client, maps);
  const ultimaFecha = stats?.fechas[stats.fechas.length - 1];

  return {
    ...client,
    ultimaCompra: ultimaFecha ? formatDate(ultimaFecha) : client.ultimaCompra,
    frecuenciaCompra: formatFrecuenciaCompra(stats),
    ticketCompra: formatTicketCompra(stats),
    modelosInteres: mergeModelosInteres(client.modelosInteres, stats?.modelos ?? new Set()),
  };
}

async function enrichClientsWithVentasStats(
  userId: string,
  clients: ClientRecord[],
): Promise<{ clients: ClientRecord[]; maps: VentasStatsMaps; avgTicket: number }> {
  if (clients.length === 0) {
    return {
      clients,
      maps: {
        byClientId: new Map(),
        byRuc: new Map(),
        ventaCount: 0,
        ventaTotalSum: 0,
      },
      avgTicket: 0,
    };
  }

  const [maps, guiasMaps] = await Promise.all([
    loadVentasStatsMaps(userId),
    loadGuiasStatsMaps(userId),
  ]);
  const enriched = clients.map((client) =>
    enrichClientWithGuiasStats(enrichClientWithVentasStats(client, maps), guiasMaps),
  );
  const avgTicket = maps.ventaCount > 0 ? maps.ventaTotalSum / maps.ventaCount : 0;

  return { clients: enriched, maps, avgTicket };
}

async function buildSnapshotFromRows(
  userId: string,
  rows: ClienteRow[],
): Promise<ClientesSnapshot> {
  const { clients, maps, avgTicket } = await enrichClientsWithVentasStats(
    userId,
    rows.map(mapRowToClient),
  );
  const debtByAge = await loadDebtByAge(userId);
  const analytics = buildAnalytics(clients, maps, debtByAge);
  return buildSnapshot(clients, analytics, avgTicket);
}

export async function fetchClientesSnapshot(userId: string | null): Promise<ClientesSnapshot> {
  if (!userId) {
    return buildSnapshot([], emptyAnalytics(), 0);
  }

  await purgeDemoClientesRemnants(userId);
  await ensureVentaItemsLegacyImported(userId);

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("user_id", userId)
    .order("fecha_alta", { ascending: false });

  if (error) {
    console.warn("[clientes] Error al cargar clientes:", error.message);
    return buildSnapshot([], emptyAnalytics(), 0);
  }

  if (!data || data.length === 0) {
    const imported = await importLegacyClientesIfNeeded(userId);
    if (imported) {
      const retry = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", userId)
        .order("fecha_alta", { ascending: false });

      if (!retry.error && retry.data?.length) {
        return buildSnapshotFromRows(userId, retry.data);
      }
    }

    return buildSnapshot([], emptyAnalytics(), 0);
  }

  return buildSnapshotFromRows(userId, data);
}

const SEGMENT_TO_DB: Record<string, string> = {
  corporativo: "Corporativo",
  pyme: "PYME",
  minorista: "Minorista",
  prospecto: "Prospecto",
  otros: "Otros",
};

function parseDistrito(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export type ClienteEditableField =
  | "ruc"
  | "razonSocial"
  | "tipoCliente"
  | "segmento"
  | "produccionMensual"
  | "fechaToner"
  | "contacto"
  | "telefono"
  | "direccion"
  | "ciudad"
  | "provincia"
  | "distrito"
  | "correo"
  | "cumpleanos"
  | "modelosInteres"
  | "observaciones";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "—" ? null : trimmed;
}

function cumpleanosToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "—") return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function buildClienteUpdatePayload(field: ClienteEditableField, value: string) {
  switch (field) {
    case "ruc":
      return { ruc: emptyToNull(value) };
    case "razonSocial":
      return { razon_social: value.trim() };
    case "tipoCliente":
      return { tipo_cliente: value.trim() };
    case "segmento":
      return { segmento: value.trim() };
    case "produccionMensual":
      return { produccion_mensual: emptyToNull(value) };
    case "fechaToner":
      return { fecha_toner: cumpleanosToIso(value) };
    case "contacto":
      return { contacto_nombre: emptyToNull(value) };
    case "telefono":
      return { telefono: emptyToNull(value) };
    case "direccion":
      return { direccion: emptyToNull(value) };
    case "ciudad":
    case "provincia":
    case "distrito":
      return { ciudad: emptyToNull(value) };
    case "correo": {
      const correo = emptyToNull(value);
      return { correo, email: correo };
    }
    case "cumpleanos":
      return { cumpleanos: cumpleanosToIso(value) };
    case "modelosInteres":
      return { modelos_interes: emptyToNull(value) };
    case "observaciones": {
      const observaciones = emptyToNull(value);
      return { observaciones, notas: observaciones };
    }
    default:
      return {};
  }
}

export async function updateClienteField(
  userId: string,
  clientId: string,
  field: ClienteEditableField,
  value: string,
  currentClient?: Pick<ClientRecord, "ciudad" | "provincia" | "distrito">,
): Promise<ClientRecord> {
  let payload: ReturnType<typeof buildClienteUpdatePayload>;

  if (field === "ciudad" || field === "provincia" || field === "distrito") {
    const nextUbicacion = {
      ciudad: field === "ciudad" ? value : currentClient?.ciudad ?? "—",
      provincia: field === "provincia" ? value : currentClient?.provincia ?? "—",
      distrito: field === "distrito" ? value : currentClient?.distrito ?? "—",
    };
    payload = {
      ciudad: emptyToNull(joinUbicacion(nextUbicacion.ciudad, nextUbicacion.provincia, nextUbicacion.distrito)),
    };
  } else {
    payload = buildClienteUpdatePayload(field, value);
  }

  const { data, error } = await supabase
    .from("clientes")
    .update(payload)
    .eq("id", clientId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { clients: enriched } = await enrichClientsWithVentasStats(userId, [mapRowToClient(data)]);
  return enriched[0];
}

export async function createCliente(
  userId: string,
  form: import("@/lib/clientes-form-data").NuevoClienteFormState,
  esBorrador = false,
) {
  const ejecutivo =
    form.ejecutivo
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Sin asignar";

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      user_id: userId,
      razon_social: form.razonSocial.trim(),
      ruc: form.rucDni.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.correo.trim() || null,
      correo: form.correo.trim() || null,
      direccion: form.direccionFiscal.trim() || null,
      contacto_nombre: form.contactoPrincipal.trim() || null,
      segmento: SEGMENT_TO_DB[form.segmento] ?? "Otros",
      estado_comercial:
        form.estadoInicial === "prospecto"
          ? "prospecto"
          : form.estadoInicial === "inactivo"
            ? "inactivo"
            : "activo",
      ejecutivo_nombre: ejecutivo,
      ejecutivo_iniciales: ejecutivo
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
      distrito: form.distrito ? parseDistrito(form.distrito) : null,
      activo: !esBorrador,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToClient(data);
}

export { clientesTabs, getClientStatusStyles, getSegmentStyles, getTipoClienteStyles, normalizeTipoClienteKey } from "@/lib/clientes-mock-data";
