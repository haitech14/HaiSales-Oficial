import { supabase } from "@/integrations/supabase/client";
import {
  cajaBancosAlerts,
  cajaBancosBankBalances,
  cajaBancosFlowByAccount,
  cajaBancosKpis as staticKpis,
  cajaBancosRecords as mockRecords,
  cajaBancosTabs,
  type CajaBancosRecord,
  type MovimientoEstado,
  type MovimientoTipo,
} from "@/lib/caja-bancos-mock-data";
import { seedDemoDataForUser } from "@/lib/seed-demo";

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

export type CajaBancosSnapshot = {
  records: CajaBancosRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  flowByAccount: typeof cajaBancosFlowByAccount;
  bankBalances: typeof cajaBancosBankBalances;
  alerts: typeof cajaBancosAlerts;
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

async function seedTesoreriaDemo(userId: string) {
  const { data: existing } = await supabase
    .from("cuentas_tesoreria" as "almacenes")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existing?.length) return;

  const cuentas = [
    { nombre: "BCP Soles", numero_cuenta: "191-2345678-0-45", tipo: "banco", banco: "BCP", saldo_actual: 202170 },
    { nombre: "BBVA Soles", numero_cuenta: "0011-0123-4567890123", tipo: "banco", banco: "BBVA", saldo_actual: 98540 },
    { nombre: "Caja Chica", numero_cuenta: "CAJA-01", tipo: "caja", saldo_actual: 2500 },
  ];

  for (const cuenta of cuentas) {
    const { data: inserted } = await supabase
      .from("cuentas_tesoreria" as "almacenes")
      .insert({ user_id: userId, ...cuenta } as never)
      .select("id, saldo_actual")
      .single();

    if (!inserted) continue;

    await supabase.from("movimientos_tesoreria" as "almacenes").insert({
      user_id: userId,
      cuenta_id: (inserted as { id: string }).id,
      tipo: "ingreso",
      documento: "INI-0001",
      concepto: "Saldo inicial demo",
      monto_ingreso: cuenta.saldo_actual,
      saldo_posterior: cuenta.saldo_actual,
      estado: "conciliado",
      responsable_nombre: "Jhelcen Romero",
      responsable_iniciales: "JR",
    } as never);
  }
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
    if (index === 0 && saldoTotal > 0) {
      return { ...kpi, value: `S/ ${Math.round(saldoTotal).toLocaleString("es-PE")}` };
    }
    if (index === 1 && totalIngresos > 0) {
      return { ...kpi, value: `S/ ${Math.round(totalIngresos).toLocaleString("es-PE")}` };
    }
    if (index === 2 && totalEgresos > 0) {
      return { ...kpi, value: `S/ ${Math.round(totalEgresos).toLocaleString("es-PE")}` };
    }
    if (index === 3) return { ...kpi, value: String(pendientes || kpi.value) };
    return kpi;
  });

  const bankBalances = cuentas.length
    ? cuentas.map((c) => ({
        bank: c.nombre,
        account: c.numero_cuenta ?? "—",
        balance: `S/ ${Number(c.saldo_actual).toLocaleString("es-PE")}`,
        change: "Actualizado",
        positive: true,
      }))
    : cajaBancosBankBalances;

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
    flowByAccount: cajaBancosFlowByAccount,
    bankBalances,
    alerts: cajaBancosAlerts,
    totalRecords: records.length,
    source,
  };
}

export async function fetchCajaBancosSnapshot(userId: string | null): Promise<CajaBancosSnapshot> {
  if (!userId) {
    return buildSnapshot(mockRecords, [], "mock");
  }

  const movimientosResult = await supabase
    .from("movimientos_tesoreria" as "almacenes")
    .select("*, cuentas_tesoreria(nombre, numero_cuenta)")
    .eq("user_id", userId)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })
    .limit(100);

  if (movimientosResult.error) {
    console.warn("[caja-bancos] Error:", movimientosResult.error.message);
    return buildSnapshot(mockRecords, [], "mock");
  }

  let movimientos = (movimientosResult.data ?? []) as unknown as MovimientoRow[];

  const cuentasResult = await supabase
    .from("cuentas_tesoreria" as "almacenes")
    .select("id, nombre, numero_cuenta, saldo_actual")
    .eq("user_id", userId)
    .eq("activo", true);

  let cuentas = (cuentasResult.data ?? []) as unknown as CuentaRow[];

  if (!movimientos.length || !cuentas.length) {
    await seedDemoDataForUser(userId);
    await seedTesoreriaDemo(userId);

    const retryMov = await supabase
      .from("movimientos_tesoreria" as "almacenes")
      .select("*, cuentas_tesoreria(nombre, numero_cuenta)")
      .eq("user_id", userId)
      .order("fecha", { ascending: false })
      .limit(100);
    const retryCuentas = await supabase
      .from("cuentas_tesoreria" as "almacenes")
      .select("id, nombre, numero_cuenta, saldo_actual")
      .eq("user_id", userId);

    movimientos = (retryMov.data ?? []) as unknown as MovimientoRow[];
    cuentas = (retryCuentas.data ?? []) as unknown as CuentaRow[];
  }

  if (!movimientos.length) {
    return buildSnapshot(mockRecords, cuentas, cuentas.length ? "supabase" : "mock");
  }

  return buildSnapshot(movimientos.map(mapRowToRecord), cuentas, "supabase");
}

export {
  cajaBancosTabs,
  formatCajaAmount,
  getMovimientoEstadoStyles,
} from "@/lib/caja-bancos-mock-data";
