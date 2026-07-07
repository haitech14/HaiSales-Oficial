import {
  BarChart3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  PieChart,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ReportCategory = "comercial" | "financiero" | "inventario" | "operaciones";
export type ReportFormat = "PDF" | "Excel" | "CSV";

export type DashboardReport = {
  id: string;
  name: string;
  category: ReportCategory;
  description: string;
  lastRun: string;
  format: ReportFormat;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  featured?: boolean;
};

export const reportCategoryMeta: Record<
  ReportCategory,
  { label: string; count: number }
> = {
  comercial: { label: "Comercial", count: 8 },
  financiero: { label: "Financiero", count: 6 },
  inventario: { label: "Inventario", count: 5 },
  operaciones: { label: "Operaciones", count: 4 },
};

export const reportesKpis = [
  {
    label: "Reportes generados",
    value: "142",
    change: "↑ 22.4% vs. mes anterior",
    changePositive: true,
    sparkColor: "#3b82f6",
    sparkPoints: [88, 96, 102, 110, 118, 128, 136, 142],
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Descargas del mes",
    value: "386",
    change: "↑ 15.8% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [240, 260, 280, 300, 320, 340, 365, 386],
    icon: Download,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Programados",
    value: "18",
    change: "↑ 2 vs. mes anterior",
    changePositive: true,
    sparkColor: "#8b5cf6",
    sparkPoints: [12, 13, 14, 14, 15, 16, 17, 18],
    icon: BarChart3,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    label: "Tiempo promedio",
    value: "1.8s",
    change: "↓ 12% vs. mes anterior",
    changePositive: true,
    sparkColor: "#14b8a6",
    sparkPoints: [3.2, 2.8, 2.5, 2.2, 2.0, 1.9, 1.85, 1.8],
    icon: TrendingUp,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
];

export const reportCategoryFilters = [
  { id: "todos", label: "Todos" },
  { id: "comercial", label: "Comercial" },
  { id: "financiero", label: "Financiero" },
  { id: "inventario", label: "Inventario" },
  { id: "operaciones", label: "Operaciones" },
] as const;

export const dashboardReports: DashboardReport[] = [
  {
    id: "rep-001",
    name: "Ventas por vendedor",
    category: "comercial",
    description: "Ranking de ventas cerradas, metas y conversión por asesor comercial.",
    lastRun: "15/03/2026 09:30",
    format: "Excel",
    icon: BarChart3,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    featured: true,
  },
  {
    id: "rep-002",
    name: "Pipeline por etapa",
    category: "comercial",
    description: "Distribución de oportunidades activas y valor estimado por etapa.",
    lastRun: "15/03/2026 08:15",
    format: "PDF",
    icon: PieChart,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    featured: true,
  },
  {
    id: "rep-003",
    name: "Estado de resultados",
    category: "financiero",
    description: "Ingresos, costos y utilidad neta del periodo seleccionado.",
    lastRun: "14/03/2026 18:00",
    format: "PDF",
    icon: FileText,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    featured: true,
  },
  {
    id: "rep-004",
    name: "Flujo de caja",
    category: "financiero",
    description: "Entradas, salidas y saldo proyectado por semana.",
    lastRun: "14/03/2026 17:45",
    format: "Excel",
    icon: TrendingUp,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "rep-005",
    name: "Cobranzas",
    category: "financiero",
    description: "Antigüedad de saldos, clientes morosos y proyección de cobranza.",
    lastRun: "14/03/2026 16:20",
    format: "Excel",
    icon: FileSpreadsheet,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "rep-006",
    name: "Rotación de inventario",
    category: "inventario",
    description: "Productos con mayor y menor rotación en el último trimestre.",
    lastRun: "13/03/2026 11:10",
    format: "CSV",
    icon: BarChart3,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    id: "rep-007",
    name: "Stock bajo y quiebres",
    category: "inventario",
    description: "Alertas de reposición por almacén y categoría de producto.",
    lastRun: "13/03/2026 10:55",
    format: "PDF",
    icon: FileText,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    id: "rep-008",
    name: "Despachos y entregas",
    category: "operaciones",
    description: "Pedidos despachados, pendientes y tiempos promedio de entrega.",
    lastRun: "12/03/2026 15:30",
    format: "Excel",
    icon: FileSpreadsheet,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    id: "rep-009",
    name: "Compras por proveedor",
    category: "operaciones",
    description: "Órdenes emitidas, montos y cumplimiento por proveedor.",
    lastRun: "12/03/2026 14:00",
    format: "CSV",
    icon: Download,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    id: "rep-010",
    name: "Conversión CRM",
    category: "comercial",
    description: "Tasa de conversión por canal, campaña y responsable comercial.",
    lastRun: "12/03/2026 09:20",
    format: "PDF",
    icon: PieChart,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

export const ventasMensualesChart = [
  { mes: "Ene", monto: 142000 },
  { mes: "Feb", monto: 168000 },
  { mes: "Mar", monto: 186000 },
  { mes: "Abr", monto: 198000 },
  { mes: "May", monto: 224000 },
  { mes: "Jun", monto: 245680 },
];

export const topClientesReporte = [
  { cliente: "Distribuidora Norte SAC", ventas: 48600, participacion: 19.8 },
  { cliente: "Tech Solutions Perú", ventas: 38400, participacion: 15.6 },
  { cliente: "Comercial Andina SAC", ventas: 31200, participacion: 12.7 },
  { cliente: "Ferretería Industrial Max", ventas: 24800, participacion: 10.1 },
  { cliente: "Servicios Generales EIRL", ventas: 18600, participacion: 7.6 },
];

export function getReportFormatStyles(format: ReportFormat): string {
  switch (format) {
    case "PDF":
      return "border-red-200 bg-red-50 text-red-700";
    case "Excel":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CSV":
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}
