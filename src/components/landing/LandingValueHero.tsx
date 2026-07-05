import { BarChart3, FileText, Receipt, Users, type LucideIcon } from "lucide-react";

const features: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}[] = [
  {
    icon: Users,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Clientes centralizados",
    description: "Organiza contactos, historial y seguimiento en una sola vista.",
  },
  {
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Cotizaciones rápidas",
    description: "Crea propuestas profesionales y conviértelas en ventas.",
  },
  {
    icon: Receipt,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Facturación electrónica",
    description: "Emite comprobantes, controla pagos y reduce tareas manuales.",
  },
  {
    icon: BarChart3,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Reportes en tiempo real",
    description: "Mide ingresos, oportunidades y cierres desde tu dashboard.",
  },
];

export function LandingValueHero() {
  return (
    <section className="bg-gradient-to-b from-blue-50/70 via-white to-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
            Todo lo que necesitas para vender mejor
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
            Cuatro herramientas clave para ordenar tu proceso comercial desde el primer día.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {features.map((item) => (
            <article
              key={item.title}
              className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                >
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} strokeWidth={1.75} />
                </span>
                <h3 className="pt-1 text-base font-bold leading-tight tracking-tight text-slate-900">
                  {item.title}
                </h3>
              </div>

              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-500">{item.description}</p>

              <span className="mt-5 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">
                Incluido en HaiSales
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
