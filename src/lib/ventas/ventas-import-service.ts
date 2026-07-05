import { supabase } from "@/integrations/supabase/client";
import type { VentaReporteRow } from "@/lib/ventas/venta-report-import";

export type VentaImportSummary = {
  ventasInsertadas: number;
  ventasActualizadas: number;
  ventasOmitidas: number;
  cuentasCobrar: number;
  movimientosTesoreria: number;
  cuentasTesoreria: number;
  anulados: number;
};

type CuentaTesoreriaConfig = {
  nombre: string;
  tipo: "banco" | "caja";
  banco: string | null;
  moneda: string;
};

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SA";
}

function resolveCuentaTesoreria(nombreRaw: string): CuentaTesoreriaConfig | null {
  const nombre = nombreRaw.trim();
  if (!nombre || nombre === "-" || nombre.toUpperCase() === "CREDITO") {
    return null;
  }

  const upper = nombre.toUpperCase();
  const moneda = upper.includes("DOLAR") ? "USD" : "PEN";

  if (
    upper.includes("YAPE") ||
    upper.includes("PLIN") ||
    upper === "EFECTIVO" ||
    upper === "TARJETA" ||
    !upper.includes("BCP") &&
      !upper.includes("BBVA") &&
      !upper.includes("INTERBANK") &&
      !upper.includes("SCOTIA")
  ) {
    return { nombre, tipo: "caja", banco: null, moneda: "PEN" };
  }

  let banco: string | null = null;
  if (upper.includes("BCP")) banco = "BCP";
  else if (upper.includes("BBVA")) banco = "BBVA";
  else if (upper.includes("INTERBANK")) banco = "Interbank";
  else if (upper.includes("SCOTIA")) banco = "Scotiabank";

  return { nombre, tipo: "banco", banco, moneda };
}

function calcTotals(importeSoles: number, anulada: boolean) {
  const total = anulada ? 0 : importeSoles;
  const subtotal = total > 0 ? Math.round((total / 1.18) * 100) / 100 : 0;
  const igv = total > 0 ? Math.round((total - subtotal) * 100) / 100 : 0;
  return { subtotal, igv, total };
}

function mapTipoDb(tipo: VentaReporteRow["tipoComprobante"]): string {
  if (tipo === "boleta") return "boleta";
  if (tipo === "nota_credito") return "nota_credito";
  if (tipo === "nota_venta") return "nota_venta";
  return "factura";
}

function buildNotas(row: VentaReporteRow): string {
  const parts = [
    `Importado desde ${row.archivoOrigen}`,
    row.tipoComprobante === "orden" ? "Tipo legacy: Orden de venta" : null,
    row.formaPago ? `Forma de pago: ${row.formaPago}` : null,
    row.cuentaCobro ? `Cuenta: ${row.cuentaCobro}` : null,
    row.numeroOperacion ? `Operación: ${row.numeroOperacion}` : null,
    row.usuario ? `Usuario: ${row.usuario}` : null,
    row.tipoCambio ? `T.C: ${row.tipoCambio}` : null,
    row.moneda !== "PEN" ? `Moneda origen: ${row.moneda}` : null,
    row.anulada ? "Documento anulado en reporte legacy" : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export async function importVentaReporteRows(
  userId: string,
  rows: VentaReporteRow[],
): Promise<VentaImportSummary> {
  const summary: VentaImportSummary = {
    ventasInsertadas: 0,
    ventasActualizadas: 0,
    ventasOmitidas: 0,
    cuentasCobrar: 0,
    movimientosTesoreria: 0,
    cuentasTesoreria: 0,
    anulados: rows.filter((row) => row.anulada).length,
  };

  if (!rows.length) return summary;

  const codigos = rows.map((row) => row.codigoComprobante);
  const { data: existingVentas } = await supabase
    .from("ventas")
    .select("id, codigo_comprobante")
    .eq("user_id", userId)
    .in("codigo_comprobante", codigos);

  const existingMap = new Map(
    (existingVentas ?? []).map((venta) => [venta.codigo_comprobante, venta.id]),
  );

  const cuentaConfigs = new Map<string, CuentaTesoreriaConfig>();
  for (const row of rows) {
    const config = resolveCuentaTesoreria(row.cuentaCobro);
    if (config) cuentaConfigs.set(config.nombre, config);
  }

  const { data: existingCuentas } = await supabase
    .from("cuentas_tesoreria" as "almacenes")
    .select("id, nombre, saldo_actual")
    .eq("user_id", userId);

  const cuentaIdByName = new Map<string, { id: string; saldo: number }>();
  for (const cuenta of (existingCuentas ?? []) as Array<{ id: string; nombre: string; saldo_actual: number }>) {
    cuentaIdByName.set(cuenta.nombre, { id: cuenta.id, saldo: Number(cuenta.saldo_actual) });
  }

  for (const config of cuentaConfigs.values()) {
    if (cuentaIdByName.has(config.nombre)) continue;
    const { data, error } = await supabase
      .from("cuentas_tesoreria" as "almacenes")
      .insert({
        user_id: userId,
        nombre: config.nombre,
        tipo: config.tipo,
        banco: config.banco,
        moneda: config.moneda,
        saldo_actual: 0,
        activo: true,
      })
      .select("id, saldo_actual")
      .single();

    if (!error && data) {
      cuentaIdByName.set(config.nombre, {
        id: (data as { id: string }).id,
        saldo: Number((data as { saldo_actual: number }).saldo_actual),
      });
      summary.cuentasTesoreria += 1;
    }
  }

  const sortedRows = [...rows].sort((a, b) => a.fechaEmision.localeCompare(b.fechaEmision));
  const movimientoDocumentos = new Set<string>();

  for (const row of sortedRows) {
    const existingId = existingMap.get(row.codigoComprobante);
    const { subtotal, igv, total } = calcTotals(row.importeSoles, row.anulada);
    const hora = "12:00:00";
    const ventaPayload = {
      user_id: userId,
      numero: `LEG-${row.serie}-${row.numero}`,
      fecha: row.fechaEmision,
      hora_emision: hora,
      estado: row.anulada ? "anulada" : "confirmada",
      moneda: row.moneda,
      subtotal,
      igv,
      total,
      tipo_comprobante: mapTipoDb(row.tipoComprobante),
      codigo_comprobante: row.codigoComprobante,
      estado_sunat: row.anulada ? "rechazado" : "aceptado",
      vendedor_nombre: row.vendedor,
      vendedor_iniciales: initialsFromName(row.vendedor),
      cliente_nombre: row.cliente,
      cliente_ruc: row.ruc || null,
      notas: buildNotas(row),
      tiene_cdr: !row.anulada,
    };

    let ventaId = existingId ?? null;

    if (existingId) {
      const { error } = await supabase.from("ventas").update(ventaPayload).eq("id", existingId);
      if (error) {
        summary.ventasOmitidas += 1;
        continue;
      }
      summary.ventasActualizadas += 1;
    } else {
      const { data, error } = await supabase.from("ventas").insert(ventaPayload).select("id").single();
      if (error || !data) {
        summary.ventasOmitidas += 1;
        continue;
      }
      ventaId = data.id;
      summary.ventasInsertadas += 1;
      existingMap.set(row.codigoComprobante, data.id);

      await supabase.from("venta_items").insert({
        venta_id: data.id,
        descripcion: `${row.documento} · ${row.cliente}`,
        cantidad: 1,
        precio_unitario: subtotal,
        subtotal,
      });
    }

    if (!ventaId || row.anulada) continue;

    const cuentaConfig = resolveCuentaTesoreria(row.cuentaCobro);
    const esCredito = row.cuentaCobro.toUpperCase() === "CREDITO" || row.formaPago.toUpperCase() === "CREDITO";

    if (esCredito && total > 0) {
      const documentoCxC = row.codigoComprobante;
      const { data: existingCxC } = await supabase
        .from("cuentas_cobrar")
        .select("id")
        .eq("user_id", userId)
        .eq("documento", documentoCxC)
        .maybeSingle();

      if (!existingCxC) {
        const { error } = await supabase.from("cuentas_cobrar").insert({
          user_id: userId,
          venta_id: ventaId,
          documento: documentoCxC,
          fecha_emision: row.fechaEmision,
          fecha_vencimiento: row.fechaVencimiento,
          monto: total,
          saldo_pendiente: total,
          estado: "pendiente",
          notas: `Crédito importado · ${row.cliente}`,
        });
        if (!error) summary.cuentasCobrar += 1;
      }
      continue;
    }

    if (!cuentaConfig || total <= 0) continue;

    const cuenta = cuentaIdByName.get(cuentaConfig.nombre);
    if (!cuenta) continue;

    const movimientoKey = `${row.codigoComprobante}:${cuentaConfig.nombre}`;
    if (movimientoDocumentos.has(movimientoKey)) continue;

    const { data: existingMov } = await supabase
      .from("movimientos_tesoreria" as "almacenes")
      .select("id")
      .eq("user_id", userId)
      .eq("documento", row.codigoComprobante)
      .eq("cuenta_id", cuenta.id)
      .maybeSingle();

    if (existingMov) continue;

    const nuevoSaldo = cuenta.saldo + total;
    const { error: movError } = await supabase.from("movimientos_tesoreria" as "almacenes").insert({
      user_id: userId,
      cuenta_id: cuenta.id,
      tipo: "ingreso",
      documento: row.codigoComprobante,
      concepto: `Cobro ${row.documento} · ${row.cliente}`,
      monto_ingreso: total,
      monto_egreso: null,
      saldo_posterior: nuevoSaldo,
      estado: "conciliado",
      responsable_nombre: row.vendedor,
      responsable_iniciales: initialsFromName(row.vendedor),
      fecha: row.fechaEmision,
      hora,
    });

    if (!movError) {
      cuenta.saldo = nuevoSaldo;
      cuentaIdByName.set(cuentaConfig.nombre, cuenta);
      movimientoDocumentos.add(movimientoKey);
      summary.movimientosTesoreria += 1;

      await supabase
        .from("cuentas_tesoreria" as "almacenes")
        .update({ saldo_actual: nuevoSaldo })
        .eq("id", cuenta.id);
    }
  }

  return summary;
}
