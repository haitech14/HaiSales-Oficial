import { supabase } from "@/integrations/supabase/client";
import { parseUbicacion } from "@/lib/clientes/location-utils";
import { updateClienteField } from "@/lib/clientes/clientes-service";
import {
  formatTipoClienteLabel,
  normalizeTipoClienteKey,
} from "@/lib/clientes-mock-data";
import { withRealKpi } from "@/lib/kpi-utils";
import { buildOwnerInitials, pickHumanContactName, phoneFromLeadCodigo, resolveContactPhone } from "@/lib/crm/contact-display-name";
import {
  leadCodigoFromConversation,
  socialLeadBadgeFromCodigo,
  syncWhatsAppLeadsToProspeccion,
} from "@/lib/crm/whatsapp-prospeccion-sync";
import { isGenericLastMessage } from "@/lib/inbox/empty-conversations-cleanup";
import { fetchInboxMessages } from "@/lib/inbox/inbox-service";
import { MESSAGING_PROVIDERS } from "@/lib/inbox/messaging-providers";
import { syncKapsoConversations } from "@/lib/inbox/whatsapp-connection-service";
import { syncZernioConversations } from "@/lib/inbox/zernio-connection-service";
import { syncZavuConversations } from "@/lib/inbox/zavu-connection-service";
import type { Database } from "@/integrations/supabase/types";
import {
  crmKpis as staticKpis,
  pipelineTabs,
  type Opportunity,
  type OpportunityStage,
  type ProspectDetail,
} from "@/lib/crm-mock-data";
import {
  pipelineColumns as mockPipelineColumns,
  pipelineKpis as staticPipelineKpis,
  type PipelineCard,
  type PipelineColumn,
  type PipelineStage,
} from "@/lib/pipeline-mock-data";

type OportunidadRow = Database["public"]["Tables"]["oportunidades"]["Row"];

export type CrmSnapshot = {
  opportunities: Opportunity[];
  pipelineColumns: PipelineColumn[];
  kpis: typeof staticKpis;
  pipelineKpis: typeof staticPipelineKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

const ETAPA_FROM_DB: Record<string, OpportunityStage> = {
  Prospectos: "Prospectos",
  Calificación: "Calificación",
  Propuesta: "Propuesta",
  Negociación: "Negociación",
  "Cierre ganado": "Cierre ganado",
};

const ETAPA_TO_PIPELINE: Record<OpportunityStage, PipelineStage> = {
  Prospectos: "Prospección",
  Calificación: "Calificación",
  Propuesta: "Cotización",
  Negociación: "Negociación",
  "Cierre ganado": "Ganada",
};

export const PIPELINE_TO_ETAPA: Record<PipelineStage, OpportunityStage> = {
  Prospección: "Prospectos",
  Calificación: "Calificación",
  Cotización: "Propuesta",
  Negociación: "Negociación",
  Ganada: "Cierre ganado",
};

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  Prospectos: "Prospección",
  Calificación: "Calificación",
  Propuesta: "Cotización",
  Negociación: "Negociación",
  "Cierre ganado": "Ganada",
};

function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function resolveOpportunityTipoCliente(opp: Pick<Opportunity, "id" | "title" | "tipoCliente">): {
  key: string;
  label: string;
} {
  if (opp.tipoCliente?.trim()) {
    const key = normalizeTipoClienteKey(opp.tipoCliente);
    return { key, label: formatTipoClienteLabel(opp.tipoCliente) };
  }
  return { key: "publico", label: "Público" };
}

export function resolveOpportunityFuente(
  opp: Pick<Opportunity, "id" | "title">,
): string | null {
  const social = socialLeadBadgeFromCodigo(opp.id, opp.title);
  return social ? social.toLowerCase() : null;
}

export const CRM_TIPO_CLIENTE_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "publico", label: "Público" },
  { id: "distribuidor", label: "Distribuidor" },
  { id: "tecnico", label: "Técnico" },
  { id: "mayorista", label: "Mayorista" },
  { id: "proveedor", label: "Proveedor" },
] as const;

export const CRM_FUENTE_FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
] as const;

export type CrmTipoClienteFilterId = (typeof CRM_TIPO_CLIENTE_FILTERS)[number]["id"];
export type CrmFuenteFilterId = (typeof CRM_FUENTE_FILTERS)[number]["id"];

export function matchesCrmTipoClienteFilter(tipoKey: string | undefined, filterId: string): boolean {
  if (!filterId || filterId === "todos") return true;
  const key = tipoKey || "publico";
  if (filterId === "publico") return key === "publico" || key === "gobierno";
  return key === filterId;
}

export function matchesCrmFuenteFilter(fuenteKey: string | undefined | null, filterId: string): boolean {
  if (!filterId || filterId === "todas") return true;
  return (fuenteKey ?? "").toLowerCase() === filterId;
}

export type CrmOwnerOption = {
  id: string;
  nombre: string;
  initials: string;
};

export async function listCrmOwnerOptions(
  userId: string,
  fallback: CrmOwnerOption,
): Promise<CrmOwnerOption[]> {
  const { data, error } = await supabase
    .from("usuarios_empresa")
    .select("id, nombre_completo, estado")
    .eq("user_id", userId)
    .neq("estado", "inactivo")
    .order("nombre_completo", { ascending: true });

  if (error) {
    console.warn("[crm] Usuarios responsables:", error.message);
  }

  const options: CrmOwnerOption[] = (data ?? [])
    .map((row) => ({
      id: row.id,
      nombre: row.nombre_completo.trim(),
      initials: buildOwnerInitials(row.nombre_completo),
    }))
    .filter((item) => item.nombre);

  if (!options.some((item) => item.nombre.toLowerCase() === fallback.nombre.trim().toLowerCase())) {
    options.unshift(fallback);
  }

  return options.length > 0 ? options : [fallback];
}

const PIPELINE_COLUMN_META: Record<
  PipelineStage,
  Omit<PipelineColumn, "count" | "totalValue" | "moreCount" | "cards">
> = {
  Prospección: mockPipelineColumns[0],
  Calificación: mockPipelineColumns[1],
  Cotización: mockPipelineColumns[2],
  Negociación: mockPipelineColumns[3],
  Ganada: mockPipelineColumns[4],
};

function formatDateParts(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return {
    date: `${day}/${month}`,
    time: `${hours}:${minutes}`,
  };
}

function cleanOportunidadTitulo(titulo: string, fallback: string) {
  const trimmed = titulo.trim();
  if (!trimmed) return fallback;
  if (/^oportunidad(\s|$|[—\-:])/i.test(trimmed)) return fallback;
  if (/^lead\s+(whatsapp|facebook|instagram)$/i.test(trimmed)) return fallback;
  if (/^(WA|FB|IG)-\S+$/i.test(trimmed)) return fallback;
  return trimmed;
}

function mapRowToOpportunity(row: OportunidadRow): Opportunity {
  const { date, time } = formatDateParts(row.fecha_oportunidad);
  return {
    id: row.codigo,
    date,
    time,
    client: row.cliente_nombre,
    ruc: row.cliente_ruc ?? "—",
    title: cleanOportunidadTitulo(row.titulo, row.cliente_nombre),
    subtitle: row.subtitulo ?? "",
    value: Number(row.valor),
    stage: ETAPA_FROM_DB[row.etapa] ?? "Prospectos",
    probability: row.probabilidad,
    owner: row.responsable_nombre,
    ownerInitials:
      row.responsable_iniciales ?? row.responsable_nombre.slice(0, 2).toUpperCase(),
    fechaIso: row.fecha_oportunidad.slice(0, 10),
    tipoCliente: undefined,
    lastMessage: row.subtitulo?.trim() || undefined,
    lastContactAt: row.fecha_oportunidad,
  };
}

function opportunityToPipelineCard(opp: Opportunity): PipelineCard {
  const dueDate = opp.date;
  const isProspection = opp.stage === "Prospectos";
  const socialBadge = socialLeadBadgeFromCodigo(opp.id, opp.title);
  const tipo = resolveOpportunityTipoCliente(opp);
  const contactName = pickHumanContactName(opp.client) || undefined;
  const contactPhone = opp.contactPhone || resolveContactPhone(opp.ruc, opp.client);
  const displayTitle = isProspection
    ? contactName || contactPhone || opp.client
    : opp.title;

  const rawMessage = opp.lastMessage || (socialBadge ? opp.subtitle : undefined);
  const lastMessage =
    rawMessage && !isGenericLastMessage(rawMessage) ? rawMessage.trim() : undefined;

  return {
    id: opp.id,
    title: displayTitle,
    company: socialBadge
      ? lastMessage || contactPhone || `Conversación ${socialBadge}`
      : isProspection
        ? opp.subtitle || "Sin compra reciente · Contactar y promocionar"
        : opp.client,
    value: opp.value,
    owner: opp.owner,
    ownerInitials: opp.ownerInitials,
    dueDate,
    dueDateUrgent: opp.stage === "Negociación",
    statusBadge:
      opp.stage === "Cierre ganado"
        ? "Ganada"
        : socialBadge && isProspection
          ? socialBadge
          : undefined,
    intereses: isProspection && !socialBadge ? opp.intereses : undefined,
    ciudad: isProspection ? opp.ciudad : undefined,
    tipoCliente: tipo.label,
    tipoClienteKey: tipo.key,
    fuenteKey: socialBadge?.toLowerCase(),
    lastMessage,
    lastContactAt: opp.lastContactAt,
    contactPhone,
    contactName,
  };
}

function buildPipelineColumns(opportunities: Opportunity[]): PipelineColumn[] {
  const stages: PipelineStage[] = [
    "Prospección",
    "Calificación",
    "Cotización",
    "Negociación",
    "Ganada",
  ];

  return stages.map((stage) => {
    const meta = PIPELINE_COLUMN_META[stage];
    const stageOpps = opportunities.filter(
      (opp) => ETAPA_TO_PIPELINE[opp.stage] === stage,
    );
    const cards = stageOpps.map(opportunityToPipelineCard);
    const totalValue = cards.reduce((sum, card) => sum + card.value, 0);

    return {
      id: meta.id,
      title: stage,
      count: cards.length,
      totalValue,
      borderColor: meta.borderColor,
      headerColor: meta.headerColor,
      badgeBg: meta.badgeBg,
      moreCount: 0,
      cards,
    };
  });
}

function buildSnapshot(
  opportunities: Opportunity[],
  source: "supabase" | "mock",
): CrmSnapshot {
  const tabCounts: Record<string, number | null> = {
    todos: null,
    prospectos: opportunities.filter((o) => o.stage === "Prospectos").length,
    calificacion: opportunities.filter((o) => o.stage === "Calificación").length,
    propuesta: opportunities.filter((o) => o.stage === "Propuesta").length,
    negociacion: opportunities.filter((o) => o.stage === "Negociación").length,
    cierre: opportunities.filter((o) => o.stage === "Cierre ganado").length,
  };

  const pipelineValue = opportunities.reduce((sum, o) => sum + o.value, 0);
  const wonValue = opportunities
    .filter((o) => o.stage === "Cierre ganado")
    .reduce((sum, o) => sum + o.value, 0);
  const inNegotiation = opportunities.filter((o) => o.stage === "Negociación").length;
  const wonCount = opportunities.filter((o) => o.stage === "Cierre ganado").length;
  const closeRate =
    opportunities.length > 0
      ? Math.round((wonCount / opportunities.length) * 1000) / 10
      : 0;

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) {
      return withRealKpi(
        kpi,
        pipelineValue > 0
          ? `S/ ${Math.round(pipelineValue).toLocaleString("es-PE")}`
          : "S/ 0",
      );
    }
    if (index === 1) return withRealKpi(kpi, String(inNegotiation));
    if (index === 3) return withRealKpi(kpi, `${closeRate}%`);
    return withRealKpi(kpi, "0");
  });

  const pipelineKpis = staticPipelineKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(opportunities.length));
    if (index === 1) {
      return withRealKpi(
        kpi,
        pipelineValue > 0
          ? `S/ ${Math.round(pipelineValue).toLocaleString("es-PE")}`
          : "S/ 0",
      );
    }
    if (index === 2) return withRealKpi(kpi, `${closeRate}%`);
    if (index === 3) {
      return withRealKpi(
        kpi,
        wonValue > 0
          ? `S/ ${Math.round(wonValue).toLocaleString("es-PE")}`
          : "S/ 0",
      );
    }
    return kpi;
  });

  return {
    opportunities,
    pipelineColumns: buildPipelineColumns(opportunities),
    kpis,
    pipelineKpis,
    tabCounts,
    totalRecords: opportunities.length,
    source,
  };
}

async function syncProspeccionSinCompraIfNeeded(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("sync_prospeccion_sin_compra_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[crm] Sync prospección sin compra:", error.message);
    return 0;
  }

  return typeof data === "number" && data > 0 ? data : 0;
}

async function loadCrmOpportunities(userId: string): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("user_id", userId)
    .order("fecha_oportunidad", { ascending: false });

  if (error) {
    console.warn("[crm] Error al cargar oportunidades:", error.message);
    return [];
  }

  const rows = data ?? [];
  const clienteIds = [
    ...new Set(rows.map((row) => row.cliente_id).filter((id): id is string => Boolean(id))),
  ];
  const rucs = [
    ...new Set(rows.map((row) => row.cliente_ruc?.trim()).filter((ruc): ruc is string => Boolean(ruc))),
  ];

  type ClienteProfile = {
    modelosInteres: string | null;
    ciudad: string | null;
    tipoCliente: string | null;
    contactoNombre: string | null;
    razonSocial: string | null;
    telefono: string | null;
  };
  const clientLookup = new Map<string, ClienteProfile>();
  const clientByRuc = new Map<string, ClienteProfile>();
  const clientByPhone = new Map<string, ClienteProfile>();

  const clienteSelect =
    "id, ciudad, modelos_interes, tipo_cliente, ruc, telefono, contacto_nombre, razon_social";
  type ClienteRow = {
    id: string;
    ciudad: string | null;
    modelos_interes: string | null;
    tipo_cliente: string | null;
    ruc: string | null;
    telefono: string | null;
    contacto_nombre: string | null;
    razon_social: string | null;
  };

  const [byId, byRuc, conversationsResult] = await Promise.all([
    clienteIds.length > 0
      ? supabase.from("clientes").select(clienteSelect).eq("user_id", userId).in("id", clienteIds)
      : Promise.resolve({ data: [] as ClienteRow[] }),
    rucs.length > 0
      ? supabase.from("clientes").select(clienteSelect).eq("user_id", userId).in("ruc", rucs)
      : Promise.resolve({ data: [] as ClienteRow[] }),
    supabase
      .from("inbox_conversations")
      .select(
        "channel, contact_name, contact_identifier, external_id, last_message, last_message_at, created_at, metadata",
      )
      .eq("user_id", userId)
      .in("channel", ["whatsapp", "facebook", "instagram", "messenger"]),
  ]);

  for (const cliente of [...(byId.data ?? []), ...(byRuc.data ?? [])]) {
    const profile: ClienteProfile = {
      modelosInteres: cliente.modelos_interes,
      ciudad: cliente.ciudad,
      tipoCliente: cliente.tipo_cliente,
      contactoNombre: cliente.contacto_nombre,
      razonSocial: cliente.razon_social,
      telefono: cliente.telefono,
    };
    clientLookup.set(cliente.id, profile);
    if (cliente.ruc?.trim()) clientByRuc.set(cliente.ruc.trim(), profile);
    const phone = digitsOnly(cliente.telefono);
    if (phone.length >= 6) {
      clientByPhone.set(phone, profile);
      clientByPhone.set(phone.slice(-9), profile);
    }
  }

  const conversationByCodigo = new Map<string, {
    lastMessage: string;
    lastContactAt: string;
    contactName: string;
    contactIdentifier: string;
    profileName: string;
    displayName: string;
    waUsername: string;
  }>();
  for (const conv of conversationsResult.data ?? []) {
    const codigo = leadCodigoFromConversation(conv);
    if (!codigo) continue;
    const lastMessage = conv.last_message?.trim() ?? "";
    const lastContactAt = conv.last_message_at ?? conv.created_at ?? "";
    const metadata = (conv.metadata ?? {}) as Record<string, unknown>;
    const contactName = conv.contact_name?.trim() ?? "";
    const contactIdentifier = conv.contact_identifier?.trim() ?? "";
    const profileName = typeof metadata.profile_name === "string" ? metadata.profile_name : "";
    const displayName = typeof metadata.display_name === "string" ? metadata.display_name : "";
    const waUsername = typeof metadata.wa_username === "string" ? metadata.wa_username : "";
    if (!lastMessage && !lastContactAt && !contactName && !contactIdentifier) continue;
    const existing = conversationByCodigo.get(codigo);
    if (existing && existing.lastContactAt >= lastContactAt) continue;
    conversationByCodigo.set(codigo, {
      lastMessage,
      lastContactAt,
      contactName,
      contactIdentifier,
      profileName,
      displayName,
      waUsername,
    });
  }

  return rows.map((row) => {
    const opp = mapRowToOpportunity(row);
    const profileById = row.cliente_id ? clientLookup.get(row.cliente_id) : undefined;
    const profileByRuc = row.cliente_ruc ? clientByRuc.get(row.cliente_ruc.trim()) : undefined;
    const phoneKey = digitsOnly(row.cliente_ruc);
    const profileByPhone =
      phoneKey.length >= 6
        ? clientByPhone.get(phoneKey) ?? clientByPhone.get(phoneKey.slice(-9))
        : undefined;
    const profile = profileById ?? profileByRuc ?? profileByPhone;
    const conversation = conversationByCodigo.get(row.codigo);
    const lastContactAt = conversation?.lastContactAt || opp.lastContactAt;
    const rawLastMessage = conversation?.lastMessage || opp.lastMessage || opp.subtitle;
    const lastMessage = isGenericLastMessage(rawLastMessage) ? undefined : rawLastMessage?.trim();
    const contactParts = lastContactAt ? formatDateParts(lastContactAt) : { date: opp.date, time: opp.time };

    const contactPhone =
      resolveContactPhone(
        conversation?.contactIdentifier,
        profile?.telefono,
        row.cliente_ruc,
        opp.client,
      ) || phoneFromLeadCodigo(row.codigo);

    const phoneProfile = contactPhone
      ? clientByPhone.get(digitsOnly(contactPhone)) ??
        clientByPhone.get(digitsOnly(contactPhone).slice(-9))
      : undefined;
    const enrichedProfile = profile ?? phoneProfile;

    const ciudad = enrichedProfile ? parseUbicacion(enrichedProfile.ciudad).ciudad : undefined;
    const clientName =
      pickHumanContactName(
        conversation?.displayName,
        conversation?.profileName,
        conversation?.waUsername,
        conversation?.contactName,
        enrichedProfile?.contactoNombre,
        enrichedProfile?.razonSocial,
        opp.client,
      ) || opp.client;

    return {
      ...opp,
      client: clientName,
      date: contactParts.date,
      time: contactParts.time,
      lastMessage: lastMessage || undefined,
      lastContactAt: lastContactAt || undefined,
      contactPhone,
      intereses: enrichedProfile?.modelosInteres?.trim() && enrichedProfile.modelosInteres !== "—"
        ? enrichedProfile.modelosInteres.trim()
        : opp.intereses,
      ciudad: ciudad && ciudad !== "—" ? ciudad : opp.ciudad,
      tipoCliente: enrichedProfile?.tipoCliente?.trim() || opp.tipoCliente,
    };
  });
}

let pipelineSyncInFlight: Promise<number> | null = null;
let lastPipelineSyncAt = 0;
const PIPELINE_SYNC_TTL_MS = 60_000;

/** Sincroniza mensajería y leads en segundo plano. No bloquea la pintura del Kanban. */
export async function syncCrmSources(
  userId: string,
  options?: { force?: boolean },
): Promise<number> {
  if (!options?.force && pipelineSyncInFlight) return pipelineSyncInFlight;
  if (!options?.force && Date.now() - lastPipelineSyncAt < PIPELINE_SYNC_TTL_MS) return 0;

  pipelineSyncInFlight = (async () => {
    try {
      const messagingTasks: Promise<unknown>[] = [];
      if (MESSAGING_PROVIDERS.zavu) {
        messagingTasks.push(syncZavuConversations({ force: options?.force }));
      }
      if (MESSAGING_PROVIDERS.zernio) {
        messagingTasks.push(syncZernioConversations({ force: options?.force }));
      }
      if (MESSAGING_PROVIDERS.kapso) {
        messagingTasks.push(syncKapsoConversations({ force: options?.force }));
      }

      if (messagingTasks.length > 0) {
        await Promise.race([
          Promise.all(messagingTasks).catch((error) => {
            console.warn("[crm] Sync mensajería:", error instanceof Error ? error.message : error);
          }),
          new Promise((resolve) => setTimeout(resolve, options?.force ? 8000 : 4000)),
        ]);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();
      const responsableNombre = profile?.full_name?.trim() || "Usuario";

      const [sinCompra, socialLeads] = await Promise.all([
        syncProspeccionSinCompraIfNeeded(userId),
        syncWhatsAppLeadsToProspeccion(userId, {
          insertOnly: !options?.force,
          responsableNombre,
        }),
      ]);

      lastPipelineSyncAt = Date.now();
      return sinCompra + socialLeads;
    } finally {
      pipelineSyncInFlight = null;
    }
  })();

  return pipelineSyncInFlight;
}

export async function fetchCrmSnapshot(
  userId: string | null,
  options?: { forceWhatsAppSync?: boolean },
): Promise<CrmSnapshot> {
  if (!userId) {
    return buildSnapshot([], "supabase");
  }

  if (options?.forceWhatsAppSync) {
    await syncCrmSources(userId, { force: true });
  }

  const opportunities = await loadCrmOpportunities(userId);
  return buildSnapshot(opportunities, "supabase");
}

export function buildCrmSnapshotFromOpportunities(opportunities: Opportunity[]): CrmSnapshot {
  return buildSnapshot(opportunities, "supabase");
}

const PLACEHOLDER_VENTA_ITEM =
  /^(Factura|Boleta|Nota de crédito|Nota de Credito|FACTURA|BOLETA|NOTA DE CR[EÉ]DITO)\s*·\s*/i;

type VentaItemRow = {
  descripcion: string;
  cantidad: number;
  subtotal: number;
  productos: { nombre: string; sku: string | null } | null;
};

type LegacyVentaItemRow = {
  codigo_comprobante: string;
  descripcion: string;
  cantidad: number;
  subtotal: number;
  codigo: string | null;
};

function resolveVentaItemDescripcion(
  descripcion: string,
  producto?: { nombre: string; sku: string | null } | null,
  codigo?: string | null,
): string | null {
  if (producto?.nombre) {
    const sku = producto.sku?.trim();
    return sku ? `${producto.nombre} (${sku})` : producto.nombre;
  }

  const trimmed = descripcion.trim();
  if (!trimmed || PLACEHOLDER_VENTA_ITEM.test(trimmed)) {
    return null;
  }

  const itemCodigo = codigo?.trim();
  return itemCodigo ? `${itemCodigo} · ${trimmed}` : trimmed;
}

function mapVentaItems(items: VentaItemRow[] | null | undefined): ProspectDetail["ventasRecientes"][number]["items"] {
  const mapped: ProspectDetail["ventasRecientes"][number]["items"] = [];

  for (const item of items ?? []) {
    const descripcion = resolveVentaItemDescripcion(item.descripcion, item.productos);
    if (!descripcion) continue;

    mapped.push({
      descripcion,
      cantidad: Number(item.cantidad),
      subtotal: Number(item.subtotal),
    });
  }

  return mapped;
}

async function loadLegacyItemsByComprobante(
  codigos: string[],
): Promise<Map<string, ProspectDetail["ventasRecientes"][number]["items"]>> {
  const result = new Map<string, ProspectDetail["ventasRecientes"][number]["items"]>();
  if (codigos.length === 0) return result;

  const legacyClient = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { data, error } = await legacyClient
    .from("venta_legacy_import_items")
    .select("codigo_comprobante, descripcion, cantidad, subtotal, codigo")
    .in("codigo_comprobante", codigos);

  if (error) {
    console.warn("[crm] venta_legacy_import_items:", error.message);
    return result;
  }

  for (const row of (data ?? []) as LegacyVentaItemRow[]) {
    const descripcion = resolveVentaItemDescripcion(row.descripcion, null, row.codigo);
    if (!descripcion) continue;

    const items = result.get(row.codigo_comprobante) ?? [];
    items.push({
      descripcion,
      cantidad: Number(row.cantidad),
      subtotal: Number(row.subtotal),
    });
    result.set(row.codigo_comprobante, items);
  }

  return result;
}

async function fetchRecentMessagesForOpportunity(
  userId: string,
  codigo: string,
  clienteRuc: string | null,
): Promise<ProspectDetail["recentMessages"]> {
  const digits = digitsOnly(clienteRuc) || digitsOnly(codigo.replace(/^(WA|FB|IG)-/i, ""));
  if (digits.length < 6) return [];

  const { data: conversations, error } = await supabase
    .from("inbox_conversations")
    .select("id, last_message, last_message_at, contact_identifier")
    .eq("user_id", userId)
    .in("channel", ["whatsapp", "facebook", "instagram", "messenger"]);

  if (error || !conversations?.length) return [];

  const conversation = conversations.find((row) => {
    const convDigits = digitsOnly(row.contact_identifier);
    if (convDigits.length < 6) return false;
    return convDigits === digits || convDigits.endsWith(digits.slice(-9)) || digits.endsWith(convDigits.slice(-9));
  });
  if (!conversation) return [];

  const messages = await fetchInboxMessages(conversation.id);
  const recent = messages
    .filter((item) => item.body.trim() && !isGenericLastMessage(item.body))
    .slice(-8)
    .map((item) => ({
      id: item.id,
      direction: item.direction,
      body: item.body.trim(),
      sentAt: item.sentAt,
    }));

  if (recent.length > 0) return recent;

  const fallback = conversation.last_message?.trim();
  if (!fallback || isGenericLastMessage(fallback)) return [];
  return [
    {
      id: conversation.id,
      direction: "inbound",
      body: fallback,
      sentAt: conversation.last_message_at ?? new Date().toISOString(),
    },
  ];
}

export async function fetchProspectDetail(
  codigo: string,
  userId: string | null,
): Promise<ProspectDetail | null> {
  if (!userId) return null;

  const { data: row, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("user_id", userId)
    .eq("codigo", codigo)
    .maybeSingle();

  if (error || !row) return null;

  const opp = mapRowToOpportunity(row);
  const pipelineStage = ETAPA_TO_PIPELINE[opp.stage];

  let cliente: ProspectDetail["cliente"] = null;

  const loadClienteFields = async (filter: { column: "id" | "ruc"; value: string }) => {
    const { data: clienteRow } = await supabase
      .from("clientes")
      .select(
        "contacto_nombre, contacto_cargo, telefono, correo, email, direccion, ciudad, tipo_cliente, segmento, estado_comercial, ejecutivo_nombre, observaciones",
      )
      .eq("user_id", userId)
      .eq(filter.column, filter.value)
      .maybeSingle();

    if (!clienteRow) return null;

    const contactoNombre = clienteRow.contacto_nombre?.trim() || null;
    const contactoCargo = clienteRow.contacto_cargo?.trim() || null;
    const contacto =
      contactoNombre && contactoCargo && contactoCargo !== "—"
        ? `${contactoNombre} — ${contactoCargo}`
        : contactoNombre;

    return {
      contacto,
      celular: clienteRow.telefono,
      telefono: clienteRow.telefono,
      correo: clienteRow.correo ?? clienteRow.email,
      direccion: clienteRow.direccion,
      ciudad: clienteRow.ciudad,
      tipoCliente: clienteRow.tipo_cliente,
      segmento: clienteRow.segmento,
      estadoComercial: clienteRow.estado_comercial,
      ejecutivo: clienteRow.ejecutivo_nombre,
      observaciones: clienteRow.observaciones,
    };
  };

  if (row.cliente_id) {
    cliente = await loadClienteFields({ column: "id", value: row.cliente_id });
  } else if (row.cliente_ruc) {
    cliente = await loadClienteFields({ column: "ruc", value: row.cliente_ruc });
  }

  let ventasRecientes: ProspectDetail["ventasRecientes"] = [];
  if (row.cliente_ruc) {
    const { data: ventas } = await supabase
      .from("ventas")
      .select(
        "id, codigo_comprobante, numero, fecha, total, venta_items(descripcion, cantidad, subtotal, productos(nombre, sku))",
      )
      .eq("user_id", userId)
      .eq("cliente_ruc", row.cliente_ruc)
      .order("fecha", { ascending: false })
      .limit(5);

    const ventaRows = ventas ?? [];
    const codigosSinItems: string[] = [];

    ventasRecientes = ventaRows.map((venta) => {
      const codigo = venta.codigo_comprobante ?? venta.numero;
      const items = mapVentaItems(venta.venta_items as VentaItemRow[] | null);
      if (items.length === 0 && codigo) {
        codigosSinItems.push(codigo);
      }

      return {
        codigo,
        fecha: new Date(venta.fecha.includes("T") ? venta.fecha : `${venta.fecha}T12:00:00`).toLocaleDateString(
          "es-PE",
          { day: "2-digit", month: "2-digit", year: "numeric" },
        ),
        total: Number(venta.total),
        items,
      };
    });

    if (codigosSinItems.length > 0) {
      const legacyByCodigo = await loadLegacyItemsByComprobante(codigosSinItems);
      ventasRecientes = ventasRecientes.map((venta) => {
        if (venta.items.length > 0) return venta;
        const legacyItems = legacyByCodigo.get(venta.codigo);
        return legacyItems?.length ? { ...venta, items: legacyItems } : venta;
      });
    }
  }

  const fechaCierre = row.fecha_cierre_estimada
    ? new Date(
        row.fecha_cierre_estimada.includes("T")
          ? row.fecha_cierre_estimada
          : `${row.fecha_cierre_estimada}T12:00:00`,
      ).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  return {
    codigo: row.codigo,
    clienteNombre: opp.client,
    clienteRuc: opp.ruc,
    titulo: opp.title,
    subtitulo: opp.subtitle,
    valor: opp.value,
    etapa: opp.stage,
    pipelineStage,
    probabilidad: opp.probability,
    responsable: opp.owner,
    responsableIniciales: opp.ownerInitials,
    fechaOportunidad: opp.date,
    horaOportunidad: opp.time,
    fechaCierreEstimada: fechaCierre,
    statusBadge:
      opp.stage === "Cierre ganado"
        ? "Ganada"
        : socialLeadBadgeFromCodigo(opp.id, opp.title) ?? undefined,
    cliente,
    ventasRecientes,
    recentMessages: await fetchRecentMessagesForOpportunity(userId, row.codigo, row.cliente_ruc),
  };
}

async function nextOportunidadCodigo(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("oportunidades")
    .select("codigo")
    .eq("user_id", userId)
    .like("codigo", "OP-%")
    .order("codigo", { ascending: false })
    .limit(1);

  if (error) {
    console.warn("[crm] No se pudo calcular código de oportunidad:", error.message);
  }

  const last = data?.[0]?.codigo;
  const match = last?.match(/^OP-(\d+)$/i);
  const next = match ? Number(match[1]) + 1 : 1;
  return `OP-${String(next).padStart(6, "0")}`;
}

export type CreateOportunidadInput = {
  clienteNombre: string;
  titulo?: string;
  subtitulo?: string;
  valor?: number;
  clienteRuc?: string;
  probabilidad?: number;
  etapa?: OpportunityStage;
  fuente?: string;
  notas?: string;
};

export async function createOportunidad(
  userId: string,
  input: CreateOportunidadInput,
  options?: { responsableNombre?: string; responsableIniciales?: string },
): Promise<Opportunity> {
  const clienteNombre = input.clienteNombre.trim();
  if (!clienteNombre) {
    throw new Error("El nombre del prospecto es obligatorio");
  }

  const codigo = await nextOportunidadCodigo(userId);
  const responsable = options?.responsableNombre?.trim() || "Sin asignar";
  const iniciales =
    options?.responsableIniciales?.trim() ||
    responsable
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") ||
    "SA";

  const titulo = input.titulo?.trim() || clienteNombre;
  const fuente = input.fuente?.trim();
  const notas = input.notas?.trim();
  const subtitulo =
    input.subtitulo?.trim() ||
    [notas, fuente ? `Fuente: ${fuente}` : null].filter(Boolean).join(" · ") ||
    "Prospecto nuevo";
  const valor = Number.isFinite(input.valor) ? Math.max(0, input.valor ?? 0) : 0;
  const probabilidad = Number.isFinite(input.probabilidad)
    ? Math.min(100, Math.max(0, input.probabilidad ?? 50))
    : 50;
  const etapa = input.etapa && ETAPA_FROM_DB[input.etapa] ? input.etapa : "Prospectos";

  const { data, error } = await supabase
    .from("oportunidades")
    .insert({
      user_id: userId,
      codigo,
      cliente_nombre: clienteNombre,
      cliente_ruc: input.clienteRuc?.trim() || null,
      titulo,
      subtitulo,
      valor,
      etapa,
      probabilidad,
      responsable_nombre: responsable,
      responsable_iniciales: iniciales,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToOpportunity(data);
}

export async function updateOportunidadEtapa(
  userId: string,
  codigo: string,
  etapa: OpportunityStage,
): Promise<void> {
  const { error } = await supabase
    .from("oportunidades")
    .update({ etapa })
    .eq("user_id", userId)
    .eq("codigo", codigo);

  if (error) throw new Error(error.message);
}

async function findClienteIdByPhone(userId: string, phone: string): Promise<string | null> {
  const digits = digitsOnly(phone);
  if (digits.length < 6) return null;
  const tail = digits.slice(-9);
  const { data, error } = await supabase
    .from("clientes")
    .select("id")
    .eq("user_id", userId)
    .or(`telefono.ilike.%${tail}%,ruc.ilike.%${tail}%`)
    .limit(1);

  if (error) {
    console.warn("[crm] Buscar cliente por teléfono:", error.message);
    return null;
  }
  return data?.[0]?.id ?? null;
}

async function resolveClienteIdForOportunidad(
  userId: string,
  row: OportunidadRow,
): Promise<string | null> {
  if (row.cliente_id) return row.cliente_id;

  const ruc = row.cliente_ruc?.trim();
  if (ruc) {
    const { data } = await supabase
      .from("clientes")
      .select("id")
      .eq("user_id", userId)
      .eq("ruc", ruc)
      .maybeSingle();
    if (data?.id) return data.id;

    const byPhone = await findClienteIdByPhone(userId, ruc);
    if (byPhone) return byPhone;
  }

  const phone =
    resolveContactPhone(row.cliente_ruc, row.cliente_nombre) ||
    phoneFromLeadCodigo(row.codigo);
  if (phone) {
    return findClienteIdByPhone(userId, phone);
  }

  return null;
}

async function ensureClienteForOportunidad(
  userId: string,
  row: OportunidadRow,
  tipoClienteLabel: string,
): Promise<string> {
  const existingId = await resolveClienteIdForOportunidad(userId, row);
  if (existingId) return existingId;

  const nombre = row.cliente_nombre.trim() || "Nuevo contacto";
  const phone =
    resolveContactPhone(row.cliente_ruc, row.cliente_nombre) ||
    phoneFromLeadCodigo(row.codigo);
  const responsable = row.responsable_nombre.trim() || "Sin asignar";

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      user_id: userId,
      razon_social: nombre,
      contacto_nombre: nombre,
      telefono: phone || null,
      ruc: row.cliente_ruc?.trim() || null,
      tipo_cliente: formatTipoClienteLabel(tipoClienteLabel),
      segmento: "Prospecto",
      estado_comercial: "prospecto",
      ejecutivo_nombre: responsable,
      ejecutivo_iniciales: row.responsable_iniciales?.trim() || buildOwnerInitials(responsable),
      activo: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

/** Actualiza tipo de cliente en Contactos y lo vincula a la oportunidad si hace falta. */
export async function updateOportunidadTipoCliente(
  userId: string,
  codigo: string,
  tipoCliente: string,
): Promise<Opportunity> {
  const label = formatTipoClienteLabel(tipoCliente.trim() || "Público");

  const { data: row, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("user_id", userId)
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) throw new Error("Oportunidad no encontrada");

  const clienteId = await ensureClienteForOportunidad(userId, row, label);
  await updateClienteField(userId, clienteId, "tipoCliente", label);

  if (row.cliente_id !== clienteId) {
    const { error: linkError } = await supabase
      .from("oportunidades")
      .update({ cliente_id: clienteId })
      .eq("user_id", userId)
      .eq("codigo", codigo);
    if (linkError) throw new Error(linkError.message);
  }

  const opp = mapRowToOpportunity(row);
  return { ...opp, tipoCliente: label };
}

export async function patchOportunidad(
  userId: string,
  codigo: string,
  patch: {
    clienteNombre?: string;
    titulo?: string;
    valor?: number;
    responsableNombre?: string;
    responsableIniciales?: string;
  },
): Promise<Opportunity> {
  const payload: Record<string, unknown> = {};
  if (patch.clienteNombre != null) {
    const clienteNombre = patch.clienteNombre.trim();
    if (!clienteNombre) throw new Error("El nombre es obligatorio");
    payload.cliente_nombre = clienteNombre;
  }
  if (patch.titulo != null) {
    const titulo = patch.titulo.trim();
    if (titulo) payload.titulo = titulo;
  }
  if (patch.valor != null && Number.isFinite(patch.valor)) {
    payload.valor = Math.max(0, patch.valor);
  }
  if (patch.responsableNombre != null) {
    const responsable = patch.responsableNombre.trim();
    if (!responsable) throw new Error("El responsable es obligatorio");
    payload.responsable_nombre = responsable;
    payload.responsable_iniciales =
      patch.responsableIniciales?.trim() || buildOwnerInitials(responsable);
  }
  if (Object.keys(payload).length === 0) {
    throw new Error("No hay cambios para guardar");
  }

  const { data, error } = await supabase
    .from("oportunidades")
    .update(payload)
    .eq("user_id", userId)
    .eq("codigo", codigo)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRowToOpportunity(data);
}

export async function updateOportunidad(
  userId: string,
  codigo: string,
  input: CreateOportunidadInput,
): Promise<Opportunity> {
  const clienteNombre = input.clienteNombre.trim();
  if (!clienteNombre) throw new Error("El nombre del prospecto es obligatorio");

  const titulo = input.titulo?.trim() || clienteNombre;
  const notas = input.notas?.trim();
  const fuente = input.fuente?.trim();
  const subtitulo =
    input.subtitulo?.trim() ||
    [notas, fuente ? `Fuente: ${fuente}` : null].filter(Boolean).join(" · ") ||
    undefined;
  const valor = Number.isFinite(input.valor) ? Math.max(0, input.valor ?? 0) : 0;
  const probabilidad = Number.isFinite(input.probabilidad)
    ? Math.min(100, Math.max(0, input.probabilidad ?? 50))
    : undefined;
  const etapa = input.etapa && ETAPA_FROM_DB[input.etapa] ? input.etapa : undefined;

  const { data, error } = await supabase
    .from("oportunidades")
    .update({
      cliente_nombre: clienteNombre,
      cliente_ruc: input.clienteRuc?.trim() || null,
      titulo,
      subtitulo: subtitulo ?? null,
      valor,
      ...(probabilidad != null ? { probabilidad } : {}),
      ...(etapa ? { etapa } : {}),
    })
    .eq("user_id", userId)
    .eq("codigo", codigo)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRowToOpportunity(data);
}

export async function deleteOportunidad(userId: string, codigo: string): Promise<void> {
  const { error } = await supabase.from("oportunidades").delete().eq("user_id", userId).eq("codigo", codigo);
  if (error) throw new Error(error.message);
}

export async function duplicateOportunidad(userId: string, codigo: string): Promise<Opportunity> {
  const { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("user_id", userId)
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró la oportunidad");

  return createOportunidad(userId, {
    clienteNombre: data.cliente_nombre,
    titulo: `${data.titulo} (copia)`,
    subtitulo: data.subtitulo ?? undefined,
    valor: Number(data.valor),
    clienteRuc: data.cliente_ruc ?? undefined,
    probabilidad: data.probabilidad,
    etapa: ETAPA_FROM_DB[data.etapa] ?? "Prospectos",
  }, {
    responsableNombre: data.responsable_nombre,
    responsableIniciales: data.responsable_iniciales ?? undefined,
  });
}

export {
  formatCurrency,
  getProbabilityStyles,
  getStageStyles,
  pipelineTabs,
} from "@/lib/crm-mock-data";
export type { OpportunityStage } from "@/lib/crm-mock-data";

export { formatPipelineCurrency } from "@/lib/pipeline-mock-data";
