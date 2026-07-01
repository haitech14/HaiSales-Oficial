export type CampanaPrioridad = "Alta" | "Media" | "Baja";
export type CampanaEstado = "Activa" | "Pausada" | "Programada";

export type NuevaCampanaFormData = {
  nombre: string;
  audiencia: string;
  listaContactos: string;
  plantilla: string;
  variablePrincipal: string;
  fechaEnvio: string;
  horaEnvio: string;
  asesor: string;
  asesorInitials: string;
  objetivo: string;
  etapaCrm: string;
  prioridad: CampanaPrioridad;
  horarioPermitido: string;
  estadoInicial: CampanaEstado;
  mensajePreview: string;
};

export const defaultNuevaCampanaForm: NuevaCampanaFormData = {
  nombre: "",
  audiencia: "",
  listaContactos: "",
  plantilla: "",
  variablePrincipal: "",
  fechaEnvio: "",
  horaEnvio: "10:00",
  asesor: "Jhelcen Romero",
  asesorInitials: "JR",
  objetivo: "",
  etapaCrm: "",
  prioridad: "Media",
  horarioPermitido: "09:00 - 18:00 (Lun - Vie)",
  estadoInicial: "Activa",
  mensajePreview: `Hola {{nombre}}, 👋
Tenemos una promoción exclusiva para ti.
Descubre todos los beneficios que tenemos preparados.
¿Te gustaría saber más?`,
};
