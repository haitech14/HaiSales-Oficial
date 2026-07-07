import { ArrowDownToLine, Briefcase, Clock, Wallet } from "lucide-react";

export type CajaChicaTipo = "Egreso" | "Solicitud" | "Rendición" | "Ingreso";

export type CajaChicaEstado = "Aprobado" | "Pendiente" | "Observado" | "Rechazado";

export type CajaChicaRecord = {
  id: string;
  date: string;
  responsible: string;
  department: string;
  concept: string;
  type: CajaChicaTipo;
  voucher: string;
  status: CajaChicaEstado;
  amount: number;
  balance: number;
};

export const cajaChicaKpis = [
  {
    label: "Saldo disponible",
    value: "S/ 6,842.50",
    change: "Total en caja chica",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [6200, 6350, 6480, 6550, 6620, 6710, 6780, 6842],
    icon: Wallet,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Gastos del mes",
    value: "S/ 4,125.80",
    change: "42 movimientos",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [3200, 3400, 3580, 3720, 3850, 3960, 4050, 4125],
    icon: ArrowDownToLine,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Solicitudes pendientes",
    value: "8",
    change: "S/ 2,310.00",
    changePositive: false,
    sparkColor: "#3b82f6",
    sparkPoints: [4, 5, 5, 6, 7, 7, 8, 8],
    icon: Briefcase,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Rendiciones vencidas",
    value: "2",
    change: "S/ 420.00",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [1, 1, 2, 2, 2, 2, 2, 2],
    icon: Clock,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
];

export const cajaChicaTabs = [
  { id: "todos", label: "Todos" },
  { id: "ingresos", label: "Ingresos" },
  { id: "egresos", label: "Egresos" },
  { id: "pendientes", label: "Pendientes" },
  { id: "aprobados", label: "Aprobados" },
  { id: "observados", label: "Observados" },
];

export const movimientosPorTipo = [
  { label: "Egresos", percent: 67, color: "#22c55e" },
  { label: "Solicitudes", percent: 17, color: "#3b82f6" },
  { label: "Rendiciones", percent: 10, color: "#a855f7" },
  { label: "Ingresos", percent: 6, color: "#38bdf8" },
];

export const gastosPorCategoria = [
  { label: "Transporte", percent: 100, color: "bg-emerald-500" },
  { label: "Alimentación", percent: 72, color: "bg-blue-600" },
  { label: "Oficina", percent: 48, color: "bg-violet-600" },
  { label: "Servicios", percent: 31, color: "bg-orange-500" },
  { label: "Otros", percent: 18, color: "bg-slate-400" },
];

export const responsablesConSaldo = [
  { name: "Carlos Mendoza", balance: 1840.5 },
  { name: "María López", balance: 1520.0 },
  { name: "Luis Ramírez", balance: 1280.75 },
  { name: "Ana Torres", balance: 980.25 },
  { name: "Jorge Vargas", balance: 621.0 },
];

const seedRecords: CajaChicaRecord[] = [
  {
    id: "cc-001",
    date: "02/07/2026",
    responsible: "Carlos Mendoza",
    department: "Ventas",
    concept: "Taxi a reunión con cliente",
    type: "Egreso",
    voucher: "BV-001-0002456",
    status: "Aprobado",
    amount: -45.6,
    balance: 6842.5,
  },
  {
    id: "cc-002",
    date: "02/07/2026",
    responsible: "María López",
    department: "Logística",
    concept: "Compra de útiles de oficina",
    type: "Solicitud",
    voucher: "SOL-2026-0089",
    status: "Pendiente",
    amount: -128.0,
    balance: 6714.5,
  },
  {
    id: "cc-003",
    date: "01/07/2026",
    responsible: "Luis Ramírez",
    department: "Operaciones",
    concept: "Rendición semana 26",
    type: "Rendición",
    voucher: "REN-2026-0045",
    status: "Aprobado",
    amount: -320.5,
    balance: 6842.1,
  },
  {
    id: "cc-004",
    date: "01/07/2026",
    responsible: "Ana Torres",
    department: "Administración",
    concept: "Reposición de fondo",
    type: "Ingreso",
    voucher: "ING-2026-0012",
    status: "Aprobado",
    amount: 1500.0,
    balance: 7162.6,
  },
  {
    id: "cc-005",
    date: "30/06/2026",
    responsible: "Jorge Vargas",
    department: "Servicios",
    concept: "Almuerzo equipo técnico",
    type: "Egreso",
    voucher: "BV-001-0002450",
    status: "Observado",
    amount: -89.5,
    balance: 5662.6,
  },
  {
    id: "cc-006",
    date: "30/06/2026",
    responsible: "Carlos Mendoza",
    department: "Ventas",
    concept: "Estacionamiento visita",
    type: "Egreso",
    voucher: "BV-001-0002448",
    status: "Aprobado",
    amount: -12.0,
    balance: 5752.1,
  },
  {
    id: "cc-007",
    date: "29/06/2026",
    responsible: "María López",
    department: "Logística",
    concept: "Flete urgente muestra",
    type: "Solicitud",
    voucher: "SOL-2026-0087",
    status: "Rechazado",
    amount: -210.0,
    balance: 5764.1,
  },
  {
    id: "cc-008",
    date: "29/06/2026",
    responsible: "Luis Ramírez",
    department: "Operaciones",
    concept: "Compra toner emergencia",
    type: "Egreso",
    voucher: "BV-001-0002445",
    status: "Pendiente",
    amount: -156.8,
    balance: 5974.1,
  },
  {
    id: "cc-009",
    date: "28/06/2026",
    responsible: "Ana Torres",
    department: "Administración",
    concept: "Rendición viáticos junio",
    type: "Rendición",
    voucher: "REN-2026-0044",
    status: "Aprobado",
    amount: -420.0,
    balance: 6130.9,
  },
  {
    id: "cc-010",
    date: "28/06/2026",
    responsible: "Jorge Vargas",
    department: "Servicios",
    concept: "Materiales limpieza",
    type: "Egreso",
    voucher: "BV-001-0002440",
    status: "Aprobado",
    amount: -35.2,
    balance: 6550.9,
  },
];

const responsables = [
  { name: "Carlos Mendoza", dept: "Ventas" },
  { name: "María López", dept: "Logística" },
  { name: "Luis Ramírez", dept: "Operaciones" },
  { name: "Ana Torres", dept: "Administración" },
  { name: "Jorge Vargas", dept: "Servicios" },
];

const concepts = [
  "Pasaje metropolitano",
  "Courier documentos",
  "Café reunión interna",
  "Copias y encuadernación",
  "Peaje autopista",
];

const types: CajaChicaTipo[] = ["Egreso", "Egreso", "Solicitud", "Rendición", "Ingreso"];
const statuses: CajaChicaEstado[] = [
  "Aprobado",
  "Aprobado",
  "Pendiente",
  "Observado",
  "Rechazado",
];

function padRecord(index: number): CajaChicaRecord {
  const person = responsables[index % responsables.length];
  const type = types[index % types.length];
  const amount =
    type === "Ingreso"
      ? 200 + (index % 8) * 150
      : -(25 + (index % 10) * 18.5);
  const balance = 5500 + index * 32.5;

  return {
    id: `cc-${String(index + 11).padStart(3, "0")}`,
    date: `${String(27 - (index % 25)).padStart(2, "0")}/06/2026`,
    responsible: person.name,
    department: person.dept,
    concept: concepts[index % concepts.length],
    type,
    voucher: `BV-001-${String(2400 - index).padStart(7, "0")}`,
    status: statuses[index % statuses.length],
    amount,
    balance,
  };
}

export const cajaChicaMockRecords: CajaChicaRecord[] = [
  ...seedRecords,
  ...Array.from({ length: 32 }, (_, index) => padRecord(index)),
];

export function formatCajaChicaAmount(value: number, signed = true) {
  const formatted = Math.abs(value).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!signed) return `S/ ${formatted}`;
  if (value < 0) return `-S/ ${formatted}`;
  if (value > 0) return `+S/ ${formatted}`;
  return `S/ ${formatted}`;
}

export function getCajaChicaTipoStyles(type: CajaChicaTipo): string {
  switch (type) {
    case "Egreso":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Solicitud":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Rendición":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Ingreso":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function getCajaChicaEstadoStyles(status: CajaChicaEstado): string {
  switch (status) {
    case "Aprobado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Pendiente":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Observado":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Rechazado":
      return "border-red-200 bg-red-50 text-red-700";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
