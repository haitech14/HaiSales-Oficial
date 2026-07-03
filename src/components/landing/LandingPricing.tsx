import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 49,
    description: "Para emprendedores que están comenzando.",
    features: [
      "CRM básico",
      "1 usuario",
      "100 comprobantes/mes",
      "Cotizaciones",
      "Soporte por chat",
    ],
    cta: "Empezar",
  },
  {
    name: "Pro",
    monthlyPrice: 99,
    description: "Para equipos que quieren vender y facturar más.",
    features: [
      "5 usuarios",
      "CRM avanzado",
      "Facturación electrónica ilimitada",
      "Automatizaciones",
      "Reportes avanzados",
      "Inventario",
    ],
    cta: "Elegir Pro",
    highlighted: true,
  },
  {
    name: "Empresa",
    monthlyPrice: 249,
    description: "Para empresas que requieren escala y control total.",
    features: [
      "Usuarios ilimitados",
      "Multi-sucursal",
      "Integraciones",
      "Permisos avanzados",
      "Onboarding personalizado",
      "Soporte prioritario",
    ],
    cta: "Contactar ventas",
  },
];

const ANNUAL_DISCOUNT = 0.17;

function getDisplayPrice(monthlyPrice: number, isAnnual: boolean) {
  if (!isAnnual) return monthlyPrice;
  return Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT));
}

export function LandingPricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="planes" className="bg-white px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="relative mb-10 sm:mb-12">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
            Planes para crecer desde el primer mes
          </h2>

          <div className="mt-6 flex items-center justify-center gap-2.5 lg:absolute lg:right-0 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  !isAnnual
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  isAnnual
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Anual
              </button>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
              Ahorra 17%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-4">
          {plans.map((plan) => {
            const price = getDisplayPrice(plan.monthlyPrice, isAnnual);

            return (
              <article
                key={plan.name}
                className={cn(
                  "flex flex-col overflow-hidden rounded-2xl bg-white",
                  plan.highlighted
                    ? "border-2 border-blue-600 shadow-[0_8px_30px_rgba(37,99,235,0.14)] lg:scale-[1.02]"
                    : "border border-slate-200",
                )}
              >
                {plan.highlighted && (
                  <div className="bg-blue-600 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                    MÁS POPULAR
                  </div>
                )}

                <div className={cn("flex flex-1 flex-col px-6 pb-6 pt-7", plan.highlighted && "pt-6")}>
                  <h3 className="text-[17px] font-bold text-[#0f172a]">{plan.name}</h3>

                  <div className="mt-4 flex items-end gap-0.5">
                    <span className="mb-1.5 text-sm font-medium text-slate-400">S/</span>
                    <span className="text-[2.75rem] font-bold leading-none tracking-tight text-[#0f172a]">
                      {price}
                    </span>
                    <span className="mb-1.5 text-sm text-slate-400">/mes</span>
                  </div>

                  {isAnnual && (
                    <p className="mt-1 text-xs text-emerald-600">Facturado anualmente</p>
                  )}

                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{plan.description}</p>

                  <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={3} />
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
