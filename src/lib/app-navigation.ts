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
  label: "Wiki",
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
      { label: "Inbox", href: "/app/inbox", icon: Inbox },
      { label: "Ventas", href: "/app/ventas", icon: Receipt },
      { label: "Pipeline", href: "/app/pipeline", icon: LayoutGrid },
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

export type SidebarViewMode = "lista" | "modulos";

export type AppModuleTile = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Clase Tailwind de fondo del tile */
  color: string;
  /** Ocupa todo el ancho (fila completa) */
  wide?: boolean;
};

export const SIDEBAR_VIEW_STORAGE_KEY = "haisales-sidebar-view";

export function loadSidebarViewMode(): SidebarViewMode {
  if (typeof window === "undefined") return "lista";
  const stored = window.localStorage.getItem(SIDEBAR_VIEW_STORAGE_KEY);
  return stored === "modulos" ? "modulos" : "lista";
}

export function saveSidebarViewMode(mode: SidebarViewMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIDEBAR_VIEW_STORAGE_KEY, mode);
}

export { ChevronRight, HelpCircle, Target };
