export type WhatsAppPlantillaId = "lista-precios" | "seguimiento";

export type WhatsAppPlantilla = {
  id: WhatsAppPlantillaId;
  attachPdfs: boolean;
  defaultSelected?: boolean;
};

const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function mesActualLabel(date = new Date()): string {
  return MESES_ES[date.getMonth()] ?? "Agosto";
}

export function firstNameFromContact(nombre: string): string {
  const cleaned = nombre.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned === "—") return "";
  return cleaned.split(" ")[0] ?? "";
}

export const WHATSAPP_PLANTILLAS: WhatsAppPlantilla[] = [
  { id: "lista-precios", attachPdfs: true, defaultSelected: true },
  { id: "seguimiento", attachPdfs: false },
];

export function plantillaLabel(id: WhatsAppPlantillaId, mes = mesActualLabel()): string {
  if (id === "lista-precios") return `LISTA DE PRECIOS del MES ${mes}`;
  return "Seguimiento";
}

export function buildPlantillaCopy(options: {
  id: WhatsAppPlantillaId;
  contacto: string;
  mes?: string;
  pdfUrls?: string[];
  includePdfLinks?: boolean;
}): string {
  const mes = options.mes ?? mesActualLabel();
  const nombre = firstNameFromContact(options.contacto);
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";

  if (options.id === "seguimiento") {
    return `${saludo}\n\nTe escribo para darte seguimiento. ¿En qué te puedo ayudar hoy?`;
  }

  const lines = [
    saludo,
    "",
    `Te comparto la LISTA DE PRECIOS del MES ${mes}.`,
    "",
    "Adjunto las dos listas vigentes.",
  ];

  if (options.includePdfLinks && options.pdfUrls?.length) {
    lines.push("");
    options.pdfUrls.forEach((url, index) => {
      lines.push(`Lista ${index + 1}: ${url}`);
    });
  }

  return lines.join("\n");
}
