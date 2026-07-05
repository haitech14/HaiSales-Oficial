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

const crmModule: PlanFeature = {
  label: "Módulo CRM",
  included: true,
  subItems: ["Pipeline", "Inbox Mensajería"],
};

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

const microempresaExtraModules: PlanFeature[] = [
  {
    label: "Módulo Contable",
    included: true,
    subItems: ["Planillas", "Asistencia"],
  },
  { label: "Módulo Alquileres", included: true },
  { label: "Módulo Planes de Mantenimiento", included: true },
  { label: "Módulo Planes de Suministros", included: true },
];

export const pricingPlans: PricingPlan[] = [
  {
    slug: "microempresa",
    name: "Emprendedor",
    subtitle: "Ideal para empezar y organizar tu negocio",
    monthlyPricePen: 129,
    annualPricePen: 99,
    monthlyPriceUsd: 39,
    annualPriceUsd: 29,
    icon: Store,
    features: [
      { label: "100 documentos / mes", included: true },
      { label: "01 establecimiento", included: true },
      { label: "01 almacén", included: true },
      { label: "02 usuarios", included: true },
      { label: "1,000 productos", included: true },
      { label: "Certificado digital", included: true },
      crmModule,
      { label: "Web, Android, iOS", included: true },
      { label: "Asesoría personalizada", included: true },
    ],
  },
  {
    slug: "emprendedor",
    name: "Microempresa",
    subtitle: "Para negocios en crecimiento que buscan más control",
    monthlyPricePen: 169,
    annualPricePen: 149,
    monthlyPriceUsd: 49,
    annualPriceUsd: 39,
    icon: Rocket,
    highlighted: true,
    features: [
      { label: "300 documentos / mes", included: true },
      { label: "02 establecimientos", included: true },
      { label: "02 almacenes", included: true },
      { label: "04 usuarios", included: true },
      { label: "5,000 productos", included: true },
      { label: "Certificado digital", included: true },
      crmModule,
      ...microempresaExtraModules,
      { label: "Web, Android, iOS", included: true },
      { label: "Soporte personalizado", included: true },
    ],
  },
  {
    slug: "corporativo",
    name: "Corporativo",
    subtitle: "Para empresas que buscan escalar y soporte prioritario",
    monthlyPricePen: 239,
    annualPricePen: 199,
    monthlyPriceUsd: 69,
    annualPriceUsd: 59,
    icon: Building2,
    features: [
      { label: "Documentos ilimitados", included: true },
      { label: "04 establecimientos", included: true },
      { label: "04 almacenes", included: true },
      { label: "08 usuarios", included: true },
      { label: "10,000 productos", included: true },
      { label: "Certificado digital", included: true },
      crmModule,
      ...microempresaExtraModules,
      { label: "Web, Android, iOS", included: true },
      { label: "Soporte personalizado", included: true },
    ],
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
