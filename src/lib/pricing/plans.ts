import { Building2, Rocket, Store, type LucideIcon } from "lucide-react";

export type Currency = "pen" | "usd";
export type BillingCycle = "monthly" | "semiannual" | "annual";
export type PlanSlug = "microempresa" | "emprendedor" | "corporativo";

export interface PlanFeature {
  label: string;
  included: boolean;
  subItems?: string[];
}

export interface PricingPlan {
  slug: PlanSlug;
  name: string;
  subtitle: string;
  /** Precio mensual en soles, IGV incluido. */
  monthlyPricePen: number;
  /** Precio mensual equivalente en plan anual, IGV incluido. */
  annualPricePen: number;
  /** Precio mensual en dólares, IGV incluido. */
  monthlyPriceUsd: number;
  /** Precio mensual equivalente en plan anual, IGV incluido. */
  annualPriceUsd: number;
  icon: LucideIcon;
  highlighted?: boolean;
  features: PlanFeature[];
}

type SystemModuleKey =
  | "dashboard"
  | "anuncios"
  | "inbox"
  | "crm"
  | "clientes"
  | "comprobantes"
  | "cobranzas"
  | "cajaChica"
  | "bancos"
  | "contabilidad"
  | "inventario"
  | "compras"
  | "logistica"
  | "almacenes"
  | "servicios"
  | "alquileres"
  | "planesMantenimiento"
  | "usuarios"
  | "planillas";

const systemModuleCatalog: Record<
  SystemModuleKey,
  { label: string; subItems?: string[] }
> = {
  dashboard: { label: "Módulo Dashboard", subItems: ["Resumen", "Reportes"] },
  anuncios: { label: "Módulo Anuncios" },
  inbox: { label: "Módulo Bandeja / Leads" },
  crm: { label: "Módulo CRM", subItems: ["Pipeline"] },
  clientes: { label: "Módulo Clientes / Empresas" },
  comprobantes: { label: "Módulo Comprobantes" },
  cobranzas: { label: "Módulo Cobranzas" },
  cajaChica: { label: "Módulo Caja Chica" },
  bancos: { label: "Módulo Bancos" },
  contabilidad: { label: "Módulo Contabilidad" },
  inventario: { label: "Módulo Productos / Inventario" },
  compras: { label: "Módulo Compras" },
  logistica: { label: "Módulo Guías de Remisión / Envíos" },
  almacenes: { label: "Módulo Almacenes / Kardex" },
  servicios: { label: "Módulo Servicios" },
  alquileres: { label: "Módulo Alquileres" },
  planesMantenimiento: {
    label: "Módulo Planes de Mantenimiento y Suministro",
  },
  usuarios: { label: "Módulo Usuarios" },
  planillas: { label: "Módulo Planillas" },
};

const moduleDisplayOrder: SystemModuleKey[] = [
  "dashboard",
  "anuncios",
  "inbox",
  "crm",
  "clientes",
  "comprobantes",
  "cobranzas",
  "cajaChica",
  "bancos",
  "contabilidad",
  "planillas",
  "inventario",
  "compras",
  "logistica",
  "almacenes",
  "servicios",
  "alquileres",
  "planesMantenimiento",
  "usuarios",
];

const planModuleAccess: Record<PlanSlug, Set<SystemModuleKey>> = {
  /** Emprendedor: operación básica para una sola persona. */
  microempresa: new Set([
    "dashboard",
    "clientes",
    "comprobantes",
    "cobranzas",
    "inventario",
    "almacenes",
    "usuarios",
  ]),
  /** Microempresa: equipo comercial pequeño con alquileres y operación ampliada. */
  emprendedor: new Set([
    "dashboard",
    "inbox",
    "crm",
    "clientes",
    "comprobantes",
    "cobranzas",
    "cajaChica",
    "bancos",
    "inventario",
    "compras",
    "logistica",
    "almacenes",
    "servicios",
    "alquileres",
    "usuarios",
  ]),
  /** Corporativo: todos los módulos del sistema. */
  corporativo: new Set(Object.keys(systemModuleCatalog) as SystemModuleKey[]),
};

function buildModuleFeatures(slug: PlanSlug): PlanFeature[] {
  const included = planModuleAccess[slug];
  return moduleDisplayOrder.map((key) => ({
    label: systemModuleCatalog[key].label,
    subItems: systemModuleCatalog[key].subItems,
    included: included.has(key),
  }));
}

const corporateExtras: PlanFeature[] = [
  { label: "WhatsApp Business integrado", included: true },
  { label: "Integraciones API y webhooks", included: true },
  { label: "Reportes consolidados multi-sede", included: true },
  { label: "Onboarding y capacitación dedicada", included: true },
];

const baseLimits = {
  microempresa: [
    { label: "100 documentos / mes", included: true },
    { label: "01 establecimiento", included: true },
    { label: "01 almacén", included: true },
    { label: "01 usuario", included: true },
    { label: "1,000 productos", included: true },
  ],
  emprendedor: [
    { label: "300 documentos / mes", included: true },
    { label: "02 establecimientos", included: true },
    { label: "02 almacenes", included: true },
    { label: "04 usuarios", included: true },
    { label: "5,000 productos", included: true },
  ],
  corporativo: [
    { label: "Documentos ilimitados", included: true },
    { label: "06 establecimientos", included: true },
    { label: "06 almacenes", included: true },
    { label: "08 usuarios", included: true },
    { label: "Productos ilimitados", included: true },
  ],
} satisfies Record<PlanSlug, PlanFeature[]>;

const planSupportLabel: Record<PlanSlug, string> = {
  microempresa: "Asesoría por chat y correo",
  emprendedor: "Soporte personalizado",
  corporativo: "Soporte prioritario 24/7",
};

function buildPlanFeatures(slug: PlanSlug): PlanFeature[] {
  return [
    ...baseLimits[slug],
    { label: "Certificado digital", included: true },
    ...buildModuleFeatures(slug),
    ...(slug === "corporativo" ? corporateExtras : []),
    { label: "Web, Android, iOS", included: true },
    { label: planSupportLabel[slug], included: true },
  ];
}

export const billingOptions: { id: BillingCycle; label: string; discount: number }[] = [
  { id: "monthly", label: "Mensual", discount: 0 },
  { id: "semiannual", label: "06 meses -10%", discount: 0.1 },
  { id: "annual", label: "Anual -20%", discount: 0.2 },
];

export const PEN_TO_USD_RATE = 3.75;

export function formatCurrencyAmountRounded(amount: number, currency: Currency) {
  const locale = currency === "pen" ? "es-PE" : "en-US";
  return Math.round(amount).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatPenAmountRounded(amount: number) {
  return formatCurrencyAmountRounded(amount, "pen");
}

export function getCurrencyPrefix(currency: Currency) {
  return currency === "pen" ? "S/" : "USD";
}

export const pricingPlans: PricingPlan[] = [
  {
    slug: "microempresa",
    name: "Emprendedor",
    subtitle: "Para emprendedores que operan solos",
    monthlyPricePen: 129,
    annualPricePen: 99,
    monthlyPriceUsd: 39,
    annualPriceUsd: 29,
    icon: Store,
    features: buildPlanFeatures("microempresa"),
  },
  {
    slug: "emprendedor",
    name: "Microempresa",
    subtitle: "Para equipos de hasta 4 usuarios con operación comercial",
    monthlyPricePen: 169,
    annualPricePen: 149,
    monthlyPriceUsd: 49,
    annualPriceUsd: 39,
    icon: Rocket,
    highlighted: true,
    features: buildPlanFeatures("emprendedor"),
  },
  {
    slug: "corporativo",
    name: "Corporativo",
    subtitle: "Para empresas en expansión con hasta 8 usuarios",
    monthlyPricePen: 239,
    annualPricePen: 199,
    monthlyPriceUsd: 69,
    annualPriceUsd: 59,
    icon: Building2,
    features: buildPlanFeatures("corporativo"),
  },
];

export function getDiscount(cycle: BillingCycle) {
  return billingOptions.find((option) => option.id === cycle)?.discount ?? 0;
}

export function getPlanDisplayPrice(plan: PricingPlan, cycle: BillingCycle, currency: Currency) {
  const monthly = currency === "pen" ? plan.monthlyPricePen : plan.monthlyPriceUsd;
  const annual = currency === "pen" ? plan.annualPricePen : plan.annualPriceUsd;
  if (cycle === "annual") return annual;
  if (cycle === "monthly") return monthly;
  return Math.round(monthly * (1 - getDiscount(cycle)));
}

export function getPlanDisplayPricePen(plan: PricingPlan, cycle: BillingCycle) {
  return getPlanDisplayPrice(plan, cycle, "pen");
}

export function getPlanAnnualTotal(plan: PricingPlan, currency: Currency) {
  const annual = currency === "pen" ? plan.annualPricePen : plan.annualPriceUsd;
  return annual * 12;
}

export function getPlanAnnualTotalPen(plan: PricingPlan) {
  return getPlanAnnualTotal(plan, "pen");
}

export function formatPlanPrice(plan: PricingPlan, cycle: BillingCycle, currency: Currency) {
  return formatCurrencyAmountRounded(getPlanDisplayPrice(plan, cycle, currency), currency);
}

export function getCurrencySuffix(currency: Currency) {
  return currency === "pen" ? "S/" : "USD";
}

export function getBillingLabel(cycle: BillingCycle) {
  return billingOptions.find((option) => option.id === cycle)?.label ?? "Mensual";
}

export function getPlanBySlug(slug: string | null): PricingPlan | undefined {
  return pricingPlans.find((plan) => plan.slug === slug);
}

export function buildCheckoutPath(
  slug: PlanSlug,
  cycle: BillingCycle = "monthly",
  currency: Currency = "pen",
) {
  const params = new URLSearchParams({ plan: slug, cycle, currency });
  return `/checkout?${params.toString()}`;
}

export function parseBillingCycle(value: string | null): BillingCycle {
  if (value && billingOptions.some((option) => option.id === value)) {
    return value as BillingCycle;
  }
  return "monthly";
}

export function parseCurrency(value: string | null): Currency {
  return value === "usd" ? "usd" : "pen";
}

export function isModuleIncludedInPlan(slug: PlanSlug, moduleKey: SystemModuleKey) {
  return planModuleAccess[slug].has(moduleKey);
}
