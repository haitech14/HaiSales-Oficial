import { Percent, Receipt, TrendingDown, TrendingUp, Users } from "lucide-react";

export const generalKpis = [
  {
    label: "Ingresos totales",
    value: "S/ 248,450",
    change: "+18.6% vs. mes anterior",
    changePositive: true,
    sparkColor: "#3b82f6",
    sparkPoints: [142, 158, 168, 178, 192, 210, 228, 248],
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Gastos totales",
    value: "S/ 187,230",
    change: "+12.4% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [142, 148, 155, 160, 168, 172, 180, 187],
    icon: TrendingDown,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Utilidad neta",
    value: "S/ 61,220",
    change: "+38.4% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [28, 32, 38, 42, 48, 52, 58, 61],
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Margen de utilidad",
    value: "24.65%",
    change: "+3.2 pp vs. mes anterior",
    changePositive: true,
    sparkColor: "#8b5cf6",
    sparkPoints: [18, 19, 20, 21, 22, 23, 24, 24.65],
    icon: Percent,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    label: "Facturas emitidas",
    value: "328",
    change: "+12.4% vs. mes anterior",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [220, 240, 260, 275, 290, 305, 318, 328],
    icon: Receipt,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Clientes activos",
    value: "1,284",
    change: "+8.7% vs. mes anterior",
    changePositive: true,
    sparkColor: "#14b8a6",
    sparkPoints: [980, 1020, 1080, 1120, 1160, 1200, 1250, 1284],
    icon: Users,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
];

export const resumenFinancieroChart = [
  { mes: "Ene", ingresos: 142, gastos: 118, utilidad: 24 },
  { mes: "Feb", ingresos: 158, gastos: 125, utilidad: 33 },
  { mes: "Mar", ingresos: 168, gastos: 132, utilidad: 36 },
  { mes: "Abr", ingresos: 178, gastos: 138, utilidad: 40 },
  { mes: "May", ingresos: 198, gastos: 148, utilidad: 50 },
  { mes: "Jun", ingresos: 248, gastos: 187, utilidad: 61 },
];

export const ingresosDistribucion = [
  { name: "Ventas de productos", value: 42, color: "#3b82f6" },
  { name: "Servicios", value: 31, color: "#8b5cf6" },
  { name: "Proyectos", value: 17, color: "#22c55e" },
  { name: "Otros ingresos", value: 10, color: "#f97316" },
];

export const gastosDistribucion = [
  { name: "Gastos fijos", value: 58, color: "#ef4444" },
  { name: "Gastos variables", value: 28, color: "#f97316" },
  { name: "Gastos financieros", value: 8, color: "#8b5cf6" },
  { name: "Otros gastos", value: 6, color: "#94a3b8" },
];

export const utilidadEvolucion = [
  { mes: "Ene", utilidad: 24 },
  { mes: "Feb", utilidad: 33 },
  { mes: "Mar", utilidad: 36 },
  { mes: "Abr", utilidad: 40 },
  { mes: "May", utilidad: 50 },
  { mes: "Jun", utilidad: 61 },
];

export const flujoCajaChart = [
  { mes: "Ene", entradas: 142, salidas: 118, neto: 24 },
  { mes: "Feb", entradas: 158, salidas: 125, neto: 33 },
  { mes: "Mar", entradas: 168, salidas: 132, neto: 36 },
  { mes: "Abr", entradas: 178, salidas: 138, neto: 40 },
  { mes: "May", entradas: 198, salidas: 148, neto: 50 },
  { mes: "Jun", entradas: 248, salidas: 187, neto: 61 },
];

export const indicadoresFinancieros = [
  { label: "Liquidez corriente", value: "2.45", status: "Sólido", tone: "emerald" },
  { label: "Endeudamiento total", value: "0.38", status: "Sólido", tone: "emerald" },
  { label: "Rotación de activos", value: "1.12", status: "Moderado", tone: "amber" },
  { label: "Periodo promedio de cobro", value: "28 días", status: "Bueno", tone: "emerald" },
  { label: "Periodo promedio de pago", value: "21 días", status: "Bueno", tone: "emerald" },
];

export const topClientesGeneral = [
  { cliente: "Distribuidora Norte SAC", facturacion: 48600, participacion: 19.6 },
  { cliente: "Tech Solutions Perú EIRL", facturacion: 38400, participacion: 15.5 },
  { cliente: "Comercial Andina SAC", facturacion: 31200, participacion: 12.6 },
  { cliente: "Grupo Industrial Lima SAC", facturacion: 24800, participacion: 10.0 },
  { cliente: "Importaciones del Sur SAC", facturacion: 22450, participacion: 9.0 },
  { cliente: "Agroexport Perú SAC", facturacion: 18680, participacion: 7.5 },
  { cliente: "Logística Express SAC", facturacion: 15200, participacion: 6.1 },
  { cliente: "Ferretería Industrial Max", facturacion: 12800, participacion: 5.2 },
  { cliente: "Servicios Generales EIRL", facturacion: 9600, participacion: 3.9 },
  { cliente: "Comercial Sur EIRL", facturacion: 8200, participacion: 3.3 },
];

export const topProductosGeneral = [
  { producto: "Laptop Dell Latitude 5440", ventas: 106250, participacion: 18.2 },
  { producto: "Monitor LG 27\" UltraFine", ventas: 57960, participacion: 9.9 },
  { producto: "Kit oficina básico", ventas: 48900, participacion: 8.4 },
  { producto: "Disco SSD Kingston 1TB", ventas: 38400, participacion: 6.6 },
  { producto: "Mouse Logitech MX Master 3S", ventas: 28560, participacion: 4.9 },
  { producto: "Cable HDMI 2.0 2m", ventas: 21840, participacion: 3.7 },
  { producto: "Instalación de software", ventas: 18600, participacion: 3.2 },
  { producto: "Webcam Logitech C920", ventas: 16320, participacion: 2.8 },
  { producto: "Teclado Logitech K120", ventas: 9480, participacion: 1.6 },
  { producto: "Impresora HP LaserJet Pro", ventas: 7560, participacion: 1.3 },
];
