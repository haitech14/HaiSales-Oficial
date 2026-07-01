import type { CreateProductoInput } from "@/lib/inventario/producto-form-data";
import type { DbProductType } from "@/lib/inventario/types";

const TEMPLATE_HEADERS = [
  "sku",
  "nombre",
  "tipo",
  "categoria",
  "unidad",
  "marca_modelo",
  "almacen",
  "stock",
  "costo",
  "precio",
  "afectacion_igv",
  "activo",
] as const;

const TEMPLATE_EXAMPLE = [
  "",
  "Monitor LG 27 UltraFine",
  "product",
  "Equipos",
  "und",
  "LG / UltraFine",
  "Almacén Principal",
  "25",
  "850.00",
  "1199.00",
  "afecto",
  "si",
];

const VALID_TIPOS = new Set<DbProductType>(["product", "service", "kit"]);
const VALID_IGV = new Set(["afecto", "exonerado", "inafecto"]);

function escapeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeTipo(value: string): DbProductType | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "product" || normalized === "producto") return "product";
  if (normalized === "service" || normalized === "servicio") return "service";
  if (normalized === "kit") return "kit";
  return null;
}

function parseActivo(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "si" || normalized === "sí" || normalized === "true" || normalized === "1") {
    return true;
  }
  return false;
}

export function downloadProductoPlantilla() {
  const rows = [
    TEMPLATE_HEADERS.join(","),
    TEMPLATE_EXAMPLE.map(escapeCsvCell).join(","),
  ];
  const blob = new Blob([`\uFEFF${rows.join("\n")}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-productos-haisales.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export type ParsedProductoImportRow = {
  rowNumber: number;
  input: CreateProductoInput;
};

export type ProductoImportParseResult = {
  rows: ParsedProductoImportRow[];
  errors: string[];
};

export async function parseProductosCsv(file: File): Promise<ProductoImportParseResult> {
  const text = await file.text();
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ["El archivo está vacío."] };
  }

  const headerCells = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const hasHeader = headerCells.includes("nombre");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: ParsedProductoImportRow[] = [];
  const errors: string[] = [];

  dataLines.forEach((line, index) => {
    const rowNumber = hasHeader ? index + 2 : index + 1;
    const cells = parseCsvLine(line);

    const getCell = (name: (typeof TEMPLATE_HEADERS)[number], fallbackIndex: number) => {
      if (hasHeader) {
        const headerIndex = headerCells.indexOf(name);
        return headerIndex >= 0 ? (cells[headerIndex] ?? "") : "";
      }
      return cells[fallbackIndex] ?? "";
    };

    const nombre = getCell("nombre", 1).trim();
    if (!nombre) {
      errors.push(`Fila ${rowNumber}: el nombre es obligatorio.`);
      return;
    }

    const tipo = normalizeTipo(getCell("tipo", 2));
    if (!tipo) {
      errors.push(`Fila ${rowNumber}: tipo inválido (usa product, service o kit).`);
      return;
    }

    const categoria = getCell("categoria", 3).trim();
    if (!categoria) {
      errors.push(`Fila ${rowNumber}: la categoría es obligatoria.`);
      return;
    }

    const unidad = getCell("unidad", 4).trim();
    if (!unidad) {
      errors.push(`Fila ${rowNumber}: la unidad es obligatoria.`);
      return;
    }

    const almacen = getCell("almacen", 6).trim() || "Almacén Principal";
    const afectacionIgv = getCell("afectacion_igv", 10).trim().toLowerCase() || "afecto";

    if (!VALID_IGV.has(afectacionIgv)) {
      errors.push(`Fila ${rowNumber}: afectación IGV inválida.`);
      return;
    }

    rows.push({
      rowNumber,
      input: {
        sku: getCell("sku", 0).trim() || undefined,
        nombre,
        tipo,
        categoria,
        unidad,
        marcaModelo: getCell("marca_modelo", 5).trim() || undefined,
        almacen,
        stock: Number.parseFloat(getCell("stock", 7)) || 0,
        costo: Number.parseFloat(getCell("costo", 8)) || 0,
        precio: Number.parseFloat(getCell("precio", 9)) || 0,
        afectacionIgv,
        activo: parseActivo(getCell("activo", 11)),
      },
    });
  });

  return { rows, errors };
}
