import { BarChart3, CalendarClock, Truck, Users } from "lucide-react";

export type PlanCategoria = "mantenimiento" | "suministro" | "mixtos";
export type PlanEstado = "Activo" | "Por renovar" | "Pendiente" | "Suspendido";
export type PlanFrecuencia = "Mensual" | "Bimestral" | "Trimestral" | "Semestral";

export type PlanMantenimientoRecord = {
  id: string;
  client: string;
  clientInitials: string;
  ruc: string;
  planName: string;
  planCode: string;
  category: PlanCategoria;
  equipment: string;
  serial: string;
  frequency: PlanFrecuencia;
  nextVisitDate: string;
  nextVisitLabel: string;
  nextVisitUrgent: boolean;
  supply: string;
  status: PlanEstado;
  monthlyAmount: number;
  executive: string;
};

export const planesKpis = [
  {
    label: "Planes activos",
    value: "142",
    change: "+12 vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [118, 122, 126, 130, 134, 137, 140, 142],
    icon: Users,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Visitas pendientes",
    value: "28",
    change: "+5 vs. ayer",
    changePositive: false,
    sparkColor: "#f97316",
    sparkPoints: [18, 20, 21, 23, 24, 25, 27, 28],
    icon: CalendarClock,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Suministros por entregar",
    value: "37",
    change: "+8 vs. ayer",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [24, 26, 28, 30, 32, 34, 36, 37],
    icon: Truck,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Ingreso recurrente",
    value: "S/ 92,450",
    change: "+8.7% vs. mes anterior",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [78, 81, 84, 86, 88, 90, 91, 92],
    icon: BarChart3,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export const planesTabs = [
  { id: "todos", label: "Todos" },
  { id: "mantenimiento", label: "Mantenimiento" },
  { id: "suministro", label: "Suministro" },
  { id: "mixtos", label: "Mixtos" },
  { id: "por-renovar", label: "Por renovar" },
  { id: "suspendidos", label: "Suspendidos" },
];

export const planesTipoDistribution = [
  { label: "Mantenimiento", percent: 55, color: "#3b82f6" },
  { label: "Suministro", percent: 30, color: "#f97316" },
  { label: "Mixtos", percent: 15, color: "#a855f7" },
];

export const renovacionesProximas = [
  { label: "0-30 días", count: 15, percent: 100, color: "bg-emerald-500" },
  { label: "31-60 días", count: 8, percent: 53, color: "bg-orange-500" },
  { label: "61-90 días", count: 4, percent: 27, color: "bg-blue-600" },
  { label: "Más de 90 días", count: 2, percent: 13, color: "bg-slate-300" },
];

export const consumiblesCriticos = [
  { name: "Tóner Negro Ricoh MP", stock: 3 },
  { name: "Kit de mantenimiento Canon", stock: 2 },
  { name: "Tambor Xerox VersaLink", stock: 1 },
  { name: "Tóner Cian HP Color", stock: 4 },
  { name: "Rodillo de fusor Kyocera", stock: 2 },
];

const seedRecords: PlanMantenimientoRecord[] = [
  {
    id: "plan-001",
    client: "Grupo Aitamar S.A.C.",
    clientInitials: "GA",
    ruc: "20512345678",
    planName: "Mantenimiento Preventivo",
    planCode: "MP-2024-0012",
    category: "mantenimiento",
    equipment: "Ricoh MP 2852",
    serial: "SN3209X400277",
    frequency: "Mensual",
    nextVisitDate: "05/07/2026",
    nextVisitLabel: "En 3 días",
    nextVisitUrgent: false,
    supply: "Tóner Negro, 1 unidad",
    status: "Activo",
    monthlyAmount: 450,
    executive: "Carlos Mendoza",
  },
  {
    id: "plan-002",
    client: "Corporación Forte S.A.",
    clientInitials: "CF",
    ruc: "20198765432",
    planName: "Suministro de Consumibles",
    planCode: "SC-2024-0089",
    category: "suministro",
    equipment: "Canon imageRUNNER 2630i",
    serial: "SN2630X891234",
    frequency: "Trimestral",
    nextVisitDate: "12/07/2026",
    nextVisitLabel: "En 10 días",
    nextVisitUrgent: false,
    supply: "Tóner Negro + Cian, 2 unidades",
    status: "Activo",
    monthlyAmount: 320,
    executive: "María López",
  },
  {
    id: "plan-003",
    client: "Distribuidora Lima Norte E.I.R.L.",
    clientInitials: "DL",
    ruc: "20456789123",
    planName: "Plan Mixto Integral",
    planCode: "MX-2023-0156",
    category: "mixtos",
    equipment: "Xerox VersaLink C405",
    serial: "SN405X778912",
    frequency: "Bimestral",
    nextVisitDate: "03/07/2026",
    nextVisitLabel: "Hoy",
    nextVisitUrgent: true,
    supply: "Kit mantenimiento, 1 unidad",
    status: "Pendiente",
    monthlyAmount: 680,
    executive: "Luis Ramírez",
  },
  {
    id: "plan-004",
    client: "Inversiones del Sur S.A.C.",
    clientInitials: "IS",
    ruc: "20678901234",
    planName: "Mantenimiento Preventivo",
    planCode: "MP-2024-0034",
    category: "mantenimiento",
    equipment: "HP LaserJet Pro M404dn",
    serial: "SN404X552190",
    frequency: "Mensual",
    nextVisitDate: "28/06/2026",
    nextVisitLabel: "Vencida",
    nextVisitUrgent: true,
    supply: "Rodillo fusor, 1 unidad",
    status: "Por renovar",
    monthlyAmount: 290,
    executive: "Ana Torres",
  },
  {
    id: "plan-005",
    client: "Tech Solutions Perú E.I.R.L.",
    clientInitials: "TS",
    ruc: "20567890123",
    planName: "Suministro de Consumibles",
    planCode: "SC-2024-0112",
    category: "suministro",
    equipment: "Brother MFC-L8690CDW",
    serial: "SN8690X11230",
    frequency: "Mensual",
    nextVisitDate: "15/07/2026",
    nextVisitLabel: "En 13 días",
    nextVisitUrgent: false,
    supply: "Tóner Negro, 2 unidades",
    status: "Activo",
    monthlyAmount: 210,
    executive: "Carlos Mendoza",
  },
  {
    id: "plan-006",
    client: "Comercial Andina S.A.C.",
    clientInitials: "CA",
    ruc: "20123456789",
    planName: "Plan Mixto Integral",
    planCode: "MX-2024-0045",
    category: "mixtos",
    equipment: "Kyocera ECOSYS M5526cdw",
    serial: "SN5526X998712",
    frequency: "Trimestral",
    nextVisitDate: "20/07/2026",
    nextVisitLabel: "En 18 días",
    nextVisitUrgent: false,
    supply: "Tóner + Kit, 3 unidades",
    status: "Activo",
    monthlyAmount: 540,
    executive: "María López",
  },
  {
    id: "plan-007",
    client: "Servicios Integrales SAC",
    clientInitials: "SI",
    ruc: "20345678901",
    planName: "Mantenimiento Preventivo",
    planCode: "MP-2023-0098",
    category: "mantenimiento",
    equipment: "Epson EcoTank L6290",
    serial: "SN6290X334501",
    frequency: "Semestral",
    nextVisitDate: "—",
    nextVisitLabel: "Suspendido",
    nextVisitUrgent: false,
    supply: "Sin programación",
    status: "Suspendido",
    monthlyAmount: 0,
    executive: "Luis Ramírez",
  },
  {
    id: "plan-008",
    client: "Minera Andina del Perú S.A.",
    clientInitials: "MA",
    ruc: "20234567890",
    planName: "Mantenimiento Preventivo",
    planCode: "MP-2024-0067",
    category: "mantenimiento",
    equipment: "Ricoh IM 550",
    serial: "SN550X667890",
    frequency: "Mensual",
    nextVisitDate: "08/07/2026",
    nextVisitLabel: "En 6 días",
    nextVisitUrgent: false,
    supply: "Tóner Negro, 1 unidad",
    status: "Activo",
    monthlyAmount: 520,
    executive: "Ana Torres",
  },
];

const extraClients = [
  { name: "Farmacias Salud Total", ruc: "20789012345", initials: "FS" },
  { name: "Hotel Costa Verde", ruc: "20432109876", initials: "HC" },
  { name: "Universidad del Pacífico", ruc: "20111222333", initials: "UP" },
  { name: "Constructora Horizonte", ruc: "20555444333", initials: "CH" },
  { name: "Agroexportadora del Sur", ruc: "20666777888", initials: "AD" },
];

const extraPlans = [
  { name: "Mantenimiento Preventivo", code: "MP", category: "mantenimiento" as const },
  { name: "Suministro de Consumibles", code: "SC", category: "suministro" as const },
  { name: "Plan Mixto Integral", code: "MX", category: "mixtos" as const },
];

const extraEquipment = [
  { name: "Ricoh MP 4002", serial: "SN4002X112233" },
  { name: "Canon IR ADVANCE 4545i", serial: "SN4545X445566" },
  { name: "HP PageWide Pro 477dw", serial: "SN477X778899" },
  { name: "Sharp MX-M5071", serial: "SN5071X001122" },
];

const frequencies: PlanFrecuencia[] = ["Mensual", "Bimestral", "Trimestral", "Semestral"];
const statuses: PlanEstado[] = ["Activo", "Activo", "Activo", "Pendiente", "Por renovar", "Suspendido"];
const executives = ["Carlos Mendoza", "María López", "Luis Ramírez", "Ana Torres"];

function padRecord(index: number): PlanMantenimientoRecord {
  const client = extraClients[index % extraClients.length];
  const plan = extraPlans[index % extraPlans.length];
  const equip = extraEquipment[index % extraEquipment.length];
  const status = statuses[index % statuses.length];
  const frequency = frequencies[index % frequencies.length];

  return {
    id: `plan-${String(index + 9).padStart(3, "0")}`,
    client: client.name,
    clientInitials: client.initials,
    ruc: client.ruc,
    planName: plan.name,
    planCode: `${plan.code}-2024-${String(100 + index).padStart(4, "0")}`,
    category: plan.category,
    equipment: equip.name,
    serial: equip.serial,
    frequency,
    nextVisitDate: status === "Suspendido" ? "—" : `${String(10 + (index % 20)).padStart(2, "0")}/07/2026`,
    nextVisitLabel: status === "Suspendido" ? "Suspendido" : `En ${3 + (index % 15)} días`,
    nextVisitUrgent: index % 7 === 0,
    supply: index % 2 === 0 ? "Tóner Negro, 1 unidad" : "Kit mantenimiento, 1 unidad",
    status,
    monthlyAmount: 180 + (index % 9) * 65,
    executive: executives[index % executives.length],
  };
}

export const planesMockRecords: PlanMantenimientoRecord[] = [
  ...seedRecords,
  ...Array.from({ length: 134 }, (_, index) => padRecord(index)),
];

export function formatPlanCurrency(value: number) {
  if (value === 0) return "S/ 0.00";
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getPlanStatusStyles(status: PlanEstado): string {
  switch (status) {
    case "Activo":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Por renovar":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Pendiente":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Suspendido":
      return "border-red-200 bg-red-50 text-red-700";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function getFrequencyStyles(): string {
  return "border-blue-200 bg-blue-50 text-blue-700";
}
