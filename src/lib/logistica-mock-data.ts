export type OrderStatus = "Aprobada" | "Emitida" | "En tránsito" | "Recibida" | "Observada";
export type OrderType = "Compra" | "Servicio";
export type OrderCategory = "requisicion" | "orden" | "transito" | "recibida" | "observada";

export type PurchaseOrder = {
  id: string;
  requisicionId: string;
  fecha: string;
  hora: string;
  proveedor: string;
  ruc: string;
  tipo: OrderType;
  almacen: string;
  importe: number;
  estado: OrderStatus;
  responsable: string;
  responsableInitials: string;
  category: OrderCategory;
};

export const logisticaKpis = [
  {
    label: "Órdenes abiertas",
    value: "32",
    change: "+10 vs. ayer",
    changePositive: true,
    sparkColor: "#2563eb",
    sparkPoints: [18, 20, 22, 24, 26, 27, 28, 30, 31, 32],
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Compras del mes",
    value: "S/ 128,640",
    change: "+14.2% vs. mes anterior",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [82000, 88000, 94000, 98000, 102000, 108000, 114000, 120000, 125000, 128640],
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Pendientes recepción",
    value: "18",
    change: "-2 vs. ayer",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [24, 23, 22, 21, 20, 20, 19, 19, 18, 18],
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Entregas retrasadas",
    value: "5",
    change: "-1 vs. ayer",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [9, 8, 8, 7, 7, 6, 6, 6, 5, 5],
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export const logisticaTabs = [
  { id: "todos", label: "Todos", count: null },
  { id: "requisiciones", label: "Requisiciones", count: 12 },
  { id: "ordenes", label: "Órdenes", count: 32 },
  { id: "transito", label: "En tránsito", count: 14 },
  { id: "recibidas", label: "Recibidas", count: 56 },
  { id: "observadas", label: "Observadas", count: 8 },
];

export const comprasTabs = [
  { id: "todos", label: "Todos", count: null },
  { id: "requisiciones", label: "Requisiciones", count: 12 },
  { id: "ordenes", label: "Órdenes", count: 32 },
  { id: "observadas", label: "Observadas", count: 8 },
];

export const logisticaEntregaTabs = [
  { id: "todos", label: "Todos", count: null },
  { id: "transito", label: "En tránsito", count: 14 },
  { id: "recibidas", label: "Recibidas", count: 56 },
  { id: "observadas", label: "Observadas", count: 8 },
];

export const guiasKpis = [
  {
    label: "Guías registradas",
    value: "0",
    change: "Sin datos en el periodo",
    changePositive: true,
    sparkColor: "#2563eb",
    sparkPoints: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "En tránsito",
    value: "0",
    change: "Sin datos en el periodo",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Entregadas",
    value: "0",
    change: "Sin datos en el periodo",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Motivo venta",
    value: "0",
    change: "Sin datos en el periodo",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export const logisticaGuiaTabs = [
  { id: "todos", label: "Todas", count: null },
  { id: "en_transito", label: "En tránsito", count: null },
  { id: "entregadas", label: "Entregadas", count: null },
  { id: "venta", label: "Venta", count: null },
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "OC-2026-0045",
    requisicionId: "REQ-2026-0112",
    fecha: "30/06/2026",
    hora: "16:03",
    proveedor: "CORPORACIÓN ABC S.A.C.",
    ruc: "20123456789",
    tipo: "Compra",
    almacen: "Almacén Principal",
    importe: 12450,
    estado: "Aprobada",
    responsable: "Jhelcen Romero",
    responsableInitials: "JR",
    category: "orden",
  },
  {
    id: "OC-2026-0044",
    requisicionId: "REQ-2026-0108",
    fecha: "30/06/2026",
    hora: "14:22",
    proveedor: "SUMINISTROS DEL NORTE S.A.C.",
    ruc: "20567891234",
    tipo: "Compra",
    almacen: "Almacén Norte",
    importe: 8320,
    estado: "Emitida",
    responsable: "Ana Martínez",
    responsableInitials: "AM",
    category: "orden",
  },
  {
    id: "OC-2026-0043",
    requisicionId: "REQ-2026-0105",
    fecha: "30/06/2026",
    hora: "11:45",
    proveedor: "LOGÍSTICA INTEGRAL E.I.R.L.",
    ruc: "20456789123",
    tipo: "Servicio",
    almacen: "Almacén Principal",
    importe: 5680,
    estado: "En tránsito",
    responsable: "Juan Campos",
    responsableInitials: "JC",
    category: "transito",
  },
  {
    id: "OC-2026-0042",
    requisicionId: "REQ-2026-0099",
    fecha: "29/06/2026",
    hora: "17:30",
    proveedor: "DISTRIBUIDORA ANDINA S.A.C.",
    ruc: "20678912345",
    tipo: "Compra",
    almacen: "Almacén Sur",
    importe: 18900,
    estado: "Recibida",
    responsable: "María Gómez",
    responsableInitials: "MG",
    category: "recibida",
  },
  {
    id: "OC-2026-0041",
    requisicionId: "REQ-2026-0096",
    fecha: "29/06/2026",
    hora: "10:15",
    proveedor: "TECH SUPPLIES PERÚ S.A.C.",
    ruc: "20345678912",
    tipo: "Compra",
    almacen: "Almacén Principal",
    importe: 24680,
    estado: "Observada",
    responsable: "Jhelcen Romero",
    responsableInitials: "JR",
    category: "observada",
  },
  {
    id: "OC-2026-0040",
    requisicionId: "REQ-2026-0091",
    fecha: "28/06/2026",
    hora: "15:48",
    proveedor: "FERRETERÍA INDUSTRIAL S.A.C.",
    ruc: "20198765432",
    tipo: "Compra",
    almacen: "Almacén Norte",
    importe: 6750,
    estado: "En tránsito",
    responsable: "Ana Martínez",
    responsableInitials: "AM",
    category: "transito",
  },
  {
    id: "OC-2026-0039",
    requisicionId: "REQ-2026-0088",
    fecha: "28/06/2026",
    hora: "09:20",
    proveedor: "SERVICIOS TÉCNICOS LIMA S.A.C.",
    ruc: "20765432198",
    tipo: "Servicio",
    almacen: "Almacén Principal",
    importe: 4200,
    estado: "Aprobada",
    responsable: "Juan Campos",
    responsableInitials: "JC",
    category: "requisicion",
  },
  {
    id: "OC-2026-0038",
    requisicionId: "REQ-2026-0084",
    fecha: "27/06/2026",
    hora: "13:55",
    proveedor: "IMPORTACIONES PACÍFICO S.A.C.",
    ruc: "20432198765",
    tipo: "Compra",
    almacen: "Almacén Sur",
    importe: 31200,
    estado: "Recibida",
    responsable: "María Gómez",
    responsableInitials: "MG",
    category: "recibida",
  },
  {
    id: "OC-2026-0037",
    requisicionId: "REQ-2026-0080",
    fecha: "27/06/2026",
    hora: "08:40",
    proveedor: "PAPELERÍA CORPORATIVA E.I.R.L.",
    ruc: "20543219876",
    tipo: "Compra",
    almacen: "Almacén Principal",
    importe: 2890,
    estado: "Emitida",
    responsable: "Jhelcen Romero",
    responsableInitials: "JR",
    category: "orden",
  },
  {
    id: "OC-2026-0036",
    requisicionId: "REQ-2026-0076",
    fecha: "26/06/2026",
    hora: "16:10",
    proveedor: "EQUIPOS Y MAQUINARIA S.A.C.",
    ruc: "20654321987",
    tipo: "Compra",
    almacen: "Almacén Norte",
    importe: 45800,
    estado: "Observada",
    responsable: "Ana Martínez",
    responsableInitials: "AM",
    category: "observada",
  },
];

export const ordersByStatus = [
  { label: "Aprobada", count: 20, color: "#22c55e" },
  { label: "Emitida", count: 18, color: "#38bdf8" },
  { label: "En tránsito", count: 14, color: "#2563eb" },
  { label: "Recibida", count: 16, color: "#10b981" },
  { label: "Observado", count: 10, color: "#f97316" },
];

export const purchasesBySupplier = [
  { name: "Corporación ABC S.A.C.", amount: 28450, percent: 100 },
  { name: "Distribuidora Andina S.A.C.", amount: 22100, percent: 78 },
  { name: "Importaciones Pacífico S.A.C.", amount: 18600, percent: 65 },
  { name: "Tech Supplies Perú S.A.C.", amount: 14200, percent: 50 },
];

export const logisticsRisks = [
  { label: "Órdenes próximas a vencer", count: 5, color: "bg-red-500", width: "100%" },
  { label: "Retrasos de entrega", count: 5, color: "bg-orange-500", width: "100%" },
  { label: "Observaciones pendientes", count: 8, color: "bg-amber-400", width: "80%" },
];

export function formatImporte(value: number) {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getOrderStatusStyles(status: OrderStatus) {
  switch (status) {
    case "Aprobada":
    case "Recibida":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Emitida":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "En tránsito":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Observada":
      return "bg-orange-50 text-orange-700 border-orange-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}
