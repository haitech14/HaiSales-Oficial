import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { withRealKpi } from "@/lib/kpi-utils";
import {
  ventasKpis as staticKpis,
  ventasTabs,
  type VentaDocumentType,
  type VentaRecord,
  type VentaSunatStatus,
} from "@/lib/ventas-mock-data";
import { normalizeFechaIso, resolvePeriodMonth } from "@/lib/ventas/ventas-period-utils";
import {
  registerVentaItemStockMovement,
  resolveProductoIdForVenta,
} from "@/lib/inventario/ventas-productos-sync";
import {
  calculateCartTotals,
  resolveVentaLineItems,
  type VentaCartLine,
} from "@/lib/nueva-venta-types";

type VentaRow = Database["public"]["Tables"]["ventas"]["Row"];

export type VentasSnapshot = {
  records: VentaRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

import {
  mapDbTipoToDisplay,
  mapFormTipoToDb,
} from "@/lib/ventas/comprobantes";

const SUNAT_FROM_DB: Record<string, VentaSunatStatus> = {
  aceptado: "Aceptado",
  pendiente: "Pendiente",
  rechazado: "Rechazado",
};

function formatDateParts(iso: string, hora?: string | null) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return {
    date: date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: hora ?? date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function periodMonthFromIso(iso: string, notas?: string | null): string {
  return resolvePeriodMonth(iso, notas);
}

function extractPaymentMeta(notas?: string | null) {
  const formaPago = notas?.match(/Forma de pago: ([^·]+)/)?.[1]?.trim();
  const cuentaCobro = notas?.match(/Cuenta: ([^·]+)/)?.[1]?.trim();
  return { formaPago, cuentaCobro };
}

function mapRowToVenta(row: VentaRow): VentaRecord {
  const fechaIso = normalizeFechaIso(row.fecha);
  const { date, time } = formatDateParts(fechaIso, row.hora_emision);
  const seller = row.vendedor_nombre ?? "Sin asignar";
  const paymentMeta = extractPaymentMeta(row.notas);
  return {
    id: row.id,
    date,
    time,
    documentType: mapDbTipoToDisplay(row.tipo_comprobante),
    documentCode: row.codigo_comprobante ?? row.numero,
    client: row.cliente_nombre ?? "Cliente",
    ruc: row.cliente_ruc ?? "—",
    amount: Number(row.total),
    status: SUNAT_FROM_DB[row.estado_sunat] ?? "Pendiente",
    businessStatus: row.estado === "anulada" ? "Anulada" : "Activa",
    periodMonth: periodMonthFromIso(fechaIso, row.notas),
    formaPago: paymentMeta.formaPago,
    cuentaCobro: paymentMeta.cuentaCobro,
    hasCdr: row.tiene_cdr,
    seller,
    sellerInitials: row.vendedor_iniciales ?? seller.slice(0, 2).toUpperCase(),
    fechaIso,
  };
}

export function buildVentasSnapshotFromRecords(records: VentaRecord[]): VentasSnapshot {
  return buildSnapshot(records, "supabase");
}

function buildSnapshot(records: VentaRecord[], source: "supabase" | "mock"): VentasSnapshot {
  const facturas = records.filter((r) => r.documentType === "Factura").length;
  const boletas = records.filter((r) => r.documentType === "Boleta").length;
  const notasVenta = records.filter((r) => r.documentType === "Nota de venta").length;
  const notas = records.filter((r) => r.documentType === "Nota de crédito").length;
  const pendientes = records.filter((r) => r.status === "Pendiente").length;
  const rechazados = records.filter((r) => r.status === "Rechazado").length;
  const anulados = records.filter((r) => r.businessStatus === "Anulada").length;
  const totalFacturado = records
    .filter((r) => r.businessStatus !== "Anulada")
    .reduce((sum, r) => sum + r.amount, 0);

  const tabCounts: Record<string, number | null> = {
    todos: null,
    facturas,
    boletas,
    "notas-venta": notasVenta,
    notas,
    anulados,
    pendientes,
    rechazados,
  };

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return withRealKpi(kpi, String(records.length));
    if (index === 1) {
      return withRealKpi(
        kpi,
        totalFacturado > 0
          ? `S/ ${Math.round(totalFacturado).toLocaleString("es-PE")}`
          : "S/ 0",
      );
    }
    if (index === 2) return withRealKpi(kpi, String(pendientes));
    if (index === 3) return withRealKpi(kpi, String(rechazados));
    return kpi;
  });

  return {
    records,
    kpis,
    tabCounts,
    totalRecords: records.length,
    source,
  };
}

async function importLegacyVentasIfNeeded(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("import_ventas_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[ventas] Import legacy:", error.message);
    return false;
  }

  const ventasImported = typeof data === "number" && data > 0;
  await importVentaItemsLegacyIfNeeded(userId);
  return ventasImported;
}

export async function importVentaItemsLegacyIfNeeded(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("import_venta_items_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[ventas] Import ítems legacy:", error.message);
    return 0;
  }

  return typeof data === "number" ? data : 0;
}

export async function importVentaItemsLegacyFromDatabase(userId: string): Promise<number> {
  return importVentaItemsLegacyIfNeeded(userId);
}

export async function importVentasLegacyFromDatabase(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("import_ventas_legacy_for_user", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return typeof data === "number" ? data : 0;
}

export async function fetchVentasSnapshot(userId: string | null): Promise<VentasSnapshot> {
  if (!userId) {
    return buildSnapshot([], "supabase");
  }

  const { data, error } = await supabase
    .from("ventas")
    .select("*")
    .eq("user_id", userId)
    .order("fecha", { ascending: false });

  if (error) {
    console.warn("[ventas] Error al cargar ventas:", error.message);
    return buildSnapshot([], "supabase");
  }

  if (!data || data.length === 0) {
    const imported = await importLegacyVentasIfNeeded(userId);
    if (imported) {
      const retry = await supabase
        .from("ventas")
        .select("*")
        .eq("user_id", userId)
        .order("fecha", { ascending: false });

      if (!retry.error && retry.data?.length) {
        return buildSnapshot(retry.data.map(mapRowToVenta), "supabase");
      }
    }

    const itemsImported = await importVentaItemsLegacyIfNeeded(userId);
    if (itemsImported > 0) {
      const retry = await supabase
        .from("ventas")
        .select("*")
        .eq("user_id", userId)
        .order("fecha", { ascending: false });

      if (!retry.error && retry.data?.length) {
        return buildSnapshot(retry.data.map(mapRowToVenta), "supabase");
      }
    }

    return buildSnapshot([], "supabase");
  }

  await importVentaItemsLegacyIfNeeded(userId);

  const { data: refreshed, error: refreshError } = await supabase
    .from("ventas")
    .select("*")
    .eq("user_id", userId)
    .order("fecha", { ascending: false });

  if (!refreshError && refreshed?.length) {
    return buildSnapshot(refreshed.map(mapRowToVenta), "supabase");
  }

  return buildSnapshot(data.map(mapRowToVenta), "supabase");
}

function parseFechaEmision(value: string) {
  const [day, month, year] = value.split("/");
  if (day && month && year) {
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return new Date().toISOString().slice(0, 10);
}

export async function createVentaFromForm(userId: string, form: import("@/lib/nueva-venta-types").NuevaVentaFormData) {
  const lineItems = resolveVentaLineItems(form);
  if (lineItems.length === 0) {
    throw new Error("Agrega al menos un producto o servicio");
  }

  const { subtotal, igv, total } = calculateCartTotals(lineItems);
  const numero = `VTA-${Date.now().toString().slice(-8)}`;
  const codigoComprobante = `${form.serie}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const tipo = mapFormTipoToDb(form.tipoComprobante);
  const fechaMovimiento = parseFechaEmision(form.fechaEmision);

  const { data: venta, error } = await supabase
    .from("ventas")
    .insert({
      user_id: userId,
      numero,
      fecha: fechaMovimiento,
      estado: "confirmada",
      subtotal,
      igv,
      total,
      tipo_comprobante: tipo,
      codigo_comprobante: codigoComprobante,
      estado_sunat: "pendiente",
      vendedor_nombre: form.vendedor,
      vendedor_iniciales: form.vendedorInitials,
      cliente_nombre: form.cliente,
      cliente_ruc: form.clienteRuc || null,
      notas: form.oportunidad ? `Oportunidad: ${form.oportunidad}` : null,
    })
    .select("*")
    .single();

  if (error || !venta) {
    throw new Error(error?.message ?? "No se pudo registrar la venta");
  }

  for (const line of lineItems) {
    await insertVentaLineItem({
      userId,
      ventaId: venta.id,
      line,
      codigoComprobante,
      clienteNombre: form.cliente,
      fechaMovimiento,
    });
  }

  return mapRowToVenta(venta);
}

async function insertVentaLineItem({
  userId,
  ventaId,
  line,
  codigoComprobante,
  clienteNombre,
  fechaMovimiento,
}: {
  userId: string;
  ventaId: string;
  line: VentaCartLine;
  codigoComprobante: string;
  clienteNombre: string;
  fechaMovimiento: string;
}) {
  const lineSubtotal = line.cantidad * line.precioUnitario;
  const descripcion = line.producto || "Producto o servicio";
  const productoId =
    line.productoId ??
    (await resolveProductoIdForVenta(userId, descripcion, line.productoCodigo || null));

  const { error: itemError } = await supabase.from("venta_items").insert({
    venta_id: ventaId,
    producto_id: productoId,
    descripcion,
    cantidad: line.cantidad,
    precio_unitario: line.precioUnitario,
    subtotal: lineSubtotal,
  });

  if (itemError) {
    throw new Error(itemError.message);
  }

  if (productoId) {
    await registerVentaItemStockMovement({
      userId,
      productoId,
      cantidad: line.cantidad,
      documentoReferencia: codigoComprobante,
      clienteNombre,
      fechaMovimiento,
    });
  }
}

export {
  formatCurrency,
  formatPeriodMonth,
  formatPeriodMonthShort,
  getBusinessStatusStyles,
  getDocumentTypeStyles,
  getSunatStatusStyles,
  ventasTabs,
} from "@/lib/ventas-mock-data";
