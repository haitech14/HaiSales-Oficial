import * as XLSX from "xlsx";

export type GuiaRemisionItemRow = {
  codigo?: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  pesoUnitario?: number;
};

export type GuiaRemisionRow = {
  codigoGuia: string;
  serie: string;
  numero: number;
  fechaEmision: string;
  fechaTraslado: string;
  motivoTraslado: string;
  sucursal: string;
  destinatarioRuc: string;
  destinatarioNombre: string;
  direccionPartida: string;
  direccionDestino: string;
  conductorRuc: string;
  conductorNombre: string;
  licencia: string;
  placa: string;
  pesoTotal: number;
  bultos: number;
  observacion: string;
  comprobanteRelacionado?: string;
  estado: "emitida" | "en_transito" | "entregada" | "anulada";
  periodoMes: string;
  archivoOrigen: string;
  items: GuiaRemisionItemRow[];
};

export type GuiaReporteParseResult = {
  guias: GuiaRemisionRow[];
  errors: string[];
  meta: {
    archivo: string;
    periodoDesde?: string;
    periodoHasta?: string;
    totalGuias: number;
    totalItems: number;
  };
};

const HEADER_MARKERS = new Set(["fecha emision", "serie", "numero"]);

function parseExcelDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const month = String(parsed.m).padStart(2, "0");
      const day = String(parsed.d).padStart(2, "0");
      return `${parsed.y}-${month}-${day}`;
    }
  }
  if (typeof value === "string") {
    const parts = value.trim().split(/[/-]/);
    if (parts.length === 3) {
      const [d, m, y] = parts.map((part) => parseInt(part, 10));
      if (d && m && y) {
        const year = y < 100 ? 2000 + y : y;
        return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
  }
  return null;
}

function cellStr(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatCodigoGuia(serie: string, numero: number): string {
  return `${serie.trim().toUpperCase()}-${String(numero).padStart(5, "0")}`;
}

export function normalizeComprobanteRelacionado(raw: string): string | undefined {
  const match = raw.toUpperCase().match(/([A-Z]\d{3})-(\d+)/);
  if (!match) return undefined;
  return `${match[1]}-${match[2].padStart(5, "0")}`;
}

function mapMotivo(value: string): string {
  if (!value) return "otros";
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function mapEstado(motivo: string): GuiaRemisionRow["estado"] {
  if (motivo === "venta" || motivo === "consignacion") return "en_transito";
  return "emitida";
}

function findHeaderRow(matrix: unknown[][]): number {
  for (let row = 0; row < Math.min(20, matrix.length); row += 1) {
    const labels = new Set(
      matrix[row]
        ?.slice(0, 5)
        .map((cell) => cellStr(cell).toLowerCase())
        .filter(Boolean) ?? [],
    );
    if (HEADER_MARKERS.has("fecha emision") && labels.has("fecha emision") && labels.has("serie") && labels.has("numero")) {
      return row;
    }
  }
  return 6;
}

function inferPeriodoMes(fecha: string): string {
  return fecha.slice(0, 7);
}

export function parseGuiaReporteWorkbook(workbook: XLSX.WorkBook, archivoOrigen: string): GuiaReporteParseResult {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const errors: string[] = [];
  const headerRow = findHeaderRow(matrix);

  let periodoDesde: string | undefined;
  let periodoHasta: string | undefined;
  for (let row = 0; row < headerRow; row += 1) {
    const label = cellStr(matrix[row]?.[0]).toUpperCase();
    if (label.startsWith("DESDE")) {
      periodoDesde = parseExcelDate(matrix[row]?.[1]) ?? undefined;
    }
    if (label.includes("HASTA")) {
      periodoHasta = parseExcelDate(matrix[row]?.[17]) ?? parseExcelDate(matrix[row]?.[1]) ?? undefined;
    }
  }

  const grouped = new Map<string, GuiaRemisionRow>();

  for (let row = headerRow + 1; row < matrix.length; row += 1) {
    const line = matrix[row] ?? [];
    const serie = cellStr(line[1]);
    const numero = toNumber(line[2], NaN);
    if (!serie || !Number.isFinite(numero)) continue;

    const fechaEmision = parseExcelDate(line[0]);
    if (!fechaEmision) {
      errors.push(`Fila ${row + 1}: fecha de emisión inválida`);
      continue;
    }

    const codigoGuia = formatCodigoGuia(serie, numero);
    const fechaTraslado = parseExcelDate(line[5]) ?? fechaEmision;
    const motivoTraslado = mapMotivo(cellStr(line[4]));
    const observacion = cellStr(line[25]);
    const comprobanteRelacionado = normalizeComprobanteRelacionado(observacion);
    const periodoMes = inferPeriodoMes(fechaEmision);

    if (!grouped.has(codigoGuia)) {
      grouped.set(codigoGuia, {
        codigoGuia,
        serie: serie.toUpperCase(),
        numero,
        fechaEmision,
        fechaTraslado,
        motivoTraslado,
        sucursal: cellStr(line[3]),
        destinatarioRuc: cellStr(line[6]),
        destinatarioNombre: cellStr(line[7]) || "Sin destinatario",
        direccionPartida: cellStr(line[8]),
        direccionDestino: cellStr(line[9]),
        conductorRuc: cellStr(line[17]),
        conductorNombre: cellStr(line[18]),
        licencia: cellStr(line[19]),
        placa: cellStr(line[20]),
        pesoTotal: toNumber(line[15]),
        bultos: toNumber(line[16]),
        observacion,
        comprobanteRelacionado,
        estado: mapEstado(motivoTraslado),
        periodoMes,
        archivoOrigen,
        items: [],
      });
    }

    const guia = grouped.get(codigoGuia)!;
    guia.items.push({
      codigo: cellStr(line[10]) || undefined,
      descripcion: cellStr(line[11]) || "Ítem sin descripción",
      cantidad: toNumber(line[12], 1),
      unidad: cellStr(line[13]) || "UND",
      pesoUnitario: toNumber(line[14]) || undefined,
    });
  }

  const guias = [...grouped.values()];
  return {
    guias,
    errors,
    meta: {
      archivo: archivoOrigen,
      periodoDesde,
      periodoHasta,
      totalGuias: guias.length,
      totalItems: guias.reduce((sum, guia) => sum + guia.items.length, 0),
    },
  };
}

export async function parseGuiaReporteFile(file: File): Promise<GuiaReporteParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  return parseGuiaReporteWorkbook(workbook, file.name);
}

export async function parseGuiaReporteUrl(url: string, archivoOrigen: string): Promise<GuiaReporteParseResult> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${archivoOrigen}`);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  return parseGuiaReporteWorkbook(workbook, archivoOrigen);
}

export const GUIAS_REPORTE_LEGACY_FILES = [
  { label: "Guías Enero 2026", path: "/Guias%20Enero%202026.xlsx" },
  { label: "Guías Febrero 2026", path: "/Guias%20Febrero%202026.xlsx" },
  { label: "Guías Marzo 2026", path: "/Guias%20Marzo%202026.xlsx" },
  { label: "Guías Abril 2026", path: "/Guias%20Abril%202026.xlsx" },
  { label: "Guías Mayo 2026", path: "/Guias%20Mayo%202026.xlsx" },
  { label: "Guías Junio 2026", path: "/Guias%20Junio.xlsx" },
] as const;

type LegacyBundleGuia = {
  codigo_guia: string;
  serie: string;
  numero_correlativo: number;
  fecha_emision: string;
  fecha_traslado: string;
  motivo_traslado: string;
  sucursal?: string;
  destinatario_ruc?: string;
  destinatario_nombre: string;
  direccion_partida?: string;
  direccion_destino?: string;
  conductor_ruc?: string;
  conductor_nombre?: string;
  licencia?: string;
  placa?: string;
  peso_total?: number;
  bultos?: number;
  observacion?: string;
  comprobante_relacionado?: string;
  estado: GuiaRemisionRow["estado"];
  periodo_mes: string;
  fuente_archivo: string;
  items: GuiaRemisionItemRow[];
};

function mapBundleGuia(guia: LegacyBundleGuia): GuiaRemisionRow {
  return {
    codigoGuia: guia.codigo_guia,
    serie: guia.serie,
    numero: guia.numero_correlativo,
    fechaEmision: guia.fecha_emision,
    fechaTraslado: guia.fecha_traslado,
    motivoTraslado: guia.motivo_traslado,
    sucursal: guia.sucursal ?? "",
    destinatarioRuc: guia.destinatario_ruc ?? "",
    destinatarioNombre: guia.destinatario_nombre,
    direccionPartida: guia.direccion_partida ?? "",
    direccionDestino: guia.direccion_destino ?? "",
    conductorRuc: guia.conductor_ruc ?? "",
    conductorNombre: guia.conductor_nombre ?? "",
    licencia: guia.licencia ?? "",
    placa: guia.placa ?? "",
    pesoTotal: guia.peso_total ?? 0,
    bultos: guia.bultos ?? 0,
    observacion: guia.observacion ?? "",
    comprobanteRelacionado: guia.comprobante_relacionado,
    estado: guia.estado,
    periodoMes: guia.periodo_mes,
    archivoOrigen: guia.fuente_archivo,
    items: guia.items.map((item) => ({
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      unidad: item.unidad,
      pesoUnitario: item.peso_unitario,
    })),
  };
}

export async function loadGuiaReporteLegacyBundle(): Promise<GuiaReporteParseResult> {
  const response = await fetch("/data/guias-legacy-bundle.json");
  if (!response.ok) throw new Error("No se pudo cargar el bundle legacy de guías");

  const payload = (await response.json()) as {
    guias: LegacyBundleGuia[];
    summary?: { total_guias: number; total_items: number };
  };

  const guias = payload.guias.map(mapBundleGuia);
  return {
    guias,
    errors: [],
    meta: {
      archivo: "guias-legacy-bundle.json",
      totalGuias: payload.summary?.total_guias ?? guias.length,
      totalItems: payload.summary?.total_items ?? guias.reduce((sum, g) => sum + g.items.length, 0),
    },
  };
}

export function groupGuiasByPeriod(guias: GuiaRemisionRow[]) {
  const map = new Map<string, GuiaRemisionRow[]>();
  for (const guia of guias) {
    const bucket = map.get(guia.periodoMes) ?? [];
    bucket.push(guia);
    map.set(guia.periodoMes, bucket);
  }
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
}

export function groupGuiasByMotivo(guias: GuiaRemisionRow[]) {
  const map = new Map<string, GuiaRemisionRow[]>();
  for (const guia of guias) {
    const label = guia.motivoTraslado.replace(/_/g, " ");
    const bucket = map.get(label) ?? [];
    bucket.push(guia);
    map.set(label, bucket);
  }
  return [...map.entries()];
}
