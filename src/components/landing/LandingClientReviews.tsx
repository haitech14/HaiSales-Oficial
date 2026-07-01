import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "HaiSales centralizó todo nuestro proceso comercial. Ahora tenemos visibilidad total, y nuestras ventas aumentaron más del 30%.",
    name: "María Fernanda López",
    role: "Gerente Comercial, TechGlobal S.A.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
  },
  {
    quote:
      "La facturación electrónica integrada nos ahorra horas cada semana y cumplimos 100% con SUNAT.",
    name: "Juan Carlos Pérez",
    role: "CEO, Innova Solutions",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
  },
  {
    quote:
      "Nuestro equipo está más organizado, cumplimos más actividades y cerramos más oportunidades.",
    name: "Ana Torres",
    role: "Jefa de Ventas, Marketing Pro",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
  },
  {
    quote:
      "Los reportes en tiempo real nos permiten tomar decisiones más rápidas y con mejor información.",
    name: "Ricardo Gómez",
    role: "Director Comercial, Logística Norte",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  },
  {
    quote:
      "La migración fue sencilla y el soporte en español nos acompañó en cada paso del proceso.",
    name: "Lucía Mendoza",
    role: "COO, Distribuidora Andina",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
  },
  {
    quote:
      "Pasamos de Excel a un CRM que todo el equipo adoptó en menos de una semana.",
    name: "Carlos Ruiz",
    role: "Gerente de Ventas, Ferretería Central",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
  },
];

function QuoteIcon() {
  return (
    <svg
      width="24"
      height="20"
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-slate-300"
    >
      <path
        d="M0 24V14.4C0 10.1333 0.7 6.66667 2.1 4C3.56667 1.26667 5.9 0 9.1 0V4.8C7.16667 4.8 5.7 5.6 4.7 7.2C3.76667 8.8 3.3 10.9333 3.3 13.6H9.1V24H0ZM18.9 24V14.4C18.9 10.1333 19.6 6.66667 21 4C22.4667 1.26667 24.8 0 28 0V4.8C26.0667 4.8 24.6 5.6 23.6 7.2C22.6667 8.8 22.2 10.9333 22.2 13.6H28V24H18.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StarRating() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 de 5 estrellas">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
      ))}
    </div>
  );
}

function ReviewCard({ quote, name, role, avatar }: (typeof testimonials)[number]) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
      <QuoteIcon />
      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">{quote}</p>
      <div className="mt-5">
        <StarRating />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </article>
  );
}

export function LandingClientReviews() {
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
    <section className="bg-[#f7f8fa] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            Empresas que ya venden más con HaiSales.
          </p>
        </div>

        <div className="mt-10 overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="min-w-0 shrink-0 grow-0 basis-full pr-4 sm:basis-1/2 lg:basis-1/3"
              >
                <ReviewCard {...testimonial} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {scrollSnaps.slice(0, 4).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir al testimonio ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                selectedIndex === index ? "bg-blue-600" : "bg-slate-300 hover:bg-slate-400",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
