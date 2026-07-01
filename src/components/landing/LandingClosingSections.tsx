import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Headphones,
  Lock,
  RefreshCw,
  Rocket,
  Star,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/* ── Pricing ── */

type Currency = "pen" | "usd";
type BillingCycle = "monthly" | "quarterly" | "semiannual" | "annual";

interface PlanFeature {
  label: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  subtitle: string;
  monthlyPricePen: number;
  icon: LucideIcon;
  highlighted?: boolean;
  features: PlanFeature[];
}

const billingOptions: { id: BillingCycle; label: string; discount: number }[] = [
  { id: "monthly", label: "Mensual", discount: 0 },
  { id: "quarterly", label: "03 meses -10%", discount: 0.1 },
  { id: "semiannual", label: "06 meses -15%", discount: 0.15 },
  { id: "annual", label: "Anual -20%", discount: 0.2 },
];

const PEN_TO_USD_RATE = 3.75;

const pricingPlans: PricingPlan[] = [
  {
    name: "Microempresa",
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
    name: "Emprendedor",
    subtitle: "Para negocios en crecimiento que buscan más control",
    monthlyPricePen: 149,
    icon: Rocket,
    highlighted: true,
    features: [
      { label: "300 Documentos / mes", included: true },
      { label: "02 Establecimientos", included: true },
      { label: "02 Almacenes", included: true },
      { label: "04 Usuarios", included: true },
      { label: "5,000 Productos", included: true },
      { label: "Certificado digital", included: true },
      { label: "Todos los módulos", included: true },
      { label: "Web", included: true },
      { label: "Android", included: true },
      { label: "iOS", included: true },
      { label: "Videotutoriales", included: true },
      { label: "Asesoría personalizada", included: true },
      { label: "Soporte personalizado", included: false },
    ],
  },
  {
    name: "Corporativo",
    subtitle: "Para empresas que buscan escalar y soporte prioritario",
    monthlyPricePen: 199,
    icon: Building2,
    features: [
      { label: "Documentos ilimitados", included: true },
      { label: "04 Establecimientos", included: true },
      { label: "04 Almacenes", included: true },
      { label: "08 Usuarios", included: true },
      { label: "10,000 Productos", included: true },
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
];

const trustFeatures = [
  {
    icon: CreditCard,
    title: "Sin tarjeta de crédito",
    description: "No solicitamos tarjeta de crédito para comenzar.",
  },
  {
    icon: Headphones,
    title: "Soporte dedicado",
    description: "Nuestro equipo está listo para ayudarte.",
  },
  {
    icon: RefreshCw,
    title: "Actualizaciones incluidas",
    description: "Mejora continua sin costos adicionales.",
  },
  {
    icon: Lock,
    title: "Seguridad garantizada",
    description: "Tus datos y los de tu empresa siempre protegidos.",
  },
];

function getDiscount(cycle: BillingCycle) {
  return billingOptions.find((option) => option.id === cycle)?.discount ?? 0;
}

function formatPrice(monthlyPricePen: number, cycle: BillingCycle, currency: Currency) {
  let price = monthlyPricePen * (1 - getDiscount(cycle));
  if (currency === "usd") {
    price = price / PEN_TO_USD_RATE;
  }
  return price.toFixed(2);
}

function getCurrencySuffix(currency: Currency) {
  return currency === "pen" ? "S/" : "USD";
}

function FeatureIcon({ included, dark = false }: { included: boolean; dark?: boolean }) {
  if (included) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
        dark ? "bg-red-500/15 ring-1 ring-red-500/30" : "bg-red-50",
      )}
    >
      <X className={cn("h-3 w-3", dark ? "text-red-400" : "text-red-500")} strokeWidth={3} />
    </span>
  );
}

/* ── Testimonials ── */

const testimonials = [
  {
    quote:
      "HaiSales nos ayudó a ordenar todo nuestro proceso comercial. Ahora facturamos más rápido y tenemos visibilidad total de nuestras ventas.",
    initials: "MR",
    name: "Marta Rios",
    role: "Gerente General, Innova Soluciones",
    avatarBg: "bg-emerald-100",
    avatarText: "text-emerald-700",
  },
  {
    quote:
      "La facturación electrónica es súper sencilla y el soporte en español siempre está cuando lo necesitamos.",
    initials: "CM",
    name: "Carlos Medina",
    role: "Director Comercial, Constructiva Grupo",
    avatarBg: "bg-blue-100",
    avatarText: "text-blue-700",
  },
  {
    quote:
      "Pasamos de hojas de Excel a un sistema que nos da reportes claros y nos ha permitido crecer sin desorden.",
    initials: "LT",
    name: "Lucia Torres",
    role: "Gerente Financiera, Verde Distribuciones",
    avatarBg: "bg-emerald-50",
    avatarText: "text-emerald-600",
  },
];

/* ── FAQ ── */

const faqs = [
  {
    question: "¿Puedo migrar mis clientes?",
    answer:
      "Sí. Puedes importar contactos, empresas y productos desde Excel o desde otras herramientas. Nuestro equipo te acompaña en la migración inicial sin costo adicional.",
  },
  {
    question: "¿Incluye facturación electrónica?",
    answer:
      "Todos los planes incluyen facturación electrónica válida ante SUNAT. El plan Pro y Empresa ofrecen emisión ilimitada de comprobantes.",
  },
  {
    question: "¿Hay prueba gratis?",
    answer:
      "Ofrecemos 14 días de prueba gratuita con acceso completo al plan Pro. No necesitas tarjeta de crédito para comenzar.",
  },
  {
    question: "¿Funciona para equipos de ventas?",
    answer:
      "Sí. HaiSales está diseñado para equipos comerciales con pipeline de ventas, asignación de responsables, reportes por vendedor y permisos por rol.",
  },
];

function QuoteIcon() {
  return (
    <svg
      width="28"
      height="22"
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-blue-600"
    >
      <path
        d="M0 24V14.4C0 10.1333 0.7 6.66667 2.1 4C3.56667 1.26667 5.9 0 9.1 0V4.8C7.16667 4.8 5.7 5.6 4.7 7.2C3.76667 8.8 3.3 10.9333 3.3 13.6H9.1V24H0ZM18.9 24V14.4C18.9 10.1333 19.6 6.66667 21 4C22.4667 1.26667 24.8 0 28 0V4.8C26.0667 4.8 24.6 5.6 23.6 7.2C22.6667 8.8 22.2 10.9333 22.2 13.6H28V24H18.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [currency, setCurrency] = useState<Currency>("pen");

  return (
    <div id="precios" className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      {/* Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:text-[11px]">
          <Star className="h-3 w-3 fill-blue-600 text-blue-600" />
          Promoción hasta el 31 de mayo del 2025
        </span>

        <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem]">
          Planes que se adaptan a tu negocio
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
          Elige el plan ideal y digitaliza tu empresa con HaiSales.
        </p>
      </div>

      {/* Billing cycle */}
      <div className="mt-8 flex justify-center overflow-x-auto pb-1">
        <div className="inline-flex min-w-max rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {billingOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setBillingCycle(option.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm",
                billingCycle === option.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="mt-4 flex justify-center">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setCurrency("pen")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm",
                currency === "pen"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Soles (S/)
            </button>
            <button
              type="button"
              onClick={() => setCurrency("usd")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm",
                currency === "usd"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Dólares (USD)
            </button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Todos los planes incluyen actualizaciones, mejoras y respaldo de datos.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3 lg:items-center lg:gap-5">
        {pricingPlans.map((plan) => {
          const price = formatPrice(plan.monthlyPricePen, billingCycle, currency);
          const currencySuffix = getCurrencySuffix(currency);
          const isHighlighted = plan.highlighted;

          return (
            <div
              key={plan.name}
              className={cn("relative flex flex-col", isHighlighted && "pt-4 lg:z-10")}
            >
              {isHighlighted && (
                <div className="absolute -top-0 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg shadow-blue-600/40">
                  <Star className="h-3 w-3 fill-white" />
                  Más popular
                </div>
              )}

              <article
                className={cn(
                  "flex h-full flex-col overflow-hidden rounded-2xl border transition-shadow",
                  isHighlighted
                    ? "border-blue-500/60 bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_20px_60px_rgba(37,99,235,0.25)] lg:scale-[1.04]"
                    : "border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)]",
                )}
              >
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
                        isHighlighted
                          ? "bg-blue-600 shadow-blue-600/40 ring-2 ring-blue-400/30"
                          : "bg-blue-600 shadow-blue-600/20",
                      )}
                    >
                      <plan.icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3
                        className={cn(
                          "text-sm font-bold sm:text-base",
                          isHighlighted ? "text-white" : "text-slate-900",
                        )}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={cn(
                          "mt-1 text-xs leading-relaxed sm:text-sm",
                          isHighlighted ? "text-slate-400" : "text-slate-500",
                        )}
                      >
                        {plan.subtitle}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-6 border-b pb-5",
                      isHighlighted ? "border-slate-700/80" : "border-slate-100",
                    )}
                  >
                    <div className="flex items-end gap-1">
                      <span
                        className={cn(
                          "text-3xl font-bold leading-none tracking-tight sm:text-4xl",
                          isHighlighted ? "text-white" : "text-slate-900",
                        )}
                      >
                        {price}
                      </span>
                      <span
                        className={cn(
                          "mb-1 text-xs font-medium",
                          isHighlighted ? "text-blue-300" : "text-slate-400",
                        )}
                      >
                        {currencySuffix}
                      </span>
                      <span
                        className={cn(
                          "mb-1 text-sm",
                          isHighlighted ? "text-slate-400" : "text-slate-400",
                        )}
                      >
                        /mes
                      </span>
                    </div>
                    <p className={cn("mt-1.5 text-xs", isHighlighted ? "text-slate-500" : "text-slate-400")}>
                      +IGV / Mensual
                    </p>
                  </div>

                  <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.label}
                        className={cn(
                          "flex items-start gap-2.5 text-xs sm:text-[13px]",
                          feature.included
                            ? isHighlighted
                              ? "text-slate-200"
                              : "text-slate-700"
                            : isHighlighted
                              ? "text-slate-500"
                              : "text-slate-400",
                        )}
                      >
                        <FeatureIcon included={feature.included} dark={isHighlighted} />
                        {feature.label}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#contacto"
                    className={cn(
                      "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition",
                      isHighlighted
                        ? "bg-blue-600 shadow-lg shadow-blue-600/30 hover:bg-blue-500"
                        : "bg-blue-600 shadow-lg shadow-blue-600/20 hover:bg-blue-500",
                    )}
                  >
                    Seleccionar plan
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            </div>
          );
        })}
      </div>

      {/* Trust footer */}
      <div className="mt-10 grid grid-cols-1 gap-6 border-t border-slate-200 pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {trustFeatures.map((item) => (
          <div key={item.title} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <item.icon className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  return (
    <div className="mt-20 sm:mt-24">
      <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
        Lo que dicen nuestros clientes
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
          >
            <QuoteIcon />
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{testimonial.quote}</p>
            <div className="mt-6 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  testimonial.avatarBg,
                  testimonial.avatarText,
                )}
              >
                {testimonial.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a]">{testimonial.name}</p>
                <p className="text-xs text-slate-500">{testimonial.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "h-2 w-2 rounded-full",
              index === 0 ? "bg-blue-600" : "bg-slate-200",
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

function FaqSection() {
  return (
    <div className="mt-20 sm:mt-24">
      <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
        Preguntas frecuentes
      </h2>

      <Accordion type="single" collapsible className="mx-auto mt-10 max-w-2xl w-full">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={faq.question}
            value={`item-${index}`}
            className="border-slate-200"
          >
            <AccordionTrigger className="py-5 text-left text-[15px] font-semibold text-[#0f172a] hover:no-underline [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-slate-400">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-sm leading-relaxed text-slate-500">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export function LandingClosingSections() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
      </div>
    </section>
  );
}
