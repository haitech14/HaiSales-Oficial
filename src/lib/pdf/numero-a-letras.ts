/** Convierte un monto a texto en español (Perú) para comprobantes. */
const UNIDADES = [
  "",
  "UNO",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISEIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
];

const DECENAS = [
  "",
  "DIEZ",
  "VEINTE",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];

const CENTENAS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

function under100(n: number): string {
  if (n < 20) return UNIDADES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return DECENAS[d];
  if (d === 2) return `VEINTI${UNIDADES[u]}`;
  return `${DECENAS[d]} Y ${UNIDADES[u]}`;
}

function under1000(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  if (n < 100) return under100(n);
  const c = Math.floor(n / 100);
  const rest = n % 100;
  if (rest === 0) return CENTENAS[c];
  return `${CENTENAS[c]} ${under100(rest)}`;
}

function integerToWords(n: number): string {
  if (n === 0) return "CERO";
  if (n < 1000) return under1000(n);

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const parts: string[] = [];

  if (millones === 1) parts.push("UN MILLON");
  else if (millones > 1) parts.push(`${under1000(millones)} MILLONES`);

  if (miles === 1) parts.push("MIL");
  else if (miles > 1) parts.push(`${under1000(miles)} MIL`);

  if (resto > 0) parts.push(under1000(resto));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function monedaLabelLetras(moneda: "PEN" | "USD" | string): string {
  if (moneda === "USD") return "DOLARES AMERICANOS";
  return "SOLES";
}

export function monedaLabelDisplay(moneda: "PEN" | "USD" | string): string {
  if (moneda === "USD") return "DÓLARES";
  return "SOLES";
}

export function currencySymbol(moneda: "PEN" | "USD" | string): string {
  return moneda === "USD" ? "$" : "S/";
}

export function numeroALetras(amount: number, moneda: "PEN" | "USD" | string = "PEN"): string {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const entero = Math.floor(safe);
  const centavos = Math.round((safe - entero) * 100);
  const centavosStr = String(centavos).padStart(2, "0");
  return `${integerToWords(entero)} CON ${centavosStr}/100 ${monedaLabelLetras(moneda)}`;
}
