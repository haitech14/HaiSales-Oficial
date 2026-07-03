import type { GuiaRemision } from "@/lib/logistica/types";

export type RotuloEnvioData = {
  codigoGuia: string;
  fecha: string;
  destinatario: string;
  ruc: string;
  contacto: string;
  telefono: string;
  direccion: string;
  sucursal: string;
  conductor: string;
  placa: string;
  bultos: string;
  peso: string;
  comprobante: string;
  observacion: string;
};

const REMITENTE = {
  razonSocial: "HAI SALES TECHNOLOGY S.A.C.",
  ruc: "20601234567",
  direccion: "Av. Petit Thouars Nro - LINCE - LIMA - LIMA",
  telefono: "+51 1 456 7890",
};

export function extractContactFromObservacion(observacion: string | null | undefined): {
  contacto: string;
  telefono: string;
  dni: string;
} {
  if (!observacion?.trim()) {
    return { contacto: "—", telefono: "—", dni: "—" };
  }

  const dniMatch =
    observacion.match(/(?:\/\/\s*DNI\s*:?\s*|(?:\s+con\s+)?DNI\s*:?\s*)([\d\s]{8,11})/i);
  const dniDigits = dniMatch?.[1]?.replace(/\s+/g, "") ?? "";
  const dni = dniDigits.length >= 8 ? dniDigits : "—";

  let contacto = "—";
  const atencionMatch = observacion.match(
    /Atenci[oó]n(?:\s+a)?\s*:?\s*(.+?)(?:\/\/\s*DNI|\s+con\s+DNI|\s*CEL\b|\s*CEL\s*:|$)/i,
  );

  if (atencionMatch?.[1]) {
    contacto = atencionMatch[1].replace(/\s*\/\/\s*$/g, "").trim();
  } else {
    const beforeDni = observacion.split(/\/\/\s*DNI/i)[0];
    if (beforeDni && beforeDni !== observacion) {
      contacto = beforeDni
        .replace(/^.*Atenci[oó]n(?:\s+a)?\s*:?\s*/i, "")
        .replace(/^[A-Z]\d{3}-\d+[^/]*?-\s*/i, "")
        .replace(/\s*\/\/\s*$/g, "")
        .trim();
    }
  }

  if (contacto === "—" || !contacto) {
    const split = splitEmbeddedDni(observacion);
    if (split.contacto !== "—") contacto = split.contacto;
    if (dni === "—" && split.dni !== "—") {
      return { contacto, telefono: extractTelefono(observacion), dni: split.dni };
    }
  }

  return {
    contacto: contacto || "—",
    telefono: extractTelefono(observacion),
    dni,
  };
}

function extractTelefono(observacion: string): string {
  const celMatch =
    observacion.match(/CEL\s*:?\s*([\d\s-]+)/i) ??
    observacion.match(/cel\.?\s*:?\s*([\d\s-]+)/i);
  return celMatch?.[1]?.replace(/\s+/g, " ").trim() || "—";
}

export function splitEmbeddedDni(value: string): { contacto: string; dni: string } {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "—") {
    return { contacto: "—", dni: "—" };
  }

  const slashMatch = trimmed.match(/^(.+?)\s*\/\/\s*DNI\s*:?\s*([\d\s]{8,11})\s*$/i);
  if (slashMatch) {
    return {
      contacto: slashMatch[1].trim() || "—",
      dni: slashMatch[2].replace(/\s+/g, ""),
    };
  }

  const conDniMatch = trimmed.match(/^(.+?)\s+con\s+DNI\s*:?\s*([\d\s]{8,11})/i);
  if (conDniMatch) {
    return {
      contacto: conDniMatch[1].trim() || "—",
      dni: conDniMatch[2].replace(/\s+/g, ""),
    };
  }

  return { contacto: trimmed, dni: "—" };
}

export function buildRotuloEnvioData(guia: GuiaRemision): RotuloEnvioData {
  return {
    codigoGuia: guia.codigoGuia,
    fecha: guia.fecha,
    destinatario: guia.destinatario,
    ruc: guia.ruc,
    contacto: guia.contacto,
    telefono: guia.telefono,
    direccion: guia.direccionDestino,
    sucursal: guia.sucursal,
    conductor: guia.conductor,
    placa: guia.placa ?? "—",
    bultos: guia.bultos != null ? String(guia.bultos) : "—",
    peso: guia.pesoTotal != null ? `${guia.pesoTotal} kg` : "—",
    comprobante: guia.comprobanteRelacionado ?? "—",
    observacion: guia.observacion ?? "—",
  };
}

function displayCopyValue(value: string | null | undefined): string {
  if (!value || value === "—") return "";
  return value.trim();
}

export function shortenAgencia(conductor: string): string {
  const normalized = conductor.toLowerCase();
  if (normalized.includes("shalom")) return "Shalom";
  if (normalized.includes("flores")) return "Flores";
  if (normalized.includes("chan chan")) return "Chan Chan";
  if (normalized.includes("turismo dias")) return "Turismo Días";
  if (!conductor || conductor === "—") return "";
  const firstWord = conductor.split(/\s+/)[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

export function parseDireccionEnvio(direccion: string): { direccion: string; destino: string } {
  if (!direccion || direccion === "—") {
    return { direccion: "", destino: "" };
  }

  const parts = direccion.split(/\s*-\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const ciudad = parts[1];
    return { direccion: ciudad, destino: ciudad };
  }

  return { direccion: direccion.trim(), destino: direccion.trim() };
}

export function formatPedidoLine(
  descripcion: string,
  cantidad: number,
  precioUnitario?: number | null,
  subtotal?: number | null,
): string {
  const qty = Number.isInteger(cantidad) ? String(cantidad) : String(cantidad);
  if (precioUnitario != null && subtotal != null) {
    const unit = Math.round(Number(precioUnitario));
    const total = Math.round(Number(subtotal));
    return `- - ${descripcion} S/ ${unit} X${qty} = S/ ${total}`;
  }
  return `- - ${descripcion} X${qty}`;
}

export type EnvioWhatsAppInput = {
  fecha: string;
  destinatario: string;
  ruc: string;
  direccion: string;
  destino: string;
  agencia: string;
  contacto: string;
  dni: string;
  telefono: string;
  pedidoLines: string[];
};

export function buildEnvioWhatsAppText(input: EnvioWhatsAppInput): string {
  return [
    `🗓️ ${displayCopyValue(input.fecha)}`,
    "🙋 *Datos de Envio:*",
    `_*Razón Social:* ${displayCopyValue(input.destinatario)}_`,
    `_*Ruc:* ${displayCopyValue(input.ruc)}_`,
    `_*Dirección:* ${displayCopyValue(input.direccion)}_`,
    `_*Destino:* ${displayCopyValue(input.destino)}_`,
    `_*Agencia:* ${displayCopyValue(input.agencia)}_`,
    `_*Atención:* ${displayCopyValue(input.contacto)}_`,
    `_*DNI:* ${displayCopyValue(input.dni)} _  / _*Cel:* ${displayCopyValue(input.telefono)}_`,
    "",
    "📕 _*Pedido:* _",
    ...input.pedidoLines,
  ].join("\n");
}

export function buildEnvioWhatsAppFromGuia(
  guia: GuiaRemision,
  pedidoLines: string[],
): string {
  const { direccion, destino } = parseDireccionEnvio(guia.direccionDestino);

  return buildEnvioWhatsAppText({
    fecha: guia.fecha,
    destinatario: guia.destinatario,
    ruc: guia.ruc,
    direccion: guia.direccionDestino,
    destino,
    agencia: shortenAgencia(guia.conductor),
    contacto: guia.contacto,
    dni: guia.dni,
    telefono: guia.telefono,
    pedidoLines,
  });
}

export function buildRotuloPlainText(data: RotuloEnvioData): string {
  return [
    "RÓTULO DE ENVÍO",
    "================",
    "",
    "REMITENTE",
    REMITENTE.razonSocial,
    `RUC: ${REMITENTE.ruc}`,
    REMITENTE.direccion,
    `Tel: ${REMITENTE.telefono}`,
    "",
    "DESTINATARIO",
    data.destinatario,
    `RUC: ${data.ruc}`,
    `Contacto: ${data.contacto}`,
    `Teléfono: ${data.telefono}`,
    `Dirección: ${data.direccion}`,
    "",
    "DATOS DEL ENVÍO",
    `Guía: ${data.codigoGuia}`,
    `Fecha: ${data.fecha}`,
    `Sucursal: ${data.sucursal}`,
    `Comprobante: ${data.comprobante}`,
    `Bultos: ${data.bultos}`,
    `Peso: ${data.peso}`,
    `Conductor: ${data.conductor}`,
    `Placa: ${data.placa}`,
    data.observacion !== "—" ? `Observación: ${data.observacion}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export { REMITENTE };
