import type { LucideIcon } from "lucide-react";

export type ProductStatus = "Activo" | "Stock bajo" | "Sin movimiento";
export type ProductType = "product" | "service" | "kit";

export type DbProductType = "product" | "service" | "kit";

export type InventarioProduct = {
  id: string;
  sku: string;
  name: string;
  description: string;
  marca: string;
  category: string;
  warehouse: string;
  stock: number;
  unit: string;
  cost: number;
  price: number;
  moneda: string;
  status: ProductStatus;
  type: ProductType;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export type InventarioKpi = {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  sparkColor: string;
  sparkPoints: number[];
  iconBg: string;
  iconColor: string;
};

export type InventarioSnapshot = {
  products: InventarioProduct[];
  kpis: InventarioKpi[];
  tabCounts: Record<string, number | null>;
  stockByCategory: { label: string; count: number; percent: number; color: string }[];
  topRotationProducts: { name: string; rotation: string; percent: number }[];
  inventoryAlerts: { label: string; count: number; color: string; width: string }[];
  totalRecords: number;
  source: "supabase" | "mock";
  importError?: string;
};
