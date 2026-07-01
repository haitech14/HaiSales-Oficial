import { FileText, LineChart, RefreshCw } from "lucide-react";

const highlights = [
  {
    icon: RefreshCw,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Seguimiento automático",
    description:
      "Automatiza tareas y recordatorios para que ningún cliente ni oportunidad se te escape.",
  },
  {
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Facturación electrónica",
    description:
      "Emite, envía y controla tus facturas electrónicas cumpliendo con la SUNAT de forma simple.",
  },
  {
    icon: LineChart,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Reportes en tiempo real",
    description: "Visualiza indicadores clave y toma decisiones basadas en datos actualizados al instante.",
  },
];

export function LandingValueHero() {
  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,42%)_minmax(0,58%)] lg:gap-10">
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            Deja de vender en hojas sueltas
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
            Centraliza tus procesos y elimina el desorden con funciones que te hacen más productivo cada
            día.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5">
          {highlights.map((item) => (
            <div key={item.title} className="flex flex-col">
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${item.iconBg}`}
              >
                <item.icon className={`h-5 w-5 ${item.iconColor}`} strokeWidth={2} />
              </div>
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
