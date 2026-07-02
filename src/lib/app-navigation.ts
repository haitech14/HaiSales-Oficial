import {
  Building2,
  Calculator,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Inbox,
  LayoutGrid,
  Package,
  Plug,
  Receipt,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  Truck,
  User,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const inboxNavItem: NavItem = {
  label: "Inbox",
  href: "/app/inbox",
  icon: Inbox,
};

export const appNavSections: NavSection[] = [
  {
    title: "Comercial",
    items: [
      { label: "Pipeline", href: "/app/pipeline", icon: LayoutGrid, badge: 118 },
      { label: "Leads", href: "/app/ventas-crm", icon: TrendingUp, badge: 21 },
      { label: "Clientes / Empresas", href: "/app/clientes", icon: Building2, badge: "1,284" },
    ],
  },
  {
    title: "Facturación",
    items: [
      { label: "Facturación electrónica", href: "/app/ventas", icon: Receipt },
      { label: "Cuentas por Cobrar", href: "/app/cuentas-cobrar", icon: CreditCard, badge: 45 },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Productos / Inventario", href: "/app/inventario", icon: Package, badge: "1,245" },
      { label: "Compras", href: "/app/compras", icon: ShoppingCart, badge: 32 },
      { label: "Logística", href: "/app/logistica", icon: Truck, badge: 18 },
      { label: "Almacenes / Kardex", href: "/app/almacenes", icon: Warehouse, badge: 328 },
    ],
  },
  {
    title: "Administración",
    items: [
      { label: "Planillas", href: "/app/planillas", icon: Users },
      { label: "Contabilidad", href: "/app/contabilidad", icon: Calculator },
      { label: "Caja y Bancos", href: "/app/caja-bancos", icon: Wallet },
    ],
  },
  {
    title: "Configuración",
    items: [
      { label: "Usuarios", href: "/app/usuarios", icon: User },
      { label: "Integraciones", href: "/app/integraciones", icon: Plug },
      { label: "Configuración", href: "/app/parametros", icon: Settings },
    ],
  },
];

export { ChevronRight, HelpCircle, Target };
