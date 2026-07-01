import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { CreateTrabajadorInput } from "@/lib/planillas-form-data";
import {
  planillasKpis as staticKpis,
  workers as mockWorkers,
  type WorkerRecord,
} from "@/lib/planillas-mock-data";
import {
  estadoDbToUi,
  estadoUiToDb,
  type PlanillasSnapshot,
  type PlanillasWorker,
} from "@/lib/planillas/types";

type TrabajadorRow = Database["public"]["Tables"]["trabajadores"]["Row"];

const AVATAR_PALETTE = [
  { avatarBg: "bg-blue-100", avatarColor: "text-blue-700" },
  { avatarBg: "bg-orange-100", avatarColor: "text-orange-700" },
  { avatarBg: "bg-emerald-100", avatarColor: "text-emerald-700" },
  { avatarBg: "bg-violet-100", avatarColor: "text-violet-700" },
  { avatarBg: "bg-red-100", avatarColor: "text-red-700" },
  { avatarBg: "bg-pink-100", avatarColor: "text-pink-700" },
  { avatarBg: "bg-cyan-100", avatarColor: "text-cyan-700" },
  { avatarBg: "bg-amber-100", avatarColor: "text-amber-700" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getAvatarVisuals(name: string) {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function mapRowToWorker(row: TrabajadorRow): PlanillasWorker {
  const visuals = getAvatarVisuals(row.nombres_apellidos);
  return {
    dbId: row.id,
    id: row.codigo ?? `TR-${row.id.slice(0, 4).toUpperCase()}`,
    nombre: row.nombres_apellidos,
    initials: getInitials(row.nombres_apellidos),
    ...visuals,
    dni: row.dni,
    cargo: row.cargo,
    area: row.area,
    sueldo: Number(row.sueldo_basico),
    asistenciaDias: row.asistencia_dias,
    asistenciaTotal: row.asistencia_total,
    estado: estadoDbToUi[row.estado],
    responsable: row.supervisor ?? "—",
    esBorrador: row.es_borrador,
  };
}

function mapMockToWorker(record: WorkerRecord): PlanillasWorker {
  return { ...record };
}

function buildTabCounts(workers: PlanillasWorker[]): Record<string, number | null> {
  return {
    todos: null,
    activos: workers.filter((w) => w.estado === "Activo").length,
    asistencia: workers.filter((w) => w.asistenciaDias < w.asistenciaTotal).length,
    vacaciones: workers.filter((w) => w.estado === "Vacaciones").length,
    boletas: workers.filter((w) => w.estado === "Activo" && !w.esBorrador).length,
    cesados: workers.filter((w) => w.estado === "Cesado").length,
  };
}

function buildKpis(workers: PlanillasWorker[]) {
  const activos = workers.filter((w) => w.estado === "Activo" && !w.esBorrador);
  const costoLaboral = activos.reduce((sum, w) => sum + w.sueldo, 0);
  const asistenciaPendiente = workers.filter((w) => w.asistenciaDias < w.asistenciaTotal).length;
  const boletas = activos.length;

  return staticKpis.map((kpi, index) => {
    if (index === 0) {
      return { ...kpi, value: String(activos.length), sparkPoints: [...kpi.sparkPoints.slice(0, -1), activos.length] };
    }
    if (index === 1) {
      return {
        ...kpi,
        value: `S/ ${costoLaboral.toLocaleString("es-PE")}`,
        sparkPoints: [...kpi.sparkPoints.slice(0, -1), costoLaboral],
      };
    }
    if (index === 2) {
      return {
        ...kpi,
        value: String(asistenciaPendiente),
        sparkPoints: [...kpi.sparkPoints.slice(0, -1), asistenciaPendiente],
      };
    }
    return {
      ...kpi,
      value: String(boletas),
      sparkPoints: [...kpi.sparkPoints.slice(0, -1), boletas],
    };
  });
}

function buildSnapshot(workers: PlanillasWorker[], source: "supabase" | "mock"): PlanillasSnapshot {
  return {
    workers,
    kpis: buildKpis(workers),
    tabCounts: buildTabCounts(workers),
    totalRecords: workers.length,
    source,
  };
}

async function generateNextCodigo(userId: string) {
  const { count } = await supabase
    .from("trabajadores")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const next = (count ?? 0) + 1;
  return `TR-${String(next).padStart(4, "0")}`;
}

function parseFechaIngreso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  const peMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (peMatch) {
    return `${peMatch[3]}-${peMatch[2]}-${peMatch[1]}`;
  }

  return null;
}

async function seedTrabajadoresForUser(userId: string) {
  for (const mock of mockWorkers) {
    const estadoKey = mock.estado === "Activo"
      ? "activo"
      : mock.estado === "Vacaciones"
        ? "vacaciones"
        : mock.estado === "Cesado"
          ? "cesado"
          : "asistencia_pendiente";

    await supabase.from("trabajadores").insert({
      user_id: userId,
      codigo: mock.id,
      dni: mock.dni,
      nombres_apellidos: mock.nombre,
      cargo: mock.cargo,
      area: mock.area,
      sueldo_basico: mock.sueldo,
      supervisor: mock.responsable,
      estado: estadoKey,
      asistencia_dias: mock.asistenciaDias,
      asistencia_total: mock.asistenciaTotal,
      dni_validado: true,
      es_borrador: false,
      activo: mock.estado !== "Cesado",
      turno: "Diurno",
      hora_entrada: "08:00:00",
      hora_salida: "17:00:00",
      dias_laborables: "Lun - Vie",
    });
  }
}

export async function fetchPlanillasSnapshot(userId: string | null): Promise<PlanillasSnapshot> {
  if (!userId) {
    return buildSnapshot(mockWorkers.map(mapMockToWorker), "mock");
  }

  let { data, error } = await supabase
    .from("trabajadores")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[planillas] Error al cargar trabajadores:", error.message);
    return buildSnapshot(mockWorkers.map(mapMockToWorker), "mock");
  }

  if (!data || data.length === 0) {
    await seedTrabajadoresForUser(userId);
    const retry = await supabase
      .from("trabajadores")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (retry.error || !retry.data?.length) {
      return buildSnapshot(mockWorkers.map(mapMockToWorker), "mock");
    }
    data = retry.data;
  }

  return buildSnapshot(data.map(mapRowToWorker), "supabase");
}

export async function validateTrabajadorDni(userId: string, dni: string) {
  const normalized = dni.trim();
  if (!/^\d{8}$/.test(normalized)) {
    throw new Error("El DNI debe tener 8 dígitos numéricos");
  }

  const { data, error } = await supabase
    .from("trabajadores")
    .select("id, nombres_apellidos")
    .eq("user_id", userId)
    .eq("dni", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    throw new Error(`El DNI ya está registrado para ${data.nombres_apellidos}`);
  }

  return { ok: true as const, dni: normalized };
}

export async function createTrabajador(userId: string, input: CreateTrabajadorInput) {
  const codigo = await generateNextCodigo(userId);
  const estado = estadoUiToDb[input.estadoInicial] ?? "activo";

  const { data, error } = await supabase
    .from("trabajadores")
    .insert({
      user_id: userId,
      codigo,
      dni: input.dni.trim(),
      nombres_apellidos: input.nombresApellidos.trim(),
      cargo: input.cargo,
      area: input.area,
      fecha_ingreso: parseFechaIngreso(input.fechaIngreso),
      tipo_contrato: input.tipoContrato || null,
      sueldo_basico: input.sueldoBasico,
      regimen_laboral: input.regimenLaboral || null,
      banco: input.banco || null,
      cuenta_sueldo: input.cuentaSueldo.trim() || null,
      supervisor: input.supervisor || null,
      estado,
      turno: input.turno || null,
      hora_entrada: input.horaEntrada ? `${input.horaEntrada}:00` : null,
      hora_salida: input.horaSalida ? `${input.horaSalida}:00` : null,
      dias_laborables: input.diasLaborables || null,
      dni_validado: input.dniValidado,
      es_borrador: input.esBorrador,
      asistencia_dias: input.esBorrador ? 0 : 26,
      asistencia_total: 26,
      activo: estado !== "cesado",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToWorker(data);
}

export {
  formatSalary,
  formatLaborCost,
  getAttendancePercent,
  getAttendanceStyles,
  getWorkerStatusStyles,
} from "@/lib/planillas-mock-data";
