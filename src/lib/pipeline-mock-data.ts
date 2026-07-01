import type { LucideIcon } from "lucide-react";
import { DollarSign, Percent, Target, Trophy } from "lucide-react";

export type PipelineStage = "Prospección" | "Calificación" | "Propuesta" | "Negociación" | "Ganada";

export type PipelineCard = {
  id: string;
  title: string;
  company: string;
  value: number;
  owner: string;
  ownerInitials: string;
  dueDate: string;
  dueDateUrgent?: boolean;
  statusBadge?: "Ganada" | "Cerrada";
};

export type PipelineColumn = {
  id: string;
  title: PipelineStage;
  count: number;
  totalValue: number;
  borderColor: string;
  headerColor: string;
  badgeBg: string;
  moreCount: number;
  cards: PipelineCard[];
};

export const pipelineKpis = [
  {
    label: "Oportunidades totales",
    value: "128",
    change: "↑ 12.5% vs. mes anterior",
    sparkColor: "#2563eb",
    sparkPoints: [88, 92, 95, 98, 102, 108, 112, 118, 122, 128],
    icon: Target as LucideIcon,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Valor del pipeline",
    value: "S/ 1,248,500",
    change: "↑ 18.2% vs. mes anterior",
    sparkColor: "#22c55e",
    sparkPoints: [920, 980, 1010, 1050, 1100, 1140, 1180, 1210, 1240, 1248],
    icon: DollarSign as LucideIcon,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Tasa de cierre",
    value: "26.7%",
    change: "↑ 3.2 pp vs. mes anterior",
    sparkColor: "#a855f7",
    sparkPoints: [20, 21, 22, 22, 23, 24, 25, 25, 26, 27],
    icon: Percent as LucideIcon,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    label: "Ventas ganadas",
    value: "S/ 325,800",
    change: "↑ 22.4% vs. mes anterior",
    sparkColor: "#f97316",
    sparkPoints: [210, 225, 240, 255, 268, 280, 292, 305, 318, 326],
    icon: Trophy as LucideIcon,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];

export const pipelineColumns: PipelineColumn[] = [
  {
    id: "prospeccion",
    title: "Prospección",
    count: 12,
    totalValue: 187450,
    borderColor: "border-t-blue-500",
    headerColor: "text-blue-600",
    badgeBg: "bg-blue-50 text-blue-600",
    moreCount: 9,
    cards: [
      {
        id: "OP-000201",
        title: "Renovación ERP Empresarial",
        company: "Empresa ABC SAC",
        value: 25000,
        owner: "Luis Mendoza",
        ownerInitials: "LM",
        dueDate: "24/06",
        dueDateUrgent: true,
      },
      {
        id: "OP-000202",
        title: "Licencias adicionales",
        company: "TechSolutions SAC",
        value: 18500,
        owner: "Ana Martínez",
        ownerInitials: "AM",
        dueDate: "28/06",
      },
      {
        id: "OP-000203",
        title: "Implementación CRM",
        company: "Distribuidora Andina",
        value: 32000,
        owner: "Juan Campos",
        ownerInitials: "JC",
        dueDate: "30/06",
      },
    ],
  },
  {
    id: "calificacion",
    title: "Calificación",
    count: 18,
    totalValue: 245800,
    borderColor: "border-t-amber-400",
    headerColor: "text-amber-600",
    badgeBg: "bg-amber-50 text-amber-600",
    moreCount: 15,
    cards: [
      {
        id: "OP-000204",
        title: "Plan anual de soporte",
        company: "Inversiones Sur SAC",
        value: 14200,
        owner: "Jhelcen Romero",
        ownerInitials: "JR",
        dueDate: "22/06",
        dueDateUrgent: true,
      },
      {
        id: "OP-000205",
        title: "Migración de datos",
        company: "Servicios Integrales SAC",
        value: 26150,
        owner: "María Gómez",
        ownerInitials: "MG",
        dueDate: "26/06",
      },
      {
        id: "OP-000206",
        title: "Capacitación comercial",
        company: "Retail Express SAC",
        value: 12450,
        owner: "Ana Martínez",
        ownerInitials: "AM",
        dueDate: "01/07",
      },
    ],
  },
  {
    id: "propuesta",
    title: "Propuesta",
    count: 24,
    totalValue: 356200,
    borderColor: "border-t-violet-500",
    headerColor: "text-violet-600",
    badgeBg: "bg-violet-50 text-violet-600",
    moreCount: 21,
    cards: [
      {
        id: "OP-000207",
        title: "Implementación CRM y capacitación",
        company: "Inversiones Sur SAC",
        value: 32400,
        owner: "Ana Martínez",
        ownerInitials: "AM",
        dueDate: "20/06",
        dueDateUrgent: true,
      },
      {
        id: "OP-000208",
        title: "Integración ERP externo",
        company: "Comercial Andina EIRL",
        value: 39600,
        owner: "Jhelcen Romero",
        ownerInitials: "JR",
        dueDate: "25/06",
      },
      {
        id: "OP-000209",
        title: "Módulo inventario avanzado",
        company: "Constructora Norte SAC",
        value: 44800,
        owner: "Juan Campos",
        ownerInitials: "JC",
        dueDate: "29/06",
      },
    ],
  },
  {
    id: "negociacion",
    title: "Negociación",
    count: 22,
    totalValue: 289600,
    borderColor: "border-t-orange-500",
    headerColor: "text-orange-600",
    badgeBg: "bg-orange-50 text-orange-600",
    moreCount: 19,
    cards: [
      {
        id: "OP-000210",
        title: "Renovación de licencia ERP",
        company: "Corporación ABC SAC",
        value: 48750,
        owner: "Jhelcen Romero",
        ownerInitials: "JR",
        dueDate: "18/06",
        dueDateUrgent: true,
      },
      {
        id: "OP-000211",
        title: "Renovación plataforma anual",
        company: "Tech Solutions SAC",
        value: 21750,
        owner: "Juan Campos",
        ownerInitials: "JC",
        dueDate: "23/06",
      },
      {
        id: "OP-000212",
        title: "Ampliación usuarios",
        company: "Grupo Logístico Perú",
        value: 52300,
        owner: "Ana Martínez",
        ownerInitials: "AM",
        dueDate: "27/06",
      },
    ],
  },
  {
    id: "ganada",
    title: "Ganada",
    count: 34,
    totalValue: 169450,
    borderColor: "border-t-emerald-500",
    headerColor: "text-emerald-600",
    badgeBg: "bg-emerald-50 text-emerald-600",
    moreCount: 31,
    cards: [
      {
        id: "OP-000213",
        title: "Soporte premium anual",
        company: "Industrias Pacífico SAC",
        value: 17250,
        owner: "Jhelcen Romero",
        ownerInitials: "JR",
        dueDate: "15/06",
        statusBadge: "Ganada",
      },
      {
        id: "OP-000214",
        title: "Licencias adicionales",
        company: "Grupo Logístico Perú SAC",
        value: 52300,
        owner: "Ana Martínez",
        ownerInitials: "AM",
        dueDate: "12/06",
        statusBadge: "Ganada",
      },
      {
        id: "OP-000215",
        title: "Plan Emprendedor anual",
        company: "Retail Express SAC",
        value: 5300,
        owner: "María Gómez",
        ownerInitials: "MG",
        dueDate: "10/06",
        statusBadge: "Cerrada",
      },
    ],
  },
];

export const pipelineFunnel = [
  { stage: "Prospección", count: 128, value: 1248500, color: "#3b82f6", width: "100%" },
  { stage: "Calificación", count: 76, value: 986200, color: "#f59e0b", width: "78%" },
  { stage: "Propuesta", count: 58, value: 740400, color: "#8b5cf6", width: "62%" },
  { stage: "Negociación", count: 34, value: 489600, color: "#f97316", width: "48%" },
  { stage: "Ganada", count: 34, value: 325800, color: "#22c55e", width: "38%" },
];

export const pipelineConversion = [
  { label: "Prospección → Calificación", percent: 60, color: "bg-blue-500" },
  { label: "Calificación → Propuesta", percent: 72, color: "bg-amber-400" },
  { label: "Propuesta → Negociación", percent: 58, color: "bg-violet-500" },
  { label: "Negociación → Ganada", percent: 45, color: "bg-emerald-500" },
];

export const pipelineUpcomingActivities = [
  {
    id: "act-1",
    type: "Llamada de seguimiento",
    opportunity: "Renovación ERP Empresarial",
    date: "Hoy, 15:00",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "act-2",
    type: "Reunión demo producto",
    opportunity: "Implementación CRM y capacitación",
    date: "Mañana, 10:30",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "act-3",
    type: "Envío de propuesta",
    opportunity: "Integración ERP externo",
    date: "28/06, 09:00",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "act-4",
    type: "Cierre de contrato",
    opportunity: "Renovación de licencia ERP",
    date: "30/06, 16:00",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

export function formatPipelineCurrency(value: number) {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
