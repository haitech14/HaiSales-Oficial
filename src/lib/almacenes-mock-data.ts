export type MovimientoTipo = "Entrada" | "Salida" | "Transferencia";
export type MovimientoEstado = "Completado" | "Pendiente" | "Observado";

export type KardexMovement = {
  id: string;
  fecha: string;
  hora: string;
  tipo: MovimientoTipo;
  producto: string;
  sku: string;
  cantidad: number;
  unidad: string;
  almacen: string;
  ubicacion: string;
  costo: number;
  referencia: string;
  estado: MovimientoEstado;
};

export const almacenesKpis = [
  {
    label: "Stock valorizado",
    value: "S/ 386,900",
    change: "+4.2% vs. mes anterior",
    changePositive: true,
    sparkColor: "#2563eb",
    sparkPoints: [340000, 350000, 358000, 365000, 370000, 375000, 380000, 383000, 385000, 386900],
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Entradas del mes",
    value: "156",
    change: "+12.0% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [120, 125, 130, 135, 140, 145, 148, 150, 153, 156],
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Salidas del mes",
    value: "142",
    change: "+8.0% vs. mes anterior",
    changePositive: true,
    sparkColor: "#f97316",
    sparkPoints: [110, 115, 118, 122, 126, 130, 134, 137, 140, 142],
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Diferencias",
    value: "3",
    change: "-2 vs. mes anterior",
    changePositive: true,
    sparkColor: "#ef4444",
    sparkPoints: [8, 7, 6, 6, 5, 5, 4, 4, 3, 3],
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
];

export const almacenesTabs = [
  { id: "todos", label: "Todos", count: null },
  { id: "entradas", label: "Entradas", count: 156 },
  { id: "salidas", label: "Salidas", count: 142 },
  { id: "transferencias", label: "Transferencias", count: 37 },
];

export const kardexMovements: KardexMovement[] = [
  {
    id: "MOV-2026-0328",
    fecha: "30/06/2026",
    hora: "16:45",
    tipo: "Entrada",
    producto: "Toner HP 85A Negro",
    sku: "TON-HP-85A",
    cantidad: 24,
    unidad: "Unid.",
    almacen: "Almacén Principal",
    ubicacion: "A01-01-01",
    costo: 447.60,
    referencia: "OC-2026-0045",
    estado: "Completado",
  },
  {
    id: "MOV-2026-0327",
    fecha: "30/06/2026",
    hora: "15:20",
    tipo: "Salida",
    producto: "Laptop Dell Latitude 5440",
    sku: "LAP-DELL-5440",
    cantidad: 2,
    unidad: "Unid.",
    almacen: "Almacén Principal",
    ubicacion: "B02-03-02",
    costo: 6780.0,
    referencia: "VTA-2026-0187",
    estado: "Completado",
  },
  {
    id: "MOV-2026-0326",
    fecha: "30/06/2026",
    hora: "14:08",
    tipo: "Transferencia",
    producto: "Monitor LG 27\" UltraFine",
    sku: "MON-LG-27UF",
    cantidad: 5,
    unidad: "Unid.",
    almacen: "Almacén Norte",
    ubicacion: "C01-02-01",
    costo: 4250.0,
    referencia: "TRF-2026-0091",
    estado: "Completado",
  },
  {
    id: "MOV-2026-0325",
    fecha: "30/06/2026",
    hora: "11:32",
    tipo: "Entrada",
    producto: "Teclado Logitech MX Keys",
    sku: "TEC-LOG-MXK",
    cantidad: 15,
    unidad: "Unid.",
    almacen: "Almacén Principal",
    ubicacion: "A02-01-03",
    costo: 675.0,
    referencia: "OC-2026-0044",
    estado: "Completado",
  },
  {
    id: "MOV-2026-0324",
    fecha: "29/06/2026",
    hora: "17:55",
    tipo: "Salida",
    producto: "Mouse Logitech MX Master 3S",
    sku: "MOU-LOG-MX3S",
    cantidad: 8,
    unidad: "Unid.",
    almacen: "Almacén Sur",
    ubicacion: "D01-01-02",
    costo: 2960.0,
    referencia: "VTA-2026-0185",
    estado: "Completado",
  },
  {
    id: "MOV-2026-0323",
    fecha: "29/06/2026",
    hora: "16:10",
    tipo: "Entrada",
    producto: "Disco SSD Kingston 1TB",
    sku: "SSD-KIN-1TB",
    cantidad: 30,
    unidad: "Unid.",
    almacen: "Almacén Principal",
    ubicacion: "A01-02-01",
    costo: 10500.0,
    referencia: "FAC F001-000123",
    estado: "Completado",
  },
  {
    id: "MOV-2026-0322",
    fecha: "29/06/2026",
    hora: "10:45",
    tipo: "Transferencia",
    producto: "Impresora HP LaserJet Pro",
    sku: "IMP-HP-LJP",
    cantidad: 3,
    unidad: "Unid.",
    almacen: "Almacén Principal",
    ubicacion: "B01-01-01",
    costo: 5400.0,
    referencia: "TRF-2026-0090",
    estado: "Pendiente",
  },
  {
    id: "MOV-2026-0321",
    fecha: "28/06/2026",
    hora: "15:30",
    tipo: "Salida",
    producto: "Cable HDMI 2.1 Premium",
    sku: "CAB-HDMI-21",
    cantidad: 50,
    unidad: "Unid.",
    almacen: "Almacén Norte",
    ubicacion: "C02-01-01",
    costo: 750.0,
    referencia: "VTA-2026-0180",
    estado: "Completado",
  },
  {
    id: "MOV-2026-0320",
    fecha: "28/06/2026",
    hora: "09:15",
    tipo: "Entrada",
    producto: "Router TP-Link Archer AX73",
    sku: "ROU-TPL-AX73",
    cantidad: 12,
    unidad: "Unid.",
    almacen: "Almacén Sur",
    ubicacion: "D02-01-01",
    costo: 3840.0,
    referencia: "OC-2026-0042",
    estado: "Completado",
  },
  {
    id: "MOV-2026-0319",
    fecha: "27/06/2026",
    hora: "14:22",
    tipo: "Salida",
    producto: "Webcam Logitech C920",
    sku: "WEB-LOG-C920",
    cantidad: 6,
    unidad: "Unid.",
    almacen: "Almacén Principal",
    ubicacion: "A03-01-02",
    costo: 1680.0,
    referencia: "VTA-2026-0175",
    estado: "Observado",
  },
];

export const movimientosPorTipo = [
  { label: "Entradas", count: 156, percent: 48, color: "#22c55e" },
  { label: "Salidas", count: 142, percent: 43, color: "#ef4444" },
  { label: "Transferencias", count: 30, percent: 9, color: "#3b82f6" },
];

export const stockPorAlmacen = [
  { label: "Almacén Principal", amount: 186420, percent: 48, color: "#3b82f6" },
  { label: "Almacén Norte", amount: 98400, percent: 25, color: "#f97316" },
  { label: "Almacén Sur", amount: 62380, percent: 16, color: "#22c55e" },
  { label: "Almacén Este", amount: 39700, percent: 11, color: "#a855f7" },
];

export const almacenAlerts = [
  { label: "2 diferencias por revisar", count: 2, color: "bg-red-500", width: "100%" },
  { label: "5 productos bajo stock mínimo", count: 5, color: "bg-orange-500", width: "80%" },
  { label: "3 ubicaciones sin inventario", count: 3, color: "bg-amber-400", width: "60%" },
  { label: "1 transferencia pendiente", count: 1, color: "bg-blue-400", width: "40%" },
];

export function formatKardexCost(amount: number): string {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getMovimientoStyles(tipo: MovimientoTipo): string {
  switch (tipo) {
    case "Entrada":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Salida":
      return "border-red-200 bg-red-50 text-red-700";
    case "Transferencia":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function getMovimientoEstadoStyles(estado: MovimientoEstado): string {
  switch (estado) {
    case "Completado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Pendiente":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Observado":
      return "border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}
