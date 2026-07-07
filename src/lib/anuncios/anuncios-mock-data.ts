import { AlertTriangle, Building2, Layers, TrendingUp } from "lucide-react";

export type AnuncioArea =
  | "comercial"
  | "administracion"
  | "operaciones"
  | "facturacion"
  | "soporte-ti";

export type AnuncioPrioridad = "Alta" | "Media" | "Baja";
export type AnuncioEstado = "Por ejecutar" | "En proceso" | "En revisión" | "Completado";

export type AnuncioTask = {
  id: string;
  title: string;
  area: AnuncioArea;
  prioridad: AnuncioPrioridad;
  estado: AnuncioEstado;
  dueDate: string;
  assignee: string;
  assigneeInitials: string;
};

export type AnuncioAreaConfig = {
  id: AnuncioArea;
  label: string;
  dotColor: string;
  borderColor: string;
  headerColor: string;
  badgeBg: string;
  defaultCopy: string;
};

export const anuncioAreas: AnuncioAreaConfig[] = [
  {
    id: "comercial",
    label: "Comercial",
    dotColor: "bg-emerald-500",
    borderColor: "border-t-emerald-500",
    headerColor: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-700",
    defaultCopy: "🚀 Impulsa ventas y fideliza clientes corporativos",
  },
  {
    id: "administracion",
    label: "Administración",
    dotColor: "bg-violet-500",
    borderColor: "border-t-violet-500",
    headerColor: "text-violet-700",
    badgeBg: "bg-violet-100 text-violet-700",
    defaultCopy: "📋 Organiza procesos y documentación interna",
  },
  {
    id: "operaciones",
    label: "Operaciones",
    dotColor: "bg-orange-500",
    borderColor: "border-t-orange-500",
    headerColor: "text-orange-700",
    badgeBg: "bg-orange-100 text-orange-700",
    defaultCopy: "⚙️ Coordina entregas, logística y servicio técnico",
  },
  {
    id: "facturacion",
    label: "Facturación",
    dotColor: "bg-sky-500",
    borderColor: "border-t-sky-500",
    headerColor: "text-sky-700",
    badgeBg: "bg-sky-100 text-sky-700",
    defaultCopy: "💰 Emite comprobantes y controla cobranzas a tiempo",
  },
  {
    id: "soporte-ti",
    label: "Soporte TI",
    dotColor: "bg-blue-700",
    borderColor: "border-t-blue-700",
    headerColor: "text-blue-800",
    badgeBg: "bg-blue-100 text-blue-800",
    defaultCopy: "💻 Mantén sistemas, accesos y soporte al día",
  },
];

export const anunciosKpis = [
  {
    label: "Pendientes activos",
    value: "48",
    change: "Tareas por ejecutar",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [32, 35, 38, 40, 42, 44, 46, 48],
    icon: Layers,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Áreas involucradas",
    value: "5",
    change: "Áreas con pendientes",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [3, 3, 4, 4, 5, 5, 5, 5],
    icon: Building2,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    label: "Tareas urgentes",
    value: "12",
    change: "Requieren atención inmediata",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [8, 9, 9, 10, 10, 11, 12, 12],
    icon: AlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Avance general",
    value: "63%",
    change: "+8% vs. mes anterior",
    changePositive: true,
    sparkColor: "#3b82f6",
    sparkPoints: [48, 50, 52, 55, 57, 59, 61, 63],
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

export const anunciosTabs = [
  { id: "todos", label: "Todos" },
  { id: "por-ejecutar", label: "Por ejecutar" },
  { id: "en-proceso", label: "En proceso" },
  { id: "en-revision", label: "En revisión" },
  { id: "completados", label: "Completados" },
];

export const orgChart = {
  root: {
    initials: "GG",
    title: "Gerencia General",
    role: "Gerente General",
    color: "bg-slate-700",
  },
  departments: [
    { initials: "CO", title: "Comercial", role: "Jefe Comercial", color: "bg-emerald-600", area: "comercial" as const },
    { initials: "AD", title: "Administración", role: "Jefe Administración", color: "bg-violet-600", area: "administracion" as const },
    { initials: "OP", title: "Operaciones", role: "Jefe Operaciones", color: "bg-orange-500", area: "operaciones" as const },
    { initials: "FA", title: "Facturación", role: "Jefe Facturación", color: "bg-sky-500", area: "facturacion" as const },
    { initials: "TI", title: "Soporte TI", role: "Jefe de TI", color: "bg-blue-700", area: "soporte-ti" as const },
  ],
};

export const pendientesPorArea = [
  { label: "Operaciones", count: 11, percent: 23, color: "#f97316" },
  { label: "Comercial", count: 10, percent: 21, color: "#22c55e" },
  { label: "Administración", count: 9, percent: 19, color: "#a855f7" },
  { label: "Facturación", count: 9, percent: 19, color: "#0ea5e9" },
  { label: "Soporte TI", count: 9, percent: 18, color: "#1d4ed8" },
];

export const avancePorArea = [
  { label: "Operaciones", percent: 73, color: "bg-orange-500" },
  { label: "Facturación", percent: 65, color: "bg-sky-500" },
  { label: "Comercial", percent: 62, color: "bg-emerald-500" },
  { label: "Administración", percent: 58, color: "bg-violet-500" },
  { label: "Soporte TI", percent: 54, color: "bg-blue-700" },
];

export const tareasCriticas = [
  { title: "Cierre de campaña Q2", dueDate: "05/07/2026", assigneeInitials: "LM", area: "comercial" as const },
  { title: "Conciliación bancaria junio", dueDate: "04/07/2026", assigneeInitials: "AR", area: "facturacion" as const },
  { title: "Migración servidor correo", dueDate: "06/07/2026", assigneeInitials: "JP", area: "soporte-ti" as const },
  { title: "Inventario físico almacén", dueDate: "08/07/2026", assigneeInitials: "RC", area: "operaciones" as const },
];

const seedTasks: AnuncioTask[] = [
  {
    id: "an-001",
    title: "Lanzar campaña de clientes corporativos",
    area: "comercial",
    prioridad: "Alta",
    estado: "Por ejecutar",
    dueDate: "15/07/2026",
    assignee: "Luis M.",
    assigneeInitials: "LM",
  },
  {
    id: "an-002",
    title: "Actualizar políticas de crédito",
    area: "administracion",
    prioridad: "Media",
    estado: "En proceso",
    dueDate: "18/07/2026",
    assignee: "Ana R.",
    assigneeInitials: "AR",
  },
  {
    id: "an-003",
    title: "Revisión de stock crítico",
    area: "operaciones",
    prioridad: "Alta",
    estado: "En revisión",
    dueDate: "10/07/2026",
    assignee: "Rosa C.",
    assigneeInitials: "RC",
  },
  {
    id: "an-004",
    title: "Emisión masiva de facturas",
    area: "facturacion",
    prioridad: "Alta",
    estado: "Por ejecutar",
    dueDate: "08/07/2026",
    assignee: "Pedro S.",
    assigneeInitials: "PS",
  },
  {
    id: "an-005",
    title: "Renovar licencias Microsoft 365",
    area: "soporte-ti",
    prioridad: "Media",
    estado: "En proceso",
    dueDate: "20/07/2026",
    assignee: "Jorge P.",
    assigneeInitials: "JP",
  },
  {
    id: "an-006",
    title: "Seguimiento propuestas pendientes",
    area: "comercial",
    prioridad: "Media",
    estado: "Por ejecutar",
    dueDate: "12/07/2026",
    assignee: "María T.",
    assigneeInitials: "MT",
  },
  {
    id: "an-007",
    title: "Digitalizar contratos 2025",
    area: "administracion",
    prioridad: "Baja",
    estado: "Por ejecutar",
    dueDate: "25/07/2026",
    assignee: "Carlos V.",
    assigneeInitials: "CV",
  },
  {
    id: "an-008",
    title: "Optimizar rutas de despacho",
    area: "operaciones",
    prioridad: "Media",
    estado: "En proceso",
    dueDate: "16/07/2026",
    assignee: "Rosa C.",
    assigneeInitials: "RC",
  },
];

const titles = [
  "Coordinar reunión de área",
  "Preparar informe semanal",
  "Validar documentación",
  "Capacitación interna",
  "Revisión de indicadores",
];

function padTask(index: number): AnuncioTask {
  const areas: AnuncioArea[] = [
    "comercial",
    "administracion",
    "operaciones",
    "facturacion",
    "soporte-ti",
  ];
  const estados: AnuncioEstado[] = [
    "Por ejecutar",
    "Por ejecutar",
    "En proceso",
    "En revisión",
    "Completado",
  ];
  const prioridades: AnuncioPrioridad[] = ["Alta", "Media", "Baja"];
  const assignees = [
    { name: "Luis M.", initials: "LM" },
    { name: "Ana R.", initials: "AR" },
    { name: "Rosa C.", initials: "RC" },
    { name: "Pedro S.", initials: "PS" },
    { name: "Jorge P.", initials: "JP" },
  ];
  const person = assignees[index % assignees.length];
  const area = areas[index % areas.length];

  return {
    id: `an-${String(index + 9).padStart(3, "0")}`,
    title: titles[index % titles.length],
    area,
    prioridad: prioridades[index % prioridades.length],
    estado: estados[index % estados.length],
    dueDate: `${String(10 + (index % 18)).padStart(2, "0")}/07/2026`,
    assignee: person.name,
    assigneeInitials: person.initials,
  };
}

export const anunciosMockTasks: AnuncioTask[] = [
  ...seedTasks,
  ...Array.from({ length: 40 }, (_, index) => padTask(index)),
];

export function getPrioridadStyles(prioridad: AnuncioPrioridad): string {
  switch (prioridad) {
    case "Alta":
      return "border-red-200 bg-red-50 text-red-700";
    case "Media":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Baja":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default: {
      const _exhaustive: never = prioridad;
      return _exhaustive;
    }
  }
}

export function getEstadoStyles(estado: AnuncioEstado): string {
  switch (estado) {
    case "Por ejecutar":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "En proceso":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "En revisión":
      return "border-pink-200 bg-pink-50 text-pink-700";
    case "Completado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default: {
      const _exhaustive: never = estado;
      return _exhaustive;
    }
  }
}

export const COLUMN_COPIES_STORAGE_KEY = "anuncios-column-copies";

export function getDefaultColumnCopies(): Record<AnuncioArea, string> {
  return Object.fromEntries(
    anuncioAreas.map((area) => [area.id, area.defaultCopy]),
  ) as Record<AnuncioArea, string>;
}
