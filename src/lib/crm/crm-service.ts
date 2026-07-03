import { supabase } from "@/integrations/supabase/client";
import { parseUbicacion } from "@/lib/clientes/location-utils";
import { withRealKpi } from "@/lib/kpi-utils";
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
  Propuesta: "Propuesta",
  Negociación: "Negociación",
  "Cierre ganado": "Ganada",
};

const PIPELINE_COLUMN_META: Record<
  PipelineStage,
  Omit<PipelineColumn, "count" | "totalValue" | "moreCount" | "cards">
> = {
  Prospección: mockPipelineColumns[0],
  Calificación: mockPipelineColumns[1],
  Propuesta: mockPipelineColumns[2],
  Negociación: mockPipelineColumns[3],
  Ganada: mockPipelineColumns[4],
};

function formatDateParts(iso: string) {
  const date = new Date(iso);
  return {
    date: date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function mapRowToOpportunity(row: OportunidadRow): Opportunity {
  const { date, time } = formatDateParts(row.fecha_oportunidad);
  return {
    id: row.codigo,
    date,
    time,
    client: row.cliente_nombre,
    ruc: row.cliente_ruc ?? "—",
    title: row.titulo,
    subtitle: row.subtitulo ?? "",
    value: Number(row.valor),
    stage: ETAPA_FROM_DB[row.etapa] ?? "Prospectos",
    probability: row.probabilidad,
    owner: row.responsable_nombre,
    ownerInitials:
      row.responsable_iniciales ?? row.responsable_nombre.slice(0, 2).toUpperCase(),
    fechaIso: row.fecha_oportunidad.slice(0, 10),
  };
}

function opportunityToPipelineCard(opp: Opportunity): PipelineCard {
  const dueDate = opp.date;
  const isProspection = opp.stage === "Prospectos";

  return {
    id: opp.id,
    title: isProspection ? opp.client : opp.title,
    company: isProspection
      ? opp.subtitle || "Sin compra reciente · Contactar y promocionar"
      : opp.client,
    value: opp.value,
    owner: opp.owner,
    ownerInitials: opp.ownerInitials,
    dueDate,
    dueDateUrgent: opp.stage === "Negociación",
    statusBadge: opp.stage === "Cierre ganado" ? "Ganada" : undefined,
    intereses: isProspection ? opp.intereses : undefined,
    ciudad: isProspection ? opp.ciudad : undefined,
  };
}

function buildPipelineColumns(opportunities: Opportunity[]): PipelineColumn[] {
  const stages: PipelineStage[] = [
    "Prospección",
    "Calificación",
    "Propuesta",
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

async function syncProspeccionSinCompraIfNeeded(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("sync_prospeccion_sin_compra_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[crm] Sync prospección sin compra:", error.message);
    return false;
  }

  return typeof data === "number" && data >= 0;
}

export async function fetchCrmSnapshot(userId: string | null): Promise<CrmSnapshot> {
  if (!userId) {
    return buildSnapshot([], "supabase");
  }

  await syncProspeccionSinCompraIfNeeded(userId);

  const { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("user_id", userId)
    .order("fecha_oportunidad", { ascending: false });

  if (error) {
    console.warn("[crm] Error al cargar oportunidades:", error.message);
    return buildSnapshot([], "supabase");
  }

  const rows = data ?? [];
  const clienteIds = [
    ...new Set(rows.map((row) => row.cliente_id).filter((id): id is string => Boolean(id))),
  ];

  const clientLookup = new Map<string, { modelosInteres: string | null; ciudad: string | null }>();
  if (clienteIds.length > 0) {
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, ciudad, modelos_interes")
      .eq("user_id", userId)
      .in("id", clienteIds);

    for (const cliente of clientes ?? []) {
      clientLookup.set(cliente.id, {
        modelosInteres: cliente.modelos_interes,
        ciudad: cliente.ciudad,
      });
    }
  }

  const opportunities = rows.map((row) => {
    const opp = mapRowToOpportunity(row);
    if (!row.cliente_id) return opp;

    const profile = clientLookup.get(row.cliente_id);
    if (!profile) return opp;

    const intereses = profile.modelosInteres?.trim();
    const ciudad = parseUbicacion(profile.ciudad).ciudad;

    return {
      ...opp,
      intereses: intereses && intereses !== "—" ? intereses : undefined,
      ciudad: ciudad !== "—" ? ciudad : undefined,
    };
  });

  return buildSnapshot(opportunities, "supabase");
}

export function buildCrmSnapshotFromOpportunities(opportunities: Opportunity[]): CrmSnapshot {
  return buildSnapshot(opportunities, "supabase");
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
  if (row.cliente_id) {
    const { data: clienteRow } = await supabase
      .from("clientes")
      .select(
        "telefono, correo, email, direccion, ciudad, tipo_cliente, segmento, estado_comercial, ejecutivo_nombre, observaciones",
      )
      .eq("user_id", userId)
      .eq("id", row.cliente_id)
      .maybeSingle();

    if (clienteRow) {
      cliente = {
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
    }
  }

  let ventasRecientes: ProspectDetail["ventasRecientes"] = [];
  if (row.cliente_ruc) {
    const { data: ventas } = await supabase
      .from("ventas")
      .select("codigo_comprobante, numero, fecha, total")
      .eq("user_id", userId)
      .eq("cliente_ruc", row.cliente_ruc)
      .order("fecha", { ascending: false })
      .limit(5);

    ventasRecientes = (ventas ?? []).map((venta) => ({
      codigo: venta.codigo_comprobante ?? venta.numero,
      fecha: new Date(venta.fecha.includes("T") ? venta.fecha : `${venta.fecha}T12:00:00`).toLocaleDateString(
        "es-PE",
        { day: "2-digit", month: "2-digit", year: "numeric" },
      ),
      total: Number(venta.total),
    }));
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
    statusBadge: opp.stage === "Cierre ganado" ? "Ganada" : undefined,
    cliente,
    ventasRecientes,
  };
}

export {
  formatCurrency,
  getProbabilityStyles,
  getStageStyles,
  pipelineTabs,
} from "@/lib/crm-mock-data";

export { formatPipelineCurrency } from "@/lib/pipeline-mock-data";
