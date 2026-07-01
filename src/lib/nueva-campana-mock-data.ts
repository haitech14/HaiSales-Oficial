export const campanaAudiencias = [
  "Nuevos leads — últimos 30 días",
  "Clientes activos — compras recurrentes",
  "Prospectos en negociación",
  "Clientes inactivos — reactivación",
];

export const campanaListas = [
  "Leads WhatsApp Ads Q2 (1,248)",
  "Base clientes corporativos (386)",
  "Prospectos feria comercial (92)",
  "Lista promoción junio (540)",
];

export const campanaPlantillas = [
  {
    label: "Promoción exclusiva",
    preview: `Hola {{nombre}}, 👋
Tenemos una promoción exclusiva para ti.
Descubre todos los beneficios que tenemos preparados.
¿Te gustaría saber más?`,
  },
  {
    label: "Seguimiento comercial",
    preview: `Hola {{nombre}}, 👋
Queremos darte seguimiento sobre tu consulta reciente.
Un asesor está listo para ayudarte.
¿Podemos conversar hoy?`,
  },
  {
    label: "Recordatorio de cotización",
    preview: `Hola {{nombre}}, 👋
Tu cotización sigue vigente por tiempo limitado.
Revisa los beneficios incluidos en nuestra propuesta.
¿Te gustaría avanzar?`,
  },
];

export const campanaVariables = ["{{nombre}}", "{{empresa}}", "{{producto}}", "{{enlace}}"];

export const campanaObjetivos = [
  "Generar leads calificados",
  "Reactivar clientes inactivos",
  "Promocionar producto o servicio",
  "Agendar demostración comercial",
];

export const campanaEtapasCrm = [
  "Prospectos",
  "Calificación",
  "Propuesta",
  "Negociación",
  "Cierre ganado",
];

export const campanaPrioridades = ["Alta", "Media", "Baja"] as const;

export const campanaHorarios = [
  "09:00 - 18:00 (Lun - Vie)",
  "08:00 - 20:00 (Lun - Sáb)",
  "10:00 - 14:00 (Lun - Vie)",
];

export const campanaEstados = ["Activa", "Pausada", "Programada"] as const;

export const campanaAsesores = [
  { name: "Jhelcen Romero", initials: "JR" },
  { name: "Ana Martínez", initials: "AM" },
  { name: "Juan Campos", initials: "JC" },
];

export const campanaAccionesRapidas = [
  { id: "nombre", label: "Personalizar nombre", variable: "{{nombre}}" },
  { id: "enlace", label: "Agregar enlace", variable: "{{enlace}}" },
  { id: "asignar", label: "Asignar lead", variable: "{{asignar}}" },
] as const;
