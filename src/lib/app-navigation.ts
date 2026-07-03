import {
  Building2,
  Calculator,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Package,
  Plug,
  Receipt,
  Settings,
  ShoppingCart,
  Briefcase,
  Target,
  Truck,
  User,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  KeyRound,
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

export type NavSubItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  href?: string;
  items: NavSubItem[];
};

export const dashboardNavGroup: NavGroup = {
  label: "Dashboard",
  icon: LayoutDashboard,
  href: "/app/dashboard",
  items: [
    { label: "Resumen", href: "/app/dashboard?mode=resumen" },
    { label: "Reportes", href: "/app/dashboard?mode=reportes" },
  ],
};

export const anunciosNavItem: NavItem = {
  label: "Anuncios",
  href: "/app/anuncios",
  icon: Megaphone,
};

/** @deprecated Usar dashboardNavGroup */
export const dashboardNavItem: NavItem = {
  label: dashboardNavGroup.label,
  href: dashboardNavGroup.href,
  icon: dashboardNavGroup.icon,
};

export const appNavSections: NavSection[] = [
  {
    title: "Comercial",
    items: [
      { label: "Inbox", href: "/app/inbox", icon: Inbox },
      { label: "Pipeline", href: "/app/pipeline", icon: LayoutGrid },
      { label: "Clientes / Empresas", href: "/app/clientes", icon: Building2 },
      { label: "Alquileres", href: "/app/alquileres", icon: KeyRound },
      {
        label: "Planes de Mantenimiento y Suministro",
        href: "/app/planes-mantenimiento-suministro",
        icon: Wrench,
      },
      { label: "Servicios", href: "/app/servicios", icon: Briefcase },
    ],
  },
  {
    title: "Facturación",
    items: [
      { label: "Comprobantes", href: "/app/ventas", icon: Receipt },
      { label: "Cuentas por Cobrar", href: "/app/cuentas-cobrar", icon: CreditCard },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Productos / Inventario", href: "/app/inventario", icon: Package },
      { label: "Compras", href: "/app/compras", icon: ShoppingCart },
      { label: "Guías de Remisión / Envíos", href: "/app/logistica", icon: Truck },
      { label: "Almacenes / Kardex", href: "/app/almacenes", icon: Warehouse },
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
