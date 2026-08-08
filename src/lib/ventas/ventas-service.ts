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
  mapDbTipoToForm,
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
      cliente_id: form.clienteId?.trim() || null,
      cliente_nombre: form.cliente,
      cliente_ruc: form.clienteRuc || null,
      notas: [
        form.observacionGeneral?.trim() ? `Obs: ${form.observacionGeneral.trim()}` : null,
        form.oportunidad?.trim() ? `Oportunidad: ${form.oportunidad.trim()}` : null,
        form.tipoCliente?.trim() ? `Tipo cliente: ${form.tipoCliente.trim()}` : null,
        form.contacto?.trim() ? `Contacto: ${form.contacto.trim()}` : null,
        form.celular?.trim() ? `Celular: ${form.celular.trim()}` : null,
        form.direccion?.trim() ? `Dirección: ${form.direccion.trim()}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || null,
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
  const baseDescripcion = line.producto || "Producto o servicio";
  const descripcion = line.observaciones?.trim()
    ? `${baseDescripcion} — ${line.observaciones.trim()}`
    : baseDescripcion;

  // IDs del catálogo Haitech/soporte no existen en public.productos.
  // Solo usar productoId si es UUID local válido; si no, resolver por SKU/nombre.
  const productoId = await resolveLocalProductoIdForLine(userId, line, baseDescripcion);

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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveLocalProductoIdForLine(
  userId: string,
  line: VentaCartLine,
  descripcion: string,
): Promise<string | null> {
  const candidate = line.productoId?.trim() || "";
  if (candidate && isUuid(candidate)) {
    const { data } = await supabase
      .from("productos")
      .select("id")
      .eq("user_id", userId)
      .eq("id", candidate)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return resolveProductoIdForVenta(userId, descripcion, line.productoCodigo || null);
}

export type VentaRecoveryListItem = {
  id: string;
  codigo: string;
  fecha: string;
  cliente: string;
  clienteRuc: string;
  total: number;
  moneda: string;
  tipoComprobante: string;
  vendedor: string;
};

export type VentaRecoveryDetail = {
  venta: VentaRecoveryListItem;
  clienteNombre: string;
  clienteRuc: string;
  tipoComprobanteForm: string;
  serie: string;
  moneda: "PEN" | "USD";
  fechaEmision: string;
  vendedor: string;
  vendedorInitials: string;
  formaPago: string;
  observacionGeneral: string;
  tipoCliente: string;
  items: Array<{
    producto: string;
    productoCodigo: string;
    productoId: string | null;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    observaciones: string;
  }>;
};

function formatFechaEmisionFromIso(iso: string): string {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function splitSerieFromCodigo(codigo: string | null | undefined): string {
  if (!codigo) return "";
  const match = codigo.match(/^([A-Za-z0-9]+)-/);
  return match?.[1] ?? "";
}

function parseNotasMeta(notas: string | null | undefined) {
  const text = notas ?? "";
  const formaPago = text.match(/Forma de pago:\s*([^·]+)/i)?.[1]?.trim() ?? "";
  const observacionGeneral = text.match(/Obs:\s*([^·]+)/i)?.[1]?.trim() ?? "";
  const tipoCliente = text.match(/Tipo cliente:\s*([^·]+)/i)?.[1]?.trim() ?? "";
  return { formaPago, observacionGeneral, tipoCliente };
}

function splitProductoObservacion(descripcion: string): { producto: string; observaciones: string } {
  const parts = descripcion.split(" — ");
  if (parts.length < 2) return { producto: descripcion, observaciones: "" };
  return {
    producto: parts[0]?.trim() || descripcion,
    observaciones: parts.slice(1).join(" — ").trim(),
  };
}

function buildVendedorInitialsFallback(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export async function searchVentasForRecovery(
  userId: string | null,
  query: string,
  limit = 12,
): Promise<VentaRecoveryListItem[]> {
  if (!userId) return [];

  const trimmed = query.trim().replace(/[%_,]/g, " ");
  let request = supabase
    .from("ventas")
    .select(
      "id, codigo_comprobante, numero, fecha, cliente_nombre, cliente_ruc, total, moneda, tipo_comprobante, vendedor_nombre",
    )
    .eq("user_id", userId)
    .order("fecha", { ascending: false })
    .limit(limit);

  if (trimmed) {
    const pattern = `%${trimmed}%`;
    request = request.or(
      [
        `codigo_comprobante.ilike.${pattern}`,
        `numero.ilike.${pattern}`,
        `cliente_nombre.ilike.${pattern}`,
        `cliente_ruc.ilike.${pattern}`,
      ].join(","),
    );
  }

  const { data, error } = await request;
  if (error) {
    console.warn("[ventas] search recovery:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    codigo: row.codigo_comprobante || row.numero,
    fecha: formatFechaEmisionFromIso(row.fecha),
    cliente: row.cliente_nombre ?? "Cliente",
    clienteRuc: row.cliente_ruc ?? "",
    total: Number(row.total) || 0,
    moneda: row.moneda || "PEN",
    tipoComprobante: row.tipo_comprobante,
    vendedor: row.vendedor_nombre ?? "",
  }));
}

export async function fetchVentaForRecovery(
  userId: string,
  ventaId: string,
): Promise<VentaRecoveryDetail | null> {
  const { data: venta, error } = await supabase
    .from("ventas")
    .select("*")
    .eq("user_id", userId)
    .eq("id", ventaId)
    .maybeSingle();

  if (error || !venta) {
    console.warn("[ventas] fetch recovery:", error?.message);
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("venta_items")
    .select("descripcion, cantidad, precio_unitario, producto_id, productos(sku, unidad)")
    .eq("venta_id", ventaId)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.warn("[ventas] fetch recovery items:", itemsError.message);
  }

  const notasMeta = parseNotasMeta(venta.notas);
  const listItem: VentaRecoveryListItem = {
    id: venta.id,
    codigo: venta.codigo_comprobante || venta.numero,
    fecha: formatFechaEmisionFromIso(venta.fecha),
    cliente: venta.cliente_nombre ?? "Cliente",
    clienteRuc: venta.cliente_ruc ?? "",
    total: Number(venta.total) || 0,
    moneda: venta.moneda || "PEN",
    tipoComprobante: venta.tipo_comprobante,
    vendedor: venta.vendedor_nombre ?? "",
  };

  return {
    venta: listItem,
    clienteNombre: venta.cliente_nombre ?? "",
    clienteRuc: venta.cliente_ruc ?? "",
    tipoComprobanteForm: mapDbTipoToForm(venta.tipo_comprobante),
    serie: splitSerieFromCodigo(venta.codigo_comprobante) || splitSerieFromCodigo(venta.numero),
    moneda: venta.moneda === "USD" ? "USD" : "PEN",
    fechaEmision: formatFechaEmisionFromIso(venta.fecha),
    vendedor: venta.vendedor_nombre ?? "",
    vendedorInitials: venta.vendedor_iniciales ?? buildVendedorInitialsFallback(venta.vendedor_nombre),
    formaPago: notasMeta.formaPago || "Contado",
    observacionGeneral: notasMeta.observacionGeneral,
    tipoCliente: notasMeta.tipoCliente || "Público",
    items: (items ?? []).map((item) => {
      const productoRel = item.productos as { sku: string | null; unidad: string | null } | null;
      const split = splitProductoObservacion(item.descripcion);
      return {
        producto: split.producto,
        productoCodigo: productoRel?.sku ?? "",
        productoId: item.producto_id,
        cantidad: Number(item.cantidad) || 1,
        unidad: productoRel?.unidad ?? "UND",
        precioUnitario: Number(item.precio_unitario) || 0,
        observaciones: split.observaciones,
      };
    }),
  };
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
