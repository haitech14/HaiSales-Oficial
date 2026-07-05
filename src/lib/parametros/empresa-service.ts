import { supabase } from "@/integrations/supabase/client";
import { clearEmpresaSetupDraft } from "@/lib/parametros/empresa-setup-draft";
import {
  getPrimaryMoneda,
  normalizeMonedas,
  type EmpresaSede,
} from "@/lib/parametros/empresa-config-data";
import { toDbTime } from "@/lib/parametros/onboarding-trabajador-data";

export type { EmpresaSede };

export type EmpresaConfig = {
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
  direccion: string;
  telefonoPrefijo: string;
  telefono: string;
  email: string;
  ciudad: string;
  pais: string;
  tipoContribuyente: string;
  gerenteGeneral: string;
  impuestoRenta: number;
  logoUrl: string;
  zonaHoraria: string;
  monedas: string[];
  moneda: string;
  igvPorcentaje: number;
  regimenTributario: string;
  serieFactura: string;
  serieBoleta: string;
  serieNotaCredito: string;
  serieNotaDebito: string;
  serieNotaVenta: string;
  serieGuiaRemision: string;
  serieProforma: string;
  serieOrdenCompra: string;
  serieOrdenPedido: string;
  serieOrdenServicio: string;
  sedes: EmpresaSede[];
  contadorNombre: string;
  contadorEmail: string;
  setupCompleted: boolean;
  demoCleanupDismissed: boolean;
};

export type EmpresaEmisor = {
  razonSocial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
};

export type OnboardingTrabajadorInput = {
  dni: string;
  nombresApellidos: string;
  cargo: string;
  area: string;
  sueldoBasico: number;
  horaEntrada: string;
  horaSalida: string;
  horaRefrigerio?: string;
  enPlanilla: boolean;
  sistemaPensiones?: "afp" | "onp";
  seguroSalud?: "essalud" | "sis";
};

export type CompleteOnboardingInput = {
  empresa: Omit<EmpresaConfig, "setupCompleted" | "contadorNombre" | "contadorEmail" | "moneda">;
  contadorNombre?: string;
  contadorEmail?: string;
  trabajadores?: OnboardingTrabajadorInput[];
};

export const defaultEmpresaConfig: EmpresaConfig = {
  razonSocial: "",
  nombreComercial: "",
  ruc: "",
  direccion: "",
  telefonoPrefijo: "+51",
  telefono: "",
  email: "",
  ciudad: "",
  pais: "Perú",
  tipoContribuyente: "",
  gerenteGeneral: "",
  impuestoRenta: 1.5,
  logoUrl: "",
  zonaHoraria: "America/Lima",
  monedas: ["PEN"],
  moneda: "PEN",
  igvPorcentaje: 18,
  regimenTributario: "regimen_general",
  serieFactura: "F001",
  serieBoleta: "B001",
  serieNotaCredito: "FC01",
  serieNotaDebito: "FD01",
  serieNotaVenta: "NV01",
  serieGuiaRemision: "T001",
  serieProforma: "PR001",
  serieOrdenCompra: "OC001",
  serieOrdenPedido: "OP001",
  serieOrdenServicio: "OS001",
  sedes: [],
  contadorNombre: "",
  contadorEmail: "",
  setupCompleted: false,
  demoCleanupDismissed: false,
};

type EmpresaRow = {
  user_id: string;
  razon_social: string | null;
  nombre_comercial: string | null;
  ruc: string | null;
  direccion: string | null;
  telefono_prefijo: string | null;
  telefono: string | null;
  email: string | null;
  ciudad: string | null;
  pais: string | null;
  tipo_contribuyente: string | null;
  gerente_general: string | null;
  impuesto_renta: number;
  logo_url: string | null;
  zona_horaria: string | null;
  moneda: string;
  monedas: unknown;
  igv_porcentaje: number;
  regimen_tributario: string | null;
  serie_factura: string | null;
  serie_boleta: string | null;
  serie_nota_credito: string | null;
  serie_nota_debito: string | null;
  serie_nota_venta: string | null;
  serie_guia_remision: string | null;
  serie_proforma: string | null;
  serie_orden_compra: string | null;
  serie_orden_pedido: string | null;
  serie_orden_servicio: string | null;
  sedes: unknown;
  contador_nombre: string | null;
  contador_email: string | null;
  setup_completed: boolean;
  demo_cleanup_dismissed?: boolean;
};

function parseSedes(value: unknown): EmpresaSede[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      id: String(item.id ?? `sede-${Math.random().toString(36).slice(2, 9)}`),
      nombre: String(item.nombre ?? ""),
      direccion: String(item.direccion ?? ""),
      esPrincipal: Boolean(item.esPrincipal),
    }));
}

function withSyncedMoneda(config: Omit<EmpresaConfig, "moneda"> & { moneda?: string }): EmpresaConfig {
  const monedas = normalizeMonedas(config.monedas);
  return {
    ...config,
    monedas,
    moneda: getPrimaryMoneda(monedas),
  } as EmpresaConfig;
}

export function hasEmpresaRegistrada(
  config: Pick<EmpresaConfig, "razonSocial" | "ruc">,
): boolean {
  const razonSocial = config.razonSocial.trim();
  const ruc = config.ruc.trim();
  return razonSocial.length > 0 && /^\d{11}$/.test(ruc);
}

function resolveSetupCompleted(config: EmpresaConfig): EmpresaConfig {
  if (config.setupCompleted || !hasEmpresaRegistrada(config)) {
    return config;
  }
  return { ...config, setupCompleted: true };
}

async function persistSetupCompletedIfNeeded(userId: string, config: EmpresaConfig) {
  if (config.setupCompleted) return;

  const { error } = await supabase
    .from("empresa_config")
    .update({ setup_completed: true } as never)
    .eq("user_id", userId);

  if (error) {
    console.warn("[empresa] No se pudo marcar setup completado:", error.message);
  }
}

function mapRowToConfig(row: EmpresaRow): EmpresaConfig {
  const monedas = normalizeMonedas(row.monedas ?? row.moneda);
  return withSyncedMoneda({
    razonSocial: row.razon_social ?? "",
    nombreComercial: row.nombre_comercial ?? "",
    ruc: row.ruc ?? "",
    direccion: row.direccion ?? "",
    telefonoPrefijo: row.telefono_prefijo ?? "+51",
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    ciudad: row.ciudad ?? "",
    pais: row.pais ?? "Perú",
    tipoContribuyente: row.tipo_contribuyente ?? "",
    gerenteGeneral: row.gerente_general ?? "",
    impuestoRenta: Number(row.impuesto_renta ?? 1.5),
    logoUrl: row.logo_url ?? "",
    zonaHoraria: row.zona_horaria ?? "America/Lima",
    monedas,
    igvPorcentaje: Number(row.igv_porcentaje ?? 18),
    regimenTributario: row.regimen_tributario ?? "regimen_general",
    serieFactura: row.serie_factura ?? "F001",
    serieBoleta: row.serie_boleta ?? "B001",
    serieNotaCredito: row.serie_nota_credito ?? "FC01",
    serieNotaDebito: row.serie_nota_debito ?? "FD01",
    serieNotaVenta: row.serie_nota_venta ?? "NV01",
    serieGuiaRemision: row.serie_guia_remision ?? "T001",
    serieProforma: row.serie_proforma ?? "PR001",
    serieOrdenCompra: row.serie_orden_compra ?? "OC001",
    serieOrdenPedido: row.serie_orden_pedido ?? "OP001",
    serieOrdenServicio: row.serie_orden_servicio ?? "OS001",
    sedes: parseSedes(row.sedes),
    contadorNombre: row.contador_nombre ?? "",
    contadorEmail: row.contador_email ?? "",
    setupCompleted: Boolean(row.setup_completed),
    demoCleanupDismissed: Boolean(row.demo_cleanup_dismissed),
  });
}

export function formatEmpresaTelefono(config: Pick<EmpresaConfig, "telefonoPrefijo" | "telefono">): string {
  const number = config.telefono.trim();
  if (!number) return "";
  return `${config.telefonoPrefijo} ${number}`.trim();
}

export function configToEmisor(config: EmpresaConfig | EmpresaEmisor): EmpresaEmisor {
  const telefono =
    "telefonoPrefijo" in config
      ? formatEmpresaTelefono(config) || "—"
      : config.telefono || "—";

  return {
    razonSocial: config.razonSocial || "Mi Empresa",
    ruc: config.ruc || "—",
    direccion: config.direccion || "—",
    telefono,
    email: config.email || "—",
  };
}

export function getEmpresaInitials(razonSocial: string): string {
  const words = razonSocial.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export async function fetchEmpresaConfig(userId: string): Promise<EmpresaConfig> {
  const { data, error } = await supabase
    .from("empresa_config")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    const resolved = resolveSetupCompleted(mapRowToConfig(data as EmpresaRow));
    if (!data.setup_completed && resolved.setupCompleted) {
      void persistSetupCompletedIfNeeded(userId, resolved);
    }
    if (resolved.setupCompleted) {
      clearEmpresaSetupDraft(userId);
    }
    return resolved;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, ruc, phone, direccion, email")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile) {
    const resolved = resolveSetupCompleted(
      withSyncedMoneda({
        ...defaultEmpresaConfig,
        razonSocial: profile.company_name ?? "",
        ruc: profile.ruc ?? "",
        telefono: profile.phone ?? "",
        direccion: (profile as { direccion?: string }).direccion ?? "",
        email: (profile as { email?: string }).email ?? "",
      }),
    );
    if (resolved.setupCompleted) {
      clearEmpresaSetupDraft(userId);
    }
    return resolved;
  }

  return defaultEmpresaConfig;
}

export async function isEmpresaSetupComplete(userId: string): Promise<boolean> {
  const config = await fetchEmpresaConfig(userId);
  return config.setupCompleted;
}

async function syncProfileFromConfig(userId: string, config: EmpresaConfig) {
  await supabase
    .from("profiles")
    .update({
      company_name: config.razonSocial.trim() || null,
      ruc: config.ruc.trim() || null,
      phone: formatEmpresaTelefono(config) || null,
      direccion: config.direccion.trim() || null,
      email: config.email.trim() || null,
    } as never)
    .eq("user_id", userId);
}

function buildEmpresaPayload(userId: string, config: EmpresaConfig, setupCompleted: boolean) {
  const synced = withSyncedMoneda(config);
  return {
    user_id: userId,
    razon_social: synced.razonSocial.trim() || null,
    nombre_comercial: synced.nombreComercial.trim() || null,
    ruc: synced.ruc.trim() || null,
    direccion: synced.direccion.trim() || null,
    telefono_prefijo: synced.telefonoPrefijo.trim() || "+51",
    telefono: synced.telefono.trim() || null,
    email: synced.email.trim() || null,
    ciudad: synced.ciudad.trim() || null,
    pais: synced.pais.trim() || "Perú",
    tipo_contribuyente: synced.tipoContribuyente.trim() || null,
    gerente_general: synced.gerenteGeneral.trim() || null,
    impuesto_renta: synced.impuestoRenta,
    logo_url: synced.logoUrl.trim() || null,
    zona_horaria: synced.zonaHoraria.trim() || "America/Lima",
    moneda: synced.moneda,
    monedas: synced.monedas,
    igv_porcentaje: synced.igvPorcentaje,
    regimen_tributario: synced.regimenTributario.trim() || "regimen_general",
    serie_factura: synced.serieFactura.trim() || null,
    serie_boleta: synced.serieBoleta.trim() || null,
    serie_nota_credito: synced.serieNotaCredito.trim() || null,
    serie_nota_debito: synced.serieNotaDebito.trim() || null,
    serie_nota_venta: synced.serieNotaVenta.trim() || null,
    serie_guia_remision: synced.serieGuiaRemision.trim() || null,
    serie_proforma: synced.serieProforma.trim() || null,
    serie_orden_compra: synced.serieOrdenCompra.trim() || null,
    serie_orden_pedido: synced.serieOrdenPedido.trim() || null,
    serie_orden_servicio: synced.serieOrdenServicio.trim() || null,
    sedes: synced.sedes,
    contador_nombre: synced.contadorNombre.trim() || null,
    contador_email: synced.contadorEmail.trim() || null,
    setup_completed: setupCompleted,
    demo_cleanup_dismissed: synced.demoCleanupDismissed,
  };
}

export async function updateEmpresaConfig(userId: string, config: EmpresaConfig) {
  const payload = buildEmpresaPayload(userId, config, config.setupCompleted);

  const { data, error } = await supabase
    .from("empresa_config")
    .upsert(payload as never, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const saved = mapRowToConfig(data as EmpresaRow);
  await syncProfileFromConfig(userId, saved);
  return saved;
}

async function createOnboardingTrabajador(userId: string, trabajador: OnboardingTrabajadorInput) {
  const { count } = await supabase
    .from("trabajadores")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const codigo = `TR-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { error } = await supabase.from("trabajadores").insert({
    user_id: userId,
    codigo,
    dni: trabajador.dni.trim(),
    nombres_apellidos: trabajador.nombresApellidos.trim(),
    cargo: trabajador.cargo.trim(),
    area: trabajador.area.trim(),
    sueldo_basico: trabajador.sueldoBasico,
    estado: "activo",
    dni_validado: true,
    es_borrador: false,
    asistencia_dias: 0,
    asistencia_total: 26,
    activo: true,
    turno: "Diurno",
    hora_entrada: toDbTime(trabajador.horaEntrada) ?? "08:00:00",
    hora_salida: toDbTime(trabajador.horaSalida) ?? "17:00:00",
    hora_refrigerio: trabajador.horaRefrigerio ? toDbTime(trabajador.horaRefrigerio) : null,
    en_planilla: trabajador.enPlanilla,
    sistema_pensiones: trabajador.enPlanilla ? trabajador.sistemaPensiones ?? null : null,
    seguro_salud: trabajador.enPlanilla ? trabajador.seguroSalud ?? null : null,
    dias_laborables: "Lun - Vie",
  } as never);

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeEmpresaOnboarding(userId: string, input: CompleteOnboardingInput) {
  const config = withSyncedMoneda({
    ...input.empresa,
    contadorNombre: input.contadorNombre?.trim() ?? "",
    contadorEmail: input.contadorEmail?.trim() ?? "",
    setupCompleted: true,
  });

  const saved = await updateEmpresaConfig(userId, config);

  if (input.trabajadores?.length) {
    for (const trabajador of input.trabajadores) {
      if (trabajador.dni && trabajador.nombresApellidos) {
        await createOnboardingTrabajador(userId, trabajador);
      }
    }
  }

  return saved;
}

export async function dismissDemoCleanupPrompt(userId: string): Promise<void> {
  const { error } = await supabase
    .from("empresa_config")
    .update({ demo_cleanup_dismissed: true } as never)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

const EMPRESA_LOGO_BUCKET = "empresa-logos";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export async function uploadEmpresaLogo(userId: string | undefined, file: File): Promise<string> {
  if (!userId) {
    return readFileAsDataUrl(file);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/logo.${extension}`;

  const { error } = await supabase.storage.from(EMPRESA_LOGO_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (!error) {
    const { data } = supabase.storage.from(EMPRESA_LOGO_BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  return readFileAsDataUrl(file);
}
