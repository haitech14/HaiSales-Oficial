import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Qué es HaiSales y para qué sirve?",
    answer:
      "HaiSales es una plataforma todo en uno para gestionar ventas, CRM y facturación electrónica. Te ayuda a centralizar clientes, oportunidades, cotizaciones y comprobantes en un solo lugar.",
  },
  {
    question: "¿HaiSales incluye facturación electrónica SUNAT?",
    answer:
      "Sí. HaiSales permite emitir comprobantes electrónicos válidos ante SUNAT, incluyendo facturas, boletas y notas, directamente desde la plataforma.",
  },
  {
    question: "¿Puedo probar HaiSales gratis?",
    answer:
      "Sí. Ofrecemos 14 días de prueba gratuita con acceso completo al plan Pro. No necesitas tarjeta de crédito para comenzar.",
  },
  {
    question: "¿Cómo es el soporte y la implementación?",
    answer:
      "Nuestro equipo te acompaña en la configuración inicial, migración de datos y capacitación. El soporte está disponible en español por chat y email, con atención prioritaria en planes superiores.",
  },
  {
    question: "¿Puedo cancelar mi plan cuando quiera?",
    answer:
      "Sí. No hay contratos de permanencia. Puedes cancelar tu suscripción en cualquier momento desde tu panel de configuración sin penalidades.",
  },
];

export function LandingHelpFAQ() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Preguntas frecuentes
        </h2>

        <Accordion type="single" collapsible className="mt-10 w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`help-item-${index}`}
              className="border-slate-200"
            >
              <AccordionTrigger className="py-5 text-left text-[15px] font-medium text-slate-900 hover:no-underline [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-slate-400">
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
