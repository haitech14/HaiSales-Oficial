import type { LucideIcon } from "lucide-react";
import { Building2, CreditCard, FileText, MessageCircle, Package, ShoppingBag, Truck } from "lucide-react";

export type IntegracionEstado = "Conectado" | "Pendiente" | "Error";

export type IntegracionItem = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: IntegracionEstado;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  ultimaSync?: string;
};

export const integracionesKpis = [
  { label: "Integraciones activas", value: "0", change: "Sin conexiones activas", changePositive: true },
  { label: "Pendientes de configurar", value: "0", change: "Sin datos en el periodo", changePositive: true },
  { label: "Errores de sincronización", value: "0", change: "Sin errores", changePositive: true },
];

function catalogItem(
  item: Omit<IntegracionItem, "estado" | "ultimaSync">,
): IntegracionItem {
  return { ...item, estado: "Pendiente" };
}

export const integraciones: IntegracionItem[] = [
  catalogItem({
    id: "sunat",
    nombre: "SUNAT — Facturación electrónica",
    descripcion: "Emisión y validación de comprobantes electrónicos en tiempo real.",
    categoria: "Facturación",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  }),
  catalogItem({
    id: "whatsapp",
    nombre: "WhatsApp Business API",
    descripcion: "Sincroniza conversaciones del Inbox y envía notificaciones automáticas.",
    categoria: "Mensajería",
    icon: MessageCircle,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  }),
  catalogItem({
    id: "woocommerce",
    nombre: "WooCommerce",
    descripcion: "Importa pedidos, clientes y actualiza stock desde tu tienda online.",
    categoria: "E-commerce",
    icon: ShoppingBag,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  }),
  catalogItem({
    id: "bcp",
    nombre: "BCP — Conciliación bancaria",
    descripcion: "Concilia pagos recibidos con cobranzas automáticamente.",
    categoria: "Pagos",
    icon: CreditCard,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  }),
  catalogItem({
    id: "olva",
    nombre: "Olva Courier",
    descripcion: "Rastrea envíos y actualiza estados de entrega en logística.",
    categoria: "Logística",
    icon: Truck,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  }),
  catalogItem({
    id: "sap",
    nombre: "SAP Business One",
    descripcion: "Sincroniza contabilidad, inventario y planillas con tu ERP.",
    categoria: "ERP",
    icon: Building2,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  }),
  catalogItem({
    id: "shopify",
    nombre: "Shopify",
    descripcion: "Conecta catálogo y pedidos de Shopify con inventario HaiSales.",
    categoria: "E-commerce",
    icon: Package,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  }),
];

export function getIntegracionEstadoStyles(estado: IntegracionEstado): string {
  switch (estado) {
    case "Conectado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Pendiente":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "Error":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}
