export type NuevoUsuarioFormData = {
  nombreCompleto: string;
  correo: string;
  telefono: string;
  sede: string;
  cargo: string;
  usuarioInterno: string;
  rolPrincipal: string;
  permisosEspeciales: string;
  modulosHabilitados: string;
  autenticacion2fa: string;
  estadoInicial: string;
  enviarInvitacion: string;
};

export const defaultNuevoUsuarioForm: NuevoUsuarioFormData = {
  nombreCompleto: "",
  correo: "",
  telefono: "",
  sede: "",
  cargo: "",
  usuarioInterno: "",
  rolPrincipal: "",
  permisosEspeciales: "",
  modulosHabilitados: "",
  autenticacion2fa: "Obligatorio",
  estadoInicial: "Invitado",
  enviarInvitacion: "Sí, enviar por correo",
};
