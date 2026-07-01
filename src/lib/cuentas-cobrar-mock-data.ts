import { AlertTriangle, CalendarClock, Clock, Hourglass, Wallet } from "lucide-react";

export type CobroEstado = "Por vencer" | "Vencida";
export type CobroSection = "facturas" | "notas-credito" | "cobros-recibidos" | "anticipos";

export type CuentasCobrarRecord = {
  id: string;
  date: string;
  document: string;
  client: string;
  reference: string;
  dueDate: string;
  dueDateOverdue: boolean;
  total: number;
  balance: number;
  daysOverdue: number | null;
  status: CobroEstado;
  seller: string;
  section: CobroSection;
};

export const cuentasCobrarKpis = [
  {
    label: "Saldo total por cobrar",
    value: "S/ 202,170",
    change: "+12.6% vs. mes anterior",
    changePositive: true,
    sparkColor: "#3b82f6",
    sparkPoints: [142, 155, 162, 168, 175, 184, 192, 202],
    icon: Wallet,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Cuentas vencidas",
    value: "S/ 69,250",
    change: "+8.2% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [52, 54, 56, 58, 61, 64, 67, 69],
    icon: AlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Por vencer (0 - 30 días)",
    value: "S/ 74,580",
    change: "+10.4% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [58, 60, 62, 65, 68, 70, 72, 75],
    icon: Clock,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Por vencer (31 - 60 días)",
    value: "S/ 35,890",
    change: "+5.1% vs. mes anterior",
    changePositive: true,
    sparkColor: "#eab308",
    sparkPoints: [28, 29, 30, 31, 32, 33, 34, 36],
    icon: CalendarClock,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Por vencer (61 - 90 días)",
    value: "S/ 14,450",
    change: "+12.9% vs. mes anterior",
    changePositive: false,
    sparkColor: "#f97316",
    sparkPoints: [9, 10, 10, 11, 12, 12, 13, 14],
    icon: Hourglass,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];

export const cuentasCobrarTabs = [
  { id: "todas", label: "Todas", count: null as number | null },
  { id: "facturas", label: "Facturas por cobrar", count: 128 },
  { id: "notas-credito", label: "Notas de crédito", count: 12 },
  { id: "cobros-recibidos", label: "Cobros recibidos", count: 86 },
  { id: "anticipos", label: "Anticipos", count: 15 },
];

export const agingDistribution = [
  { label: "0-30 días", percent: 36.9, color: "#3b82f6" },
  { label: "31-60 días", percent: 17.8, color: "#22c55e" },
  { label: "61-90 días", percent: 7.1, color: "#f97316" },
  { label: "+90 días", percent: 3.6, color: "#ea580c" },
  { label: "Vencidos", percent: 34.3, color: "#ef4444" },
];

export const topClientesPorSaldo = [
  { name: "Inversiones del Sur S.A.C.", balance: 45800, percent: 100 },
  { name: "Distribuidora Norte SAC", balance: 38200, percent: 83 },
  { name: "Tech Solutions Perú EIRL", balance: 29450, percent: 64 },
  { name: "Comercial Andina SAC", balance: 22100, percent: 48 },
  { name: "Grupo Logístico Lima S.A.C.", balance: 18600, percent: 41 },
];

export const cuentasCobrarRecords: CuentasCobrarRecord[] = [
  {
    id: "1",
    date: "15/06/2026",
    document: "F001-00001248",
    client: "Inversiones del Sur S.A.C.",
    reference: "Venta equipos oficina",
    dueDate: "15/07/2026",
    dueDateOverdue: false,
    total: 12450,
    balance: 12450,
    daysOverdue: null,
    status: "Por vencer",
    seller: "Jhelcen Romero",
    section: "facturas",
  },
  {
    id: "2",
    date: "12/06/2026",
    document: "F001-00001241",
    client: "Distribuidora Norte SAC",
    reference: "Pedido mensual mayo",
    dueDate: "12/06/2026",
    dueDateOverdue: true,
    total: 9850,
    balance: 9850,
    daysOverdue: 19,
    status: "Vencida",
    seller: "Ana Martínez",
    section: "facturas",
  },
  {
    id: "3",
    date: "10/06/2026",
    document: "F001-00001235",
    client: "Tech Solutions Perú EIRL",
    reference: "Servicio implementación ERP",
    dueDate: "10/07/2026",
    dueDateOverdue: false,
    total: 15800,
    balance: 7900,
    daysOverdue: null,
    status: "Por vencer",
    seller: "Juan Campos",
    section: "facturas",
  },
  {
    id: "4",
    date: "08/06/2026",
    document: "F001-00001229",
    client: "Comercial Andina SAC",
    reference: "Factura consolidada Q2",
    dueDate: "08/05/2026",
    dueDateOverdue: true,
    total: 22100,
    balance: 22100,
    daysOverdue: 54,
    status: "Vencida",
    seller: "María Gómez",
    section: "facturas",
  },
  {
    id: "5",
    date: "05/06/2026",
    document: "F001-00001222",
    client: "Grupo Logístico Lima S.A.C.",
    reference: "Suministros almacén central",
    dueDate: "05/07/2026",
    dueDateOverdue: false,
    total: 6420,
    balance: 6420,
    daysOverdue: null,
    status: "Por vencer",
    seller: "Jhelcen Romero",
    section: "facturas",
  },
  {
    id: "6",
    date: "03/06/2026",
    document: "F001-00001218",
    client: "Constructora Pacífico S.A.",
    reference: "Material construcción lote 3",
    dueDate: "03/04/2026",
    dueDateOverdue: true,
    total: 18750,
    balance: 12500,
    daysOverdue: 89,
    status: "Vencida",
    seller: "Carlos Mendoza",
    section: "facturas",
  },
  {
    id: "7",
    date: "01/06/2026",
    document: "F001-00001212",
    client: "Farmacia Salud Total EIRL",
    reference: "Reposición inventario",
    dueDate: "01/07/2026",
    dueDateOverdue: false,
    total: 4380,
    balance: 4380,
    daysOverdue: null,
    status: "Por vencer",
    seller: "Ana Martínez",
    section: "facturas",
  },
  {
    id: "8",
    date: "28/05/2026",
    document: "FC01-00000092",
    client: "Distribuidora Norte SAC",
    reference: "Nota crédito devolución",
    dueDate: "28/05/2026",
    dueDateOverdue: false,
    total: -1850,
    balance: -1850,
    daysOverdue: null,
    status: "Por vencer",
    seller: "Ana Martínez",
    section: "notas-credito",
  },
  {
    id: "9",
    date: "25/05/2026",
    document: "RC-0000456",
    client: "Inversiones del Sur S.A.C.",
    reference: "Abono parcial factura F001-00001201",
    dueDate: "25/05/2026",
    dueDateOverdue: false,
    total: 8000,
    balance: 0,
    daysOverdue: null,
    status: "Por vencer",
    seller: "Jhelcen Romero",
    section: "cobros-recibidos",
  },
  {
    id: "10",
    date: "20/05/2026",
    document: "ANT-0000089",
    client: "Tech Solutions Perú EIRL",
    reference: "Anticipo proyecto fase 2",
    dueDate: "20/08/2026",
    dueDateOverdue: false,
    total: 15000,
    balance: 15000,
    daysOverdue: null,
    status: "Por vencer",
    seller: "Juan Campos",
    section: "anticipos",
  },
];

export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return amount < 0 ? `-S/ ${formatted}` : `S/ ${formatted}`;
}

export function getCobroStatusStyles(status: CobroEstado): string {
  switch (status) {
    case "Por vencer":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Vencida":
      return "border-red-200 bg-red-50 text-red-700";
  }
}
