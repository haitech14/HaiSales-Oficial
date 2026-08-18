import { supabase } from "@/integrations/supabase/client";
import { joinUbicacion, parseUbicacion } from "@/lib/clientes/location-utils";
import {
  addPurchaseItemToStats,
  createEmptyPurchaseStats,
  formatEquipoInteres,
  formatUltimaFechaToner,
  getGuiaClienteStats,
  loadGuiasStatsMaps,
  mergePurchaseStats,
  purchaseStatsToLabels,
  resolvePurchaseItemDescripcion,
  shortenProductoLabel,
  type ClientePurchaseStats,
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
  clientesTabIdForTipo,
  type ClientRecord,
  type ClientSegment,
  type ClientStatus,
  type DebtAgeChartItem,
  type ExecutiveChartItem,
  type SegmentChartItem,
} from "@/lib/clientes-mock-data";

const legacySetupDone = new Set<string>();

async function ensureVentaItemsLegacyImported(userId: string): Promise<void> {
  const { error } = await supabase.rpc("import_venta_items_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[clientes] Import ítems venta legacy:", error.message);
  }
}

async function runOnceLegacySetup(userId: string): Promise<void> {
  if (legacySetupDone.has(userId)) return;
  await purgeDemoClientesRemnants(userId);
  await ensureVentaItemsLegacyImported(userId);
  legacySetupDone.add(userId);
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
  };

  for (const client of clients) {
    const tabKey = clientesTabIdForTipo(client.tipoCliente);
    if (tabKey in tabCounts && tabKey !== "todos") {
      tabCounts[tabKey] = (tabCounts[tabKey] ?? 0) + 1;
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
  purchase: ClientePurchaseStats;
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
  return { fechas: [], totalSum: 0, modelos: new Set(), purchase: createEmptyPurchaseStats() };
}

function isValidRuc(ruc: string | null | undefined) {
  const value = ruc?.trim();
  return Boolean(value && value !== "—" && value !== "00000000");
}

type VentaItemInput = {
  descripcion: string;
  productos?: { nombre: string; sku: string | null } | null;
};

function addVentaToStats(
  stats: ClientVentasStats,
  fecha: string,
  total: number,
  items: VentaItemInput[] | null,
) {
  stats.fechas.push(fecha);
  stats.totalSum += total;

  for (const item of items ?? []) {
    const descripcion = resolvePurchaseItemDescripcion({
      descripcion: item.descripcion,
      producto: item.productos,
    });
    if (!descripcion) continue;

    addPurchaseItemToStats(stats.purchase, fecha, descripcion);
    stats.modelos.add(shortenProductoLabel(descripcion));
  }
}

function getClientVentasStats(client: ClientRecord, maps: VentasStatsMaps): ClientVentasStats | null {
  const byId = maps.byClientId.get(client.id);
  const byRuc = isValidRuc(client.ruc) ? maps.byRuc.get(client.ruc.trim()) : null;

  if (!byId && !byRuc) return null;

  const hasPurchaseData = (stats: ClientVentasStats) =>
    stats.purchase.equipos.size > 0 ||
    stats.purchase.toners.size > 0 ||
    stats.purchase.repuestos.size > 0 ||
    stats.purchase.productos.size > 0;

  const hasActivity = (stats: ClientVentasStats) =>
    stats.fechas.length > 0 || hasPurchaseData(stats);

  if (byId && !byRuc) return hasActivity(byId) ? byId : null;
  if (!byId && byRuc) return hasActivity(byRuc) ? byRuc : null;

  if (!hasActivity(byId!) && !hasActivity(byRuc!)) return byId;

  if (byId === byRuc) return byId;

  return {
    fechas: byId!.fechas.length > 0 ? byId!.fechas : byRuc!.fechas,
    totalSum: byId!.fechas.length > 0 ? byId!.totalSum : byRuc!.totalSum,
    modelos: new Set([...byId!.modelos, ...byRuc!.modelos]),
    purchase: mergePurchaseStats(byId!.purchase, byRuc!.purchase),
  };
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

async function augmentVentasStatsFromLegacy(
  byRuc: Map<string, ClientVentasStats>,
): Promise<void> {
  const legacyClient = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { data, error } = await legacyClient
    .from("venta_legacy_import_items")
    .select("cliente_ruc, descripcion, fecha, codigo")
    .not("cliente_ruc", "is", null);

  if (error) {
    console.warn("[clientes] venta_legacy_import_items:", error.message);
    return;
  }

  for (const row of data ?? []) {
    const ruc = row.cliente_ruc?.trim();
    if (!isValidRuc(ruc)) continue;

    const descripcion = resolvePurchaseItemDescripcion({
      descripcion: row.descripcion,
      codigo: row.codigo,
    });
    if (!descripcion) continue;

    const stats = byRuc.get(ruc!) ?? createEmptyVentasStats();
    addPurchaseItemToStats(stats.purchase, row.fecha, descripcion);
    stats.modelos.add(shortenProductoLabel(descripcion));
    byRuc.set(ruc!, stats);
  }
}

async function loadVentasStatsMaps(userId: string): Promise<VentasStatsMaps> {
  const { data, error } = await supabase
    .from("ventas")
    .select("cliente_id, cliente_ruc, fecha, total, venta_items(descripcion, productos(nombre, sku))")
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
    const items = venta.venta_items as VentaItemInput[] | null;

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

  await augmentVentasStatsFromLegacy(byRuc);

  return { byClientId, byRuc, ventaCount, ventaTotalSum };
}

function enrichClientWithPurchaseStats(
  client: ClientRecord,
  ventasMaps: VentasStatsMaps,
  guiasMaps: GuiasStatsMaps,
): ClientRecord {
  const ventasStats = getClientVentasStats(client, ventasMaps);
  const guiaStats = getGuiaClienteStats(client.ruc, guiasMaps);
  const purchase = mergePurchaseStats(
    ventasStats?.purchase ?? createEmptyPurchaseStats(),
    guiaStats ?? createEmptyPurchaseStats(),
  );
  const ultimaFecha = ventasStats?.fechas[ventasStats.fechas.length - 1];
  const tonerAuto = formatUltimaFechaToner(purchase.tonerFechas);
  const fechaTonerStored = client.fechaToner !== "—";

  return {
    ...client,
    ultimaCompra: ultimaFecha ? formatDate(ultimaFecha) : client.ultimaCompra,
    frecuenciaCompra: formatFrecuenciaCompra(ventasStats),
    ticketCompra: formatTicketCompra(ventasStats),
    modelosInteres: mergeModelosInteres(
      client.modelosInteres,
      ventasStats?.modelos ?? purchaseStatsToLabels(purchase),
    ),
    equipoInteres: formatEquipoInteres(purchase),
    fechaToner: fechaTonerStored
      ? client.fechaToner
      : tonerAuto
        ? formatDate(tonerAuto)
        : "—",
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
    enrichClientWithPurchaseStats(client, maps, guiasMaps),
  );
  const avgTicket = maps.ventaCount > 0 ? maps.ventaTotalSum / maps.ventaCount : 0;

  return { clients: enriched, maps, avgTicket };
}


async function loadClientesRows(userId: string): Promise<ClienteRow[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("user_id", userId)
    .order("fecha_alta", { ascending: false });

  if (error) {
    console.warn("[clientes] Error al cargar clientes:", error.message);
    return [];
  }

  if (data?.length) return data;

  const imported = await importLegacyClientesIfNeeded(userId);
  if (!imported) return [];

  const retry = await supabase
    .from("clientes")
    .select("*")
    .eq("user_id", userId)
    .order("fecha_alta", { ascending: false });

  if (retry.error) {
    console.warn("[clientes] Error al recargar clientes:", retry.error.message);
    return [];
  }

  return retry.data ?? [];
}

/** Carga rápida: solo filas de clientes, sin estadísticas de ventas/guias. */
export async function fetchClientesList(userId: string | null): Promise<ClientesSnapshot> {
  if (!userId) {
    return buildSnapshot([], emptyAnalytics(), 0);
  }

  await runOnceLegacySetup(userId);
  const rows = await loadClientesRows(userId);
  return buildSnapshot(rows.map(mapRowToClient), emptyAnalytics(), 0);
}

/** Enriquecimiento en segundo plano: ventas, guías y analytics. */
export async function fetchClientesEnrichment(
  userId: string,
  clients: ClientRecord[],
): Promise<{ clients: ClientRecord[]; analytics: ClientesAnalytics; avgTicket: number }> {
  if (clients.length === 0) {
    return { clients, analytics: emptyAnalytics(), avgTicket: 0 };
  }

  const { clients: enriched, maps, avgTicket } = await enrichClientsWithVentasStats(userId, clients);
  const debtByAge = await loadDebtByAge(userId);
  return {
    clients: enriched,
    analytics: buildAnalytics(enriched, maps, debtByAge),
    avgTicket,
  };
}

export function mergeClientesEnrichment(
  enrichment: Awaited<ReturnType<typeof fetchClientesEnrichment>>,
): ClientesSnapshot {
  return buildSnapshot(enrichment.clients, enrichment.analytics, enrichment.avgTicket);
}

export async function fetchClientesSnapshot(userId: string | null): Promise<ClientesSnapshot> {
  const list = await fetchClientesList(userId);
  if (!userId || list.clients.length === 0) return list;
  return mergeClientesEnrichment(await fetchClientesEnrichment(userId, list.clients));
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

/** Persiste contacto, celular, dirección y tipo desde el modal de venta. */
export async function updateClienteFromVentaForm(
  userId: string,
  clientId: string,
  data: {
    contacto: string;
    celular: string;
    direccion: string;
    tipoCliente: string;
  },
): Promise<void> {
  const { data: updated, error } = await supabase
    .from("clientes")
    .update({
      contacto_nombre: emptyToNull(data.contacto),
      telefono: emptyToNull(data.celular),
      direccion: emptyToNull(data.direccion),
      tipo_cliente: formatTipoClienteLabel(data.tipoCliente.trim() || "Público"),
    })
    .eq("id", clientId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!updated?.id) {
    throw new Error("No se encontró el cliente para actualizar");
  }
}

/** Resuelve el UUID local del cliente por id, RUC o razón social. */
export async function resolveClienteIdForVenta(
  userId: string,
  opts: { clienteId?: string; ruc?: string; razonSocial?: string },
): Promise<string | null> {
  const byId = opts.clienteId?.trim();
  if (byId) {
    const { data } = await supabase
      .from("clientes")
      .select("id")
      .eq("user_id", userId)
      .eq("id", byId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const ruc = opts.ruc?.trim();
  if (ruc) {
    const { data } = await supabase
      .from("clientes")
      .select("id")
      .eq("user_id", userId)
      .eq("ruc", ruc)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const razon = opts.razonSocial?.trim();
  if (razon) {
    const { data } = await supabase
      .from("clientes")
      .select("id")
      .eq("user_id", userId)
      .ilike("razon_social", razon)
      .limit(1);
    if (data?.[0]?.id) return data[0].id;
  }

  return null;
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

export type ClientePickerOption = {
  id: string;
  razonSocial: string;
  ruc: string;
  contacto: string;
  ciudad: string;
  telefono: string;
  correo: string;
  direccion: string;
  tipoCliente: string;
  hint: string;
  searchText: string;
};

function mapRowToPickerOption(row: ClienteRow, matchHint?: string): ClientePickerOption {
  const ruc = row.ruc?.trim() || "";
  const contacto = row.contacto_nombre?.trim() || "";
  const ciudad = row.ciudad?.trim() || "";
  const telefono = row.telefono?.trim() || "";
  const correo = (row.correo ?? row.email)?.trim() || "";
  const direccion = row.direccion?.trim() || "";
  const tipoCliente = formatTipoClienteLabel(row.tipo_cliente ?? "Público");
  const hintParts = matchHint
    ? [matchHint]
    : [ruc ? `RUC ${ruc}` : null, contacto || null, telefono || null, ciudad || null].filter(
        Boolean,
      );

  return {
    id: row.id,
    razonSocial: row.razon_social,
    ruc,
    contacto,
    ciudad,
    telefono,
    correo,
    direccion,
    tipoCliente,
    hint: hintParts.join(" · "),
    searchText: `${row.razon_social} ${ruc} ${contacto} ${correo} ${telefono} ${ciudad} ${direccion}`,
  };
}

function sanitizePickerQuery(query: string): string {
  return query.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function shortenMatchLabel(value: string, max = 42): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/**
 * Clientes que compraron un producto/servicio cuya descripción coincide con la búsqueda.
 */
async function findClienteIdsByProductoComprado(
  userId: string,
  pattern: string,
  limit: number,
): Promise<Map<string, string>> {
  const matched = new Map<string, string>();

  try {
    const { data: items, error: itemsError } = await supabase
      .from("venta_items")
      .select("descripcion, venta_id")
      .ilike("descripcion", pattern)
      .limit(120);

    if (itemsError) {
      // Tabla ausente o sin sincronizar en schema cache: no bloquear el picker
      if (!/schema cache|does not exist|Could not find the table/i.test(itemsError.message)) {
        console.warn("[clientes] search by producto:", itemsError.message);
      }
      return matched;
    }
    if (!items?.length) return matched;

    const ventaIds = [...new Set(items.map((item) => item.venta_id).filter(Boolean))];
    if (ventaIds.length === 0) return matched;

    const { data: ventas, error: ventasError } = await supabase
      .from("ventas")
      .select("id, cliente_id")
      .eq("user_id", userId)
      .in("id", ventaIds)
      .not("cliente_id", "is", null)
      .limit(80);

    if (ventasError) {
      if (!/schema cache|does not exist|Could not find the table/i.test(ventasError.message)) {
        console.warn("[clientes] search ventas by producto:", ventasError.message);
      }
      return matched;
    }

    const ventaToCliente = new Map<string, string>();
    for (const venta of ventas ?? []) {
      if (venta.cliente_id) ventaToCliente.set(venta.id, venta.cliente_id);
    }

    for (const item of items) {
      const clienteId = ventaToCliente.get(item.venta_id);
      if (!clienteId || matched.has(clienteId)) continue;
      matched.set(clienteId, item.descripcion);
      if (matched.size >= limit) break;
    }
  } catch (error) {
    console.warn("[clientes] search by producto failed:", error);
  }

  return matched;
}

async function loadClientesByIds(
  userId: string,
  ids: string[],
): Promise<Map<string, ClienteRow>> {
  const byId = new Map<string, ClienteRow>();
  if (ids.length === 0) return byId;

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    console.warn("[clientes] load by ids:", error.message);
    return byId;
  }

  for (const row of data ?? []) {
    byId.set(row.id, row);
  }
  return byId;
}

async function loadFrequentClienteIds(userId: string, limit: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("ventas")
    .select("cliente_id")
    .eq("user_id", userId)
    .not("cliente_id", "is", null)
    .order("fecha", { ascending: false })
    .limit(200);

  if (error) {
    if (!/schema cache|does not exist|Could not find the table/i.test(error.message)) {
      console.warn("[clientes] frequent ids:", error.message);
    }
    return [];
  }
  if (!data?.length) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    const id = row.cliente_id;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

/**
 * Clientes reales para el picker de Nueva venta:
 * vacío → recientes / frecuentes / últimos actualizados.
 * con texto → razón social, RUC, contacto, celular, correo, modelos de interés
 *             y clientes que compraron un producto coincidente.
 */
export async function searchClientesForPicker(
  userId: string | null,
  query: string,
  recentIds: string[] = [],
  limit = 12,
): Promise<ClientePickerOption[]> {
  if (!userId) return [];

  const trimmed = query.trim();

  if (trimmed) {
    const safe = sanitizePickerQuery(trimmed);
    if (!safe) return [];
    const pattern = `%${safe}%`;
    const phoneDigits = digitsOnly(safe);
    const phonePattern = phoneDigits.length >= 4 ? `%${phoneDigits}%` : null;

    const fieldFilters = [
      `razon_social.ilike.${pattern}`,
      `ruc.ilike.${pattern}`,
      `contacto_nombre.ilike.${pattern}`,
      `contacto_cargo.ilike.${pattern}`,
      `email.ilike.${pattern}`,
      `correo.ilike.${pattern}`,
      `telefono.ilike.${pattern}`,
      `ciudad.ilike.${pattern}`,
      `modelos_interes.ilike.${pattern}`,
      `direccion.ilike.${pattern}`,
    ];
    if (phonePattern) {
      fieldFilters.push(`telefono.ilike.${phonePattern}`);
    }

    const [directResult, productMatches] = await Promise.all([
      supabase
        .from("clientes")
        .select("*")
        .eq("user_id", userId)
        .or(fieldFilters.join(","))
        .order("updated_at", { ascending: false })
        .limit(limit),
      findClienteIdsByProductoComprado(userId, pattern, limit),
    ]);

    if (directResult.error) {
      console.warn("[clientes] search picker:", directResult.error.message);
    }

    const byId = new Map<string, ClientePickerOption>();

    for (const row of directResult.data ?? []) {
      byId.set(row.id, mapRowToPickerOption(row));
    }

    const missingProductIds = [...productMatches.keys()].filter((id) => !byId.has(id));
    if (missingProductIds.length > 0) {
      const productClients = await loadClientesByIds(userId, missingProductIds);
      for (const [id, row] of productClients) {
        const productLabel = productMatches.get(id);
        byId.set(
          id,
          mapRowToPickerOption(
            row,
            productLabel ? `Compró: ${shortenMatchLabel(productLabel)}` : undefined,
          ),
        );
      }
    } else {
      // Ya estaban por coincidencia directa: reforzar hint si también compraron el producto
      for (const [id, productLabel] of productMatches) {
        const existing = byId.get(id);
        if (!existing) continue;
        byId.set(id, {
          ...existing,
          hint: `Compró: ${shortenMatchLabel(productLabel)} · ${existing.hint}`,
        });
      }
    }

    const ordered: ClientePickerOption[] = [];
    for (const row of directResult.data ?? []) {
      const option = byId.get(row.id);
      if (option) ordered.push(option);
    }
    for (const id of productMatches.keys()) {
      if (ordered.some((item) => item.id === id)) continue;
      const option = byId.get(id);
      if (option) ordered.push(option);
      if (ordered.length >= limit) break;
    }

    return ordered.slice(0, limit);
  }

  const frequentIds = await loadFrequentClienteIds(userId, limit);
  const priorityIds = [...recentIds, ...frequentIds.filter((id) => !recentIds.includes(id))].slice(
    0,
    limit,
  );

  const byId = new Map<string, ClientePickerOption>();

  if (priorityIds.length > 0) {
    const { data: prioritized } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", userId)
      .in("id", priorityIds);

    for (const row of prioritized ?? []) {
      byId.set(row.id, mapRowToPickerOption(row));
    }
  }

  const ordered: ClientePickerOption[] = [];
  for (const id of priorityIds) {
    const option = byId.get(id);
    if (option) ordered.push(option);
  }

  if (ordered.length < limit) {
    const { data: recentRows } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit * 2);

    for (const row of recentRows ?? []) {
      if (byId.has(row.id)) continue;
      const option = mapRowToPickerOption(row);
      byId.set(row.id, option);
      ordered.push(option);
      if (ordered.length >= limit) break;
    }
  }

  return ordered.slice(0, limit);
}

export {
  clientesTabs,
  getClientStatusStyles,
  getSegmentStyles,
  getTipoClienteStyles,
  matchesClientesTipoTab,
  normalizeTipoClienteKey,
} from "@/lib/clientes-mock-data";
