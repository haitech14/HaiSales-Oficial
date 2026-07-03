export type OrderStatus = "Aprobada" | "Emitida" | "En tránsito" | "Recibida" | "Observada";
export type OrderType = "Compra" | "Servicio";
export type OrderCategory = "requisicion" | "orden" | "transito" | "recibida" | "observada";

export type DbOrderStatus = "aprobada" | "emitida" | "en_transito" | "recibida" | "observada";
export type DbOrderType = "compra" | "servicio";

export type PurchaseOrder = {
  id: string;
  numero: string;
  requisicionId: string;
  fecha: string;
  hora: string;
  proveedor: string;
  ruc: string;
  tipo: OrderType;
  almacen: string;
  importe: number;
  estado: OrderStatus;
  responsable: string;
  responsableInitials: string;
  category: OrderCategory;
  notas?: string | null;
  fechaEntregaEstimada?: string | null;
};

export type PurchaseOrderItem = {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type PurchaseOrderDetail = PurchaseOrder & {
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type LogisticaKpi = {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  sparkColor: string;
  sparkPoints: number[];
  iconBg: string;
  iconColor: string;
};

export type OrderStatusCount = {
  label: string;
  count: number;
  color: string;
};

export type SupplierPurchase = {
  name: string;
  amount: number;
  percent: number;
};

export type LogisticsRisk = {
  label: string;
  count: number;
  color: string;
  width: string;
};

export type LogisticaSnapshot = {
  orders: PurchaseOrder[];
  guias: GuiaRemision[];
  kpis: LogisticaKpi[];
  guiasKpis: LogisticaKpi[];
  tabCounts: Record<string, number | null>;
  guiaTabCounts: Record<string, number | null>;
  ordersByStatus: OrderStatusCount[];
  purchasesBySupplier: SupplierPurchase[];
  logisticsRisks: LogisticsRisk[];
  totalRecords: number;
  totalGuias: number;
  source: "supabase" | "mock";
};

export type GuiaEstado = "Emitida" | "En tránsito" | "Entregada" | "Anulada";

export type GuiaEditableField =
  | "sucursal"
  | "destinatario"
  | "ruc"
  | "conductor"
  | "placa"
  | "comprobante"
  | "estado";

export const GUIA_ESTADO_OPTIONS: GuiaEstado[] = ["Emitida", "En tránsito", "Entregada", "Anulada"];

export type GuiaRemisionItem = {
  id: string;
  codigo?: string | null;
  descripcion: string;
  cantidad: number;
  unidad: string;
  pesoUnitario?: number | null;
};

export type GuiaRemision = {
  id: string;
  codigoGuia: string;
  fecha: string;
  hora: string;
  fechaTraslado: string;
  motivoTraslado: string;
  destinatario: string;
  ruc: string;
  contacto: string;
  telefono: string;
  dni: string;
  sucursal: string;
  direccionDestino: string;
  observacion?: string | null;
  conductor: string;
  placa?: string | null;
  bultos?: number | null;
  pesoTotal?: number | null;
  comprobanteRelacionado?: string | null;
  estado: GuiaEstado;
  periodoMes: string;
  itemsCount: number;
};

export type GuiaRemisionDetail = GuiaRemision & {
  items: GuiaRemisionItem[];
  observacion?: string | null;
  direccionPartida?: string | null;
  createdAt: string;
};
