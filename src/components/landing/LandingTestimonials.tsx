import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "HaiSales nos ayudó a ordenar todo nuestro proceso comercial. Ahora facturamos más rápido y tenemos visibilidad total de nuestras ventas.",
    initials: "MR",
    name: "Marta Rios",
    role: "Gerente General, Innova Soluciones",
    avatarBg: "bg-emerald-100",
    avatarText: "text-emerald-700",
  },
  {
    quote:
      "La facturación electrónica es súper sencilla y el soporte en español siempre está cuando lo necesitamos.",
    initials: "CM",
    name: "Carlos Medina",
    role: "Director Comercial, Constructiva Grupo",
    avatarBg: "bg-blue-100",
    avatarText: "text-blue-700",
  },
  {
    quote:
      "Pasamos de hojas de Excel a un sistema que nos da reportes claros y nos ha permitido crecer sin desorden.",
    initials: "LT",
    name: "Lucia Torres",
    role: "Gerente Financiera, Verde Distribuciones",
    avatarBg: "bg-emerald-50",
    avatarText: "text-emerald-600",
  },
  {
    quote:
      "El pipeline de ventas nos permitió duplicar nuestra tasa de cierre en solo tres meses. El equipo lo adoptó desde el primer día.",
    initials: "JP",
    name: "Jorge Paredes",
    role: "CEO, Logística Norte",
    avatarBg: "bg-blue-50",
    avatarText: "text-blue-600",
  },
  {
    quote:
      "Integrar inventario con facturación nos ahorró horas cada semana. Ya no tenemos errores entre stock y comprobantes.",
    initials: "AS",
    name: "Ana Soto",
    role: "Operaciones, Ferretería Central",
    avatarBg: "bg-emerald-100",
    avatarText: "text-emerald-700",
  },
  {
    quote:
      "Los reportes en tiempo real cambiaron cómo tomamos decisiones. Ahora sabemos exactamente qué vendedor necesita apoyo.",
    initials: "RG",
    name: "Ricardo Gómez",
    role: "Gerente Comercial, TechPeru",
    avatarBg: "bg-blue-100",
    avatarText: "text-blue-700",
  },
];

function QuoteIcon() {
  return (
    <svg
      width="28"
      height="22"
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-blue-600"
    >
      <path
        d="M0 24V14.4C0 10.1333 0.7 6.66667 2.1 4C3.56667 1.26667 5.9 0 9.1 0V4.8C7.16667 4.8 5.7 5.6 4.7 7.2C3.76667 8.8 3.3 10.9333 3.3 13.6H9.1V24H0ZM18.9 24V14.4C18.9 10.1333 19.6 6.66667 21 4C22.4667 1.26667 24.8 0 28 0V4.8C26.0667 4.8 24.6 5.6 23.6 7.2C22.6667 8.8 22.2 10.9333 22.2 13.6H28V24H18.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TestimonialCard({
  quote,
  initials,
  name,
  role,
  avatarBg,
  avatarText,
}: (typeof testimonials)[number]) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <QuoteIcon />
      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{quote}</p>
      <div className="mt-6 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            avatarBg,
            avatarText,
          )}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-[#0f172a]">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </article>
  );
}

export function LandingTestimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
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
    <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
          Lo que dicen nuestros clientes
        </h2>

        <div className="mt-10 overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="min-w-0 shrink-0 grow-0 basis-full pl-0 pr-4 sm:basis-1/2 lg:basis-1/3"
              >
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir al testimonio ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                selectedIndex === index ? "w-2 bg-blue-600" : "w-2 bg-slate-200 hover:bg-slate-300",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
