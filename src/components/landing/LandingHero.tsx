import { ArrowRight, Check, LayoutGrid } from "lucide-react";

const trustPoints = [
  "Sin tarjeta de crédito",
  "Configuración en minutos",
  "Soporte en español",
];

export function LandingHero() {
  return (
    <section id="inicio" className="relative overflow-x-hidden bg-[#050816] pt-28 pb-16 sm:pt-32 sm:pb-24">
      <div className="pointer-events-none absolute bottom-0 right-0 h-[640px] w-[640px] rounded-full bg-blue-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute left-1/4 top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto grid max-w-[90rem] grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,50%)_minmax(0,50%)] lg:gap-12 lg:px-8">
        <div className="max-w-2xl lg:max-w-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              TODO LO QUE TU EQUIPO NECESITA
            </span>
          </div>

          <h1 className="mt-8 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:max-w-none lg:text-[3.25rem] lg:leading-[1.12]">
            Convierte oportunidades en ventas facturadas{" "}
            <span className="text-blue-500">en minutos, no en días</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg lg:max-w-xl">
            Centraliza clientes, cotizaciones y facturación electrónica en una plataforma que tu
            equipo adopta desde el primer día.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
            >
              Probar Gratis 14 días
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#precios"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-transparent px-5 py-3 text-[13px] font-medium text-white transition hover:bg-white/5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25">
                <LayoutGrid className="h-3 w-3 text-white" />
              </span>
              Ver Planes
            </a>
          </div>

          <div className="mt-5 flex flex-nowrap items-center gap-4 sm:gap-6">
            {trustPoints.map((point) => (
              <div key={point} className="flex shrink-0 items-center gap-1.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600/50">
                  <Check className="h-2.5 w-2.5 text-blue-200" strokeWidth={3} />
                </span>
                <span className="whitespace-nowrap text-[11px] text-slate-500 sm:text-xs">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:-mr-7 xl:-mr-9">
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-blue-500/10 blur-3xl" />
          <img
            src="/mockups.png"
            alt="Vista previa de HaiSales en escritorio y móvil"
            className="relative z-10 mx-auto block h-auto w-full min-w-0 origin-center rounded-2xl shadow-2xl shadow-black/50 lg:mx-0 lg:scale-[1.07] lg:origin-center xl:scale-[1.09] 2xl:scale-[1.11]"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
