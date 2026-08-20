export type UbicacionParts = {
  ciudad: string;
  provincia: string;
  distrito: string;
};

const PERU_DEPARTMENTS = new Set(
  [
    "amazonas",
    "áncash",
    "ancash",
    "apurimac",
    "apurímac",
    "arequipa",
    "ayacucho",
    "cajamarca",
    "callao",
    "cusco",
    "huancavelica",
    "huánuco",
    "huanuco",
    "ica",
    "junín",
    "junin",
    "la libertad",
    "lambayeque",
    "lima",
    "loreto",
    "madre de dios",
    "moquegua",
    "pasco",
    "piura",
    "puno",
    "san martín",
    "san martin",
    "tacna",
    "tumbes",
    "ucayali",
  ].map((value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()),
);

const ADDRESS_PATTERN =
  /\b(av\.?|avenida|calle|jr\.?|jir[oó]n|mz\.?|manzana|lt\.?|lote|aa\.?\s*hh|esquina|urbanizaci[oó]n|urb\.?|pasaje|car\.?|carretera|prolongaci[oó]n|asociaci[oó]n|cooperativa|ampliaaci[oó]n|bodega|almac[eé]n|frente|altura|entre|cdra\.?|cuadra|mze\.?|parcela|comite|comit[eé]|pasando|estaci[oó]n|paradero)\b/i;

const INVALID_CIUDAD = new Set(
  ["sin direccion", "sin dirección", "-", "—", "sdfasdsadsa", "asdassad"].map((v) => v.toLowerCase()),
);

const KNOWN_CITY_SUFFIXES = [
  "Huancayo",
  "Trujillo",
  "Huancayo",
  "Huaraz",
  "Chosica",
  "Pichanaqui",
  "Arequipa",
  "Chincha",
  "Iquitos",
  "Pucallpa",
  "Tarapoto",
  "Chiclayo",
  "Piura",
  "Cusco",
  "Tacna",
  "Ica",
  "Juliaca",
  "Moyobamba",
  "Rioja",
  "Satipo",
  "Barranca",
  "Cañete",
  "Ayacucho",
  "Cajamarca",
  "Moquegua",
  "Huancavelica",
  "Chulucanas",
  "Tingo Maria",
  "Chaclacayo",
  "Surco",
  "Callao",
  "Lima",
  "Zapallal",
  "Puente Piedra",
];

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function isAddressLikeCiudad(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (ADDRESS_PATTERN.test(trimmed)) return true;
  if (/^\d/.test(trimmed) && /[A-Za-zÁÉÍÓÚáéíóú]/.test(trimmed)) return true;
  if (trimmed.includes("((") || trimmed.includes("))")) return true;
  return false;
}

function extractCityFromAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("-")) {
    const candidate = trimmed.slice(1).trim().split(/\s+/)[0]?.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ-]/g, "");
    if (candidate && candidate.length >= 3 && !ADDRESS_PATTERN.test(candidate)) {
      return titleCase(candidate);
    }
  }

  for (const city of KNOWN_CITY_SUFFIXES) {
    if (new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(trimmed)) {
      return city === "Surco" ? "Santiago de Surco" : titleCase(city);
    }
  }

  const parenMatch = trimmed.match(/\(([^)]+)\)\s*$/);
  if (parenMatch?.[1]) {
    const inner = parenMatch[1].trim();
    if (inner.length >= 3 && inner.length <= 40 && !ADDRESS_PATTERN.test(inner)) {
      return titleCase(inner);
    }
  }

  const tokens = trimmed.split(/[\s,()/-]+/).filter(Boolean);
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index].replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ]/g, "");
    if (token.length < 3 || /\d/.test(token)) continue;
    if (ADDRESS_PATTERN.test(token)) continue;
    const key = normalizeKey(token);
    if (["av", "jr", "mz", "lt", "pe", "peru", "lima"].includes(key)) continue;
    return titleCase(token);
  }

  return null;
}

export type NormalizedCiudad = {
  ciudad: string | null;
  pais: string | null;
};

/** Normaliza el valor crudo almacenado en clientes.ciudad. */
export function normalizeCiudadRaw(raw?: string | null): NormalizedCiudad {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === "—") {
    return { ciudad: null, pais: null };
  }

  const boliviaMatch = trimmed.match(/^(.+?)\s*[-–]\s*Bolivia\s*$/i);
  if (boliviaMatch) {
    return { ciudad: titleCase(boliviaMatch[1].trim()), pais: "Bolivia" };
  }

  if (/^\d{5,6}$/.test(trimmed)) {
    return { ciudad: null, pais: null };
  }

  if (INVALID_CIUDAD.has(trimmed.toLowerCase())) {
    return { ciudad: null, pais: null };
  }

  if (isAddressLikeCiudad(trimmed)) {
    const extracted = extractCityFromAddress(trimmed);
    return extracted ? { ciudad: extracted, pais: "Perú" } : { ciudad: null, pais: null };
  }

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3 && !isAddressLikeCiudad(trimmed)) {
    return { ciudad: trimmed, pais: "Perú" };
  }

  if (parts.length === 2 && !isAddressLikeCiudad(trimmed)) {
    return { ciudad: trimmed, pais: "Perú" };
  }

  const single = parts[0];
  const singleKey = normalizeKey(single);
  if (PERU_DEPARTMENTS.has(singleKey)) {
    return { ciudad: null, pais: null };
  }

  if (singleKey === "bogota" || singleKey === "cucuta") {
    return { ciudad: titleCase(single), pais: "Colombia" };
  }

  if (singleKey === "sucre") {
    return { ciudad: "Sucre", pais: "Bolivia" };
  }

  if (singleKey === "manta") {
    return { ciudad: "Manta", pais: "Ecuador" };
  }

  return { ciudad: single, pais: "Perú" };
}

export function parseUbicacion(raw?: string | null, pais?: string | null): UbicacionParts {
  const empty: UbicacionParts = { ciudad: "—", provincia: "—", distrito: "—" };
  if (!raw || raw.trim() === "" || raw === "—") return empty;

  const normalized = normalizeCiudadRaw(raw);
  if (normalized.ciudad) {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 3) {
      return {
        provincia: parts[1],
        ciudad: normalized.ciudad,
        distrito: parts[parts.length - 1],
      };
    }

    if (parts.length === 2) {
      return {
        provincia: parts[0],
        ciudad: normalized.ciudad,
        distrito: "—",
      };
    }

    return {
      ciudad: normalized.ciudad,
      provincia: pais && pais !== "Perú" ? pais : "—",
      distrito: "—",
    };
  }

  return empty;
}

export function joinUbicacion(ciudad: string, provincia: string, distrito: string): string {
  const parts = [ciudad, provincia, distrito].filter((part) => part && part !== "—");
  return parts.join(", ");
}
