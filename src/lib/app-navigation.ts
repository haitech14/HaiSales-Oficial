import {
  Building2,
  Calculator,
  ChevronRight,
  ClipboardList,
  CreditCard,
  HelpCircle,
  Inbox,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Briefcase,
  Key,
  ShieldCheck,
  Target,
  Truck,
  Users,
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
  groups?: NavGroup[];
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

export const serviciosNavGroup: NavGroup = {
  label: "Servicios",
  icon: Briefcase,
  href: "/app/servicios",
  items: [
    { label: "Servicios", href: "/app/servicios" },
    { label: "Alquileres", href: "/app/alquileres" },
    {
      label: "Planes de Mantenimiento y Suministro",
      href: "/app/planes-mantenimiento-suministro",
    },
  ],
};

export const configuracionNavGroup: NavGroup = {
  label: "Configuración",
  icon: Settings,
  href: "/app/parametros",
  items: [
    { label: "Integraciones", href: "/app/integraciones" },
    { label: "Parámetros", href: "/app/parametros" },
  ],
};

export function isConfiguracionRoute(pathname: string): boolean {
  return configuracionNavGroup.items.some(
    (item) => pathname === item.href.split("?")[0],
  );
}

export const appNavSections: NavSection[] = [
  {
    title: "Comercial",
    items: [
      { label: "Bandeja / Leads", href: "/app/inbox", icon: Inbox },
      { label: "CRM", href: "/app/pipeline", icon: LayoutGrid },
      { label: "Clientes / Empresas", href: "/app/clientes", icon: Building2 },
    ],
  },
  {
    title: "Soporte TI",
    items: [
      { label: "Servicios", href: "/app/servicios", icon: Briefcase },
      { label: "Alquileres", href: "/app/alquileres", icon: Key },
      {
        label: "Planes de Mantenimiento y Suministro / Garantías",
        href: "/app/planes-mantenimiento-suministro",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Administración y Facturación",
    items: [
      { label: "Comprobantes", href: "/app/ventas", icon: Receipt },
      { label: "Cobranzas", href: "/app/cuentas-cobrar", icon: CreditCard },
      { label: "Caja Chica y Bancos", href: "/app/tesoreria", icon: Landmark },
      { label: "Contabilidad", href: "/app/contabilidad", icon: Calculator },
      { label: "Usuarios/Planillas", href: "/app/usuarios", icon: Users },
      { label: "Planillas", href: "/app/planillas", icon: ClipboardList },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Productos / Inventario", href: "/app/inventario", icon: Package },
      { label: "Compras", href: "/app/compras", icon: ShoppingCart },
      { label: "Guías de Remisión / Envíos", href: "/app/logistica", icon: Truck },
      { label: "Almacenes / Kardex", href: "/app/almacenes", icon: Warehouse },
    ],
  },
];

export { ChevronRight, HelpCircle, Target };
