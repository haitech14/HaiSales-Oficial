import { AlertTriangle, LineChart, Truck, Users } from "lucide-react";

export type AlquilerEstado = "Activo" | "Por vencer" | "Vencido" | "Finalizado";

export type TipoEquipo =
  | "Impresora multifuncional"
  | "Fotocopiadora"
  | "Proyector"
  | "Aire acondicionado"
  | "Montacargas";

export type AlquilerRecord = {
  id: string;
  date: string;
  client: string;
  equipment: string;
  serial: string;
  startDate: string;
  endDate: string;
  status: AlquilerEstado;
  monthlyAmount: number;
  equipmentType: TipoEquipo;
  contractCode: string;
};

export const alquileresKpis = [
  {
    label: "Contratos activos",
    value: "48",
    change: "+12% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [38, 40, 41, 43, 44, 45, 46, 48],
    icon: Users,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Equipos alquilados",
    value: "156",
    change: "+8% vs. mes anterior",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [132, 136, 140, 144, 148, 150, 153, 156],
    icon: Truck,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Por vencer",
    value: "9",
    change: "-5% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [12, 11, 11, 10, 10, 9, 9, 9],
    icon: AlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Ingresos del mes",
    value: "S/ 84,250",
    change: "+15% vs. mes anterior",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [68, 71, 74, 76, 79, 81, 83, 84],
    icon: LineChart,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export const alquileresTabs = [
  { id: "todos", label: "Todos" },
  { id: "activos", label: "Activos" },
  { id: "por-vencer", label: "Por vencer" },
  { id: "vencidos", label: "Vencidos" },
  { id: "finalizados", label: "Finalizados" },
];

export const alquileresStatusDistribution = [
  { label: "Activos", percent: 68, color: "#3b82f6", status: "Activo" as const },
  { label: "Por vencer", percent: 19, color: "#f97316", status: "Por vencer" as const },
  { label: "Vencidos", percent: 6, color: "#ef4444", status: "Vencido" as const },
  { label: "Finalizados", percent: 7, color: "#94a3b8", status: "Finalizado" as const },
];

export const vencimientosProximos = [
  { label: "0-30 días", contracts: 6, amount: 8100, color: "bg-emerald-500", percent: 100 },
  { label: "31-60 días", contracts: 3, amount: 3450, color: "bg-orange-500", percent: 43 },
  { label: "61-90 días", contracts: 1, amount: 1250, color: "bg-blue-600", percent: 15 },
  { label: "Más de 90 días", contracts: 0, amount: 0, color: "bg-slate-300", percent: 0 },
];

export const equiposMayorRotacion = [
  { name: "Impresoras Multifuncionales", quantity: 28, percent: 100 },
  { name: "Fotocopiadoras", quantity: 16, percent: 57 },
  { name: "Proyectores", quantity: 9, percent: 32 },
  { name: "Aires Acondicionados", quantity: 7, percent: 25 },
  { name: "Montacargas", quantity: 5, percent: 18 },
];

const seedRecords: AlquilerRecord[] = [
  {
    id: "alq-001",
    date: "15/03/2026",
    client: "Distribuidora Carpio S.A.C.",
    equipment: "Ricoh MP 4002",
    serial: "3209X400277",
    startDate: "01/03/2026",
    endDate: "28/02/2027",
    status: "Activo",
    monthlyAmount: 3450,
    equipmentType: "Fotocopiadora",
    contractCode: "ALQ-2026-0048",
  },
  {
    id: "alq-002",
    date: "12/03/2026",
    client: "Corporación Fénix S.A.",
    equipment: "Canon imageRUNNER 2630i",
    serial: "CN2630X891234",
    startDate: "15/02/2026",
    endDate: "14/02/2027",
    status: "Activo",
    monthlyAmount: 2800,
    equipmentType: "Impresora multifuncional",
    contractCode: "ALQ-2026-0047",
  },
  {
    id: "alq-003",
    date: "10/03/2026",
    client: "Servicios Andinos E.I.R.L.",
    equipment: "HP LaserJet Pro M404dn",
    serial: "HPLJ404X552190",
    startDate: "01/01/2026",
    endDate: "15/03/2026",
    status: "Por vencer",
    monthlyAmount: 1200,
    equipmentType: "Impresora multifuncional",
    contractCode: "ALQ-2026-0046",
  },
  {
    id: "alq-004",
    date: "08/03/2026",
    client: "Importaciones del Pacífico",
    equipment: "Xerox VersaLink C405",
    serial: "XRVC405X778912",
    startDate: "15/11/2025",
    endDate: "14/11/2026",
    status: "Activo",
    monthlyAmount: 4100,
    equipmentType: "Fotocopiadora",
    contractCode: "ALQ-2025-0112",
  },
  {
    id: "alq-005",
    date: "05/03/2026",
    client: "Logística Express S.A.C.",
    equipment: "Epson EcoTank L6290",
    serial: "EPL6290X334501",
    startDate: "01/10/2025",
    endDate: "28/02/2026",
    status: "Vencido",
    monthlyAmount: 890,
    equipmentType: "Impresora multifuncional",
    contractCode: "ALQ-2025-0098",
  },
  {
    id: "alq-006",
    date: "03/03/2026",
    client: "Tecnología Avanzada SAC",
    equipment: "Brother MFC-L8690CDW",
    serial: "BRMFC8690X11230",
    startDate: "15/06/2025",
    endDate: "14/06/2026",
    status: "Activo",
    monthlyAmount: 2350,
    equipmentType: "Impresora multifuncional",
    contractCode: "ALQ-2025-0076",
  },
  {
    id: "alq-007",
    date: "01/03/2026",
    client: "Comercial Norte E.I.R.L.",
    equipment: "Kyocera ECOSYS M5526cdw",
    serial: "KY5526X998712",
    startDate: "01/03/2025",
    endDate: "28/02/2026",
    status: "Finalizado",
    monthlyAmount: 1750,
    equipmentType: "Fotocopiadora",
    contractCode: "ALQ-2025-0041",
  },
  {
    id: "alq-008",
    date: "28/02/2026",
    client: "Inversiones Lima Sur S.A.",
    equipment: "Ricoh SP C250DN",
    serial: "RSPC250X445891",
    startDate: "10/01/2026",
    endDate: "09/01/2027",
    status: "Activo",
    monthlyAmount: 1980,
    equipmentType: "Impresora multifuncional",
    contractCode: "ALQ-2026-0039",
  },
  {
    id: "alq-009",
    date: "25/02/2026",
    client: "Grupo Industrial SAC",
    equipment: "Proyector Epson EB-X49",
    serial: "EPEBX49X223400",
    startDate: "01/12/2025",
    endDate: "30/11/2026",
    status: "Activo",
    monthlyAmount: 650,
    equipmentType: "Proyector",
    contractCode: "ALQ-2025-0105",
  },
  {
    id: "alq-010",
    date: "22/02/2026",
    client: "Almacenes del Centro",
    equipment: "Montacargas Toyota 1.5T",
    serial: "TYMT15X771234",
    startDate: "01/09/2025",
    endDate: "31/08/2026",
    status: "Activo",
    monthlyAmount: 8500,
    equipmentType: "Montacargas",
    contractCode: "ALQ-2025-0088",
  },
];

const extraClients = [
  "GRUPO AITAMAR",
  "CORPORACION FORTE",
  "DISTRIBUIDORA LIMA NORTE",
  "Minera Andina SAC",
  "Clínica San Martín",
  "Hotel Costa Verde",
  "Universidad del Pacífico",
  "Constructora Horizonte",
  "Farmacias Salud Total",
  "Agroexportadora del Sur",
];

const extraEquipment = [
  { name: "Ricoh IM 550", type: "Impresora multifuncional" as const },
  { name: "Canon IR ADVANCE 4545i", type: "Fotocopiadora" as const },
  { name: "HP PageWide Pro 477dw", type: "Impresora multifuncional" as const },
  { name: "Epson PowerLite X49", type: "Proyector" as const },
  { name: "Carrier 48TC", type: "Aire acondicionado" as const },
  { name: "Yale ERP15VT", type: "Montacargas" as const },
  { name: "Konica Minolta bizhub C258", type: "Fotocopiadora" as const },
  { name: "Sharp MX-M5071", type: "Impresora multifuncional" as const },
];

const statusPool: AlquilerEstado[] = [
  "Activo", "Activo", "Activo", "Activo", "Activo",
  "Activo", "Activo", "Activo", "Activo", "Activo",
  "Activo", "Activo", "Activo", "Activo", "Activo",
  "Activo", "Activo", "Activo", "Activo", "Activo",
  "Activo", "Activo", "Activo", "Activo", "Activo",
  "Activo", "Activo", "Activo", "Activo", "Activo",
  "Activo", "Activo", "Activo",
  "Por vencer", "Por vencer", "Por vencer", "Por vencer", "Por vencer",
  "Por vencer", "Por vencer", "Por vencer", "Por vencer",
  "Vencido", "Vencido", "Vencido",
  "Finalizado", "Finalizado", "Finalizado",
];

function padRecord(index: number): AlquilerRecord {
  const client = extraClients[index % extraClients.length];
  const equip = extraEquipment[index % extraEquipment.length];
  const status = statusPool[index] ?? "Activo";
  const day = String(20 - (index % 18)).padStart(2, "0");
  const month = index % 2 === 0 ? "02" : "01";

  return {
    id: `alq-${String(index + 11).padStart(3, "0")}`,
    date: `${day}/${month}/2026`,
    client,
    equipment: equip.name,
    serial: `SN${String(100000 + index * 7919).slice(0, 6)}X${String(200000 + index * 3371).slice(0, 6)}`,
    startDate: `01/${month}/2026`,
    endDate: status === "Vencido" ? "15/02/2026" : status === "Por vencer" ? "20/03/2026" : `28/${month}/2027`,
    status,
    monthlyAmount: 950 + (index % 7) * 420,
    equipmentType: equip.type,
    contractCode: `ALQ-2026-${String(48 - index).padStart(4, "0")}`,
  };
}

export const alquileresMockRecords: AlquilerRecord[] = [
  ...seedRecords,
  ...Array.from({ length: 38 }, (_, index) => padRecord(index)),
];

export function formatAlquilerCurrency(value: number) {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function getAlquilerStatusStyles(status: AlquilerEstado): string {
  switch (status) {
    case "Activo":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Por vencer":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Vencido":
      return "border-red-200 bg-red-50 text-red-700";
    case "Finalizado":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
