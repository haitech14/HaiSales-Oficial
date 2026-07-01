import { AlertCircle, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Wallet } from "lucide-react";

export type MovimientoTipo = "ingreso" | "egreso" | "transferencia";
export type MovimientoEstado = "Conciliado" | "Pendiente";

export type CajaBancosRecord = {
  id: string;
  date: string;
  time: string;
  tipo: MovimientoTipo;
  cuenta: string;
  cuentaNumero: string;
  documento: string;
  concepto: string;
  ingreso: number | null;
  egreso: number | null;
  saldo: number;
  responsable: string;
  responsableInitials: string;
  estado: MovimientoEstado;
  tab: "ingresos" | "egresos" | "transferencias" | "pendientes" | "conciliados";
};

export const cajaBancosKpis = [
  {
    label: "Saldo total disponible",
    value: "S/ 202,170",
    change: "Actualizado al cierre de hoy",
    changePositive: true,
    sparkColor: "#2563eb",
    sparkPoints: [168, 172, 178, 182, 188, 192, 196, 198, 200, 202],
    icon: Wallet,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Ingresos del periodo",
    value: "S/ 18,450",
    change: "+14.6% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [12, 13, 14, 14.5, 15, 16, 17, 17.5, 18, 18.5],
    icon: ArrowUpRight,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Egresos del periodo",
    value: "S/ 9,870",
    change: "-8.2% vs. mes anterior",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [12, 11.5, 11, 10.8, 10.5, 10.2, 10, 9.9, 9.87, 9.85],
    icon: ArrowDownLeft,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Pendiente conciliar",
    value: "24",
    change: "Movimientos",
    changePositive: false,
    sparkColor: "#f97316",
    sparkPoints: [18, 19, 20, 21, 22, 23, 24, 24, 24, 24],
    icon: AlertCircle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];

export const cajaBancosTabs = [
  { id: "todos", label: "Todos", count: null as number | null },
  { id: "ingresos", label: "Ingresos", count: 45 },
  { id: "egresos", label: "Egresos", count: 38 },
  { id: "transferencias", label: "Transferencias", count: 22 },
  { id: "pendientes", label: "Pendientes", count: 24 },
  { id: "conciliados", label: "Conciliados", count: 156 },
];

export const cajaBancosRecords: CajaBancosRecord[] = [
  {
    id: "1",
    date: "30/06/2026",
    time: "16:03",
    tipo: "ingreso",
    cuenta: "BCP Soles",
    cuentaNumero: "191-2345678-0-45",
    documento: "F001-0001234",
    concepto: "Cobro por venta",
    ingreso: 4850,
    egreso: null,
    saldo: 202170,
    responsable: "Jhelcen Romero",
    responsableInitials: "JR",
    estado: "Conciliado",
    tab: "conciliados",
  },
  {
    id: "2",
    date: "30/06/2026",
    time: "14:22",
    tipo: "egreso",
    cuenta: "BBVA Soles",
    cuentaNumero: "0011-0123-4567890123",
    documento: "PAG-000089",
    concepto: "Pago a proveedor",
    ingreso: null,
    egreso: 3260,
    saldo: 197320,
    responsable: "Ana Martínez",
    responsableInitials: "AM",
    estado: "Pendiente",
    tab: "pendientes",
  },
  {
    id: "3",
    date: "30/06/2026",
    time: "11:45",
    tipo: "transferencia",
    cuenta: "BCP Soles",
    cuentaNumero: "191-2345678-0-45",
    documento: "TRF-000045",
    concepto: "Transferencia a caja chica",
    ingreso: null,
    egreso: 1500,
    saldo: 200580,
    responsable: "María Gómez",
    responsableInitials: "MG",
    estado: "Conciliado",
    tab: "conciliados",
  },
  {
    id: "4",
    date: "29/06/2026",
    time: "17:10",
    tipo: "ingreso",
    cuenta: "Interbank Soles",
    cuentaNumero: "200-3004567890",
    documento: "F001-0001230",
    concepto: "Cobro factura servicios",
    ingreso: 8450,
    egreso: null,
    saldo: 202080,
    responsable: "Juan Campos",
    responsableInitials: "JC",
    estado: "Conciliado",
    tab: "conciliados",
  },
  {
    id: "5",
    date: "29/06/2026",
    time: "10:30",
    tipo: "egreso",
    cuenta: "BCP Soles",
    cuentaNumero: "191-2345678-0-45",
    documento: "PAG-000088",
    concepto: "Pago planilla quincenal",
    ingreso: null,
    egreso: 18600,
    saldo: 193630,
    responsable: "Jhelcen Romero",
    responsableInitials: "JR",
    estado: "Pendiente",
    tab: "pendientes",
  },
  {
    id: "6",
    date: "28/06/2026",
    time: "15:55",
    tipo: "ingreso",
    cuenta: "BBVA Soles",
    cuentaNumero: "0011-0123-4567890123",
    documento: "F001-0001225",
    concepto: "Anticipo de cliente",
    ingreso: 5200,
    egreso: null,
    saldo: 212230,
    responsable: "Ana Martínez",
    responsableInitials: "AM",
    estado: "Conciliado",
    tab: "conciliados",
  },
  {
    id: "7",
    date: "28/06/2026",
    time: "09:18",
    tipo: "transferencia",
    cuenta: "Interbank Soles",
    cuentaNumero: "200-3004567890",
    documento: "TRF-000044",
    concepto: "Traslado entre cuentas BCP",
    ingreso: 8000,
    egreso: null,
    saldo: 207030,
    responsable: "María Gómez",
    responsableInitials: "MG",
    estado: "Pendiente",
    tab: "pendientes",
  },
  {
    id: "8",
    date: "27/06/2026",
    time: "16:40",
    tipo: "egreso",
    cuenta: "BCP Soles",
    cuentaNumero: "191-2345678-0-45",
    documento: "PAG-000087",
    concepto: "Pago servicios públicos",
    ingreso: null,
    egreso: 890,
    saldo: 199030,
    responsable: "Juan Campos",
    responsableInitials: "JC",
    estado: "Conciliado",
    tab: "conciliados",
  },
  {
    id: "9",
    date: "27/06/2026",
    time: "11:05",
    tipo: "ingreso",
    cuenta: "Caja general",
    cuentaNumero: "CAJA-001",
    documento: "REC-000156",
    concepto: "Cobro en efectivo",
    ingreso: 1250,
    egreso: null,
    saldo: 199920,
    responsable: "Jhelcen Romero",
    responsableInitials: "JR",
    estado: "Pendiente",
    tab: "pendientes",
  },
  {
    id: "10",
    date: "26/06/2026",
    time: "14:28",
    tipo: "egreso",
    cuenta: "BBVA Soles",
    cuentaNumero: "0011-0123-4567890123",
    documento: "PAG-000086",
    concepto: "Comisión bancaria",
    ingreso: null,
    egreso: 45,
    saldo: 198670,
    responsable: "Ana Martínez",
    responsableInitials: "AM",
    estado: "Conciliado",
    tab: "conciliados",
  },
];

export const cajaBancosFlowByAccount = [
  { label: "BCP Soles", percent: 42, color: "#3b82f6", amount: 84911 },
  { label: "BBVA Soles", percent: 28, color: "#8b5cf6", amount: 56608 },
  { label: "Interbank Soles", percent: 18, color: "#22c55e", amount: 36391 },
  { label: "Caja general", percent: 12, color: "#f97316", amount: 24260 },
];

export const cajaBancosBankBalances = [
  { name: "BCP Soles", number: "191-2345678-0-45", balance: 84911, percent: 100 },
  { name: "BBVA Soles", number: "0011-0123-4567890123", balance: 56608, percent: 67 },
  { name: "Interbank Soles", number: "200-3004567890", balance: 36391, percent: 43 },
  { name: "Caja general", number: "CAJA-001", balance: 24260, percent: 29 },
];

export const cajaBancosAlerts = [
  {
    label: "24 movimientos pendientes de conciliar",
    color: "border-l-orange-500 bg-orange-50 text-orange-800",
  },
  {
    label: "3 cheques por vencer en 7 días",
    color: "border-l-blue-500 bg-blue-50 text-blue-800",
  },
  {
    label: "2 transferencias rechazadas",
    color: "border-l-red-500 bg-red-50 text-red-800",
  },
  {
    label: "1 sobregiro detectado",
    color: "border-l-red-700 bg-red-100 text-red-900",
  },
];

export function formatCajaAmount(value: number | null) {
  if (value === null) return "—";
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getMovimientoEstadoStyles(estado: MovimientoEstado) {
  if (estado === "Conciliado") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  return "bg-orange-100 text-orange-700 border-orange-200";
}

export function getMovimientoTipoLabel(tipo: MovimientoTipo) {
  switch (tipo) {
    case "ingreso":
      return "Ingreso";
    case "egreso":
      return "Egreso";
    case "transferencia":
      return "Transferencia";
  }
}
