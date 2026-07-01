export type WorkerStatus = "Activo" | "Vacaciones" | "Cesado" | "Asistencia pendiente";

export type WorkerRecord = {
  id: string;
  nombre: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  dni: string;
  cargo: string;
  area: string;
  sueldo: number;
  asistenciaDias: number;
  asistenciaTotal: number;
  estado: WorkerStatus;
  responsable: string;
};

export const planillasKpis = [
  {
    label: "Trabajadores activos",
    value: "86",
    change: "+5.1% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [72, 74, 76, 78, 79, 80, 82, 83, 85, 86],
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    label: "Costo laboral del mes",
    value: "S/ 186,420",
    change: "+3.8% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [168000, 170500, 173200, 175800, 178400, 180100, 182600, 184200, 185800, 186420],
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    label: "Asistencias pendientes",
    value: "12",
    change: "-14.3% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [18, 17, 16, 15, 15, 14, 14, 13, 13, 12],
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  {
    label: "Boletas por emitir",
    value: "64",
    change: "+2.0% vs. mes anterior",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [58, 59, 60, 60, 61, 62, 62, 63, 63, 64],
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
];

export const planillasTabs = [
  { id: "todos", label: "Todos", count: null },
  { id: "activos", label: "Activos", count: 72 },
  { id: "asistencia", label: "Asistencia", count: 12 },
  { id: "vacaciones", label: "Vacaciones", count: 8 },
  { id: "boletas", label: "Boletas", count: 64 },
  { id: "cesados", label: "Cesados", count: 14 },
];

export const workers: WorkerRecord[] = [
  {
    id: "TR-0001",
    nombre: "Dr. Manuel Arenas",
    initials: "MA",
    avatarBg: "bg-blue-100",
    avatarColor: "text-blue-700",
    dni: "45123678",
    cargo: "Gerente Comercial",
    area: "Comercial",
    sueldo: 8500,
    asistenciaDias: 24,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "Jhelcen Romero",
  },
  {
    id: "TR-0002",
    nombre: "Sr. Carlos Vargas",
    initials: "CV",
    avatarBg: "bg-orange-100",
    avatarColor: "text-orange-700",
    dni: "40789456",
    cargo: "Supervisor Logístico",
    area: "Logística",
    sueldo: 5200,
    asistenciaDias: 22,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "Ana Martínez",
  },
  {
    id: "TR-0003",
    nombre: "Ing. Roberto Díaz",
    initials: "RD",
    avatarBg: "bg-emerald-100",
    avatarColor: "text-emerald-700",
    dni: "72349851",
    cargo: "Jefe de Compras",
    area: "Operaciones",
    sueldo: 7800,
    asistenciaDias: 26,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "Jhelcen Romero",
  },
  {
    id: "TR-0004",
    nombre: "Lic. Verónica Salas",
    initials: "VS",
    avatarBg: "bg-violet-100",
    avatarColor: "text-violet-700",
    dni: "09876543",
    cargo: "Analista Contable",
    area: "Finanzas",
    sueldo: 4800,
    asistenciaDias: 20,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "María Gómez",
  },
  {
    id: "TR-0005",
    nombre: "Téc. Luis Mendoza",
    initials: "LM",
    avatarBg: "bg-red-100",
    avatarColor: "text-red-700",
    dni: "55432198",
    cargo: "Operador de Planta",
    area: "Producción",
    sueldo: 3100,
    asistenciaDias: 18,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "Juan Campos",
  },
  {
    id: "TR-0006",
    nombre: "Srta. Patricia Ríos",
    initials: "PR",
    avatarBg: "bg-pink-100",
    avatarColor: "text-pink-700",
    dni: "41234567",
    cargo: "Ejecutiva de Ventas",
    area: "Comercial",
    sueldo: 4200,
    asistenciaDias: 25,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "Jhelcen Romero",
  },
  {
    id: "TR-0007",
    nombre: "Sr. Fernando Castro",
    initials: "FC",
    avatarBg: "bg-cyan-100",
    avatarColor: "text-cyan-700",
    dni: "67890123",
    cargo: "Coordinador de Almacén",
    area: "Logística",
    sueldo: 3800,
    asistenciaDias: 23,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "Ana Martínez",
  },
  {
    id: "TR-0008",
    nombre: "Lic. Carmen Delgado",
    initials: "CD",
    avatarBg: "bg-amber-100",
    avatarColor: "text-amber-700",
    dni: "33445566",
    cargo: "Asistente de RR.HH.",
    area: "Recursos Humanos",
    sueldo: 3500,
    asistenciaDias: 26,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "María Gómez",
  },
  {
    id: "TR-0009",
    nombre: "Ing. Diego Paredes",
    initials: "DP",
    avatarBg: "bg-indigo-100",
    avatarColor: "text-indigo-700",
    dni: "77889900",
    cargo: "Ingeniero de Procesos",
    area: "Producción",
    sueldo: 6200,
    asistenciaDias: 21,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "Juan Campos",
  },
  {
    id: "TR-0010",
    nombre: "Sr. Ricardo Núñez",
    initials: "RN",
    avatarBg: "bg-teal-100",
    avatarColor: "text-teal-700",
    dni: "22334455",
    cargo: "Analista de Costos",
    area: "Finanzas",
    sueldo: 5100,
    asistenciaDias: 24,
    asistenciaTotal: 26,
    estado: "Activo",
    responsable: "María Gómez",
  },
];

export const staffByArea = [
  { label: "Comercial", count: 22, percent: 26, color: "#3b82f6" },
  { label: "Logística", count: 16, percent: 19, color: "#f97316" },
  { label: "Operaciones", count: 18, percent: 21, color: "#22c55e" },
  { label: "Finanzas", count: 12, percent: 14, color: "#a855f7" },
  { label: "Producción", count: 10, percent: 12, color: "#ef4444" },
  { label: "RR.HH.", count: 8, percent: 9, color: "#06b6d4" },
];

export const laborCostByArea = [
  { label: "Operaciones", amount: 68750, percent: 37 },
  { label: "Comercial", amount: 52400, percent: 28 },
  { label: "Logística", amount: 31200, percent: 17 },
  { label: "Finanzas", amount: 18600, percent: 10 },
  { label: "Producción", amount: 14970, percent: 8 },
];

export const laborAlerts = [
  { label: "Contratos por vencer", count: 8, color: "bg-red-500", width: "100%" },
  { label: "Vacaciones por aprobar", count: 6, color: "bg-orange-500", width: "75%" },
  { label: "Documentos vencidos", count: 5, color: "bg-orange-400", width: "63%" },
  { label: "Asistencias pendientes", count: 12, color: "bg-amber-400", width: "100%" },
];

export function formatSalary(amount: number): string {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatLaborCost(amount: number): string {
  return `S/ ${amount.toLocaleString("es-PE")}`;
}

export function getAttendancePercent(dias: number, total: number): number {
  return Math.round((dias / total) * 100);
}

export function getAttendanceStyles(percent: number): string {
  if (percent >= 90) return "text-emerald-600";
  if (percent >= 75) return "text-orange-500";
  return "text-red-500";
}

export function getWorkerStatusStyles(estado: WorkerStatus): string {
  switch (estado) {
    case "Activo":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Vacaciones":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Cesado":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "Asistencia pendiente":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}
