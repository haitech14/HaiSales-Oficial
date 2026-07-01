import { ArrowRight, Info, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingPromoBanner({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={cn(
        "bg-white px-4 sm:px-6 lg:px-8",
        compact ? "pb-0 pt-4 sm:pb-1 sm:pt-6" : "py-8 sm:py-10",
      )}
    >      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 rounded-2xl border border-blue-100 bg-[#f0f7ff] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 shadow-md shadow-blue-600/20">
              <Rocket className="h-5 w-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 sm:text-lg">
                Impulsa tu negocio con HaiSales
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
                Unete a cientos de empresas que ya optimizan sus procesos y aumentan sus ventas con
                nuestra plataforma.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#precios"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Conocer Precios
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500"
              >
                Probar gratis 14 dias
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-blue-500 sm:justify-end">
              <Info className="h-3.5 w-3.5" />
              No se requiere tarjeta de credito
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
