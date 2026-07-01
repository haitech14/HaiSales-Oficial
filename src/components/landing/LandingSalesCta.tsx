import { Check, Headphones, Play, Shield } from "lucide-react";

const trustItems = [
  { icon: Check, label: "Implementación rápida" },
  { icon: Shield, label: "Datos 100% seguros" },
  { icon: Headphones, label: "Soporte en español" },
];

function DotPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-[45%] overflow-hidden rounded-r-2xl"
      aria-hidden="true"
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cta-dot-grid" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.25" fill="rgba(148,163,184,0.3)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cta-dot-grid)" />
      </svg>
    </div>
  );
}

export function LandingSalesCta() {
  return (
    <section className="bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-[#0a1628] px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <DotPattern />

        <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-10">
          <div className="max-w-lg">
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2rem]">
              Convierte cada contacto en una venta
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
              Únete a cientos de empresas que ya venden más con{" "}
              <span className="font-semibold text-blue-400">HaiSales</span>.
            </p>
          </div>

          <div className="flex flex-col items-start gap-5 lg:items-end">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <a
                href="#contacto"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Comenzar ahora
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/40">
                  <Play className="h-3 w-3 fill-white text-white" />
                </span>
                Ver demo
              </a>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 lg:justify-end">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-white">
                  <item.icon className="h-4 w-4 text-blue-400" strokeWidth={2} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
