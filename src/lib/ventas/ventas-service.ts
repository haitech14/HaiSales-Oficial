import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { seedDemoDataForUser } from "@/lib/seed-demo";
import { calculateVentaTotals } from "@/lib/nueva-venta-types";
import {
  ventasKpis as staticKpis,
  ventasRecords as mockRecords,
  ventasTabs,
  type VentaDocumentType,
  type VentaRecord,
  type VentaSunatStatus,
} from "@/lib/ventas-mock-data";

type VentaRow = Database["public"]["Tables"]["ventas"]["Row"];

export type VentasSnapshot = {
  records: VentaRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

const TIPO_FROM_DB: Record<string, VentaDocumentType> = {
  factura: "Factura",
  boleta: "Boleta",
  nota_credito: "Nota de crédito",
};

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

function mapRowToVenta(row: VentaRow): VentaRecord {
  const { date, time } = formatDateParts(row.fecha, row.hora_emision);
  const seller = row.vendedor_nombre ?? "Sin asignar";
  return {
    id: row.id,
    date,
    time,
    documentType: TIPO_FROM_DB[row.tipo_comprobante] ?? "Factura",
    documentCode: row.codigo_comprobante ?? row.numero,
    client: row.cliente_nombre ?? "Cliente",
    ruc: row.cliente_ruc ?? "—",
    amount: Number(row.total),
    status: SUNAT_FROM_DB[row.estado_sunat] ?? "Pendiente",
    hasCdr: row.tiene_cdr,
    seller,
    sellerInitials: row.vendedor_iniciales ?? seller.slice(0, 2).toUpperCase(),
  };
}

function buildSnapshot(records: VentaRecord[], source: "supabase" | "mock"): VentasSnapshot {
  const facturas = records.filter((r) => r.documentType === "Factura").length;
  const boletas = records.filter((r) => r.documentType === "Boleta").length;
  const notas = records.filter((r) => r.documentType === "Nota de crédito").length;
  const pendientes = records.filter((r) => r.status === "Pendiente").length;
  const rechazados = records.filter((r) => r.status === "Rechazado").length;
  const totalFacturado = records.reduce((sum, r) => sum + r.amount, 0);

  const tabCounts: Record<string, number | null> = {
    todos: null,
    facturas,
    boletas,
    notas,
    pendientes,
    rechazados,
  };

  const kpis = staticKpis.map((kpi, index) => {
    if (index === 0) return { ...kpi, value: String(records.length || kpi.value) };
    if (index === 1) {
      return {
        ...kpi,
        value:
          totalFacturado > 0
            ? `S/ ${Math.round(totalFacturado).toLocaleString("es-PE")}`
            : kpi.value,
      };
    }
    if (index === 2) return { ...kpi, value: String(pendientes || kpi.value) };
    if (index === 3) return { ...kpi, value: String(rechazados || kpi.value) };
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

export async function fetchVentasSnapshot(userId: string | null): Promise<VentasSnapshot> {
  if (!userId) {
    return buildSnapshot(mockRecords, "mock");
  }

  const { data, error } = await supabase
    .from("ventas")
    .select("*")
    .eq("user_id", userId)
    .order("fecha", { ascending: false });

  if (error) {
    console.warn("[ventas] Error al cargar ventas:", error.message);
    return buildSnapshot(mockRecords, "mock");
  }

  if (!data || data.length === 0) {
    await seedDemoDataForUser(userId);
    const retry = await supabase
      .from("ventas")
      .select("*")
      .eq("user_id", userId)
      .order("fecha", { ascending: false });

    if (retry.error || !retry.data?.length) {
      return buildSnapshot(mockRecords, "mock");
    }
    data = retry.data;
  }

  return buildSnapshot(data.map(mapRowToVenta), "supabase");
}

const TIPO_TO_DB: Record<string, string> = {
  "Factura Electrónica (01)": "factura",
  "Boleta de Venta (03)": "boleta",
  "Nota de Crédito (07)": "nota_credito",
};

function parseFechaEmision(value: string) {
  const [day, month, year] = value.split("/");
  if (day && month && year) {
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return new Date().toISOString().slice(0, 10);
}

export async function createVentaFromForm(userId: string, form: import("@/lib/nueva-venta-types").NuevaVentaFormData) {
  const { subtotal, igv, total } = calculateVentaTotals(form.cantidad, form.precioUnitario);
  const numero = `VTA-${Date.now().toString().slice(-8)}`;
  const codigoComprobante = `${form.serie}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const tipo = TIPO_TO_DB[form.tipoComprobante] ?? "factura";

  const { data: venta, error } = await supabase
    .from("ventas")
    .insert({
      user_id: userId,
      numero,
      fecha: parseFechaEmision(form.fechaEmision),
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

  const { error: itemError } = await supabase.from("venta_items").insert({
    venta_id: venta.id,
    descripcion: form.producto || "Producto o servicio",
    cantidad: form.cantidad,
    precio_unitario: form.precioUnitario,
    subtotal,
  });

  if (itemError) {
    throw new Error(itemError.message);
  }

  return mapRowToVenta(venta);
}

export {
  formatCurrency,
  getDocumentTypeStyles,
  getSunatStatusStyles,
  ventasTabs,
} from "@/lib/ventas-mock-data";
