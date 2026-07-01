import { ArrowRight, FileCheck, Handshake, UserPlus, Wallet } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Captura lead",
    description: "Registra prospectos desde formularios, WhatsApp o importación masiva.",
  },
  {
    number: 2,
    icon: Handshake,
    title: "Cierra venta",
    description: "Gestiona oportunidades, cotizaciones y negociaciones hasta el cierre.",
  },
  {
    number: 3,
    icon: FileCheck,
    title: "Emite factura",
    description: "Genera comprobantes electrónicos válidos en segundos.",
  },
  {
    number: 4,
    icon: Wallet,
    title: "Cobra y analiza",
    description: "Controla pagos, cobranzas y métricas de rendimiento comercial.",
  },
];

export function LandingProcessFlow() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Del lead a la factura en minutos
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map((step, index) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              {index < steps.length - 1 && (
                <ArrowRight
                  className="absolute -right-3 top-16 hidden h-5 w-5 text-slate-300 lg:block xl:-right-5"
                  strokeWidth={1.5}
                />
              )}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                {step.number}
              </span>
              <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                <step.icon className="h-8 w-8 text-slate-700" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 max-w-[200px] text-sm leading-relaxed text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
