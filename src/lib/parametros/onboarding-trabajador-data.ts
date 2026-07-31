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
  /** Correo del usuario (se genera automáticamente). */
  email: string;
  /** Login interno sugerido. */
  usuarioInterno: string;
  /** Si true, se trata como Contador y se guarda también en empresa_config. */
  esContador: boolean;
  /** Si el usuario editó el correo a mano, no se regenera al cambiar el nombre. */
  emailManual: boolean;
};

export function createOnboardingTrabajadorId(
  options?: Partial<Pick<OnboardingTrabajadorDraft, "esContador" | "area">>,
): OnboardingTrabajadorDraft {
  const esContador = Boolean(options?.esContador);
  return {
    id: `trab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dni: "",
    nombresApellidos: "",
    area: options?.area ?? (esContador ? "finanzas" : ""),
    sueldoBasico: "",
    horaEntrada: "08:00",
    horaSalida: "17:00",
    horaRefrigerio: "",
    enPlanilla: !esContador,
    sistemaPensiones: "",
    seguroSalud: "",
    email: "",
    usuarioInterno: "",
    esContador,
    emailManual: false,
  };
}

export function isTrabajadorDraftEmpty(trabajador: OnboardingTrabajadorDraft): boolean {
  return (
    !trabajador.dni &&
    !trabajador.nombresApellidos &&
    !trabajador.area &&
    !trabajador.sueldoBasico &&
    !trabajador.email
  );
}

export function normalizeLegacyTrabajadorDraft(
  value: Partial<OnboardingTrabajadorDraft> | null | undefined,
): OnboardingTrabajadorDraft {
  return {
    ...createOnboardingTrabajadorId({ esContador: Boolean(value?.esContador) }),
    ...value,
    id: value?.id ?? createOnboardingTrabajadorId().id,
    horaEntrada: value?.horaEntrada ?? "08:00",
    horaSalida: value?.horaSalida ?? "17:00",
    horaRefrigerio: value?.horaRefrigerio ?? "",
    enPlanilla: value?.enPlanilla ?? !value?.esContador,
    sistemaPensiones: value?.sistemaPensiones ?? "",
    seguroSalud: value?.seguroSalud ?? "",
    email: value?.email ?? "",
    usuarioInterno: value?.usuarioInterno ?? "",
    esContador: Boolean(value?.esContador),
    emailManual: Boolean(value?.emailManual),
  };
}

export function toDbTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

/** Suma 1 hora a un valor `HH:MM` (rango de refrigerio). */
export function addOneHour(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  const total = (hours * 60 + minutes + 60) % (24 * 60);
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

/** Resta 1 hora a un valor `HH:MM`. */
export function subtractOneHour(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  const total = (hours * 60 + minutes - 60 + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}
