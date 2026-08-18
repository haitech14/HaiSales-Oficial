import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  FileText,
  Handshake,
  Phone,
  Search,
  Users,
} from "lucide-react";

export type WikiProcesoTabId = "resumen" | "guias" | "plantillas" | "ejemplos";

export const wikiProcesoVentasTabs: { id: WikiProcesoTabId; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "guias", label: "Guías" },
  { id: "plantillas", label: "Plantillas" },
  { id: "ejemplos", label: "Ejemplos" },
];

export type WikiProcesoStep = {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export const wikiProcesoVentasSteps: WikiProcesoStep[] = [
  {
    id: "llamadas",
    number: 1,
    title: "Atención de Llamadas",
    description: "Saludo, identificación del cliente y registro de la consulta.",
    icon: Phone,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "necesidad",
    number: 2,
    title: "Levantamiento de Necesidad",
    description: "Preguntas clave para entender volumen, uso y presupuesto.",
    icon: Search,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "solucion",
    number: 3,
    title: "Presentación de Solución",
    description: "Propuesta de producto, beneficios y cotización inicial.",
    icon: FileText,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    id: "objeciones",
    number: 4,
    title: "Manejo de Objeciones",
    description: "Respuestas a precio, plazos, garantía y competencia.",
    icon: DollarSign,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: "cierre",
    number: 5,
    title: "Cierre de Ventas",
    description: "Confirmación, forma de pago y emisión de comprobante.",
    icon: Handshake,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "seguimiento",
    number: 6,
    title: "Seguimiento Comercial",
    description: "Postventa, entrega y fidelización del cliente.",
    icon: Users,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
];

export const APUNTES_SECTION_THEMES: Record<
  string,
  {
    headerText: string;
    headerBg: string;
    cardBg: string;
    cardBorder: string;
    accent: string;
  }
> = {
  Ventas: {
    headerText: "text-blue-600",
    headerBg: "bg-blue-50/80",
    cardBg: "bg-sky-50/90",
    cardBorder: "border-sky-100",
    accent: "text-blue-600",
  },
  Productos: {
    headerText: "text-emerald-600",
    headerBg: "bg-emerald-50/80",
    cardBg: "bg-emerald-50/90",
    cardBorder: "border-emerald-100",
    accent: "text-emerald-600",
  },
  Equipos: {
    headerText: "text-violet-600",
    headerBg: "bg-violet-50/80",
    cardBg: "bg-violet-50/90",
    cardBorder: "border-violet-100",
    accent: "text-violet-600",
  },
};

export const PROCESO_VENTAS_APUNTES_ORDER = ["Ventas", "Productos", "Equipos"] as const;
