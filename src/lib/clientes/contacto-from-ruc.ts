const COMPANY_PATTERN =
  /\b(s\.?\s*a\.?\s*c\.?|s\.?\s*a\.?\s*a\.?|s\.?\s*a\.?|s\.?\s*r\.?\s*l\.?|e\.?\s*i\.?\s*r\.?\s*l\.?|sociedad|asociaci[oó]n|municipalidad|gobierno|ministerio|universidad|instituto|colegio|empresa|inversiones|comercial|distribuidora|industrias?|corporaci[oó]n|consorcio|cooperativa|fundaci[oó]n|hospital|cl[ií]nica|constructora|servicios|group|holding|ltda?|eirl|sac|srl)\b/i;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function rucStartsWith(ruc: string | undefined, prefix: "10" | "20") {
  return digitsOnly(ruc ?? "").startsWith(prefix);
}

/** DNI peruano: 8 dígitos. El RUC tiene 11. */
export function isDniDocumento(value: string | undefined) {
  const digits = digitsOnly(value ?? "");
  return digits.length === 8;
}

export function extractDniDocumento(value: string | undefined) {
  return isDniDocumento(value) ? digitsOnly(value ?? "") : "";
}

export function displayRucDocumento(value: string | undefined) {
  const raw = value?.trim() ?? "";
  if (!raw || raw === "—" || isDniDocumento(raw)) return "—";
  return raw;
}

export function looksLikeCompanyName(razonSocial: string) {
  return COMPANY_PATTERN.test(razonSocial.trim());
}

export function looksLikePersonName(razonSocial: string) {
  const text = razonSocial.trim();
  if (!text || text === "—") return false;
  if (looksLikeCompanyName(text)) return false;
  if (/\d{4,}/.test(text)) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 6) return false;

  return words.every((word) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.'-]+$/.test(word));
}

function isBlankContacto(contacto: string | undefined) {
  const value = contacto?.trim() ?? "";
  return !value || value === "—";
}

/** RUC 10: copia la razón social a Contacto. RUC 20 con nombre de persona: usa ese nombre en Contacto. */
export function resolveClienteContacto(
  ruc: string | undefined,
  razonSocial: string | undefined,
  contacto: string | undefined,
) {
  if (!isBlankContacto(contacto)) return contacto!.trim();

  const name = razonSocial?.trim() ?? "";
  if (!name || name === "—") return "—";

  if (rucStartsWith(ruc, "10") || isDniDocumento(ruc)) return name;
  if (rucStartsWith(ruc, "20") && looksLikePersonName(name)) return name;

  return "—";
}
