export type VentaComprobanteDb = "factura" | "boleta" | "nota_credito" | "nota_venta";

export type VentaDocumentType = "Factura" | "Boleta" | "Nota de crédito" | "Nota de venta";

export const VENTA_TIPOS_COMPROBANTE_FORM = [
  "Factura Electrónica (01)",
  "Boleta de Venta (03)",
  "Nota de Crédito (07)",
  "Nota de Venta (NV)",
  "Guía de Remisión",
  "Proforma",
] as const;

export const TIPO_FORM_TO_DB: Record<string, VentaComprobanteDb> = {
  "Factura Electrónica (01)": "factura",
  "Boleta de Venta (03)": "boleta",
  "Nota de Crédito (07)": "nota_credito",
  "Nota de Venta (NV)": "nota_venta",
  "Guía de Remisión": "nota_venta",
  Proforma: "nota_venta",
};

export const TIPOS_COMPROBANTE_DOCUMENTO_INTERNO = ["Guía de Remisión", "Proforma"] as const;

export function isDocumentoInternoForm(tipoForm: string): boolean {
  return (TIPOS_COMPROBANTE_DOCUMENTO_INTERNO as readonly string[]).includes(tipoForm);
}

export const TIPO_DB_TO_DISPLAY: Record<VentaComprobanteDb, VentaDocumentType> = {
  factura: "Factura",
  boleta: "Boleta",
  nota_credito: "Nota de crédito",
  nota_venta: "Nota de venta",
};

export const INGRESO_DISTRIBUCION_LABELS: Array<{
  documentType: VentaDocumentType;
  label: string;
}> = [
  { documentType: "Factura", label: "Facturas" },
  { documentType: "Boleta", label: "Boletas" },
  { documentType: "Nota de venta", label: "Notas de venta" },
  { documentType: "Nota de crédito", label: "Notas de crédito" },
];

export type SeriesConfig = {
  serieFactura: string;
  serieBoleta: string;
  serieNotaCredito: string;
  serieNotaVenta: string;
};

export const DEFAULT_SERIES: SeriesConfig = {
  serieFactura: "F001",
  serieBoleta: "B001",
  serieNotaCredito: "FC01",
  serieNotaVenta: "NV01",
};

export function mapDbTipoToDisplay(tipo: string | null | undefined): VentaDocumentType {
  const normalized = tipo as VentaComprobanteDb;
  return TIPO_DB_TO_DISPLAY[normalized] ?? "Factura";
}

export function mapFormTipoToDb(tipoForm: string): VentaComprobanteDb {
  return TIPO_FORM_TO_DB[tipoForm] ?? "factura";
}

export function resolveSerieForTipoForm(tipoForm: string, series: SeriesConfig): string {
  if (tipoForm === "Guía de Remisión") return "T001";
  if (tipoForm === "Proforma") return "PRO01";
  const db = mapFormTipoToDb(tipoForm);
  if (db === "boleta") return series.serieBoleta;
  if (db === "nota_credito") return series.serieNotaCredito;
  if (db === "nota_venta") return series.serieNotaVenta;
  return series.serieFactura;
}

export function seriesOptionsForTipoForm(tipoForm: string, series: SeriesConfig): string[] {
  if (tipoForm === "Guía de Remisión") return ["T001", "T002"];
  if (tipoForm === "Proforma") return ["PRO01", "PRO02"];
  const primary = resolveSerieForTipoForm(tipoForm, series);
  const extras: string[] = [];

  if (mapFormTipoToDb(tipoForm) === "factura") {
    extras.push("F002");
  }
  if (mapFormTipoToDb(tipoForm) === "boleta") {
    extras.push("B002");
  }

  return [...new Set([primary, ...extras].filter(Boolean))];
}

export function seriesConfigFromEmpresa(empresa: {
  serieFactura: string;
  serieBoleta: string;
  serieNotaCredito: string;
  serieNotaVenta: string;
}): SeriesConfig {
  return {
    serieFactura: empresa.serieFactura || DEFAULT_SERIES.serieFactura,
    serieBoleta: empresa.serieBoleta || DEFAULT_SERIES.serieBoleta,
    serieNotaCredito: empresa.serieNotaCredito || DEFAULT_SERIES.serieNotaCredito,
    serieNotaVenta: empresa.serieNotaVenta || DEFAULT_SERIES.serieNotaVenta,
  };
}
