import { Building2, Rocket, Store, type LucideIcon } from "lucide-react";

export type Currency = "pen" | "usd";
export type BillingCycle = "monthly" | "quarterly" | "semiannual" | "annual";
export type PlanSlug = "microempresa" | "emprendedor" | "corporativo";

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  slug: PlanSlug;
  name: string;
  subtitle: string;
  monthlyPricePen: number;
  icon: LucideIcon;
  highlighted?: boolean;
  /** Texto inicial cuando el plan hereda beneficios del anterior (solo en landing). */
  includesLabel?: string;
  features: PlanFeature[];
}

export const billingOptions: { id: BillingCycle; label: string; discount: number }[] = [
  { id: "monthly", label: "Mensual", discount: 0 },
  { id: "quarterly", label: "03 meses -10%", discount: 0.1 },
  { id: "semiannual", label: "06 meses -15%", discount: 0.15 },
  { id: "annual", label: "Anual -20%", discount: 0.2 },
];

export const PEN_TO_USD_RATE = 3.75;

export const pricingPlans: PricingPlan[] = [
  {
    slug: "microempresa",
    name: "Emprendedor",
    subtitle: "Ideal para empezar y organizar tu negocio",
    monthlyPricePen: 99,
    icon: Store,
    features: [
      { label: "100 Documentos / mes", included: true },
      { label: "01 Establecimiento", included: true },
      { label: "01 Almacén", included: true },
      { label: "02 Usuarios", included: true },
      { label: "1,000 Productos", included: true },
      { label: "Certificado digital", included: true },
      { label: "Todos los módulos", included: true },
      { label: "Web", included: true },
      { label: "Android", included: true },
      { label: "iOS", included: true },
      { label: "Videotutoriales", included: true },
      { label: "Asesoría personalizada", included: true },
      { label: "Soporte personalizado", included: true },
    ],
  },
  {
    slug: "emprendedor",
    name: "Microempresa",
    subtitle: "Para negocios en crecimiento que buscan más control",
    monthlyPricePen: 149,
    icon: Rocket,
    highlighted: true,
    includesLabel: "Todo lo del plan Emprendedor",
    features: [
      { label: "300 Documentos / mes", included: true },
      { label: "02 Establecimientos", included: true },
      { label: "02 Almacenes", included: true },
      { label: "04 Usuarios", included: true },
      { label: "5,000 Productos", included: true },
    ],
  },
  {
    slug: "corporativo",
    name: "Corporativo",
    subtitle: "Para empresas que buscan escalar y soporte prioritario",
    monthlyPricePen: 199,
    icon: Building2,
    includesLabel: "Todo lo del plan Microempresa",
    features: [
      { label: "Documentos ilimitados", included: true },
      { label: "04 Establecimientos", included: true },
      { label: "04 Almacenes", included: true },
      { label: "08 Usuarios", included: true },
      { label: "10,000 Productos", included: true },
      { label: "Soporte personalizado", included: true },
    ],
  },
];

export function getDiscount(cycle: BillingCycle) {
  return billingOptions.find((option) => option.id === cycle)?.discount ?? 0;
}

export function formatPlanPrice(monthlyPricePen: number, cycle: BillingCycle, currency: Currency) {
  let price = monthlyPricePen * (1 - getDiscount(cycle));
  if (currency === "usd") {
    price = price / PEN_TO_USD_RATE;
  }
  return price.toFixed(2);
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
