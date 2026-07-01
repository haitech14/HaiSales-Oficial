export const trabajadorCargos = [
  { value: "gerente-comercial", label: "Gerente Comercial" },
  { value: "supervisor-logistico", label: "Supervisor Logístico" },
  { value: "jefe-compras", label: "Jefe de Compras" },
  { value: "analista-contable", label: "Analista Contable" },
  { value: "operador-planta", label: "Operador de Planta" },
  { value: "ejecutiva-ventas", label: "Ejecutiva de Ventas" },
  { value: "coordinador-almacen", label: "Coordinador de Almacén" },
  { value: "asistente-rrhh", label: "Asistente de RR.HH." },
  { value: "ingeniero-procesos", label: "Ingeniero de Procesos" },
  { value: "analista-costos", label: "Analista de Costos" },
];

export const trabajadorAreas = [
  { value: "comercial", label: "Comercial" },
  { value: "logistica", label: "Logística" },
  { value: "operaciones", label: "Operaciones" },
  { value: "finanzas", label: "Finanzas" },
  { value: "produccion", label: "Producción" },
  { value: "rrhh", label: "Recursos Humanos" },
];

export const trabajadorTiposContrato = [
  { value: "indefinido", label: "Contrato indefinido" },
  { value: "plazo-fijo", label: "Contrato a plazo fijo" },
  { value: "part-time", label: "Tiempo parcial" },
  { value: "practicas", label: "Prácticas preprofesionales" },
  { value: "locacion", label: "Locación de servicios" },
];

export const trabajadorRegimenes = [
  { value: "general", label: "Régimen general" },
  { value: "pequena-empresa", label: "Pequeña empresa" },
  { value: "microempresa", label: "Microempresa" },
  { value: "agrario", label: "Régimen agrario" },
  { value: "construccion", label: "Régimen de construcción" },
];

export const trabajadorBancos = [
  { value: "bcp", label: "BCP" },
  { value: "bbva", label: "BBVA" },
  { value: "interbank", label: "Interbank" },
  { value: "scotiabank", label: "Scotiabank" },
  { value: "banbif", label: "BanBif" },
  { value: "pichincha", label: "Banco Pichincha" },
];

export const trabajadorSupervisores = [
  { value: "jhelcen-romero", label: "Jhelcen Romero" },
  { value: "ana-martinez", label: "Ana Martínez" },
  { value: "juan-campos", label: "Juan Campos" },
  { value: "maria-gomez", label: "María Gómez" },
];

export const trabajadorEstadosIniciales = [
  { value: "activo", label: "Activo", color: "text-emerald-600" },
  { value: "asistencia-pendiente", label: "Asistencia pendiente", color: "text-amber-600" },
  { value: "vacaciones", label: "Vacaciones", color: "text-blue-600" },
];

export const trabajadorTurnos = [
  { value: "diurno", label: "Diurno (08:00 - 17:00)" },
  { value: "tarde", label: "Tarde (14:00 - 22:00)" },
  { value: "noche", label: "Noche (22:00 - 06:00)" },
  { value: "rotativo", label: "Rotativo" },
];

export const trabajadorDiasLaborables = [
  { value: "lun-vie", label: "Lun - Vie" },
  { value: "lun-sab", label: "Lun - Sáb" },
  { value: "mar-sab", label: "Mar - Sáb" },
  { value: "rotativo", label: "Rotativo" },
];

export type NuevoTrabajadorFormState = {
  dni: string;
  nombresApellidos: string;
  cargo: string;
  area: string;
  fechaIngreso: string;
  tipoContrato: string;
  turno: string;
  horaEntrada: string;
  horaSalida: string;
  diasLaborables: string;
  sueldoBasico: string;
  regimenLaboral: string;
  banco: string;
  cuentaSueldo: string;
  supervisor: string;
  estadoInicial: string;
};

export const defaultNuevoTrabajadorForm: NuevoTrabajadorFormState = {
  dni: "",
  nombresApellidos: "",
  cargo: "",
  area: "",
  fechaIngreso: "",
  tipoContrato: "",
  turno: "",
  horaEntrada: "08:00",
  horaSalida: "17:00",
  diasLaborables: "",
  sueldoBasico: "",
  regimenLaboral: "",
  banco: "",
  cuentaSueldo: "",
  supervisor: "",
  estadoInicial: "",
};

export type CreateTrabajadorInput = {
  dni: string;
  nombresApellidos: string;
  cargo: string;
  area: string;
  fechaIngreso: string;
  tipoContrato: string;
  turno: string;
  horaEntrada: string;
  horaSalida: string;
  diasLaborables: string;
  sueldoBasico: number;
  regimenLaboral: string;
  banco: string;
  cuentaSueldo: string;
  supervisor: string;
  estadoInicial: string;
  dniValidado: boolean;
  esBorrador: boolean;
};

function resolveLabel(
  options: { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function formToCreateInput(
  form: NuevoTrabajadorFormState,
  mode: "draft" | "create",
  dniValidado: boolean,
): CreateTrabajadorInput {
  return {
    dni: form.dni.trim(),
    nombresApellidos: form.nombresApellidos.trim(),
    cargo: resolveLabel(trabajadorCargos, form.cargo),
    area: resolveLabel(trabajadorAreas, form.area),
    fechaIngreso: form.fechaIngreso.trim(),
    tipoContrato: resolveLabel(trabajadorTiposContrato, form.tipoContrato),
    turno: resolveLabel(trabajadorTurnos, form.turno),
    horaEntrada: form.horaEntrada.trim(),
    horaSalida: form.horaSalida.trim(),
    diasLaborables: resolveLabel(trabajadorDiasLaborables, form.diasLaborables),
    sueldoBasico: parseFloat(form.sueldoBasico.replace(/,/g, "")) || 0,
    regimenLaboral: resolveLabel(trabajadorRegimenes, form.regimenLaboral),
    banco: resolveLabel(trabajadorBancos, form.banco),
    cuentaSueldo: form.cuentaSueldo.trim(),
    supervisor: resolveLabel(trabajadorSupervisores, form.supervisor),
    estadoInicial: form.estadoInicial || "activo",
    dniValidado,
    esBorrador: mode === "draft",
  };
}

const EMPLOYER_CONTRIBUTION_RATE = 0.12;
const EMPLOYEE_DEDUCTION_RATE = 0.13;

export function calculateTrabajadorPayroll(sueldoBasico: string) {
  const sueldo = parseFloat(sueldoBasico.replace(/,/g, "")) || 0;
  const aportes = sueldo * EMPLOYER_CONTRIBUTION_RATE;
  const costoMensual = sueldo + aportes;
  const netoReferencial = sueldo * (1 - EMPLOYEE_DEDUCTION_RATE);

  return { sueldo, aportes, costoMensual, netoReferencial };
}

export function formatTrabajadorCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
