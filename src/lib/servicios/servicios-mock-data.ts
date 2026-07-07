import { BarChart3, Clock, FileText, Wrench } from "lucide-react";

export type ServicioTipo =
  | "Correctivo"
  | "Diagnóstico"
  | "Mantenimiento"
  | "Instalación"
  | "Preventivo";

export type ServicioEstado =
  | "Abierto"
  | "En proceso"
  | "Finalizado"
  | "Facturado"
  | "Garantía";

export type ServicioTab = "todos" | "diagnostico" | "en-proceso" | "finalizados" | "facturados" | "garantia";

export type ServicioRecord = {
  id: string;
  date: string;
  orderCode: string;
  client: string;
  serviceType: ServicioTipo;
  technician: string;
  equipment: string;
  status: ServicioEstado;
  amount: number;
};

export const serviciosKpis = [
  {
    label: "Servicios abiertos",
    value: "24",
    change: "+12% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [16, 18, 19, 20, 21, 22, 23, 24],
    icon: Wrench,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "En proceso",
    value: "38",
    change: "+8% vs. mes anterior",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [28, 30, 32, 33, 34, 35, 37, 38],
    icon: Clock,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Pendientes de facturar",
    value: "16",
    change: "+5% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [10, 11, 12, 13, 14, 14, 15, 16],
    icon: FileText,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Ticket promedio",
    value: "S/ 1,842",
    change: "Promedio por servicio",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [1620, 1680, 1720, 1760, 1780, 1800, 1820, 1842],
    icon: BarChart3,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export const serviciosTabs = [
  { id: "todos", label: "Todos" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "en-proceso", label: "En proceso" },
  { id: "finalizados", label: "Finalizados" },
  { id: "facturados", label: "Facturados" },
  { id: "garantia", label: "Garantía" },
];

export const serviciosEstadoDistribution = [
  { label: "Abierto", percent: 20, color: "#ef4444" },
  { label: "En proceso", percent: 32, color: "#f97316" },
  { label: "Finalizado", percent: 28, color: "#22c55e" },
  { label: "Facturado", percent: 15, color: "#3b82f6" },
  { label: "Garantía", percent: 5, color: "#a855f7" },
];

export const antiguedadOrdenes = [
  { label: "0-7 días", count: 42, percent: 100, color: "bg-emerald-500" },
  { label: "8-15 días", count: 28, percent: 67, color: "bg-blue-600" },
  { label: "16-30 días", count: 19, percent: 45, color: "bg-orange-500" },
  { label: "31-60 días", count: 12, percent: 29, color: "bg-amber-500" },
  { label: "Más de 60 días", count: 6, percent: 14, color: "bg-red-500" },
];

export const tecnicosTopAtenciones = [
  { name: "Carlos Mendoza", count: 34, percent: 100 },
  { name: "María López", count: 28, percent: 82 },
  { name: "Luis Ramírez", count: 22, percent: 65 },
  { name: "Ana Torres", count: 18, percent: 53 },
  { name: "Jorge Vargas", count: 12, percent: 35 },
];

const seedRecords: ServicioRecord[] = [
  {
    id: "srv-001",
    date: "02/07/2026",
    orderCode: "OS-2026-00789",
    client: "GRUPO AITAMAR S.A.C.",
    serviceType: "Correctivo",
    technician: "Carlos Mendoza",
    equipment: "RICOH MP 2852",
    status: "Abierto",
    amount: 350,
  },
  {
    id: "srv-002",
    date: "01/07/2026",
    orderCode: "OS-2026-00788",
    client: "CORPORACION FORTE S.A.",
    serviceType: "Diagnóstico",
    technician: "María López",
    equipment: "CANON IR 2630i",
    status: "En proceso",
    amount: 180,
  },
  {
    id: "srv-003",
    date: "01/07/2026",
    orderCode: "OS-2026-00787",
    client: "DISTRIBUIDORA LIMA NORTE E.I.R.L.",
    serviceType: "Mantenimiento",
    technician: "Luis Ramírez",
    equipment: "XEROX VERSALINK C405",
    status: "Finalizado",
    amount: 520,
  },
  {
    id: "srv-004",
    date: "30/06/2026",
    orderCode: "OS-2026-00786",
    client: "INVERSIONES DEL SUR S.A.C.",
    serviceType: "Instalación",
    technician: "Ana Torres",
    equipment: "HP LASERJET M404dn",
    status: "Facturado",
    amount: 890,
  },
  {
    id: "srv-005",
    date: "30/06/2026",
    orderCode: "OS-2026-00785",
    client: "TECH SOLUTIONS PERU E.I.R.L.",
    serviceType: "Preventivo",
    technician: "Jorge Vargas",
    equipment: "BROTHER MFC-L8690CDW",
    status: "Garantía",
    amount: 0,
  },
  {
    id: "srv-006",
    date: "29/06/2026",
    orderCode: "OS-2026-00784",
    client: "COMERCIAL ANDINA S.A.C.",
    serviceType: "Correctivo",
    technician: "Carlos Mendoza",
    equipment: "KYOCERA ECOSYS M5526",
    status: "En proceso",
    amount: 420,
  },
  {
    id: "srv-007",
    date: "29/06/2026",
    orderCode: "OS-2026-00783",
    client: "SERVICIOS INTEGRALES SAC",
    serviceType: "Diagnóstico",
    technician: "María López",
    equipment: "EPSON ECOTANK L6290",
    status: "Abierto",
    amount: 150,
  },
  {
    id: "srv-008",
    date: "28/06/2026",
    orderCode: "OS-2026-00782",
    client: "MINERA ANDINA DEL PERU S.A.",
    serviceType: "Mantenimiento",
    technician: "Luis Ramírez",
    equipment: "RICOH IM 550",
    status: "Finalizado",
    amount: 680,
  },
  {
    id: "srv-009",
    date: "28/06/2026",
    orderCode: "OS-2026-00781",
    client: "FARMACIAS SALUD TOTAL",
    serviceType: "Preventivo",
    technician: "Ana Torres",
    equipment: "SHARP MX-M5071",
    status: "Facturado",
    amount: 310,
  },
  {
    id: "srv-010",
    date: "27/06/2026",
    orderCode: "OS-2026-00780",
    client: "HOTEL COSTA VERDE",
    serviceType: "Instalación",
    technician: "Jorge Vargas",
    equipment: "CANON IR ADVANCE 4545i",
    status: "En proceso",
    amount: 1250,
  },
];

const extraClients = [
  "CONSTRUCTORA HORIZONTE",
  "UNIVERSIDAD DEL PACIFICO",
  "AGROEXPORTADORA DEL SUR",
  "LOGISTICA EXPRESS SAC",
  "IMPORTACIONES DEL PACIFICO",
];

const types: ServicioTipo[] = [
  "Correctivo",
  "Diagnóstico",
  "Mantenimiento",
  "Instalación",
  "Preventivo",
];
const statuses: ServicioEstado[] = [
  "Abierto",
  "En proceso",
  "En proceso",
  "Finalizado",
  "Finalizado",
  "Facturado",
  "Garantía",
];
const technicians = ["Carlos Mendoza", "María López", "Luis Ramírez", "Ana Torres", "Jorge Vargas"];
const equipments = [
  "RICOH MP 4002",
  "CANON IR 2630i",
  "HP PAGEWIDE 477dw",
  "XEROX VERSALINK C405",
  "EPSON POWERLITE X49",
];

function padRecord(index: number): ServicioRecord {
  const day = String(26 - (index % 25)).padStart(2, "0");
  const month = index % 2 === 0 ? "06" : "05";

  return {
    id: `srv-${String(index + 11).padStart(3, "0")}`,
    date: `${day}/${month}/2026`,
    orderCode: `OS-2026-${String(779 - index).padStart(5, "0")}`,
    client: extraClients[index % extraClients.length],
    serviceType: types[index % types.length],
    technician: technicians[index % technicians.length],
    equipment: equipments[index % equipments.length],
    status: statuses[index % statuses.length],
    amount: index % 7 === 0 ? 0 : 200 + (index % 12) * 95,
  };
}

export const serviciosMockRecords: ServicioRecord[] = [
  ...seedRecords,
  ...Array.from({ length: 110 }, (_, index) => padRecord(index)),
];

export function formatServicioCurrency(value: number) {
  if (value === 0) return "S/ 0.00";
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getServicioTipoStyles(type: ServicioTipo): string {
  switch (type) {
    case "Correctivo":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Diagnóstico":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Mantenimiento":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Instalación":
      return "border-teal-200 bg-teal-50 text-teal-700";
    case "Preventivo":
      return "border-orange-200 bg-orange-50 text-orange-700";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function getServicioEstadoStyles(status: ServicioEstado): string {
  switch (status) {
    case "Abierto":
      return "border-red-200 bg-red-50 text-red-700";
    case "En proceso":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Finalizado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Facturado":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Garantía":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
