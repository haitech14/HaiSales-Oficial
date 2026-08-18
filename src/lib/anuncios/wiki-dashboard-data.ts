import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  FileText,
  FolderOpen,
  Headphones,
  Layers,
  Shield,
  TrendingUp,
  Wrench,
} from "lucide-react";

export type WikiIndexChild = {
  id: string;
  label: string;
  pageId?: string;
};

export type WikiIndexFolder = {
  id: string;
  number: string;
  label: string;
  children: WikiIndexChild[];
};

export const wikiIndexTree: WikiIndexFolder[] = [
  {
    id: "empresa",
    number: "01",
    label: "Empresa",
    children: [
      { id: "idx-info", label: "Información General", pageId: "wiki-hub-empresa" },
      { id: "idx-mision", label: "Misión, Visión y Valores", pageId: "wiki-mision-vision" },
      { id: "idx-organigrama", label: "Organigrama", pageId: "wiki-organigrama" },
      { id: "idx-politicas-corp", label: "Políticas Corporativas", pageId: "wiki-politicas-corporativas" },
      { id: "idx-normas", label: "Normas Internas", pageId: "wiki-politicas-corporativas" },
    ],
  },
  {
    id: "ventas",
    number: "02",
    label: "Ventas",
    children: [
      { id: "idx-proceso", label: "Proceso de Ventas", pageId: "wiki-ventas" },
      { id: "idx-llamadas", label: "Atención de Llamadas" },
      { id: "idx-necesidad", label: "Levantamiento de Necesidad" },
      { id: "idx-solucion", label: "Presentación de Solución" },
      { id: "idx-objeciones", label: "Manejo de Objeciones" },
      { id: "idx-cierre", label: "Cierre de Ventas" },
      { id: "idx-seguimiento", label: "Seguimiento Comercial" },
    ],
  },
  {
    id: "productos",
    number: "03",
    label: "Productos",
    children: [
      { id: "idx-fotocopiadoras", label: "Fotocopiadoras" },
      { id: "idx-laptops", label: "Laptops" },
      { id: "idx-pcs", label: "PCs de Escritorio" },
      { id: "idx-accesorios", label: "Accesorios" },
    ],
  },
  {
    id: "recursos",
    number: "04",
    label: "Recursos",
    children: [
      { id: "idx-plantillas", label: "Plantillas", pageId: "wiki-plantillas" },
      { id: "idx-formatos", label: "Formatos", pageId: "wiki-formato-cotizacion" },
      { id: "idx-herramientas", label: "Herramientas", pageId: "wiki-herramientas" },
      { id: "idx-capacitaciones", label: "Capacitaciones", pageId: "wiki-capacitaciones" },
    ],
  },
  {
    id: "soporte",
    number: "05",
    label: "Soporte y Postventa",
    children: [
      { id: "idx-instalacion", label: "Instalación y Entrega" },
      { id: "idx-mantenimiento", label: "Mantenimiento Preventivo" },
      { id: "idx-garantias", label: "Garantías" },
      { id: "idx-atencion", label: "Atención al Cliente", pageId: "wiki-atencion-cliente" },
    ],
  },
];

export type WikiCategoryCard = {
  id: string;
  label: string;
  pageCount: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  sectionId: string;
  pageId: string;
};

export const wikiMainCategories: WikiCategoryCard[] = [
  {
    id: "empresa",
    label: "Empresa",
    pageCount: 12,
    icon: Building2,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    sectionId: "empresa",
    pageId: "wiki-hub-empresa",
  },
  {
    id: "ventas",
    label: "Ventas",
    pageCount: 8,
    icon: FileText,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    sectionId: "ventas",
    pageId: "wiki-ventas",
  },
  {
    id: "productos",
    label: "Productos",
    pageCount: 10,
    icon: Layers,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    sectionId: "productos",
    pageId: "wiki-manuales",
  },
  {
    id: "recursos",
    label: "Recursos",
    pageCount: 15,
    icon: Wrench,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    sectionId: "recursos",
    pageId: "wiki-hub-recursos",
  },
  {
    id: "documentacion",
    label: "Documentación",
    pageCount: 24,
    icon: FolderOpen,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    sectionId: "documentacion",
    pageId: "wiki-hub-documentacion",
  },
  {
    id: "soporte-cat",
    label: "Soporte",
    pageCount: 6,
    icon: Headphones,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    sectionId: "soporte",
    pageId: "wiki-atencion-cliente",
  },
];

export type WikiRecentPageItem = {
  id: string;
  pageId: string;
  title: string;
  tagLabel: string;
  tagClassName: string;
  updatedBy: string;
  updatedAt: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export const wikiRecentPagesSeed: WikiRecentPageItem[] = [
  {
    id: "recent-1",
    pageId: "wiki-ventas",
    title: "Proceso de Ventas",
    tagLabel: "Ventas",
    tagClassName: "text-blue-600",
    updatedBy: "Nicolas Aliaga",
    updatedAt: "Hace 2 h",
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "recent-2",
    pageId: "wiki-manual-ventas",
    title: "Manual de Ventas v2.1",
    tagLabel: "Documento",
    tagClassName: "text-emerald-600",
    updatedBy: "Esmeralda Rojas",
    updatedAt: "Ayer",
    icon: BookOpen,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "recent-3",
    pageId: "wiki-politica-descuentos",
    title: "Política de Descuentos",
    tagLabel: "Política",
    tagClassName: "text-violet-600",
    updatedBy: "Jhelcen Romero",
    updatedAt: "15 ago",
    icon: Shield,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export type WikiFeaturedPage = {
  id: string;
  pageId: string;
  title: string;
  starred?: boolean;
};

export const wikiFeaturedPages: WikiFeaturedPage[] = [
  { id: "feat-1", pageId: "wiki-ventas", title: "Proceso de Ventas", starred: true },
  { id: "feat-2", pageId: "wiki-manual-ventas", title: "Manual de Ventas v2.1", starred: true },
  { id: "feat-3", pageId: "wiki-formato-cotizacion", title: "Formato de Cotización" },
  { id: "feat-4", pageId: "wiki-politica-descuentos", title: "Política de Descuentos" },
];

export const wikiActivityFeed = [
  {
    id: "act-1",
    pageId: "wiki-ventas",
    userName: "Nicolas Aliaga",
    userInitials: "NA",
    avatarColor: "bg-indigo-100 text-indigo-700",
    action: "actualizó",
    pageTitle: "Proceso de Ventas",
    timeAgo: "Hace 2 h",
  },
  {
    id: "act-2",
    pageId: "wiki-ventas",
    userName: "Esmeralda Rojas",
    userInitials: "ER",
    avatarColor: "bg-pink-100 text-pink-700",
    action: "agregó apunte en",
    pageTitle: "Productos",
    timeAgo: "Hace 5 h",
  },
  {
    id: "act-3",
    pageId: "wiki-manual-ventas",
    userName: "Jhelcen Romero",
    userInitials: "JR",
    avatarColor: "bg-blue-100 text-blue-700",
    action: "revisó",
    pageTitle: "Manual de Ventas v2.1",
    timeAgo: "Ayer",
  },
  {
    id: "act-4",
    pageId: "wiki-formato-cotizacion",
    userName: "Nicolas Aliaga",
    userInitials: "NA",
    avatarColor: "bg-indigo-100 text-indigo-700",
    action: "descargó",
    pageTitle: "Formato de Cotización",
    timeAgo: "Hace 3 d",
  },
];
