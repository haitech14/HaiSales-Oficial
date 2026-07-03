import * as XLSX from "xlsx";

export type VentaReporteRow = {
  fechaEmision: string;
  fechaVencimiento: string;
  documento: string;
  serie: string;
  numero: number;
  codigoComprobante: string;
  ruc: string;
  cliente: string;
  vendedor: string;
  usuario: string;
  moneda: "PEN" | "USD";
  totalDocumento: number;
  tipoCambio: number;
  importeSoles: number;
  formaPago: string;
  cuentaCobro: string;
  numeroOperacion: string;
  anulada: boolean;
  periodoMes: string;
  tipoComprobante: "factura" | "boleta" | "nota_credito" | "orden";
  reporteDesde?: string;
  reporteHasta?: string;
  archivoOrigen: string;
};

export type VentaReporteParseResult = {
  rows: VentaReporteRow[];
  errors: string[];
  meta: {
    archivo: string;
    periodoDesde?: string;
    periodoHasta?: string;
    empresa?: string;
    anulados: number;
    totalFilas: number;
  };
};

const HEADER_ALIASES: Record<string, keyof VentaReporteRow | "skip"> = {
  FECFAC: "fechaEmision",
  FECVEN: "fechaVencimiento",
  DOCUMENTO: "documento",
  SERIE: "serie",
  NUMERO: "numero",
  NRO_RUC: "ruc",
  "NOMBRE O RAZON SOCIAL": "cliente",
  VENDEDOR: "vendedor",
  USUARIO: "usuario",
  MONEDA: "moneda",
  TOTAL: "totalDocumento",
  "T.C": "tipoCambio",
  "IMPORTE S/": "importeSoles",
  DESCUENTO: "skip",
  "F.PAGO1": "formaPago",
  CUENTA1: "cuentaCobro",
  "N.OPERACION": "numeroOperacion",
};

function isRedRgb(rgb?: string | null): boolean {
  if (!rgb) return false;
  const hex = rgb.replace(/^#/, "").toUpperCase();
  if (hex.length === 8) {
    const r = parseInt(hex.slice(2, 4), 16);
    const g = parseInt(hex.slice(4, 6), 16);
    const b = parseInt(hex.slice(6, 8), 16);
    return r > 200 && g < 80 && b < 80;
  }
  return hex.includes("FF0000");
}

function cellIsRed(cell: XLSX.CellObject | undefined): boolean {
  if (!cell?.s?.font?.color) return false;
  const color = cell.s.font.color;
  if (color.rgb) return isRedRgb(color.rgb);
  return false;
}

function rowIsRed(sheet: XLSX.WorkSheet, rowIndex: number, colCount: number): boolean {
  for (let col = 0; col < colCount; col += 1) {
    const addr = XLSX.utils.encode_cell({ r: rowIndex, c: col });
    if (cellIsRed(sheet[addr])) return true;
  }
  return false;
}

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
  const text = String(value).trim();
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().slice(0, 10);
  }
  return null;
}

function parseMoneda(value: unknown): "PEN" | "USD" {
  const text = String(value ?? "").toUpperCase();
  if (text.includes("DOLAR") || text === "USD") return "USD";
  return "PEN";
}

function formatCodigoComprobante(serie: string, numero: number): string {
  return `${serie.trim().toUpperCase()}-${String(numero).padStart(5, "0")}`;
}

function isValidDocumento(documento: string): boolean {
  const text = documento.toUpperCase();
  return (
    text === "FACTURA" ||
    text === "ORDEN" ||
    text.includes("BOLETA") ||
    text.includes("NOTA DE CREDITO")
  );
}

function mapTipoComprobante(documento: string): VentaReporteRow["tipoComprobante"] {
  const text = documento.toUpperCase();
  if (text.includes("BOLETA")) return "boleta";
  if (text.includes("NOTA")) return "nota_credito";
  if (text === "ORDEN") return "orden";
  return "factura";
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function periodoFromFecha(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function readMetaRow(matrix: unknown[][], label: string): string | undefined {
  const row = matrix.find((cells) => String(cells[0] ?? "").toUpperCase() === label.toUpperCase());
  return row?.[1] != null ? String(row[1]) : undefined;
}

function findHeaderRow(matrix: unknown[][]): number {
  return matrix.findIndex((row) => String(row[0] ?? "").toUpperCase() === "FECFAC");
}

export function parseVentaReporteWorkbook(
  workbook: XLSX.WorkBook,
  archivoOrigen: string,
): VentaReporteParseResult {
  const errors: string[] = [];
  const rows: VentaReporteRow[] = [];
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const headerRowIndex = findHeaderRow(matrix);

  if (headerRowIndex < 0) {
    return {
      rows: [],
      errors: ["No se encontró la fila de encabezados (FECFAC) en el reporte."],
      meta: { archivo: archivoOrigen, anulados: 0, totalFilas: 0 },
    };
  }

  const empresa = readMetaRow(matrix, "EMPRESA");
  const reporteDesde = readMetaRow(matrix, "DESDE");
  const reporteHasta = readMetaRow(matrix, "HASTA");
  const headers = matrix[headerRowIndex].map((cell) => String(cell ?? "").trim().toUpperCase());

  const columnMap = headers.map((header) => HEADER_ALIASES[header] ?? "skip");

  for (let rowIndex = headerRowIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
    const raw = matrix[rowIndex];
    const documento = String(raw[2] ?? "").trim();
    if (!documento || documento.toUpperCase().startsWith("TOTAL")) break;
    if (!isValidDocumento(documento)) continue;

    const fechaEmision = parseExcelDate(raw[0]);
    if (!fechaEmision) {
      errors.push(`Fila ${rowIndex + 1}: fecha de emisión inválida`);
      continue;
    }

    const serie = String(raw[3] ?? "").trim();
    const numero = toNumber(raw[4]);
    const totalDocumento = toNumber(raw[10]);
    const importeSoles = toNumber(raw[12]);
    const redRow = rowIsRed(sheet, rowIndex, headers.length);
    const anulada = redRow || (totalDocumento > 0 && importeSoles === 0);

    const record: VentaReporteRow = {
      fechaEmision,
      fechaVencimiento: parseExcelDate(raw[1]) ?? fechaEmision,
      documento,
      serie,
      numero,
      codigoComprobante: formatCodigoComprobante(serie, numero),
      ruc: String(raw[5] ?? "").trim(),
      cliente: String(raw[6] ?? "").trim() || "Cliente",
      vendedor: String(raw[7] ?? "").trim() || "Sin asignar",
      usuario: String(raw[8] ?? "").trim(),
      moneda: parseMoneda(raw[9]),
      totalDocumento,
      tipoCambio: toNumber(raw[11]) || 1,
      importeSoles,
      formaPago: String(raw[14] ?? "").trim(),
      cuentaCobro: String(raw[15] ?? "").trim(),
      numeroOperacion: String(raw[16] ?? "").trim(),
      anulada,
      periodoMes: periodoFromFecha(fechaEmision),
      tipoComprobante: mapTipoComprobante(documento),
      reporteDesde,
      reporteHasta,
      archivoOrigen,
    };

    for (let col = 0; col < columnMap.length; col += 1) {
      const key = columnMap[col];
      if (key === "skip" || !key) continue;
      if (key === "fechaEmision") record.fechaEmision = parseExcelDate(raw[col]) ?? record.fechaEmision;
      if (key === "fechaVencimiento") record.fechaVencimiento = parseExcelDate(raw[col]) ?? record.fechaVencimiento;
      if (key === "documento") record.documento = String(raw[col] ?? "").trim();
      if (key === "serie") record.serie = String(raw[col] ?? "").trim();
      if (key === "numero") record.numero = toNumber(raw[col]);
      if (key === "ruc") record.ruc = String(raw[col] ?? "").trim();
      if (key === "cliente") record.cliente = String(raw[col] ?? "").trim();
      if (key === "vendedor") record.vendedor = String(raw[col] ?? "").trim();
      if (key === "usuario") record.usuario = String(raw[col] ?? "").trim();
      if (key === "moneda") record.moneda = parseMoneda(raw[col]);
      if (key === "totalDocumento") record.totalDocumento = toNumber(raw[col]);
      if (key === "tipoCambio") record.tipoCambio = toNumber(raw[col]) || 1;
      if (key === "importeSoles") record.importeSoles = toNumber(raw[col]);
      if (key === "formaPago") record.formaPago = String(raw[col] ?? "").trim();
      if (key === "cuentaCobro") record.cuentaCobro = String(raw[col] ?? "").trim();
      if (key === "numeroOperacion") record.numeroOperacion = String(raw[col] ?? "").trim();
    }

    record.codigoComprobante = formatCodigoComprobante(record.serie, record.numero);
    record.periodoMes = periodoFromFecha(record.fechaEmision);
    record.tipoComprobante = mapTipoComprobante(record.documento);
    rows.push(record);
  }

  return {
    rows,
    errors,
    meta: {
      archivo: archivoOrigen,
      periodoDesde: reporteDesde,
      periodoHasta: reporteHasta,
      empresa,
      anulados: rows.filter((row) => row.anulada).length,
      totalFilas: rows.length,
    },
  };
}

export async function parseVentaReporteFile(file: File): Promise<VentaReporteParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellStyles: true });
  return parseVentaReporteWorkbook(workbook, file.name);
}

export async function parseVentaReporteUrl(url: string, archivoOrigen: string): Promise<VentaReporteParseResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${archivoOrigen}`);
  }
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellStyles: true });
  return parseVentaReporteWorkbook(workbook, archivoOrigen);
}

export const VENTAS_REPORTE_LEGACY_FILES = [
  // 2024
  { label: "Setiembre 2024", path: "/Setiembre2024.xlsx" },
  { label: "Octubre 2024", path: "/Octubre2024.xlsx" },
  { label: "Noviembre 2024", path: "/Nov2024.xlsx" },
  { label: "Diciembre 2024", path: "/Dic2024.xlsx" },
  // 2025
  { label: "Enero 2025", path: "/Enero2025.xlsx" },
  { label: "Febrero 2025", path: "/Febrero25.xlsx" },
  { label: "Marzo 2025", path: "/Marzo.xlsx" },
  { label: "Abril 2025", path: "/Abril.xlsx" },
  { label: "Mayo 2025", path: "/Mayo.xlsx" },
  { label: "Junio 2025", path: "/Junio.xlsx" },
  { label: "Julio 2025", path: "/Julio.xlsx" },
  { label: "Agosto 2025", path: "/Agosto.xlsx" },
  { label: "Setiembre 2025", path: "/Setiembre.xlsx" },
  { label: "Octubre 2025", path: "/Octubre.xlsx" },
  { label: "Noviembre 2025", path: "/Noviembre25.xlsx" },
  { label: "Diciembre 2025", path: "/Diciembre.xlsx" },
  // 2026
  { label: "Enero 2026", path: "/Enero.xlsx" },
  { label: "Febrero 2026", path: "/Febrero.xlsx" },
  { label: "Marzo 2026", path: "/Reporte_de_Ventas_2026070253857366.xlsx" },
  { label: "Abril 2026", path: "/Abril2025.xlsx" },
  { label: "Mayo 2026", path: "/Reporte_de_Ventas_2026070253736502.xlsx" },
  { label: "Junio 2026", path: "/Reporte_de_Ventas_2026070253617363.xlsx" },
] as const;

type LegacyBundleRow = {
  codigo_comprobante: string;
  fecha: string;
  fecha_vencimiento?: string;
  tipo_comprobante: string;
  serie: string;
  numero_correlativo: number;
  cliente_ruc?: string | null;
  cliente_nombre: string;
  vendedor_nombre?: string | null;
  usuario_emision?: string | null;
  moneda_origen?: string;
  subtotal: number;
  igv: number;
  total: number;
  tipo_cambio?: number | null;
  forma_pago?: string | null;
  cuenta_cobro?: string | null;
  numero_operacion?: string | null;
  periodo_mes: string;
  fuente_archivo: string;
  notas?: string | null;
  estado: string;
  anulada?: boolean;
};

function mapBundleRow(row: LegacyBundleRow): VentaReporteRow {
  const documento =
    row.tipo_comprobante === "boleta"
      ? "BOLETA DE VENTA"
      : row.tipo_comprobante === "nota_credito"
        ? "NOTA DE CREDITO"
        : "FACTURA";

  return {
    fechaEmision: row.fecha,
    fechaVencimiento: row.fecha_vencimiento ?? row.fecha,
    documento,
    serie: row.serie,
    numero: row.numero_correlativo,
    codigoComprobante: row.codigo_comprobante,
    ruc: row.cliente_ruc ?? "",
    cliente: row.cliente_nombre,
    vendedor: row.vendedor_nombre ?? "Sin asignar",
    usuario: row.usuario_emision ?? "",
    moneda: row.moneda_origen === "USD" ? "USD" : "PEN",
    totalDocumento: row.total,
    tipoCambio: row.tipo_cambio ?? 1,
    importeSoles: row.total,
    formaPago: row.forma_pago ?? "",
    cuentaCobro: row.cuenta_cobro ?? "",
    numeroOperacion: row.numero_operacion ?? "",
    anulada: row.estado === "anulada" || row.anulada === true,
    periodoMes: row.periodo_mes,
    tipoComprobante: mapTipoComprobante(documento),
    archivoOrigen: row.fuente_archivo,
  };
}

export async function loadVentaReporteLegacyBundle(): Promise<VentaReporteParseResult> {
  const response = await fetch("/data/ventas-legacy-bundle.json");
  if (!response.ok) {
    throw new Error("No se pudo cargar el bundle legacy de ventas");
  }

  const payload = (await response.json()) as {
    rows: LegacyBundleRow[];
    summary?: { total: number; anulados: number };
  };

  const rows = payload.rows.map(mapBundleRow);
  return {
    rows,
    errors: [],
    meta: {
      archivo: "ventas-legacy-bundle.json",
      anulados: payload.summary?.anulados ?? rows.filter((row) => row.anulada).length,
      totalFilas: rows.length,
    },
  };
}

export function groupRowsByPeriod(rows: VentaReporteRow[]) {
  const map = new Map<string, VentaReporteRow[]>();
  for (const row of rows) {
    const bucket = map.get(row.periodoMes) ?? [];
    bucket.push(row);
    map.set(row.periodoMes, bucket);
  }
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
}

export function groupRowsByDocumentType(rows: VentaReporteRow[]) {
  const labels: Record<VentaReporteRow["tipoComprobante"], string> = {
    factura: "Facturas",
    boleta: "Boletas",
    nota_credito: "Notas de crédito",
    orden: "Órdenes",
  };
  const map = new Map<string, VentaReporteRow[]>();
  for (const row of rows) {
    const label = labels[row.tipoComprobante];
    const bucket = map.get(label) ?? [];
    bucket.push(row);
    map.set(label, bucket);
  }
  return [...map.entries()];
}
