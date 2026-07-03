import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CreditCard,
  Headphones,
  Lock,
  RefreshCw,
  Star,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  billingOptions,
  buildCheckoutPath,
  formatPlanPrice,
  getCurrencySuffix,
  pricingPlans,
  type BillingCycle,
  type Currency,
  type PricingPlan,
} from "@/lib/pricing/plans";
import { cn } from "@/lib/utils";

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

function PricingPlanCard({
  plan,
  billingCycle,
  currency,
  featured = false,
}: {
  plan: PricingPlan;
  billingCycle: BillingCycle;
  currency: Currency;
  featured?: boolean;
}) {
  const price = formatPlanPrice(plan.monthlyPricePen, billingCycle, currency);
  const currencySuffix = getCurrencySuffix(currency);

  return (
    <div className={cn("relative flex flex-col", featured && "pt-4")}>
      {featured && (
        <div className="absolute -top-0 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg shadow-blue-600/25">
          <Star className="h-3 w-3 fill-white" />
          Más popular
        </div>
      )}

      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)]",
          featured && "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_20px_50px_rgba(37,99,235,0.12)]",
        )}
      >
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-600/20">
              <plan.icon className="h-5 w-5 text-white" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {plan.name}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{plan.subtitle}</p>
            </div>
          </div>

          <div className="mt-6 border-b border-slate-100 pb-5">
            <div className="flex items-end gap-1">
              <span className="font-bold leading-none tracking-tight text-slate-900 text-3xl sm:text-4xl">
                {price}
              </span>
              <span className="mb-1 text-xs font-medium text-slate-400">{currencySuffix}</span>
              <span className="mb-1 text-sm text-slate-400">/mes</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">+IGV / Mensual</p>
          </div>

          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            {plan.includesLabel && (
              <li className="flex items-start gap-2.5 text-xs font-medium text-slate-800 sm:text-[13px]">
                <FeatureIcon included />
                {plan.includesLabel}
              </li>
            )}
            {plan.features.map((feature) => (
              <li
                key={feature.label}
                className={cn(
                  "flex items-start gap-2.5 text-xs sm:text-[13px]",
                  feature.included ? "text-slate-700" : "text-slate-400",
                )}
              >
                <FeatureIcon included={feature.included} />
                {feature.label}
              </li>
            ))}
          </ul>

          <div className={cn("mt-6 space-y-2", featured && "sm:max-w-md")}>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Probar Gratis 14 días
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={buildCheckoutPath(plan.slug, billingCycle, currency)}
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Comprar ahora
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [currency, setCurrency] = useState<Currency>("pen");

  const entryPlan = pricingPlans.find((plan) => plan.slug === "microempresa");
  const featuredPlan = pricingPlans.find((plan) => plan.slug === "emprendedor");
  const corporatePlan = pricingPlans.find((plan) => plan.slug === "corporativo");

  if (!entryPlan || !featuredPlan || !corporatePlan) {
    return null;
  }

  return (
    <section
      id="planes"
      className="relative overflow-hidden bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-100/60 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-50 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
      {/* Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:text-[11px]">
          <Star className="h-3 w-3 fill-blue-500 text-blue-500" />
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
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setCurrency("pen")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm",
              currency === "pen" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            Soles (S/)
          </button>
          <button
            type="button"
            onClick={() => setCurrency("usd")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm",
              currency === "usd" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            Dólares (USD)
          </button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3 lg:gap-6">
        <PricingPlanCard plan={entryPlan} billingCycle={billingCycle} currency={currency} />
        <PricingPlanCard
          plan={featuredPlan}
          billingCycle={billingCycle}
          currency={currency}
          featured
        />
        <PricingPlanCard plan={corporatePlan} billingCycle={billingCycle} currency={currency} />
      </div>

      {/* Trust footer */}
      <div className="mt-12 grid grid-cols-1 gap-6 border-t border-slate-200 pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {trustFeatures.map((item) => (
          <div key={item.title} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
              <item.icon className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
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
    <>
      <PricingSection />
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <TestimonialsSection />
          <FaqSection />
        </div>
      </section>
    </>
  );
}
