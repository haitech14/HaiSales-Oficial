import { ArrowDownLeft, ArrowUpRight, Percent, TrendingUp } from "lucide-react";

export type ContabilidadEntryStatus = "Publicado" | "Borrador" | "Anulado";
export type ContabilidadSection = "asientos" | "libro-diario" | "balance" | "resultados" | "conciliacion";

export type ContabilidadRecord = {
  id: string;
  date: string;
  time: string;
  entryCode: string;
  account: string;
  accountCode: string;
  document: string;
  description: string;
  debit: number | null;
  credit: number | null;
  status: ContabilidadEntryStatus;
  section: ContabilidadSection;
};

export const contabilidadKpis = [
  {
    label: "Ingresos",
    value: "S/ 248,450",
    change: "+18.6% vs. mes anterior",
    changePositive: true,
    sparkColor: "#3b82f6",
    sparkPoints: [168, 178, 185, 198, 210, 220, 235, 248],
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Egresos",
    value: "S/ 132,180",
    change: "+8.2% vs. mes anterior",
    changePositive: false,
    sparkColor: "#f97316",
    sparkPoints: [98, 102, 108, 112, 118, 122, 128, 132],
    icon: ArrowDownLeft,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Ganancia neta",
    value: "S/ 89,270",
    change: "+24.1% vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [52, 58, 62, 68, 72, 78, 84, 89],
    icon: ArrowUpRight,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Margen",
    value: "35.9%",
    change: "-2.4% vs. mes anterior",
    changePositive: false,
    sparkColor: "#8b5cf6",
    sparkPoints: [42, 41, 40.5, 39.8, 38.5, 37.8, 36.5, 35.9],
    icon: Percent,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export const contabilidadTabs = [
  { id: "todos", label: "Todos", count: null as number | null },
  { id: "asientos", label: "Asientos", count: 112 },
  { id: "libro-diario", label: "Libro diario", count: null },
  { id: "balance", label: "Balance", count: null },
  { id: "resultados", label: "Resultados", count: null },
  { id: "conciliacion", label: "Conciliación", count: null },
];

export const contabilidadRecords: ContabilidadRecord[] = [
  {
    id: "1",
    date: "15/03/2026",
    time: "10:24",
    entryCode: "AS-000148",
    account: "Cuentas por cobrar comerciales",
    accountCode: "1211",
    document: "F001-00001248",
    description: "Venta a crédito — Distribuidora Norte SAC",
    debit: 4850,
    credit: null,
    status: "Publicado",
    section: "asientos",
  },
  {
    id: "2",
    date: "15/03/2026",
    time: "10:24",
    entryCode: "AS-000148",
    account: "Ventas de mercaderías",
    accountCode: "7011",
    document: "F001-00001248",
    description: "Ingreso por venta de mercaderías",
    debit: null,
    credit: 4112,
    status: "Publicado",
    section: "asientos",
  },
  {
    id: "3",
    date: "15/03/2026",
    time: "10:24",
    entryCode: "AS-000148",
    account: "IGV por pagar",
    accountCode: "4011",
    document: "F001-00001248",
    description: "IGV generado en venta",
    debit: null,
    credit: 738,
    status: "Publicado",
    section: "asientos",
  },
  {
    id: "4",
    date: "15/03/2026",
    time: "09:58",
    entryCode: "AS-000147",
    account: "Caja y bancos",
    accountCode: "1041",
    document: "B001-00004521",
    description: "Cobro en efectivo — Boleta de venta",
    debit: 320,
    credit: null,
    status: "Publicado",
    section: "libro-diario",
  },
  {
    id: "5",
    date: "15/03/2026",
    time: "09:58",
    entryCode: "AS-000147",
    account: "Ventas de mercaderías",
    accountCode: "7011",
    document: "B001-00004521",
    description: "Venta al contado",
    debit: null,
    credit: 271,
    status: "Publicado",
    section: "libro-diario",
  },
  {
    id: "6",
    date: "14/03/2026",
    time: "17:12",
    entryCode: "AS-000146",
    account: "Mercaderías",
    accountCode: "2011",
    document: "OC-0000892",
    description: "Ingreso de mercadería — Compra a proveedor",
    debit: 8400,
    credit: null,
    status: "Publicado",
    section: "asientos",
  },
  {
    id: "7",
    date: "14/03/2026",
    time: "17:12",
    entryCode: "AS-000146",
    account: "Cuentas por pagar comerciales",
    accountCode: "4212",
    document: "OC-0000892",
    description: "Deuda con proveedor Tech Solutions",
    debit: null,
    credit: 9912,
    status: "Publicado",
    section: "asientos",
  },
  {
    id: "8",
    date: "14/03/2026",
    time: "15:40",
    entryCode: "AS-000145",
    account: "Gastos de personal",
    accountCode: "6311",
    document: "PL-03-2026",
    description: "Planilla marzo 2026 — sueldos",
    debit: 28500,
    credit: null,
    status: "Publicado",
    section: "resultados",
  },
  {
    id: "9",
    date: "14/03/2026",
    time: "15:40",
    entryCode: "AS-000145",
    account: "Remuneraciones por pagar",
    accountCode: "4111",
    document: "PL-03-2026",
    description: "Obligación laboral del periodo",
    debit: null,
    credit: 28500,
    status: "Publicado",
    section: "resultados",
  },
  {
    id: "10",
    date: "13/03/2026",
    time: "11:05",
    entryCode: "AS-000144",
    account: "Banco de crédito del Perú",
    accountCode: "1042",
    document: "CONC-BCP-03",
    description: "Conciliación bancaria marzo — depósitos",
    debit: 12400,
    credit: null,
    status: "Borrador",
    section: "conciliacion",
  },
];

export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return amount < 0 ? `-S/ ${formatted}` : `S/ ${formatted}`;
}

export function formatAmountCell(amount: number | null): string {
  if (amount === null) return "—";
  return formatCurrency(amount);
}

export function getEntryStatusStyles(status: ContabilidadEntryStatus): string {
  switch (status) {
    case "Publicado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Borrador":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Anulado":
      return "border-slate-200 bg-slate-100 text-slate-500";
  }
}
