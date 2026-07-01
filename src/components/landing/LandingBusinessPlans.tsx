import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  description: string;
  price: string;
  priceSuffix: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    description: "Ideal para pequeños equipos que están comenzando.",
    price: "S/ 49",
    priceSuffix: "por usuario / mes",
    features: [
      "CRM básico",
      "Pipeline de ventas",
      "Cotizaciones",
      "Hasta 3 usuarios",
      "Soporte por email",
    ],
    cta: "Comenzar ahora",
  },
  {
    name: "Pro",
    description: "Para equipos en crecimiento que quieren escalar.",
    price: "S/ 99",
    priceSuffix: "por usuario / mes",
    features: [
      "Todo en Starter",
      "Automatizaciones",
      "Facturación electrónica",
      "Reportes avanzados",
      "Hasta 10 usuarios",
    ],
    cta: "Comenzar ahora",
    highlighted: true,
  },
  {
    name: "Empresa",
    description: "Para empresas que requieren personalización y soporte dedicado.",
    price: "Personalizado",
    priceSuffix: "Contáctanos",
    features: [
      "Todo en Pro",
      "Personalizaciones",
      "API e integraciones",
      "Usuarios ilimitados",
      "Soporte prioritario",
    ],
    cta: "Hablar con ventas",
  },
];

export function LandingBusinessPlans() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Planes que se adaptan a tu negocio
          </h2>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            Elige el plan perfecto para ti. Sin contratos. Cancela cuando quieras.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-4">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-2xl bg-white",
                plan.highlighted
                  ? "border-2 border-blue-600 shadow-[0_8px_30px_rgba(37,99,235,0.12)]"
                  : "border border-slate-200",
              )}
            >
              {plan.highlighted && (
                <div className="bg-blue-600 py-2 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                  MÁS RECOMENDADO
                </div>
              )}

              <div className={cn("flex flex-1 flex-col px-6 pb-6 pt-7", plan.highlighted && "pt-6")}>
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{plan.description}</p>

                <div className="mt-5">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">{plan.price}</span>
                  <p className="mt-1 text-sm text-slate-500">{plan.priceSuffix}</p>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contacto"
                  className={cn(
                    "mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors",
                    plan.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "border border-blue-600 bg-white text-blue-600 hover:bg-blue-50",
                  )}
                >
                  {plan.cta}
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          <span aria-hidden="true">🔒</span> Pago 100% seguro{" "}
          <span className="mx-2 text-slate-300">•</span>
          Facturación electrónica{" "}
          <span className="mx-2 text-slate-300">•</span>
          Sin permanencia
        </p>
      </div>
    </section>
  );
}
