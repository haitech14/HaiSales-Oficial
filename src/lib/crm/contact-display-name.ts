const GENERIC_NAME =
  /^(lead|contacto|conversaci[oó]n)(\s+(whatsapp|facebook|instagram|messenger))?$/i;

export function looksLikePhone(value?: string | null): boolean {
  const text = value?.trim() ?? "";
  if (!text || text === "—") return false;
  const compact = text.replace(/\s/g, "");
  const digits = compact.replace(/\D/g, "");
  return digits.length >= 7 && digits.length / Math.max(compact.length, 1) >= 0.7;
}

export function formatContactPhone(value?: string | null): string | undefined {
  const raw = value?.trim();
  if (!raw || raw === "—" || !looksLikePhone(raw)) return undefined;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return `+${digits}`;
  return digits.length >= 10 ? `+${digits}` : raw;
}

export function phoneFromLeadCodigo(codigo: string): string | undefined {
  if (!codigo.startsWith("WA-")) return undefined;
  const digits = codigo.slice(3).replace(/\D/g, "");
  if (digits.length < 6) return undefined;
  return formatContactPhone(`+${digits}`);
}

export function resolveContactPhone(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const value of candidates) {
    const formatted = formatContactPhone(value);
    if (formatted) return formatted;
  }
  return undefined;
}

export function isHumanContactName(value?: string | null): boolean {
  const text = value?.trim() ?? "";
  if (!text || text === "—" || GENERIC_NAME.test(text)) return false;

  const compact = text.replace(/\s/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length >= 7 && digits.length / Math.max(compact.length, 1) >= 0.7) {
    return false;
  }

  return /[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]/.test(text);
}

/** Prioriza nombre guardado / usuario de WhatsApp frente al número. */
export function pickHumanContactName(
  ...candidates: Array<string | null | undefined>
): string {
  for (const value of candidates) {
    if (isHumanContactName(value)) return value!.trim();
  }
  return "";
}

export function buildOwnerInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function isPlaceholderOwner(name?: string | null): boolean {
  const text = (name ?? "").trim();
  if (!text || text === "—" || text === "SA") return true;
  if (/^(sin asignar|usuario)$/i.test(text)) return true;
  if (/whatsapp|facebook|instagram|messenger|zavu/i.test(text)) return true;
  return looksLikePhone(text);
}

export function resolveOwnerName(name: string | undefined, fallback: string): string {
  return isPlaceholderOwner(name) ? fallback : name!.trim();
}
