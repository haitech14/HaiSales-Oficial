import { ArrowDownLeft, ArrowUpRight, Clock, Landmark } from "lucide-react";

export type MovimientoTipo = "ingreso" | "egreso" | "transferencia";
export type MovimientoEstado = "Conciliado" | "Pendiente" | "Observado";

export type CajaBancosRecord = {
  id: string;
  date: string;
  bank: string;
  bankInitials: string;
  bankColor: string;
  account: string;
  accountNumber: string;
  operationTitle: string;
  operationEntity: string;
  reference: string;
  tipo: MovimientoTipo;
  estado: MovimientoEstado;
  amount: number;
  /** @deprecated legacy supabase fields */
  time?: string;
  cuenta?: string;
  cuentaNumero?: string;
  documento?: string;
  concepto?: string;
  ingreso?: number | null;
  egreso?: number | null;
  saldo?: number;
  responsable?: string;
  responsableInitials?: string;
  tab?: "ingresos" | "egresos" | "transferencias" | "pendientes" | "conciliados";
};

export const cajaBancosKpis = [
  {
    label: "Saldo bancario",
    value: "S/ 482,650.35",
    change: "Total en cuentas",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [420, 435, 448, 455, 462, 470, 478, 482],
    icon: Landmark,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Ingresos del mes",
    value: "S/ 168,540.20",
    change: "12 movimientos",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [120, 128, 135, 142, 150, 158, 164, 168],
    icon: ArrowUpRight,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Egresos del mes",
    value: "S/ 92,310.50",
    change: "18 movimientos",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [72, 76, 80, 83, 86, 88, 90, 92],
    icon: ArrowDownLeft,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Por conciliar",
    value: "S/ 24,850.75",
    change: "8 movimientos",
    changePositive: false,
    sparkColor: "#f97316",
    sparkPoints: [18, 19, 20, 21, 22, 23, 24, 24],
    icon: Clock,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];

export const cajaBancosTabs = [
  { id: "todos", label: "Todos" },
  { id: "ingresos", label: "Ingresos" },
  { id: "egresos", label: "Egresos" },
  { id: "transferencias", label: "Transferencias" },
  { id: "conciliados", label: "Conciliados" },
  { id: "pendientes", label: "Pendientes" },
];

export const movimientosPorBanco = [
  { label: "BCP", percent: 35, color: "#3b82f6" },
  { label: "BBVA", percent: 30, color: "#2563eb" },
  { label: "Interbank", percent: 22, color: "#22c55e" },
  { label: "Otros", percent: 13, color: "#94a3b8" },
];

export const conciliacionMensual = [
  { bank: "BCP", percent: 92, color: "bg-emerald-500" },
  { bank: "BBVA", percent: 85, color: "bg-blue-600" },
  { bank: "Interbank", percent: 78, color: "bg-violet-600" },
  { bank: "Scotiabank", percent: 64, color: "bg-orange-500" },
];

export const cuentasMayorSaldo = [
  { name: "BCP Cuenta Corriente", balance: 198420.5 },
  { name: "BBVA Cuenta Ahorros", balance: 142850.0 },
  { name: "Interbank Cuenta Corriente", balance: 96380.25 },
  { name: "BCP Cuenta Detracciones", balance: 44999.6 },
];

const seedRecords: CajaBancosRecord[] = [
  {
    id: "bnk-001",
    date: "02/07/2026",
    bank: "BCP",
    bankInitials: "BCP",
    bankColor: "bg-blue-600",
    account: "Cuenta Corriente",
    accountNumber: "191-2345678-0-45",
    operationTitle: "Cobro factura F001-0001456",
    operationEntity: "GRUPO AITAMAR S.A.C.",
    reference: "OP-2026-00891",
    tipo: "ingreso",
    estado: "Conciliado",
    amount: 12450.0,
  },
  {
    id: "bnk-002",
    date: "02/07/2026",
    bank: "BBVA",
    bankInitials: "BBV",
    bankColor: "bg-blue-700",
    account: "Cuenta Ahorros",
    accountNumber: "0011-0123-4567890123",
    operationTitle: "Pago a proveedor",
    operationEntity: "DISTRIBUIDORA LIMA NORTE",
    reference: "TRF-2026-00452",
    tipo: "egreso",
    estado: "Pendiente",
    amount: -8750.0,
  },
  {
    id: "bnk-003",
    date: "01/07/2026",
    bank: "Interbank",
    bankInitials: "IBK",
    bankColor: "bg-emerald-600",
    account: "Cuenta Corriente",
    accountNumber: "200-3004567890",
    operationTitle: "Transferencia entre cuentas",
    operationEntity: "BCP Cuenta Corriente",
    reference: "TRF-INT-2026-118",
    tipo: "transferencia",
    estado: "Conciliado",
    amount: -25000.0,
  },
  {
    id: "bnk-004",
    date: "01/07/2026",
    bank: "BCP",
    bankInitials: "BCP",
    bankColor: "bg-blue-600",
    account: "Cuenta Corriente",
    accountNumber: "191-2345678-0-45",
    operationTitle: "Depósito cliente",
    operationEntity: "CORPORACION FORTE S.A.",
    reference: "DEP-2026-00334",
    tipo: "ingreso",
    estado: "Conciliado",
    amount: 5680.5,
  },
  {
    id: "bnk-005",
    date: "30/06/2026",
    bank: "BBVA",
    bankInitials: "BBV",
    bankColor: "bg-blue-700",
    account: "Cuenta Ahorros",
    accountNumber: "0011-0123-4567890123",
    operationTitle: "Pago planilla",
    operationEntity: "PLANILLA JUNIO 2026",
    reference: "PAG-PLA-2026-06",
    tipo: "egreso",
    estado: "Conciliado",
    amount: -32100.0,
  },
  {
    id: "bnk-006",
    date: "30/06/2026",
    bank: "Scotiabank",
    bankInitials: "SCT",
    bankColor: "bg-red-600",
    account: "Cuenta Corriente",
    accountNumber: "000-1234567",
    operationTitle: "Comisión bancaria",
    operationEntity: "SCOTIABANK PERU",
    reference: "COM-2026-00678",
    tipo: "egreso",
    estado: "Observado",
    amount: -125.5,
  },
  {
    id: "bnk-007",
    date: "29/06/2026",
    bank: "BCP",
    bankInitials: "BCP",
    bankColor: "bg-blue-600",
    account: "Cuenta Detracciones",
    accountNumber: "191-9988776-0-12",
    operationTitle: "Detracción venta",
    operationEntity: "MINERA ANDINA DEL PERU",
    reference: "DET-2026-00221",
    tipo: "ingreso",
    estado: "Pendiente",
    amount: 4200.0,
  },
  {
    id: "bnk-008",
    date: "29/06/2026",
    bank: "Interbank",
    bankInitials: "IBK",
    bankColor: "bg-emerald-600",
    account: "Cuenta Corriente",
    accountNumber: "200-3004567890",
    operationTitle: "Cobro servicios",
    operationEntity: "TECH SOLUTIONS PERU E.I.R.L.",
    reference: "OP-2026-00876",
    tipo: "ingreso",
    estado: "Conciliado",
    amount: 2890.0,
  },
  {
    id: "bnk-009",
    date: "28/06/2026",
    bank: "BBVA",
    bankInitials: "BBV",
    bankColor: "bg-blue-700",
    account: "Cuenta Ahorros",
    accountNumber: "0011-0123-4567890123",
    operationTitle: "Transferencia a caja chica",
    operationEntity: "CAJA CHICA LIMA",
    reference: "TRF-2026-00448",
    tipo: "transferencia",
    estado: "Pendiente",
    amount: -3500.0,
  },
  {
    id: "bnk-010",
    date: "28/06/2026",
    bank: "BCP",
    bankInitials: "BCP",
    bankColor: "bg-blue-600",
    account: "Cuenta Corriente",
    accountNumber: "191-2345678-0-45",
    operationTitle: "Pago SUNAT",
    operationEntity: "SUNAT - IGV JUNIO",
    reference: "PAG-SUNAT-2026-06",
    tipo: "egreso",
    estado: "Conciliado",
    amount: -18420.75,
  },
];

const banks = [
  { bank: "BCP", initials: "BCP", color: "bg-blue-600" },
  { bank: "BBVA", initials: "BBV", color: "bg-blue-700" },
  { bank: "Interbank", initials: "IBK", color: "bg-emerald-600" },
  { bank: "Scotiabank", initials: "SCT", color: "bg-red-600" },
];

const operations = [
  { title: "Cobro factura", entity: "CLIENTE VARIOS" },
  { title: "Pago proveedor", entity: "PROVEEDOR SAC" },
  { title: "Transferencia interna", entity: "CUENTA DESTINO" },
  { title: "Depósito en efectivo", entity: "OFICINA PRINCIPAL" },
];

const types: MovimientoTipo[] = ["ingreso", "egreso", "egreso", "transferencia", "ingreso"];
const statuses: MovimientoEstado[] = ["Conciliado", "Conciliado", "Pendiente", "Observado"];

function padRecord(index: number): CajaBancosRecord {
  const bank = banks[index % banks.length];
  const op = operations[index % operations.length];
  const tipo = types[index % types.length];
  const amount =
    tipo === "ingreso"
      ? 1500 + (index % 12) * 820
      : tipo === "transferencia"
        ? -(5000 + (index % 8) * 1200)
        : -(400 + (index % 15) * 310);

  return {
    id: `bnk-${String(index + 11).padStart(3, "0")}`,
    date: `${String(27 - (index % 26)).padStart(2, "0")}/06/2026`,
    bank: bank.bank,
    bankInitials: bank.initials,
    bankColor: bank.color,
    account: index % 2 === 0 ? "Cuenta Corriente" : "Cuenta Ahorros",
    accountNumber: `191-${String(1000000 + index).slice(0, 7)}-0-45`,
    operationTitle: op.title,
    operationEntity: op.entity,
    reference: `OP-2026-${String(800 - index).padStart(5, "0")}`,
    tipo,
    estado: statuses[index % statuses.length],
    amount,
  };
}

export const cajaBancosRecords: CajaBancosRecord[] = [
  ...seedRecords,
  ...Array.from({ length: 117 }, (_, index) => padRecord(index)),
];

export function formatCajaAmount(value: number | null, signed = false) {
  if (value === null) return "—";
  const formatted = Math.abs(value).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!signed) return `S/ ${formatted}`;
  if (value < 0) return `-S/ ${formatted}`;
  if (value > 0) return `S/ ${formatted}`;
  return `S/ ${formatted}`;
}

export function getMovimientoEstadoStyles(estado: MovimientoEstado) {
  switch (estado) {
    case "Conciliado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Pendiente":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Observado":
      return "border-red-200 bg-red-50 text-red-700";
    default: {
      const _exhaustive: never = estado;
      return _exhaustive;
    }
  }
}

export function getMovimientoTipoStyles(tipo: MovimientoTipo) {
  switch (tipo) {
    case "ingreso":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "egreso":
      return "border-red-200 bg-red-50 text-red-700";
    case "transferencia":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default: {
      const _exhaustive: never = tipo;
      return _exhaustive;
    }
  }
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
