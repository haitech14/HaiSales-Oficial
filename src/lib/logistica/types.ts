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
  kpis: LogisticaKpi[];
  tabCounts: Record<string, number | null>;
  ordersByStatus: OrderStatusCount[];
  purchasesBySupplier: SupplierPurchase[];
  logisticsRisks: LogisticsRisk[];
  totalRecords: number;
  source: "supabase" | "mock";
};
