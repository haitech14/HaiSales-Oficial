export type OpportunityStage =
  | "Prospectos"
  | "Calificación"
  | "Propuesta"
  | "Negociación"
  | "Cierre ganado";

export type Opportunity = {
  id: string;
  date: string;
  time: string;
  client: string;
  ruc: string;
  title: string;
  subtitle: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  owner: string;
  ownerInitials: string;
};

export const crmKpis = [
  {
    label: "Oportunidades",
    value: "S/ 486,200",
    change: "+18.6% vs. mes anterior",
    sparkColor: "#2563eb",
    sparkPoints: [42, 48, 45, 52, 58, 55, 62, 68, 72, 78],
  },
  {
    label: "En negociación",
    value: "42",
    change: "+12.4% vs. mes anterior",
    sparkColor: "#f97316",
    sparkPoints: [28, 30, 32, 35, 34, 38, 40, 39, 41, 42],
  },
  {
    label: "Cotizaciones enviadas",
    value: "128",
    change: "+8.7% vs. mes anterior",
    sparkColor: "#22c55e",
    sparkPoints: [95, 98, 102, 108, 112, 115, 118, 122, 125, 128],
  },
  {
    label: "Tasa de cierre",
    value: "26.7%",
    change: "+3.1 pp vs. mes anterior",
    sparkColor: "#a855f7",
    sparkPoints: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
  },
];

export const pipelineTabs = [
  { id: "todos", label: "Todos", count: null },
  { id: "prospectos", label: "Prospectos", count: 36 },
  { id: "calificacion", label: "Calificación", count: 24 },
  { id: "propuesta", label: "Propuesta", count: 28 },
  { id: "negociacion", label: "Negociación", count: 18 },
  { id: "cierre", label: "Cierre ganado", count: 12 },
];

export const opportunities: Opportunity[] = [
  {
    id: "OP-000123",
    date: "30/06/2026",
    time: "10:35",
    client: "CORPORACIÓN ABC S.A.C.",
    ruc: "20123456789",
    title: "Renovación de licencia ERP",
    subtitle: "Renovación anual + 5 usuarios adicionales",
    value: 48750,
    stage: "Negociación",
    probability: 70,
    owner: "Jhelcen Romero",
    ownerInitials: "JR",
  },
  {
    id: "OP-000122",
    date: "30/06/2026",
    time: "09:10",
    client: "INVERSIONES SUR S.A.C.",
    ruc: "20567891234",
    title: "Implementación CRM y capacitación",
    subtitle: "CRM + 2 días de capacitación presencial",
    value: 32400,
    stage: "Propuesta",
    probability: 55,
    owner: "Ana Martínez",
    ownerInitials: "AM",
  },
  {
    id: "OP-000121",
    date: "29/06/2026",
    time: "16:44",
    client: "DISTRIBUIDORA NORTE E.I.R.L.",
    ruc: "20456789123",
    title: "Plan anual de soporte",
    subtitle: "Soporte premium 12 meses",
    value: 18900,
    stage: "Calificación",
    probability: 40,
    owner: "Juan Campos",
    ownerInitials: "JC",
  },
  {
    id: "OP-000120",
    date: "29/06/2026",
    time: "11:05",
    client: "SERVICIOS INTEGRALES S.A.C.",
    ruc: "20345678912",
    title: "Migración de datos históricos",
    subtitle: "Importación de 3 años de ventas",
    value: 26150,
    stage: "Prospectos",
    probability: 25,
    owner: "Jhelcen Romero",
    ownerInitials: "JR",
  },
  {
    id: "OP-000119",
    date: "28/06/2026",
    time: "15:22",
    client: "GRUPO LOGÍSTICO PERÚ S.A.C.",
    ruc: "20678912345",
    title: "Licencias adicionales usuarios",
    subtitle: "Ampliación a 15 usuarios",
    value: 52300,
    stage: "Cierre ganado",
    probability: 100,
    owner: "Ana Martínez",
    ownerInitials: "AM",
  },
  {
    id: "OP-000118",
    date: "28/06/2026",
    time: "09:48",
    client: "TECH SOLUTIONS S.A.C.",
    ruc: "20198765432",
    title: "Renovación anual plataforma",
    subtitle: "Plan Emprendedor anual",
    value: 21750,
    stage: "Negociación",
    probability: 65,
    owner: "Juan Campos",
    ownerInitials: "JC",
  },
  {
    id: "OP-000117",
    date: "27/06/2026",
    time: "14:10",
    client: "COMERCIAL ANDINA E.I.R.L.",
    ruc: "20432198765",
    title: "Integración con ERP externo",
    subtitle: "API + sincronización inventario",
    value: 39600,
    stage: "Propuesta",
    probability: 50,
    owner: "Jhelcen Romero",
    ownerInitials: "JR",
  },
  {
    id: "OP-000116",
    date: "26/06/2026",
    time: "16:35",
    client: "RETAIL EXPRESS S.A.C.",
    ruc: "20543219876",
    title: "Capacitación equipo comercial",
    subtitle: "Taller de 8 horas in-company",
    value: 12450,
    stage: "Calificación",
    probability: 35,
    owner: "Ana Martínez",
    ownerInitials: "AM",
  },
  {
    id: "OP-000115",
    date: "25/06/2026",
    time: "11:18",
    client: "CONSTRUCTORA NORTE S.A.C.",
    ruc: "20654321987",
    title: "Implementación módulo inventario",
    subtitle: "Inventario + almacenes múltiples",
    value: 44800,
    stage: "Prospectos",
    probability: 20,
    owner: "Juan Campos",
    ownerInitials: "JC",
  },
  {
    id: "OP-000114",
    date: "24/06/2026",
    time: "09:55",
    client: "INDUSTRIAS PACÍFICO S.A.C.",
    ruc: "20765432198",
    title: "Soporte premium anual",
    subtitle: "SLA 4h + consultor dedicado",
    value: 17250,
    stage: "Cierre ganado",
    probability: 100,
    owner: "Jhelcen Romero",
    ownerInitials: "JR",
  },
];

export const pipelineByStage = [
  { stage: "Prospectos", count: 36, color: "#94a3b8", percent: 28 },
  { stage: "Calificación", count: 24, color: "#a855f7", percent: 19 },
  { stage: "Propuesta", count: 28, color: "#3b82f6", percent: 22 },
  { stage: "Negociación", count: 18, color: "#f97316", percent: 14 },
  { stage: "Cierre ganado", count: 12, color: "#22c55e", percent: 9 },
  { stage: "Perdidas", count: 10, color: "#ef4444", percent: 8 },
];

export const salesBySeller = [
  { name: "Jhelcen Romero", value: 186400, percent: 100 },
  { name: "Ana Martínez", value: 152800, percent: 82 },
  { name: "Juan Campos", value: 98400, percent: 53 },
  { name: "María Gómez", value: 48600, percent: 26 },
];

export const pendingActivities = [
  { label: "Llamadas por realizar", count: 18, color: "bg-red-500", width: "100%" },
  { label: "Reuniones agendadas", count: 12, color: "bg-orange-500", width: "67%" },
  { label: "Correos por enviar", count: 9, color: "bg-amber-400", width: "50%" },
  { label: "Seguimientos pendientes", count: 7, color: "bg-emerald-500", width: "39%" },
];

export const kanbanColumns: {
  title: OpportunityStage;
  count: number;
  cards: {
    id: string;
    name: string;
    amount: string;
    time: string;
    owner: string;
    probability: number;
  }[];
}[] = [
  {
    title: "Prospectos",
    count: 36,
    cards: [
      { id: "OP-000120", name: "SERVICIOS INTEGRALES S.A.C.", amount: "S/ 26,150", time: "Hace 1 día", owner: "Jhelcen Romero", probability: 25 },
      { id: "OP-000115", name: "CONSTRUCTORA NORTE S.A.C.", amount: "S/ 44,800", time: "Hace 5 días", owner: "Juan Campos", probability: 20 },
      { id: "OP-000110", name: "Distribuidora Andina", amount: "S/ 4,500", time: "Hoy", owner: "Ana Martínez", probability: 15 },
    ],
  },
  {
    title: "Calificación",
    count: 24,
    cards: [
      { id: "OP-000121", name: "DISTRIBUIDORA NORTE E.I.R.L.", amount: "S/ 18,900", time: "Hace 1 día", owner: "Juan Campos", probability: 40 },
      { id: "OP-000116", name: "RETAIL EXPRESS S.A.C.", amount: "S/ 12,450", time: "Hace 4 días", owner: "Ana Martínez", probability: 35 },
      { id: "OP-000109", name: "TechSolutions SAC", amount: "S/ 6,200", time: "Hoy", owner: "Jhelcen Romero", probability: 30 },
    ],
  },
  {
    title: "Propuesta",
    count: 28,
    cards: [
      { id: "OP-000122", name: "INVERSIONES SUR S.A.C.", amount: "S/ 32,400", time: "Hoy", owner: "Ana Martínez", probability: 55 },
      { id: "OP-000117", name: "COMERCIAL ANDINA E.I.R.L.", amount: "S/ 39,600", time: "Hace 3 días", owner: "Jhelcen Romero", probability: 50 },
      { id: "OP-000108", name: "Constructora Norte", amount: "S/ 8,500", time: "Hace 2 días", owner: "Juan Campos", probability: 45 },
    ],
  },
  {
    title: "Negociación",
    count: 18,
    cards: [
      { id: "OP-000123", name: "CORPORACIÓN ABC S.A.C.", amount: "S/ 48,750", time: "Hoy", owner: "Jhelcen Romero", probability: 70 },
      { id: "OP-000118", name: "TECH SOLUTIONS S.A.C.", amount: "S/ 21,750", time: "Hace 2 días", owner: "Juan Campos", probability: 65 },
      { id: "OP-000107", name: "Ferremax", amount: "S/ 5,100", time: "Hace 3 días", owner: "Ana Martínez", probability: 60 },
    ],
  },
  {
    title: "Cierre ganado",
    count: 12,
    cards: [
      { id: "OP-000119", name: "GRUPO LOGÍSTICO PERÚ S.A.C.", amount: "S/ 52,300", time: "Hace 2 días", owner: "Ana Martínez", probability: 100 },
      { id: "OP-000114", name: "INDUSTRIAS PACÍFICO S.A.C.", amount: "S/ 17,250", time: "Hace 6 días", owner: "Jhelcen Romero", probability: 100 },
      { id: "OP-000106", name: "Retail Express", amount: "S/ 5,300", time: "Hace 1 semana", owner: "María Gómez", probability: 100 },
    ],
  },
];

export function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getStageStyles(stage: OpportunityStage | string) {
  switch (stage) {
    case "Negociación":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Propuesta":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Calificación":
      return "bg-violet-100 text-violet-700 border-violet-200";
    case "Cierre ganado":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getProbabilityStyles(probability: number) {
  if (probability >= 70) return "bg-amber-100 text-amber-700 border-amber-200";
  if (probability >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (probability >= 35) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}
