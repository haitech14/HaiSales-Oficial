import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Puedo migrar mis clientes?",
    answer:
      "Sí. Puedes importar contactos, empresas y productos desde Excel o desde otras herramientas. Nuestro equipo te acompaña en la migración inicial sin costo adicional.",
  },
  {
    question: "¿Incluye facturación electrónica?",
    answer:
      "Todos los planes incluyen facturación electrónica válida ante SUNAT. El plan Pro y Empresa ofrecen emisión ilimitada de comprobantes.",
  },
  {
    question: "¿Hay prueba gratis?",
    answer:
      "Ofrecemos 14 días de prueba gratuita con acceso completo al plan Pro. No necesitas tarjeta de crédito para comenzar.",
  },
  {
    question: "¿Funciona para equipos de ventas?",
    answer:
      "Sí. HaiSales está diseñado para equipos comerciales con pipeline de ventas, asignación de responsables, reportes por vendedor y permisos por rol.",
  },
];

export function LandingFAQ() {
  return (
    <section className="bg-white px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
          Preguntas frecuentes
        </h2>

        <Accordion type="single" collapsible className="mt-10 w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="border-slate-200"
            >
              <AccordionTrigger className="py-5 text-left text-[15px] font-medium text-[#0f172a] hover:no-underline [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-slate-400">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-slate-500">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
