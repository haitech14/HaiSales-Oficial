import { ArrowDownRight, Banknote, Percent, ShoppingCart, TrendingUp } from "lucide-react";

export type DashboardArea =
  | "Ventas"
  | "CRM"
  | "Inventario"
  | "Facturación"
  | "Compras"
  | "Tesorería"
  | "Logística"
  | "Clientes";

export type DashboardStatus =
  | "Emitido"
  | "Aprobado"
  | "Despachado"
  | "Publicado"
  | "Aplicado"
  | "Completado"
  | "Pendiente"
  | "Activo";

export type DashboardRecord = {
  id: string;
  date: string;
  time: string;
  area: DashboardArea;
  document: string;
  detail: string;
  amount: number | null;
  status: DashboardStatus;
  responsible: string;
  responsibleInitials: string;
  tab: "resumen" | "ventas" | "crm" | "facturacion" | "inventario" | "compras";
};

export const dashboardKpis = [
  {
    label: "Ingresos del mes",
    value: "S/ 245,680",
    change: "↑ 18.6% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [168, 178, 192, 205, 215, 228, 238, 246],
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Ventas cerradas",
    value: "84",
    change: "↑ 12.4% vs. mes anterior",
    changePositive: true,
    sparkColor: "#3b82f6",
    sparkPoints: [58, 62, 65, 70, 72, 76, 80, 84],
    icon: ShoppingCart,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Cobranzas pend.",
    value: "S/ 36,240",
    change: "↓ 8.2% vs. mes anterior",
    changePositive: false,
    sparkColor: "#f97316",
    sparkPoints: [42, 40, 39, 38, 37, 36, 36, 36],
    icon: Banknote,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Gastos operativos",
    value: "S/ 178,320",
    change: "↑ 5.1% vs. mes anterior",
    changePositive: false,
    sparkColor: "#8b5cf6",
    sparkPoints: [152, 158, 162, 166, 170, 174, 176, 178],
    icon: ArrowDownRight,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    label: "Margen neto",
    value: "27.4%",
    change: "↑ 2.3% vs. mes anterior",
    changePositive: true,
    sparkColor: "#14b8a6",
    sparkPoints: [22, 23, 24, 24.5, 25.5, 26, 26.8, 27.4],
    icon: Percent,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
];

export const dashboardTabs = [
  { id: "resumen", label: "Resumen" },
  { id: "ventas", label: "Ventas" },
  { id: "crm", label: "CRM" },
  { id: "facturacion", label: "Facturación" },
  { id: "inventario", label: "Inventario" },
  { id: "compras", label: "Compras" },
  { id: "reportes", label: "Reportes" },
] as const;

export type DashboardTabId = (typeof dashboardTabs)[number]["id"];

export const dashboardRecords: DashboardRecord[] = [
  {
    id: "1",
    date: "15/03/2026",
    time: "10:32",
    area: "Ventas",
    document: "VTA-000184",
    detail: "Factura F001-00001248 — Distribuidora Norte SAC",
    amount: 4850,
    status: "Emitido",
    responsible: "Jhelcen Romero",
    responsibleInitials: "JR",
    tab: "ventas",
  },
  {
    id: "2",
    date: "15/03/2026",
    time: "09:45",
    area: "CRM",
    document: "OPP-000312",
    detail: "Propuesta enviada — Tech Solutions Perú",
    amount: 12800,
    status: "Aprobado",
    responsible: "Ana Martínez",
    responsibleInitials: "AM",
    tab: "crm",
  },
  {
    id: "3",
    date: "14/03/2026",
    time: "17:20",
    area: "Inventario",
    document: "PRD-INV-089",
    detail: "Salida por venta — 24 unidades despachadas",
    amount: null,
    status: "Despachado",
    responsible: "Juan Campos",
    responsibleInitials: "JC",
    tab: "inventario",
  },
  {
    id: "4",
    date: "14/03/2026",
    time: "15:10",
    area: "Facturación",
    document: "FAC-000094",
    detail: "Factura electrónica aceptada por SUNAT",
    amount: 8450,
    status: "Publicado",
    responsible: "María Gómez",
    responsibleInitials: "MG",
    tab: "facturacion",
  },
  {
    id: "5",
    date: "14/03/2026",
    time: "11:55",
    area: "Compras",
    document: "COM-000067",
    detail: "Orden de compra aprobada — Proveedor Andina",
    amount: 18600,
    status: "Aplicado",
    responsible: "Jorge Díaz",
    responsibleInitials: "JD",
    tab: "compras",
  },
  {
    id: "6",
    date: "13/03/2026",
    time: "16:30",
    area: "Tesorería",
    document: "PAG-000041",
    detail: "Pago a proveedor — Transferencia BCP",
    amount: 9820,
    status: "Completado",
    responsible: "Laura Pérez",
    responsibleInitials: "LP",
    tab: "resumen",
  },
  {
    id: "7",
    date: "13/03/2026",
    time: "14:15",
    area: "Logística",
    document: "LOG-000028",
    detail: "Despacho programado — Lima Norte",
    amount: null,
    status: "Pendiente",
    responsible: "Carlos Ruiz",
    responsibleInitials: "CR",
    tab: "resumen",
  },
  {
    id: "8",
    date: "12/03/2026",
    time: "10:08",
    area: "Clientes",
    document: "CLI-000156",
    detail: "Alta de cliente nuevo — Comercial Sur EIRL",
    amount: null,
    status: "Activo",
    responsible: "Jhelcen Romero",
    responsibleInitials: "JR",
    tab: "resumen",
  },
];

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAmountCell(amount: number | null): string {
  if (amount === null) return "—";
  return formatCurrency(amount);
}

export function getDashboardStatusStyles(status: DashboardStatus): string {
  switch (status) {
    case "Emitido":
    case "Aprobado":
    case "Aplicado":
    case "Completado":
    case "Activo":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Despachado":
    case "Publicado":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Pendiente":
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}
