import { supabase } from "@/integrations/supabase/client";
import {
  cajaBancosKpis as staticKpis,
  cajaBancosTabs,
  type CajaBancosRecord,
  type MovimientoEstado,
  type MovimientoTipo,
} from "@/lib/caja-bancos-mock-data";
import { withRealKpi } from "@/lib/kpi-utils";

type CuentaRow = {
  id: string;
  nombre: string;
  numero_cuenta: string | null;
  saldo_actual: number;
};

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

export type CajaBancosFlowItem = {
  label: string;
  percent: number;
  color: string;
  amount: number;
};

export type CajaBancosBankBalance = {
  name: string;
  number: string;
  balance: number;
  percent: number;
};

export type CajaBancosAlert = {
  label: string;
  color: string;
};

export type CajaBancosSnapshot = {
  records: CajaBancosRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  flowByAccount: CajaBancosFlowItem[];
  bankBalances: CajaBancosBankBalance[];
  alerts: CajaBancosAlert[];
  totalRecords: number;
  source: "supabase" | "mock";
};

function formatDateParts(fecha: string, hora: string) {
  const date = new Date(`${fecha}T${hora}`);
  return {
    date: date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function mapRowToRecord(row: MovimientoRow): CajaBancosRecord {
  const { date, time } = formatDateParts(row.fecha, row.hora);
  const estado: MovimientoEstado = row.estado === "conciliado" ? "Conciliado" : "Pendiente";
  const ingreso = row.monto_ingreso ? Number(row.monto_ingreso) : null;
  const egreso = row.monto_egreso ? Number(row.monto_egreso) : null;

  let tab: CajaBancosRecord["tab"] = "conciliados";
  if (row.tipo === "ingreso") tab = estado === "Pendiente" ? "pendientes" : "ingresos";
  if (row.tipo === "egreso") tab = estado === "Pendiente" ? "pendientes" : "egresos";
  if (row.tipo === "transferencia") tab = "transferencias";

  return {
    id: row.id,
    date,
    time,
    tipo: row.tipo,
    cuenta: row.cuentas_tesoreria?.nombre ?? "Cuenta",
    cuentaNumero: row.cuentas_tesoreria?.numero_cuenta ?? "—",
    documento: row.documento ?? "—",
    concepto: row.concepto,
    ingreso,
    egreso,
    saldo: Number(row.saldo_posterior),
    responsable: row.responsable_nombre ?? "Sin asignar",
    responsableInitials: row.responsable_iniciales ?? "SA",
    estado,
    tab,
  };
}

function computeFlowByAccount(records: CajaBancosRecord[]): CajaBancosFlowItem[] {
  const totals = new Map<string, number>();
  const colors = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316"];

  for (const record of records) {
    const flow = (record.ingreso ?? 0) + (record.egreso ?? 0);
    totals.set(record.cuenta, (totals.get(record.cuenta) ?? 0) + flow);
  }

  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()].map(([label, amount], index) => ({
    label,
    amount,
    percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    color: colors[index % colors.length],
  }));
}

function computeBankBalances(cuentas: CuentaRow[]): CajaBancosBankBalance[] {
  const saldoTotal = cuentas.reduce((sum, cuenta) => sum + Number(cuenta.saldo_actual), 0);

  return cuentas.map((cuenta) => {
    const balance = Number(cuenta.saldo_actual);
    return {
      name: cuenta.nombre,
      number: cuenta.numero_cuenta ?? "—",
      balance,
      percent: saldoTotal > 0 ? Math.round((balance / saldoTotal) * 100) : 0,
    };
  });
}

function computeAlerts(records: CajaBancosRecord[]): CajaBancosAlert[] {
  const pendientes = records.filter((record) => record.estado === "Pendiente").length;
  if (pendientes === 0) return [];

  return [
    {
      label: `${pendientes} movimiento${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"} de conciliar`,
      color: "border-l-orange-500 bg-orange-50 text-orange-800",
    },
  ];
}

function buildSnapshot(records: CajaBancosRecord[], cuentas: CuentaRow[], source: "supabase" | "mock"): CajaBancosSnapshot {
  const ingresos = records.filter((r) => r.tipo === "ingreso").length;
  const egresos = records.filter((r) => r.tipo === "egreso").length;
  const transferencias = records.filter((r) => r.tipo === "transferencia").length;
  const pendientes = records.filter((r) => r.estado === "Pendiente").length;
  const conciliados = records.filter((r) => r.estado === "Conciliado").length;
  const saldoTotal = cuentas.reduce((sum, c) => sum + Number(c.saldo_actual), 0);
  const totalIngresos = records.reduce((sum, r) => sum + (r.ingreso ?? 0), 0);
  const totalEgresos = records.reduce((sum, r) => sum + (r.egreso ?? 0), 0);

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) {
      return withRealKpi(
        kpi,
        saldoTotal > 0 ? `S/ ${Math.round(saldoTotal).toLocaleString("es-PE")}` : "S/ 0",
      );
    }
    if (index === 1) {
      return withRealKpi(
        kpi,
        totalIngresos > 0 ? `S/ ${Math.round(totalIngresos).toLocaleString("es-PE")}` : "S/ 0",
      );
    }
    if (index === 2) {
      return withRealKpi(
        kpi,
        totalEgresos > 0 ? `S/ ${Math.round(totalEgresos).toLocaleString("es-PE")}` : "S/ 0",
      );
    }
    if (index === 3) return withRealKpi(kpi, String(pendientes));
    return withRealKpi(kpi, "0");
  });

  return {
    records,
    kpis,
    tabCounts: {
      todos: null,
      ingresos,
      egresos,
      transferencias,
      pendientes,
      conciliados,
    },
    flowByAccount: computeFlowByAccount(records),
    bankBalances: computeBankBalances(cuentas),
    alerts: computeAlerts(records),
    totalRecords: records.length,
    source,
  };
}

export async function fetchCajaBancosSnapshot(userId: string | null): Promise<CajaBancosSnapshot> {
  if (!userId) {
    return buildSnapshot([], [], "supabase");
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
    return buildSnapshot([], [], "supabase");
  }

  const movimientos = (movimientosResult.data ?? []) as unknown as MovimientoRow[];

  const cuentasResult = await supabase
    .from("cuentas_tesoreria" as "almacenes")
    .select("id, nombre, numero_cuenta, saldo_actual")
    .eq("user_id", userId)
    .eq("activo", true);

  const cuentas = (cuentasResult.data ?? []) as unknown as CuentaRow[];

  if (!movimientos.length) {
    return buildSnapshot([], cuentas, "supabase");
  }

  return buildSnapshot(movimientos.map(mapRowToRecord), cuentas, "supabase");
}

export {
  cajaBancosTabs,
  formatCajaAmount,
  getMovimientoEstadoStyles,
} from "@/lib/caja-bancos-mock-data";
