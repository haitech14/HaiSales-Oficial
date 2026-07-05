import type { EmpresaConfig } from "@/lib/parametros/empresa-service";
import {
  normalizeLegacyTrabajadorDraft,
  type OnboardingTrabajadorDraft,
} from "@/lib/parametros/onboarding-trabajador-data";

const STORAGE_PREFIX = "haisales_empresa_setup_draft";

export type EmpresaSetupFormState = Omit<
  EmpresaConfig,
  "setupCompleted" | "contadorNombre" | "contadorEmail" | "moneda"
>;

export type { OnboardingTrabajadorDraft };

export type EmpresaSetupContadorDraft = {
  nombre: string;
  email: string;
};

export type EmpresaSetupDraft = {
  stepIndex: number;
  empresa: EmpresaSetupFormState;
  trabajadores: OnboardingTrabajadorDraft[];
  contador: EmpresaSetupContadorDraft;
  updatedAt: string;
};

type LegacyEmpresaSetupDraft = Omit<EmpresaSetupDraft, "trabajadores"> & {
  trabajador?: Partial<OnboardingTrabajadorDraft>;
  trabajadores?: OnboardingTrabajadorDraft[];
};

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function normalizeDraft(raw: LegacyEmpresaSetupDraft): EmpresaSetupDraft {
  const trabajadores =
    raw.trabajadores?.length
      ? raw.trabajadores.map((item) => normalizeLegacyTrabajadorDraft(item))
      : raw.trabajador && (raw.trabajador.dni || raw.trabajador.nombresApellidos)
        ? [normalizeLegacyTrabajadorDraft(raw.trabajador)]
        : [];

  return {
    stepIndex: raw.stepIndex,
    empresa: raw.empresa,
    trabajadores,
    contador: raw.contador,
    updatedAt: raw.updatedAt,
  };
}

export function loadEmpresaSetupDraft(userId: string): EmpresaSetupDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return normalizeDraft(JSON.parse(raw) as LegacyEmpresaSetupDraft);
  } catch {
    return null;
  }
}

export function saveEmpresaSetupDraft(userId: string, draft: Omit<EmpresaSetupDraft, "updatedAt">) {
  if (typeof window === "undefined") return;

  const payload: EmpresaSetupDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(storageKey(userId), JSON.stringify(payload));
}

export function clearEmpresaSetupDraft(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(userId));
}

export function empresaConfigToSetupForm(
  config: EmpresaConfig,
): EmpresaSetupFormState {
  return {
    razonSocial: config.razonSocial,
    nombreComercial: config.nombreComercial,
    ruc: config.ruc,
    direccion: config.direccion,
    telefonoPrefijo: config.telefonoPrefijo,
    telefono: config.telefono,
    email: config.email,
    ciudad: config.ciudad,
    pais: config.pais,
    tipoContribuyente: config.tipoContribuyente,
    gerenteGeneral: config.gerenteGeneral,
    impuestoRenta: config.impuestoRenta,
    logoUrl: config.logoUrl,
    zonaHoraria: config.zonaHoraria,
    monedas: config.monedas,
    igvPorcentaje: config.igvPorcentaje,
    regimenTributario: config.regimenTributario,
    serieFactura: config.serieFactura,
    serieBoleta: config.serieBoleta,
    serieNotaCredito: config.serieNotaCredito,
    serieNotaDebito: config.serieNotaDebito,
    serieNotaVenta: config.serieNotaVenta,
    serieGuiaRemision: config.serieGuiaRemision,
    serieProforma: config.serieProforma,
    serieOrdenCompra: config.serieOrdenCompra,
    serieOrdenPedido: config.serieOrdenPedido,
    serieOrdenServicio: config.serieOrdenServicio,
    sedes: config.sedes,
  };
}
