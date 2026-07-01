import { FileCheck, Target, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const steps: {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    number: 1,
    icon: Users,
    title: "1. Registra tus clientes",
    description:
      "Importa o agrega tus clientes y contactos. Centraliza toda la información en un solo lugar.",
  },
  {
    number: 2,
    icon: Target,
    title: "2. Gestiona oportunidades",
    description:
      "Crea oportunidades, da seguimiento con actividades y mueve tu pipeline hacia adelante.",
  },
  {
    number: 3,
    icon: FileCheck,
    title: "3. Cierra y factura",
    description:
      "Cierra la venta, genera tu factura electrónica y sigue creciendo con reportes en tiempo real.",
  },
];

function DottedArrow() {
  return (
    <div className="hidden shrink-0 items-center lg:flex" aria-hidden="true">
      <svg width="48" height="12" viewBox="0 0 48 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line
          x1="0"
          y1="6"
          x2="36"
          y2="6"
          stroke="#2563eb"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <path d="M40 6L34 2V10L40 6Z" fill="#2563eb" />
      </svg>
    </div>
  );
}

export function LandingEasyStart() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Así de fácil, así de rápido
          </h2>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            Empieza hoy y ve resultados en días.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 lg:mt-14 lg:flex-row lg:items-stretch lg:justify-center">
          {steps.map((step, index) => (
            <div key={step.title} className="contents">
              <article className="relative w-full max-w-sm flex-1 rounded-2xl border border-slate-100 bg-white px-6 pb-8 pt-6 text-center shadow-[0_4px_24px_rgba(15,23,42,0.06)] lg:max-w-none">
                <span className="absolute left-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {step.number}
                </span>

                <div className="mx-auto mt-2 flex h-16 w-16 items-center justify-center">
                  <step.icon className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
              </article>

              {index < steps.length - 1 && <DottedArrow />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
