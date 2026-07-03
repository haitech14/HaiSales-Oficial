import { supabase } from "@/integrations/supabase/client";
import { importGuiasLegacyFromDatabase } from "@/lib/logistica/guias-import-service";
import {
  buildEnvioWhatsAppFromGuia,
  extractContactFromObservacion,
  formatPedidoLine,
  splitEmbeddedDni,
} from "@/lib/logistica/rotulo-utils";
import type { GuiaEditableField, GuiaRemision, GuiaRemisionDetail, GuiaRemisionItem } from "@/lib/logistica/types";

type GuiaRow = {
  id: string;
  codigo_guia: string;
  fecha_emision: string;
  fecha_traslado: string;
  motivo_traslado: string;
  sucursal: string | null;
  destinatario_ruc: string | null;
  destinatario_nombre: string;
  direccion_destino: string | null;
  conductor_nombre: string | null;
  placa: string | null;
  bultos: number | null;
  peso_total: number | null;
  comprobante_relacionado: string | null;
  observacion: string | null;
  estado: string;
  periodo_mes: string;
  created_at: string;
  guia_remision_items?: Array<{
    id: string;
    codigo: string | null;
    descripcion: string;
    cantidad: number;
    unidad: string;
    peso_unitario: number | null;
  }>;
};

const ESTADO_FROM_DB: Record<string, GuiaRemision["estado"]> = {
  emitida: "Emitida",
  en_transito: "En tránsito",
  entregada: "Entregada",
  anulada: "Anulada",
};

function formatDateParts(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return {
    fecha: date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function mapGuiaRow(row: GuiaRow, itemsCount = 0): GuiaRemision {
  const { fecha, hora } = formatDateParts(row.fecha_emision);
  const traslado = formatDateParts(row.fecha_traslado).fecha;
  const parsed = extractContactFromObservacion(row.observacion);
  return {
    id: row.id,
    codigoGuia: row.codigo_guia,
    fecha,
    hora,
    fechaTraslado: traslado,
    motivoTraslado: row.motivo_traslado.replace(/_/g, " "),
    destinatario: row.destinatario_nombre,
    ruc: row.destinatario_ruc ?? "—",
    contacto: parsed.contacto,
    telefono: parsed.telefono,
    dni: parsed.dni,
    sucursal: row.sucursal ?? "—",
    direccionDestino: row.direccion_destino ?? "—",
    observacion: row.observacion,
    conductor: row.conductor_nombre ?? "—",
    placa: row.placa,
    bultos: row.bultos,
    pesoTotal: row.peso_total != null ? Number(row.peso_total) : null,
    comprobanteRelacionado: row.comprobante_relacionado,
    estado: ESTADO_FROM_DB[row.estado] ?? "Emitida",
    periodoMes: row.periodo_mes,
    itemsCount,
  };
}

async function enrichGuiasWithClienteData(
  userId: string,
  guias: GuiaRemision[],
): Promise<GuiaRemision[]> {
  const rucs = [...new Set(guias.map((guia) => guia.ruc).filter((ruc) => ruc && ruc !== "—"))];
  if (!rucs.length) return guias;

  const { data } = await supabase
    .from("clientes")
    .select("ruc, contacto_nombre, telefono")
    .eq("user_id", userId)
    .in("ruc", rucs);

  const clienteMap = new Map(
    (data ?? []).map((cliente) => [cliente.ruc, cliente]),
  );

  return guias.map((guia) => {
    const cliente = clienteMap.get(guia.ruc);
    if (!cliente) return guia;

    return {
      ...guia,
      ...((): Pick<GuiaRemision, "contacto" | "dni" | "telefono"> => {
        const contactoNombre =
          guia.contacto !== "—" ? guia.contacto : cliente.contacto_nombre ?? "—";
        const split = splitEmbeddedDni(contactoNombre);
        return {
          contacto: split.contacto,
          dni: guia.dni !== "—" ? guia.dni : split.dni,
          telefono: guia.telefono !== "—" ? guia.telefono : cliente.telefono ?? "—",
        };
      })(),
    };
  });
}

export async function fetchGuiasRemision(userId: string | null): Promise<GuiaRemision[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("guias_remision" as "productos")
    .select("*, guia_remision_items(id)")
    .eq("user_id", userId)
    .order("fecha_emision", { ascending: false });

  if (error) {
    console.warn("[guias] Error al cargar guías:", error.message);
    return [];
  }

  return enrichGuiasWithClienteData(
    userId,
    ((data ?? []) as GuiaRow[]).map((row) =>
      mapGuiaRow(row, row.guia_remision_items?.length ?? 0),
    ),
  );
}

export async function fetchGuiaRemisionDetail(
  guiaId: string,
  userId: string | null,
): Promise<GuiaRemisionDetail | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("guias_remision" as "productos")
    .select("*, guia_remision_items(*)")
    .eq("user_id", userId)
    .eq("id", guiaId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as GuiaRow;
  const items: GuiaRemisionItem[] = (row.guia_remision_items ?? []).map((item) => ({
    id: item.id,
    codigo: item.codigo,
    descripcion: item.descripcion,
    cantidad: Number(item.cantidad),
    unidad: item.unidad,
    pesoUnitario: item.peso_unitario != null ? Number(item.peso_unitario) : null,
  }));

  return {
    ...(await enrichGuiasWithClienteData(userId, [mapGuiaRow(row, items.length)]))[0],
    items,
    direccionPartida: null,
    createdAt: row.created_at,
  };
}

export async function fetchGuiasSnapshot(userId: string | null): Promise<{
  guias: GuiaRemision[];
  autoImported: boolean;
}> {
  let guias = await fetchGuiasRemision(userId);
  let autoImported = false;

  if (userId && guias.length === 0) {
    try {
      const count = await importGuiasLegacyFromDatabase(userId);
      if (count > 0) {
        guias = await fetchGuiasRemision(userId);
        autoImported = true;
      }
    } catch (error) {
      console.warn("[guias] Auto-import legacy omitido:", error);
    }
  }

  return { guias, autoImported };
}

export function getGuiaEstadoStyles(estado: GuiaRemision["estado"]) {
  switch (estado) {
    case "Emitida":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "En tránsito":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Entregada":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Anulada":
      return "border-slate-200 bg-slate-100 text-slate-500";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function formatMotivoTraslado(motivo: string) {
  return motivo
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const ESTADO_TO_DB: Record<GuiaRemision["estado"], string> = {
  Emitida: "emitida",
  "En tránsito": "en_transito",
  Entregada: "entregada",
  Anulada: "anulada",
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "—" ? null : trimmed;
}

function buildGuiaUpdatePayload(field: GuiaEditableField, value: string) {
  switch (field) {
    case "sucursal":
      return { sucursal: emptyToNull(value) };
    case "destinatario":
      return { destinatario_nombre: value.trim() === "" || value === "—" ? "Sin destinatario" : value.trim() };
    case "ruc":
      return { destinatario_ruc: emptyToNull(value) };
    case "conductor":
      return { conductor_nombre: emptyToNull(value) };
    case "placa":
      return { placa: emptyToNull(value) };
    case "comprobante":
      return { comprobante_relacionado: emptyToNull(value) };
    case "estado":
      return { estado: ESTADO_TO_DB[value as GuiaRemision["estado"]] ?? "emitida" };
    default:
      return {};
  }
}

export async function fetchPedidoLinesForGuia(
  userId: string,
  guia: GuiaRemision,
): Promise<string[]> {
  const detail = await fetchGuiaRemisionDetail(guia.id, userId);

  if (guia.comprobanteRelacionado) {
    const { data: venta } = await supabase
      .from("ventas")
      .select("id, venta_items(descripcion, cantidad, precio_unitario, subtotal)")
      .eq("user_id", userId)
      .eq("codigo_comprobante", guia.comprobanteRelacionado)
      .maybeSingle();

    const ventaItems = (venta?.venta_items ?? []) as Array<{
      descripcion: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }>;

    if (ventaItems.length > 0) {
      return ventaItems.map((item) =>
        formatPedidoLine(
          item.descripcion,
          Number(item.cantidad),
          Number(item.precio_unitario),
          Number(item.subtotal),
        ),
      );
    }
  }

  const guiaItems = detail?.items ?? [];
  if (guiaItems.length > 0) {
    return guiaItems.map((item) =>
      formatPedidoLine(item.descripcion, item.cantidad),
    );
  }

  return [];
}

export async function buildEnvioWhatsAppCopyText(
  userId: string,
  guia: GuiaRemision,
): Promise<string> {
  const pedidoLines = await fetchPedidoLinesForGuia(userId, guia);
  return buildEnvioWhatsAppFromGuia(guia, pedidoLines);
}

export async function updateGuiaRemisionField(
  userId: string,
  guiaId: string,
  field: GuiaEditableField,
  value: string,
): Promise<void> {
  const payload = {
    ...buildGuiaUpdatePayload(field, value),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("guias_remision" as "productos")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", guiaId);

  if (error) {
    throw new Error(error.message);
  }
}
