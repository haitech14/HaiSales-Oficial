export type CuentaBancariaPdf = {
  banco: string;
  moneda: string;
  cuenta: string;
  cci: string;
};

export type ComprobantePdfEmisor = {
  razonSocial: string;
  nombreComercial?: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  web?: string;
  giro?: string;
  logoUrl?: string;
  resolucionSunat?: string;
  proveedorFacturacion?: string;
  cuentasBancarias?: CuentaBancariaPdf[];
};

/** Cuentas exactas del comprobante de referencia HAITECH. */
export const DEFAULT_CUENTAS_BANCARIAS: CuentaBancariaPdf[] = [
  {
    banco: "BCP",
    moneda: "SOLES",
    cuenta: "193-2475837-0-46",
    cci: "00219300247583704613",
  },
  {
    banco: "BCP",
    moneda: "DÓLARES",
    cuenta: "193-2560487-1-70",
    cci: "00219300256048717015",
  },
  {
    banco: "BBVA",
    moneda: "SOLES",
    cuenta: "0011-0814-02-00050631",
    cci: "011-814-000200050631-80",
  },
  {
    banco: "INTERBANK",
    moneda: "SOLES",
    cuenta: "200-3002542140",
    cci: "003-200-003002542140-32",
  },
  {
    banco: "INTERBANK",
    moneda: "DÓLARES",
    cuenta: "200-3002969351",
    cci: "003-200-003002969351-35",
  },
  {
    banco: "YAPE",
    moneda: "SOLES",
    cuenta: "926224243",
    cci: "-",
  },
];

export const DEFAULT_COMPROBANTE_GIRO =
  "Venta/Alquiler al por mayor y menor de Fotocopiadoras, Impresoras, toner, repuestos y servicio tecnico";

export const DEFAULT_RESOLUCION_SUNAT = "094-005-0001933/SUNAT";
export const DEFAULT_PROVEEDOR_FACTURACION = "RAPIFAC";

export const DEFAULT_HAITECH_EMISOR: ComprobantePdfEmisor = {
  razonSocial: "NBN TECNOLOGIA TOTAL S.A.C.",
  nombreComercial: "HAITECH",
  ruc: "20612146561",
  direccion: "Av. Petit Thouars Nro - LINCE - LIMA - LIMA",
  telefono: "Ventas: 915149290 / Soporte: 965805873 / Ventas 2: 926224243",
  email: "ventas@haitech.pe",
  web: "https://haitech.pe/",
  giro: DEFAULT_COMPROBANTE_GIRO,
  resolucionSunat: DEFAULT_RESOLUCION_SUNAT,
  proveedorFacturacion: DEFAULT_PROVEEDOR_FACTURACION,
  cuentasBancarias: DEFAULT_CUENTAS_BANCARIAS,
};
