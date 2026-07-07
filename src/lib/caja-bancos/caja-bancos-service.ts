import { supabase } from "@/integrations/supabase/client";
import { withRealKpi } from "@/lib/kpi-utils";
import {
  cajaBancosKpis as staticKpis,
  cajaBancosTabs,
  type CajaBancosRecord,
  type MovimientoEstado,
  type MovimientoTipo,
} from "@/lib/caja-bancos-mock-data";

type MovimientoRow = {
  id: string;
  cuenta_id: string;
  tipo: MovimientoTipo;
  documento: string | null;
  concepto: string;
  monto_ingreso: number | null;
  monto_egreso: number | null;
  saldo_posterior: number;
  estado: string;
  responsable_nombre: string | null;
  responsable_iniciales: string | null;
  fecha: string;
  hora: string;
  cuentas_tesoreria?: { nombre: string; numero_cuenta: string | null } | null;
};

export type CajaBancosSnapshot = {
  records: CajaBancosRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number>;
  movimientosPorBanco: { bank: string; count: number }[];
  conciliacionMensual: { month: string; conciliados: number; pendientes: number }[];
  cuentasMayorSaldo: { account: string; balance: number }[];
  totalRecords: number;
  source: "supabase";
};

function formatDateParts(fecha: string, hora: string) {
  const date = new Date(`${fecha}T${hora}`);
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(amount: number) {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function inferBank(cuentaName: string): { bank: string; initials: string; color: string } {
  const lower = cuentaName.toLowerCase();
  if (lower.includes("bcp")) return { bank: "BCP", initials: "BCP", color: "bg-blue-600" };
  if (lower.includes("bbva")) return { bank: "BBVA", initials: "BBV", color: "bg-blue-700" };
  if (lower.includes("interbank")) return { bank: "Interbank", initials: "IBK", color: "bg-emerald-600" };
  if (lower.includes("scotiabank")) return { bank: "Scotiabank", initials: "SCT", color: "bg-red-600" };
  return { bank: "Otros", initials: "BNK", color: "bg-slate-500" };
}

function mapRowToRecord(row: MovimientoRow): CajaBancosRecord {
  const cuentaName = row.cuentas_tesoreria?.nombre ?? "Cuenta";
  const bank = inferBank(cuentaName);
  const ingreso = row.monto_ingreso ? Number(row.monto_ingreso) : null;
  const egreso = row.monto_egreso ? Number(row.monto_egreso) : null;
  const amount = ingreso ? ingreso : egreso ? -egreso : 0;

  let estado: MovimientoEstado = "Pendiente";
  if (row.estado === "conciliado") estado = "Conciliado";
  if (row.estado === "observado") estado = "Observado";

  return {
    id: row.id,
    date: formatDateParts(row.fecha, row.hora),
    bank: bank.bank,
    bankInitials: bank.initials,
    bankColor: bank.color,
    account: cuentaName,
    accountNumber: row.cuentas_tesoreria?.numero_cuenta ?? "—",
    operationTitle: row.concepto,
    operationEntity: row.responsable_nombre ?? "Sin asignar",
    reference: row.documento ?? "—",
    tipo: row.tipo,
    estado,
    amount,
    time: row.hora,
    cuenta: cuentaName,
    cuentaNumero: row.cuentas_tesoreria?.numero_cuenta ?? "—",
    documento: row.documento ?? "—",
    concepto: row.concepto,
    ingreso,
    egreso,
    saldo: Number(row.saldo_posterior),
    responsable: row.responsable_nombre ?? "Sin asignar",
    responsableInitials: row.responsable_iniciales ?? "SA",
  };
}

function buildSnapshot(records: CajaBancosRecord[]): CajaBancosSnapshot {
  const ingresos = records.filter((record) => record.tipo === "ingreso");
  const egresos = records.filter((record) => record.tipo === "egreso");
  const transferencias = records.filter((record) => record.tipo === "transferencia");
  const pendientes = records.filter((record) => record.estado === "Pendiente");
  const conciliados = records.filter((record) => record.estado === "Conciliado");
  const totalIngresos = ingresos.reduce((sum, record) => sum + Math.abs(record.amount), 0);
  const totalEgresos = egresos.reduce((sum, record) => sum + Math.abs(record.amount), 0);
  const saldo = records.length > 0 ? (records[0]?.saldo ?? 0) : 0;
  const porConciliar = pendientes.reduce((sum, record) => sum + Math.abs(record.amount), 0);

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, formatCurrency(saldo));
    if (index === 1) return withRealKpi(kpi, formatCurrency(totalIngresos));
    if (index === 2) return withRealKpi(kpi, formatCurrency(totalEgresos));
    return withRealKpi(kpi, formatCurrency(porConciliar));
  });

  return {
    records,
    kpis,
    tabCounts: {
      todos: records.length,
      ingresos: ingresos.length,
      egresos: egresos.length,
      transferencias: transferencias.length,
      conciliados: conciliados.length,
      pendientes: pendientes.length,
    },
    movimientosPorBanco: [],
    conciliacionMensual: [],
    cuentasMayorSaldo: [],
    totalRecords: records.length,
    source: "supabase",
  };
}

export async function fetchCajaBancosSnapshot(userId: string | null): Promise<CajaBancosSnapshot> {
  if (!userId) {
    return buildSnapshot([]);
  }

  const movimientosResult = await supabase
    .from("movimientos_tesoreria" as "almacenes")
    .select("*, cuentas_tesoreria(nombre, numero_cuenta)")
    .eq("user_id", userId)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })
    .limit(1000);

  if (movimientosResult.error) {
    console.warn("[caja-bancos] Error:", movimientosResult.error.message);
    return buildSnapshot([]);
  }

  const movimientos = (movimientosResult.data ?? []) as unknown as MovimientoRow[];
  return buildSnapshot(movimientos.map(mapRowToRecord));
}

export function filterCajaBancosRecords(
  records: CajaBancosRecord[],
  {
    activeTab,
    search,
    selectedCuenta,
  }: {
    activeTab: string;
    search: string;
    selectedCuenta: string;
  },
) {
  const query = search.trim().toLowerCase();

  return records.filter((item) => {
    const matchesTab =
      activeTab === "todos" ||
      (activeTab === "ingresos" && item.tipo === "ingreso") ||
      (activeTab === "egresos" && item.tipo === "egreso") ||
      (activeTab === "transferencias" && item.tipo === "transferencia") ||
      (activeTab === "pendientes" && item.estado === "Pendiente") ||
      (activeTab === "conciliados" && item.estado === "Conciliado");

    const matchesCuenta =
      selectedCuenta === "todos" || item.account === selectedCuenta || item.cuenta === selectedCuenta;

    const matchesSearch =
      !query ||
      item.bank.toLowerCase().includes(query) ||
      item.operationTitle.toLowerCase().includes(query) ||
      item.operationEntity.toLowerCase().includes(query) ||
      item.reference.toLowerCase().includes(query) ||
      item.account.toLowerCase().includes(query);

    return matchesTab && matchesCuenta && matchesSearch;
  });
}

export {
  cajaBancosTabs,
  formatCajaAmount,
  getMovimientoEstadoStyles,
  getMovimientoTipoLabel,
  getMovimientoTipoStyles,
} from "@/lib/caja-bancos-mock-data";
