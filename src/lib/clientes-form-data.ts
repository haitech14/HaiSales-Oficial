export const clienteTipos = [
  { value: "empresa", label: "Empresa" },
  { value: "persona-natural", label: "Persona natural con negocio" },
  { value: "extranjero", label: "Cliente extranjero" },
];

export const clienteSegmentos = [
  { value: "corporativo", label: "Corporativo" },
  { value: "pyme", label: "PYME" },
  { value: "minorista", label: "Minorista" },
  { value: "prospecto", label: "Prospecto" },
  { value: "otros", label: "Otros" },
];

export const clienteEjecutivos = [
  { value: "jhelcen-romero", label: "Jhelcen Romero" },
  { value: "ana-martinez", label: "Ana Martínez" },
  { value: "juan-campos", label: "Juan Campos" },
  { value: "maria-gomez", label: "María Gómez" },
];

export const clienteDistritos = [
  { value: "san-isidro", label: "San Isidro" },
  { value: "miraflores", label: "Miraflores" },
  { value: "surco", label: "Santiago de Surco" },
  { value: "ate", label: "Ate" },
  { value: "callao", label: "Callao" },
];

export const clienteEstadosIniciales = [
  { value: "activo", label: "Activo", color: "text-emerald-600" },
  { value: "prospecto", label: "Prospecto", color: "text-orange-600" },
  { value: "inactivo", label: "Inactivo", color: "text-slate-500" },
];

export type NuevoClienteFormState = {
  tipoCliente: string;
  rucDni: string;
  razonSocial: string;
  nombreComercial: string;
  contactoPrincipal: string;
  telefono: string;
  correo: string;
  direccionFiscal: string;
  distrito: string;
  segmento: string;
  ejecutivo: string;
  estadoInicial: string;
};

export const defaultNuevoClienteForm: NuevoClienteFormState = {
  tipoCliente: "",
  rucDni: "",
  razonSocial: "",
  nombreComercial: "",
  contactoPrincipal: "",
  telefono: "",
  correo: "",
  direccionFiscal: "",
  distrito: "",
  segmento: "",
  ejecutivo: "",
  estadoInicial: "activo",
};
