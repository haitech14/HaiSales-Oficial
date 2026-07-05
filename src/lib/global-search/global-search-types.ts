export type GlobalSearchCategory =
  | "cliente"
  | "contacto"
  | "comprobante"
  | "guia"
  | "producto"
  | "oportunidad"
  | "modulo";

export type GlobalSearchResult = {
  id: string;
  category: GlobalSearchCategory;
  title: string;
  subtitle?: string;
  href: string;
};

export const GLOBAL_SEARCH_CATEGORY_LABELS: Record<GlobalSearchCategory, string> = {
  cliente: "Clientes",
  contacto: "Contactos",
  comprobante: "Comprobantes y series",
  guia: "Guías de remisión",
  producto: "Productos",
  oportunidad: "Oportunidades",
  modulo: "Módulos",
};
