export type ClientSegment = "Corporativo" | "PYME" | "Minorista" | "Prospecto" | "Otros";
export type ClientStatus = "Activo" | "Prospecto" | "Con deuda" | "Inactivo";

export type ClientRecord = {
  id: string;
  fechaAlta: string;
  ruc: string;
  razonSocial: string;
  contacto: string;
  cargo: string;
  telefono: string;
  segmento: ClientSegment;
  estado: ClientStatus;
  ejecutivo: string;
  ejecutivoInitials: string;
};

export const clientesKpis = [
  {
    label: "Clientes activos",
    value: "1,284",
    change: "+8.7% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [980, 1020, 1080, 1120, 1160, 1190, 1220, 1250, 1270, 1284],
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    label: "Prospectos",
    value: "312",
    change: "+4.3% vs. mes anterior",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [260, 268, 275, 282, 288, 295, 300, 305, 309, 312],
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  {
    label: "Con deuda",
    value: "45",
    change: "-3.2% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [58, 55, 52, 50, 49, 48, 47, 46, 46, 45],
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
  },
  {
    label: "Ticket promedio",
    value: "S/ 3,420",
    change: "+6.1% vs. mes anterior",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [2800, 2900, 3000, 3080, 3150, 3200, 3280, 3340, 3380, 3420],
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
];

export const clientesTabs = [
  { id: "todos", label: "Todos", count: null },
  { id: "activos", label: "Activos", count: 1284 },
  { id: "prospectos", label: "Prospectos", count: 312 },
  { id: "morosos", label: "Morosos", count: 45 },
  { id: "inactivos", label: "Inactivos", count: 102 },
];

export const clients: ClientRecord[] = [
  {
    id: "CL-001284",
    fechaAlta: "15/03/2024",
    ruc: "20123456789",
    razonSocial: "DISTRIBUIDORA ANDINA S.A.C.",
    contacto: "María López",
    cargo: "Gerente General",
    telefono: "+51 999 123 456",
    segmento: "Corporativo",
    estado: "Activo",
    ejecutivo: "Jhelcen Romero",
    ejecutivoInitials: "JR",
  },
  {
    id: "CL-001283",
    fechaAlta: "22/01/2024",
    ruc: "20567891234",
    razonSocial: "TECH SOLUTIONS PERÚ S.A.C.",
    contacto: "Carlos Ruiz",
    cargo: "Director Comercial",
    telefono: "+51 987 654 321",
    segmento: "Corporativo",
    estado: "Activo",
    ejecutivo: "Ana Martínez",
    ejecutivoInitials: "AM",
  },
  {
    id: "CL-001282",
    fechaAlta: "08/11/2023",
    ruc: "20456789123",
    razonSocial: "FERRETERÍA CENTRAL E.I.R.L.",
    contacto: "Pedro Sánchez",
    cargo: "Propietario",
    telefono: "+51 976 543 210",
    segmento: "PYME",
    estado: "Con deuda",
    ejecutivo: "Juan Campos",
    ejecutivoInitials: "JC",
  },
  {
    id: "CL-001281",
    fechaAlta: "30/06/2024",
    ruc: "20678912345",
    razonSocial: "INNOVA LOGÍSTICA S.A.C.",
    contacto: "Lucía Torres",
    cargo: "Jefa de Compras",
    telefono: "+51 965 432 109",
    segmento: "Corporativo",
    estado: "Prospecto",
    ejecutivo: "Jhelcen Romero",
    ejecutivoInitials: "JR",
  },
  {
    id: "CL-001280",
    fechaAlta: "12/04/2023",
    ruc: "20345678912",
    razonSocial: "COMERCIAL NORTE S.A.C.",
    contacto: "Jorge Paredes",
    cargo: "Gerente de Ventas",
    telefono: "+51 954 321 098",
    segmento: "PYME",
    estado: "Activo",
    ejecutivo: "María Gómez",
    ejecutivoInitials: "MG",
  },
  {
    id: "CL-001279",
    fechaAlta: "05/09/2022",
    ruc: "20198765432",
    razonSocial: "RETAIL EXPRESS E.I.R.L.",
    contacto: "Ana Soto",
    cargo: "Administradora",
    telefono: "+51 943 210 987",
    segmento: "Minorista",
    estado: "Inactivo",
    ejecutivo: "Ana Martínez",
    ejecutivoInitials: "AM",
  },
  {
    id: "CL-001278",
    fechaAlta: "18/02/2024",
    ruc: "20765432198",
    razonSocial: "CONSTRUCTORA PACÍFICO S.A.C.",
    contacto: "Ricardo Gómez",
    cargo: "Gerente de Proyectos",
    telefono: "+51 932 109 876",
    segmento: "Corporativo",
    estado: "Activo",
    ejecutivo: "Juan Campos",
    ejecutivoInitials: "JC",
  },
  {
    id: "CL-001277",
    fechaAlta: "25/07/2024",
    ruc: "20432198765",
    razonSocial: "SERVICIOS INTEGRALES DEL SUR S.A.C.",
    contacto: "Patricia Mendoza",
    cargo: "CEO",
    telefono: "+51 921 098 765",
    segmento: "PYME",
    estado: "Prospecto",
    ejecutivo: "Jhelcen Romero",
    ejecutivoInitials: "JR",
  },
  {
    id: "CL-001276",
    fechaAlta: "03/05/2023",
    ruc: "20543219876",
    razonSocial: "IMPORTACIONES LIMA S.A.C.",
    contacto: "Fernando Díaz",
    cargo: "Gerente Financiero",
    telefono: "+51 910 987 654",
    segmento: "Corporativo",
    estado: "Con deuda",
    ejecutivo: "Ana Martínez",
    ejecutivoInitials: "AM",
  },
  {
    id: "CL-001275",
    fechaAlta: "14/10/2024",
    ruc: "20654321987",
    razonSocial: "VERDE DISTRIBUCIONES E.I.R.L.",
    contacto: "Carmen Vargas",
    cargo: "Encargada Comercial",
    telefono: "+51 998 876 543",
    segmento: "PYME",
    estado: "Activo",
    ejecutivo: "María Gómez",
    ejecutivoInitials: "MG",
  },
];

export const segmentDistribution = [
  { label: "Corporativo", count: 514, percent: 40, color: "#3b82f6" },
  { label: "PYME", count: 449, percent: 35, color: "#eab308" },
  { label: "Minorista", count: 193, percent: 15, color: "#a855f7" },
  { label: "Prospecto", count: 90, percent: 7, color: "#06b6d4" },
  { label: "Otros", count: 38, percent: 3, color: "#1e40af" },
];

export const debtByAge = [
  { label: "0-30 días", amount: 45200, percent: 42, color: "bg-emerald-500" },
  { label: "31-60 días", amount: 28800, percent: 27, color: "bg-amber-500" },
  { label: "61-90 días", amount: 18500, percent: 17, color: "bg-red-500" },
  { label: "91-120 días", amount: 9800, percent: 9, color: "bg-violet-500" },
  { label: "Más de 120 días", amount: 5400, percent: 5, color: "bg-blue-600" },
];

export const topExecutives = [
  { name: "Jhelcen Romero", portfolio: 428600, percent: 100 },
  { name: "Ana Martínez", portfolio: 356200, percent: 83 },
  { name: "Juan Campos", portfolio: 289400, percent: 67 },
  { name: "María Gómez", portfolio: 198750, percent: 46 },
];

export function getSegmentStyles(segment: ClientSegment) {
  switch (segment) {
    case "Corporativo":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "PYME":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "Minorista":
      return "bg-violet-50 text-violet-700 border-violet-100";
    case "Prospecto":
      return "bg-cyan-50 text-cyan-700 border-cyan-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

export function getClientStatusStyles(status: ClientStatus) {
  switch (status) {
    case "Activo":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Prospecto":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Con deuda":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function formatDebtAmount(value: number) {
  return `S/ ${value.toLocaleString("es-PE")}`;
}
