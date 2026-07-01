import { Box, Cog, Package, RotateCw, TrendingDown, type LucideIcon } from "lucide-react";

export type ProductStatus = "Activo" | "Stock bajo" | "Sin movimiento";
export type ProductType = "product" | "service" | "kit";

export type InventarioRecord = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  warehouse: string;
  stock: number;
  unit: string;
  cost: number;
  price: number;
  status: ProductStatus;
  type: ProductType;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export const inventarioKpis = [
  {
    label: "Productos activos",
    value: "1,245",
    change: "+8.6% vs. mes anterior",
    changePositive: true,
    sparkColor: "#3b82f6",
    sparkPoints: [980, 1020, 1080, 1120, 1150, 1180, 1210, 1245],
    icon: Package,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Stock valorizado",
    value: "S/ 386,900",
    change: "+12.3% vs. mes anterior",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [280, 300, 310, 330, 350, 360, 375, 387],
    icon: Box,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Stock bajo",
    value: "18",
    change: "+2 vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [12, 13, 14, 14, 15, 16, 17, 18],
    icon: TrendingDown,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Rotación mensual",
    value: "4.2x",
    change: "+0.6x vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [2.8, 3.0, 3.2, 3.5, 3.7, 3.9, 4.0, 4.2],
    icon: RotateCw,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

export const inventarioTabs = [
  { id: "todos", label: "Todos", count: null as number | null },
  { id: "activos", label: "Activos", count: 1245 },
  { id: "stock-bajo", label: "Stock bajo", count: 18 },
  { id: "sin-movimiento", label: "Sin movimiento", count: 32 },
  { id: "servicios", label: "Servicios", count: 156 },
  { id: "kits", label: "Kits", count: 48 },
];

export const inventarioRecords: InventarioRecord[] = [
  {
    id: "1",
    sku: "PROD-000123",
    name: "Laptop Dell Latitude 5440",
    description: "Intel i7, 16GB RAM, SSD 512GB",
    category: "Equipos",
    warehouse: "Almacén Central",
    stock: 25,
    unit: "unidades",
    cost: 3200,
    price: 4850,
    status: "Activo",
    type: "product",
    icon: Package,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "2",
    sku: "PROD-000124",
    name: "Monitor LG 27\" UltraFine",
    description: "4K UHD, IPS, USB-C",
    category: "Equipos",
    warehouse: "Almacén Central",
    stock: 42,
    unit: "unidades",
    cost: 980,
    price: 1380,
    status: "Activo",
    type: "product",
    icon: Package,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "3",
    sku: "PROD-000125",
    name: "Mouse Logitech MX Master 3S",
    description: "Inalámbrico, ergonómico",
    category: "Accesorios",
    warehouse: "Almacén Central",
    stock: 68,
    unit: "unidades",
    cost: 280,
    price: 420,
    status: "Activo",
    type: "product",
    icon: Package,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "4",
    sku: "PROD-000126",
    name: "Teclado Logitech K120",
    description: "USB, español LATAM",
    category: "Accesorios",
    warehouse: "Almacén Sur",
    stock: 8,
    unit: "unidades",
    cost: 45,
    price: 79,
    status: "Stock bajo",
    type: "product",
    icon: Package,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "5",
    sku: "PROD-000127",
    name: "Cable HDMI 2.0 2m",
    description: "4K@60Hz, conectores dorados",
    category: "Accesorios",
    warehouse: "Almacén Central",
    stock: 156,
    unit: "unidades",
    cost: 18,
    price: 35,
    status: "Activo",
    type: "product",
    icon: Package,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "6",
    sku: "PROD-000128",
    name: "Disco SSD Kingston 1TB",
    description: "NVMe M.2, 3500 MB/s",
    category: "Almacenamiento",
    warehouse: "Almacén Central",
    stock: 34,
    unit: "unidades",
    cost: 320,
    price: 480,
    status: "Activo",
    type: "product",
    icon: Package,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "7",
    sku: "SERV-000045",
    name: "Instalación de software",
    description: "Por equipo, incluye configuración",
    category: "Servicios",
    warehouse: "—",
    stock: 0,
    unit: "servicio",
    cost: 0,
    price: 150,
    status: "Activo",
    type: "service",
    icon: Cog,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "8",
    sku: "KIT-000012",
    name: "Kit oficina básico",
    description: "Laptop + mouse + teclado + soporte",
    category: "Kits",
    warehouse: "Almacén Central",
    stock: 12,
    unit: "kits",
    cost: 3800,
    price: 4890,
    status: "Activo",
    type: "kit",
    icon: Box,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    id: "9",
    sku: "PROD-000129",
    name: "Webcam Logitech C920",
    description: "1080p, micrófono estéreo",
    category: "Accesorios",
    warehouse: "Almacén Norte",
    stock: 5,
    unit: "unidades",
    cost: 220,
    price: 340,
    status: "Stock bajo",
    type: "product",
    icon: Package,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "10",
    sku: "PROD-000130",
    name: "Impresora HP LaserJet Pro",
    description: "Monocromática, WiFi, dúplex",
    category: "Equipos",
    warehouse: "Almacén Central",
    stock: 0,
    unit: "unidades",
    cost: 1450,
    price: 1890,
    status: "Sin movimiento",
    type: "product",
    icon: Package,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getProductStatusStyles(status: ProductStatus): string {
  switch (status) {
    case "Activo":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Stock bajo":
      return "border-red-200 bg-red-50 text-red-700";
    case "Sin movimiento":
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function isLowStock(stock: number, status: ProductStatus): boolean {
  return status === "Stock bajo" || stock <= 10;
}

export const stockByCategory = [
  { label: "Equipos", count: 4, percent: 40, color: "#3b82f6" },
  { label: "Accesorios", count: 3, percent: 30, color: "#f97316" },
  { label: "Servicios", count: 2, percent: 20, color: "#38bdf8" },
  { label: "Almacenamiento", count: 1, percent: 10, color: "#22c55e" },
];

export const topRotationProducts = [
  { name: "Cable HDMI 2.0 2m", rotation: "12.4x", percent: 100 },
  { name: "Mouse Logitech MX Master 3S", rotation: "9.8x", percent: 79 },
  { name: "Teclado Logitech K120", rotation: "8.7x", percent: 70 },
  { name: "Disco SSD Kingston 1TB", rotation: "7.2x", percent: 58 },
  { name: "Laptop Dell Latitude 5440", rotation: "5.6x", percent: 45 },
];

export const inventoryAlerts = [
  { label: "Stock bajo", count: 12, color: "bg-red-500", width: "100%" },
  { label: "Sin movimiento (90+ días)", count: 24, color: "bg-orange-500", width: "67%" },
  { label: "Próximos a vencer", count: 5, color: "bg-amber-400", width: "42%" },
];
