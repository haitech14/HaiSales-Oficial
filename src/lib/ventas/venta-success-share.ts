import {
  calculateCartTotals,
  formatVentaCurrency,
  resolveVentaLineItems,
  type NuevaVentaFormData,
} from "@/lib/nueva-venta-types";

/** Normaliza celular peruano a dígitos internacionales (51…). */
export function toWhatsAppPhone(celular: string): string | null {
  const digits = celular.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("51") && digits.length >= 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `51${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppMeLink(celular: string, text?: string): string | null {
  const phone = toWhatsAppPhone(celular);
  if (!phone) return null;
  const base = `https://wa.me/${phone}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function buildVentaClienteShareText(form: NuevaVentaFormData): string {
  const lines = resolveVentaLineItems(form);
  const { total } = calculateCartTotals(lines);
  const waLink = buildWhatsAppMeLink(form.celular);
  const productoLines = lines.map(
    (line) =>
      `• ${line.producto}${line.productoCodigo ? ` (${line.productoCodigo})` : ""} × ${line.cantidad} = ${formatVentaCurrency(line.cantidad * line.precioUnitario, form.moneda)}`,
  );

  const blocks = [
    "✅ ¡Venta registrada con éxito!",
    "",
    "👤 *Datos del cliente*",
    `*Razón social:* ${form.cliente || "—"}`,
    `*RUC:* ${form.clienteRuc || "—"}`,
    `*Contacto:* ${form.contacto || "—"}`,
    `*Celular:* ${form.celular || "—"}`,
    `*Dirección:* ${form.direccion || "—"}`,
    `*Tipo de cliente:* ${form.tipoCliente || "—"}`,
    "",
    "🧾 *Comprobante*",
    `*Tipo:* ${form.tipoComprobante}`,
    `*Serie:* ${form.serie}`,
    `*Fecha:* ${form.fechaEmision}`,
    `*Forma de pago:* ${form.formaPago}`,
    `*Total:* ${formatVentaCurrency(total, form.moneda)}`,
    "",
    "📦 *Productos*",
    ...(productoLines.length > 0 ? productoLines : ["• —"]),
  ];

  if (form.observacionGeneral?.trim()) {
    blocks.push("", `📝 *Obs:* ${form.observacionGeneral.trim()}`);
  }

  blocks.push(
    "",
    waLink ? `💬 WhatsApp cliente:\n${waLink}` : "💬 WhatsApp: (sin celular)",
  );

  return blocks.join("\n");
}
