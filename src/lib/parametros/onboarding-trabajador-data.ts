export type OnboardingTrabajadorDraft = {
  id: string;
  dni: string;
  nombresApellidos: string;
  area: string;
  sueldoBasico: string;
  horaEntrada: string;
  horaSalida: string;
  horaRefrigerio: string;
  enPlanilla: boolean;
  sistemaPensiones: "" | "afp" | "onp";
  seguroSalud: "" | "essalud" | "sis";
};

export function createOnboardingTrabajadorId(): OnboardingTrabajadorDraft {
  return {
    id: `trab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dni: "",
    nombresApellidos: "",
    area: "",
    sueldoBasico: "",
    horaEntrada: "08:00",
    horaSalida: "17:00",
    horaRefrigerio: "",
    enPlanilla: true,
    sistemaPensiones: "",
    seguroSalud: "",
  };
}

export function isTrabajadorDraftEmpty(trabajador: OnboardingTrabajadorDraft): boolean {
  return (
    !trabajador.dni &&
    !trabajador.nombresApellidos &&
    !trabajador.area &&
    !trabajador.sueldoBasico
  );
}

export function normalizeLegacyTrabajadorDraft(
  value: Partial<OnboardingTrabajadorDraft> | null | undefined,
): OnboardingTrabajadorDraft {
  return {
    ...createOnboardingTrabajadorId(),
    ...value,
    id: value?.id ?? createOnboardingTrabajadorId().id,
    horaEntrada: value?.horaEntrada ?? "08:00",
    horaSalida: value?.horaSalida ?? "17:00",
    horaRefrigerio: value?.horaRefrigerio ?? "",
    enPlanilla: value?.enPlanilla ?? true,
    sistemaPensiones: value?.sistemaPensiones ?? "",
    seguroSalud: value?.seguroSalud ?? "",
  };
}

export function toDbTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}
