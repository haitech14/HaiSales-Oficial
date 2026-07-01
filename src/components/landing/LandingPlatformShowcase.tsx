import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  BarChart3,
  Check,
  Cloud,
  Headphones,
  Layers,
  Package,
  Receipt,
  Shield,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  iconBg: string;
  checkBg: string;
}

const slides: FeatureCard[][] = [
  [
    {
      icon: Users,
      title: "CRM Inteligente",
      description: "Gestiona clientes, contactos y oportunidades de venta en un solo lugar.",
      bullets: ["Gestion de clientes", "Seguimiento de oportunidades", "Historial de interacciones"],
      iconBg: "bg-blue-600",
      checkBg: "bg-blue-600",
    },
    {
      icon: TrendingUp,
      title: "Ventas y Cotizaciones",
      description: "Crea cotizaciones profesionales y conviértelas en ventas en segundos.",
      bullets: ["Cotizaciones rapidas", "Conversion a ventas", "Plantillas personalizadas"],
      iconBg: "bg-emerald-500",
      checkBg: "bg-emerald-500",
    },
    {
      icon: Receipt,
      title: "Facturación Electrónica",
      description: "Emite comprobantes electronicos validos ante la SUNAT de forma rapida y segura.",
      bullets: ["Boletas y facturas", "Envio automatico", "Cumplimiento SUNAT"],
      iconBg: "bg-violet-600",
      checkBg: "bg-violet-600",
    },
    {
      icon: Package,
      title: "Inventario Controlado",
      description: "Controla productos, stock y movimientos con precision en tiempo real.",
      bullets: ["Control de stock", "Movimientos de inventario", "Multi almacenes"],
      iconBg: "bg-orange-500",
      checkBg: "bg-orange-500",
    },
  ],
  [
    {
      icon: BarChart3,
      title: "Reportes en Tiempo Real",
      description: "Toma mejores decisiones con reportes y estadísticas actualizadas al instante.",
      bullets: ["Reportes dinamicos", "Graficos interactivos", "Exportacion de datos"],
      iconBg: "bg-teal-500",
      checkBg: "bg-teal-500",
    },
    {
      icon: Layers,
      title: "Kardex Automatizado",
      description: "Controla entradas, salidas y movimientos de tu inventario con total precision.",
      bullets: ["Kardex en tiempo real", "Valorizacion de inventario", "Trazabilidad completa"],
      iconBg: "bg-orange-500",
      checkBg: "bg-orange-500",
    },
    {
      icon: Shield,
      title: "Multiusuario y Seguro",
      description: "Roles y permisos personalizados con altos estandares de seguridad.",
      bullets: ["Roles y permisos", "Actividad de usuarios", "Respaldo de informacion"],
      iconBg: "bg-pink-500",
      checkBg: "bg-pink-500",
    },
    {
      icon: Cloud,
      title: "Todo en la Nube",
      description: "Accede desde cualquier lugar y dispositivo. Tu informacion siempre segura.",
      bullets: ["Acceso 24/7", "Alta disponibilidad", "Copia de seguridad"],
      iconBg: "bg-blue-600",
      checkBg: "bg-blue-600",
    },
  ],
  [
    {
      icon: Headphones,
      title: "Soporte Especializado",
      description: "Nuestro equipo te acompaña en la implementacion y crecimiento del sistema.",
      bullets: ["Atencion rapida", "Asesoria funcional", "Acompañamiento continuo"],
      iconBg: "bg-violet-600",
      checkBg: "bg-violet-600",
    },
    {
      icon: Zap,
      title: "Automatizacion Comercial",
      description: "Automatiza tareas repetitivas y mejora la productividad de tu equipo.",
      bullets: ["Flujos automáticos", "Recordatorios inteligentes", "Mayor eficiencia"],
      iconBg: "bg-emerald-500",
      checkBg: "bg-emerald-500",
    },
    {
      icon: Shield,
      title: "Seguridad Avanzada",
      description: "Protege tu informacion con controles de acceso y respaldo continuo.",
      bullets: ["Respaldo diario", "Control por roles", "Proteccion de datos"],
      iconBg: "bg-blue-600",
      checkBg: "bg-blue-600",
    },
    {
      icon: Users,
      title: "CRM Inteligente",
      description: "Gestiona clientes, contactos y oportunidades de venta en un solo lugar.",
      bullets: ["Gestion de clientes", "Seguimiento de oportunidades", "Historial de interacciones"],
      iconBg: "bg-indigo-600",
      checkBg: "bg-indigo-600",
    },
  ],
];

function PlatformFeatureCard({ icon: Icon, title, description, bullets, iconBg, checkBg }: FeatureCard) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white px-5 py-7 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50" />
      <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-bl-[2rem] bg-slate-50/80" />

      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-xl shadow-sm">
        <div className={`flex h-full w-full items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
        </div>
      </div>

      <h3 className="relative mt-5 text-center text-base font-bold text-slate-900">{title}</h3>
      <p className="relative mt-2 text-center text-sm leading-relaxed text-slate-500">{description}</p>

      <ul className="relative mt-6 space-y-3 border-t border-slate-100 pt-5">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2.5 text-sm text-slate-600">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${checkBg}`}>
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </span>
            {bullet}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function LandingPlatformShowcase() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  return (
    <section className="relative overflow-hidden bg-white px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-purple-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            CRM + Facturación todo en uno
          </span>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            <span className="block text-slate-900">Gestiona tu empresa de principio a fin</span>
            <span className="mt-1 block whitespace-nowrap">
              <span className="text-blue-600">con una sola </span>
              <span className="text-violet-600">plataforma</span>
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
            Todas las herramientas que necesitas para hacer crecer tu negocio,
            <br className="hidden sm:block" />
            {" "}integradas en un solo lugar
          </p>
        </div>

        {/* Carousel */}
        <div className="mt-10 overflow-hidden sm:mt-12" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, slideIndex) => (
              <div key={slideIndex} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                  {slide.map((card) => (
                    <PlatformFeatureCard key={`${slideIndex}-${card.title}`} {...card} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir al slide ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                selectedIndex === index
                  ? "w-8 bg-blue-600"
                  : "w-2 bg-slate-200 hover:bg-slate-300",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
