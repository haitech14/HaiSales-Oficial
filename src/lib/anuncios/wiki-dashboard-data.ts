import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Headphones,
  Layers,
  Shield,
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
      { id: "idx-mision", label: "Misión, Visión y Valores", pageId: "wiki-mision-vision" },
      { id: "idx-organigrama", label: "Organigrama", pageId: "wiki-organigrama" },
      { id: "idx-politicas-corp", label: "Políticas Corporativas", pageId: "wiki-politicas-corporativas" },
    ],
  },
  {
    id: "procesos",
    number: "02",
    label: "Procesos",
    children: [
      { id: "idx-ventas", label: "Ventas", pageId: "wiki-manual-ventas" },
      { id: "idx-marketing", label: "Marketing", pageId: "wiki-marketing" },
      { id: "idx-logistica", label: "Logística", pageId: "wiki-logistica" },
      { id: "idx-atencion", label: "Atención al Cliente", pageId: "wiki-atencion-cliente" },
    ],
  },
  {
    id: "documentacion",
    number: "03",
    label: "Documentación",
    children: [
      { id: "idx-manuales", label: "Manuales", pageId: "wiki-manual-ventas" },
      { id: "idx-formatos", label: "Formatos", pageId: "wiki-formato-cotizacion" },
      { id: "idx-guias", label: "Guías Rápidas", pageId: "wiki-guia-registrar-venta" },
      { id: "idx-politicas", label: "Políticas", pageId: "wiki-politica-descuentos" },
    ],
  },
  {
    id: "recursos",
    number: "04",
    label: "Recursos",
    children: [
      { id: "idx-herramientas", label: "Herramientas", pageId: "wiki-herramientas" },
      { id: "idx-plantillas", label: "Plantillas", pageId: "wiki-plantillas" },
      { id: "idx-capacitaciones", label: "Capacitaciones", pageId: "wiki-capacitaciones" },
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
  },
  {
    id: "procesos",
    label: "Procesos",
    pageCount: 18,
    icon: Layers,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    sectionId: "procesos",
  },
  {
    id: "documentacion",
    label: "Documentación",
    pageCount: 24,
    icon: FolderOpen,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    sectionId: "documentacion",
  },
  {
    id: "recursos",
    label: "Recursos",
    pageCount: 15,
    icon: Wrench,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    sectionId: "recursos",
  },
  {
    id: "ventas-cat",
    label: "Ventas",
    pageCount: 8,
    icon: FileText,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    sectionId: "procesos",
  },
  {
    id: "soporte-cat",
    label: "Soporte",
    pageCount: 6,
    icon: Headphones,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    sectionId: "recursos",
  },
];

export type WikiRecentPageItem = {
  id: string;
  pageId: string;
  title: string;
  tagLabel: string;
  tagClassName: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  updatedBy: string;
  updatedAt: string;
};

export const wikiRecentPagesSeed: WikiRecentPageItem[] = [
  {
    id: "recent-1",
    pageId: "wiki-manual-ventas",
    title: "Manual de Ventas v2.1",
    tagLabel: "Documento",
    tagClassName: "text-blue-600",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    updatedBy: "María Fernanda",
    updatedAt: "hace 2 horas",
  },
  {
    id: "recent-2",
    pageId: "wiki-politica-descuentos",
    title: "Política de Descuentos",
    tagLabel: "Política",
    tagClassName: "text-emerald-600",
    icon: Shield,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    updatedBy: "Carlos Ruiz",
    updatedAt: "hace 5 horas",
  },
  {
    id: "recent-3",
    pageId: "wiki-atencion-cliente",
    title: "Proceso de Atención al Cliente",
    tagLabel: "Proceso",
    tagClassName: "text-orange-600",
    icon: BookOpen,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    updatedBy: "Ana López",
    updatedAt: "ayer",
  },
  {
    id: "recent-4",
    pageId: "wiki-formato-cotizacion",
    title: "Formato de Cotización",
    tagLabel: "Formato",
    tagClassName: "text-emerald-600",
    icon: FileSpreadsheet,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    updatedBy: "Roberto Sánchez",
    updatedAt: "ayer",
  },
  {
    id: "recent-5",
    pageId: "wiki-guia-registrar-venta",
    title: "Guía Rápida: Cómo registrar una venta",
    tagLabel: "Guía",
    tagClassName: "text-violet-600",
    icon: BookOpen,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    updatedBy: "Nicolas Aliaga",
    updatedAt: "hace 3 días",
  },
];

export type WikiFeaturedPage = {
  id: string;
  pageId: string;
  title: string;
  starred?: boolean;
};

export const wikiFeaturedPages: WikiFeaturedPage[] = [
  { id: "feat-1", pageId: "wiki-manual-ventas", title: "Manual de Ventas v2.1" },
  { id: "feat-2", pageId: "wiki-politica-descuentos", title: "Política de Descuentos" },
  { id: "feat-3", pageId: "wiki-codigo-etica", title: "Código de Ética", starred: true },
  { id: "feat-4", pageId: "wiki-onboarding", title: "Proceso de Onboarding" },
];

export type WikiActivityItem = {
  id: string;
  userName: string;
  userInitials: string;
  action: string;
  pageTitle: string;
  pageId?: string;
  timeAgo: string;
  avatarColor: string;
};

export const wikiActivityFeed: WikiActivityItem[] = [
  {
    id: "act-1",
    userName: "María Fernanda",
    userInitials: "MF",
    action: "actualizó la página",
    pageTitle: "Manual de Ventas v2.1",
    pageId: "wiki-manual-ventas",
    timeAgo: "hace 2 horas",
    avatarColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "act-2",
    userName: "Carlos Ruiz",
    userInitials: "CR",
    action: "creó la página",
    pageTitle: "Política de Descuentos",
    pageId: "wiki-politica-descuentos",
    timeAgo: "hace 5 horas",
    avatarColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "act-3",
    userName: "Ana López",
    userInitials: "AL",
    action: "comentó en",
    pageTitle: "Proceso de Atención al Cliente",
    pageId: "wiki-atencion-cliente",
    timeAgo: "ayer",
    avatarColor: "bg-orange-100 text-orange-700",
  },
  {
    id: "act-4",
    userName: "Roberto Sánchez",
    userInitials: "RS",
    action: "agregó una etiqueta en",
    pageTitle: "Formato de Cotización",
    pageId: "wiki-formato-cotizacion",
    timeAgo: "ayer",
    avatarColor: "bg-violet-100 text-violet-700",
  },
];
