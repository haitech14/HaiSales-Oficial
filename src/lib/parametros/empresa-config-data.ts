export type EmpresaSede = {
  id: string;
  nombre: string;
  direccion: string;
  /** Serie de cotización de la sucursal, p. ej. C001-001 */
  serieCotizacion?: string;
  esPrincipal?: boolean;
};

/** Prefijo por defecto de serie de cotización (el sufijo 001/002 es por sucursal). */
export const SERIE_COTIZACION_PREFIX = "C001-";

export function formatSerieCotizacion(
  sucursalIndex: number,
  prefix: string = SERIE_COTIZACION_PREFIX,
): string {
  const normalizedPrefix = prefix.trim() || SERIE_COTIZACION_PREFIX;
  const base = normalizedPrefix.endsWith("-")
    ? normalizedPrefix
    : `${normalizedPrefix.replace(/-+$/, "")}-`;
  return `${base}${String(sucursalIndex + 1).padStart(3, "0")}`;
}

export type PhonePrefixOption = {
  code: string;
  flag: string;
  label: string;
};

export const PHONE_PREFIX_OPTIONS: PhonePrefixOption[] = [
  { code: "+51", flag: "🇵🇪", label: "Perú" },
  { code: "+1", flag: "🇺🇸", label: "Estados Unidos" },
  { code: "+52", flag: "🇲🇽", label: "México" },
  { code: "+57", flag: "🇨🇴", label: "Colombia" },
  { code: "+56", flag: "🇨🇱", label: "Chile" },
  { code: "+54", flag: "🇦🇷", label: "Argentina" },
  { code: "+34", flag: "🇪🇸", label: "España" },
  { code: "+49", flag: "🇩🇪", label: "Alemania" },
];

export type EmpresaMonedaOption = {
  code: string;
  label: string;
};

export const EMPRESA_MONEDA_OPTIONS: EmpresaMonedaOption[] = [
  { code: "PEN", label: "Soles (PEN)" },
  { code: "USD", label: "Dólares (USD)" },
  { code: "EUR", label: "Euros (EUR)" },
];

export function createSedeId() {
  return `sede-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeMonedas(value: unknown, fallback = "PEN"): string[] {
  if (Array.isArray(value)) {
    const codes = value.filter((item): item is string => typeof item === "string" && item.length > 0);
    return codes.length > 0 ? codes : [fallback];
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [fallback];
}

export function getPrimaryMoneda(monedas: string[]): string {
  return monedas[0] ?? "PEN";
}

export const IMPUESTO_RENTA_OPTIONS = [
  { value: 1.5, label: "1.5%" },
  { value: 1, label: "1.0%" },
] as const;

export const TIPO_CONTRIBUYENTE_OPTIONS = [
  { value: "regimen_general", label: "Régimen General" },
  { value: "rer", label: "RER - Régimen Especial de Renta" },
  { value: "remype", label: "REMYPE - Régimen Microempresa" },
  { value: "rus", label: "RUS - Régimen Único Simplificado" },
  { value: "nrus", label: "NRUS - Nuevo RUS" },
  { value: "persona_natural_negocio", label: "Persona Natural con Negocio" },
  { value: "persona_natural", label: "Persona Natural" },
  { value: "no_domiciliado", label: "No Domiciliado" },
];

/** Impuesto a la Renta sugerido según tipo de contribuyente. */
export function getImpuestoRentaForTipoContribuyente(tipo: string): number | null {
  if (tipo === "remype") return 1.5;
  if (tipo === "rer") return 1;
  return null;
}

export const PAIS_OPTIONS = [
  { value: "Perú", label: "Perú" },
  { value: "Colombia", label: "Colombia" },
  { value: "México", label: "México" },
  { value: "Chile", label: "Chile" },
  { value: "Argentina", label: "Argentina" },
  { value: "Ecuador", label: "Ecuador" },
  { value: "Bolivia", label: "Bolivia" },
  { value: "España", label: "España" },
  { value: "Estados Unidos", label: "Estados Unidos" },
];

export const ZONA_HORARIA_OPTIONS = [
  { value: "America/Lima", label: "Lima (GMT-5)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Caracas", label: "Caracas (GMT-4)" },
  { value: "America/La_Paz", label: "La Paz (GMT-4)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

export function getTipoContribuyenteLabel(value: string): string {
  return TIPO_CONTRIBUYENTE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export const REGIMEN_TRIBUTARIO_OPTIONS = [
  { value: "regimen_general", label: "Régimen General" },
  { value: "rer", label: "RER - Régimen Especial de Renta" },
  { value: "remype", label: "REMYPE - Régimen Microempresa" },
  { value: "rus", label: "RUS - Régimen Único Simplificado" },
  { value: "nrus", label: "NRUS - Nuevo RUS" },
  { value: "mype_tributario", label: "Régimen MYPE Tributario" },
  { value: "agente_retencion", label: "Agente de Retención IGV" },
  { value: "especial", label: "Régimen Especial" },
];

export function getRegimenTributarioLabel(value: string): string {
  return REGIMEN_TRIBUTARIO_OPTIONS.find((item) => item.value === value)?.label ?? value;
}
