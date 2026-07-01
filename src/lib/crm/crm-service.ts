import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  crmKpis as staticKpis,
  opportunities as mockOpportunities,
  pipelineTabs,
  type Opportunity,
  type OpportunityStage,
} from "@/lib/crm-mock-data";
import {
  pipelineColumns as mockPipelineColumns,
  pipelineKpis as staticPipelineKpis,
  type PipelineCard,
  type PipelineColumn,
  type PipelineStage,
} from "@/lib/pipeline-mock-data";
import { seedDemoDataForUser } from "@/lib/seed-demo";

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
  };
}

function opportunityToPipelineCard(opp: Opportunity): PipelineCard {
  const dueDate = opp.date;
  return {
    id: opp.id,
    title: opp.title,
    company: opp.client,
    value: opp.value,
    owner: opp.owner,
    ownerInitials: opp.ownerInitials,
    dueDate,
    dueDateUrgent: opp.stage === "Negociación",
    statusBadge: opp.stage === "Cierre ganado" ? "Ganada" : undefined,
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
      return {
        ...kpi,
        value:
          pipelineValue > 0
            ? `S/ ${Math.round(pipelineValue).toLocaleString("es-PE")}`
            : kpi.value,
      };
    }
    if (index === 1) return { ...kpi, value: String(inNegotiation || kpi.value) };
    if (index === 3) return { ...kpi, value: `${closeRate}%` };
    return kpi;
  });

  const pipelineKpis = staticPipelineKpis.map((kpi, index) => {
    if (index === 0) return { ...kpi, value: String(opportunities.length || kpi.value) };
    if (index === 1) {
      return {
        ...kpi,
        value:
          pipelineValue > 0
            ? `S/ ${Math.round(pipelineValue).toLocaleString("es-PE")}`
            : kpi.value,
      };
    }
    if (index === 2) return { ...kpi, value: `${closeRate}%` };
    if (index === 3) {
      return {
        ...kpi,
        value:
          wonValue > 0
            ? `S/ ${Math.round(wonValue).toLocaleString("es-PE")}`
            : kpi.value,
      };
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

export async function fetchCrmSnapshot(userId: string | null): Promise<CrmSnapshot> {
  if (!userId) {
    return buildSnapshot(mockOpportunities, "mock");
  }

  let { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("user_id", userId)
    .order("fecha_oportunidad", { ascending: false });

  if (error) {
    console.warn("[crm] Error al cargar oportunidades:", error.message);
    return buildSnapshot(mockOpportunities, "mock");
  }

  if (!data || data.length === 0) {
    await seedDemoDataForUser(userId);
    const retry = await supabase
      .from("oportunidades")
      .select("*")
      .eq("user_id", userId)
      .order("fecha_oportunidad", { ascending: false });

    if (retry.error || !retry.data?.length) {
      return buildSnapshot(mockOpportunities, "mock");
    }
    data = retry.data;
  }

  return buildSnapshot(data.map(mapRowToOpportunity), "supabase");
}

export {
  formatCurrency,
  getProbabilityStyles,
  getStageStyles,
  pipelineTabs,
} from "@/lib/crm-mock-data";

export { formatPipelineCurrency } from "@/lib/pipeline-mock-data";
