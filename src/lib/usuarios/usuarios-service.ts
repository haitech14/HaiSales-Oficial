import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ROLE_LABELS, normalizeRole, type UserRole } from "@/lib/auth/roles";
import { withRealKpi } from "@/lib/kpi-utils";
import type { NuevoUsuarioFormData } from "@/lib/nuevo-usuario-types";
import {
  usuariosKpis as staticKpis,
  type UsuarioEstado,
  type UsuarioRecord,
} from "@/lib/usuarios-mock-data";

type UsuarioEmpresaRow = Database["public"]["Tables"]["usuarios_empresa"]["Row"];
type UsuarioEmpresaInsert = Database["public"]["Tables"]["usuarios_empresa"]["Insert"];
type UsuarioEmpresaUpdate = Database["public"]["Tables"]["usuarios_empresa"]["Update"];

export type UsuariosSnapshot = {
  users: UsuarioRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

export type CreateUsuarioPayload = {
  nombreCompleto: string;
  correo: string;
  telefono: string;
  sedeId: string;
  sedeNombre: string;
  cargo: string;
  usuarioInterno: string;
  rolPrincipal: string;
  autenticacion2fa: string;
  estadoInicial: string;
  enviarInvitacion: string;
  esBorrador: boolean;
};

const AVATAR_STYLES = [
  { avatarBg: "bg-blue-100", avatarColor: "text-blue-700" },
  { avatarBg: "bg-violet-100", avatarColor: "text-violet-700" },
  { avatarBg: "bg-emerald-100", avatarColor: "text-emerald-700" },
  { avatarBg: "bg-orange-100", avatarColor: "text-orange-700" },
  { avatarBg: "bg-cyan-100", avatarColor: "text-cyan-700" },
  { avatarBg: "bg-pink-100", avatarColor: "text-pink-700" },
] as const;

const estadoUiToDb: Record<UsuarioEstado, UsuarioEmpresaRow["estado"]> = {
  Activo: "activo",
  Invitado: "invitado",
  Inactivo: "inactivo",
};

const estadoDbToUi: Record<UsuarioEmpresaRow["estado"], UsuarioEstado> = {
  activo: "Activo",
  invitado: "Invitado",
  inactivo: "Inactivo",
};

const twoFaUiToDb: Record<string, UsuarioEmpresaRow["autenticacion_2fa"]> = {
  Obligatorio: "obligatorio",
  Opcional: "opcional",
  Deshabilitado: "deshabilitado",
};

const twoFaDbToUi: Record<UsuarioEmpresaRow["autenticacion_2fa"], string> = {
  obligatorio: "Obligatorio",
  opcional: "Opcional",
  deshabilitado: "Deshabilitado",
};

function buildInitials(nombre: string): string {
  return (
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "US"
  );
}

function pickAvatarStyle(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index)) % AVATAR_STYLES.length;
  }
  return AVATAR_STYLES[hash] ?? AVATAR_STYLES[0];
}

function rolLabelToDb(label: string): UserRole {
  const entry = Object.entries(ROLE_LABELS).find(([, value]) => value === label);
  if (entry) return entry[0] as UserRole;
  return normalizeRole(label);
}

function mapRowToUsuario(row: UsuarioEmpresaRow): UsuarioRecord {
  const nombre = row.nombre_completo;
  const avatar = pickAvatarStyle(row.id);

  return {
    id: row.id,
    nombre,
    initials: buildInitials(nombre),
    avatarBg: avatar.avatarBg,
    avatarColor: avatar.avatarColor,
    correo: row.correo,
    rol: ROLE_LABELS[normalizeRole(row.rol)],
    sede: row.sede_nombre ?? "Sin sucursal",
    estado: estadoDbToUi[row.estado],
    has2fa: row.has_2fa,
    telefono: row.telefono ?? "",
    sedeId: row.sede_id ?? "",
    cargo: row.cargo ?? "",
    usuarioInterno: row.usuario_interno,
    autenticacion2fa: twoFaDbToUi[row.autenticacion_2fa],
  };
}

function buildSnapshot(users: UsuarioRecord[], source: "supabase" | "mock"): UsuariosSnapshot {
  const activos = users.filter((user) => user.estado === "Activo").length;
  const invitados = users.filter((user) => user.estado === "Invitado").length;
  const inactivos = users.filter((user) => user.estado === "Inactivo").length;

  return {
    users,
    kpis: staticKpis.map((kpi, index) => {
      if (index === 0) return withRealKpi(kpi, String(activos || users.length));
      if (index === 1) return withRealKpi(kpi, String(invitados));
      if (index === 2) return withRealKpi(kpi, String(users.length));
      if (index === 3) return withRealKpi(kpi, String(inactivos));
      return withRealKpi(kpi, "0");
    }),
    tabCounts: {
      todos: null,
      activos,
      invitados,
      inactivos,
    },
    totalRecords: users.length,
    source,
  };
}

async function generateNextCodigo(userId: string) {
  const { count } = await supabase
    .from("usuarios_empresa")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const next = (count ?? 0) + 1;
  return `USR-${String(next).padStart(3, "0")}`;
}

function payloadToInsert(
  input: CreateUsuarioPayload,
): Omit<UsuarioEmpresaInsert, "user_id" | "codigo"> {
  const estado = estadoUiToDb[input.estadoInicial as UsuarioEstado] ?? "invitado";
  const autenticacion2fa = twoFaUiToDb[input.autenticacion2fa] ?? "obligatorio";

  return {
    nombre_completo: input.nombreCompleto.trim(),
    correo: input.correo.trim().toLowerCase(),
    telefono: input.telefono.trim() || null,
    sede_id: input.sedeId || null,
    sede_nombre: input.sedeNombre || null,
    cargo: input.cargo.trim() || null,
    usuario_interno: input.usuarioInterno.trim(),
    rol: rolLabelToDb(input.rolPrincipal),
    estado,
    autenticacion_2fa: autenticacion2fa,
    enviar_invitacion: input.enviarInvitacion || null,
    has_2fa: autenticacion2fa === "obligatorio",
    es_borrador: input.esBorrador,
  };
}

export function formToCreateUsuarioInput(
  form: NuevoUsuarioFormData,
  sedeNombre: string,
  mode: "draft" | "create",
): CreateUsuarioPayload {
  return {
    nombreCompleto: form.nombreCompleto,
    correo: form.correo,
    telefono: form.telefono,
    sedeId: form.sede,
    sedeNombre,
    cargo: form.cargo,
    usuarioInterno: form.usuarioInterno,
    rolPrincipal: form.rolPrincipal,
    autenticacion2fa: form.autenticacion2fa,
    estadoInicial: form.estadoInicial,
    enviarInvitacion: form.enviarInvitacion,
    esBorrador: mode === "draft",
  };
}

export function usuarioRecordToForm(usuario: UsuarioRecord): NuevoUsuarioFormData {
  return {
    nombreCompleto: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono ?? "",
    sede: usuario.sedeId ?? "",
    cargo: usuario.cargo ?? "",
    usuarioInterno: usuario.usuarioInterno ?? "",
    rolPrincipal: usuario.rol,
    permisosEspeciales: "",
    modulosHabilitados: "",
    autenticacion2fa: usuario.autenticacion2fa ?? "Obligatorio",
    estadoInicial: usuario.estado,
    enviarInvitacion: "No, crear sin enviar",
  };
}

export function validateCreateUsuarioInput(
  input: CreateUsuarioPayload,
  mode: "draft" | "create",
): string | null {
  if (mode === "draft") {
    if (!input.nombreCompleto.trim() && !input.correo.trim()) {
      return "Ingresa al menos nombre o correo para guardar el borrador";
    }
    return null;
  }

  if (!input.nombreCompleto.trim()) {
    return "El nombre completo es obligatorio";
  }
  if (!input.correo.trim()) {
    return "El correo electrónico es obligatorio";
  }
  if (!input.rolPrincipal.trim()) {
    return "El rol principal es obligatorio";
  }
  if (!input.usuarioInterno.trim()) {
    return "El usuario interno es obligatorio";
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(input.usuarioInterno.trim())) {
    return "El usuario interno solo puede contener letras, números, punto y guion bajo";
  }

  return null;
}

export function validateUpdateUsuarioInput(input: CreateUsuarioPayload): string | null {
  return validateCreateUsuarioInput({ ...input, esBorrador: false }, "create");
}

export async function fetchUsuariosSnapshot(
  userId: string | null,
  _email?: string | null,
): Promise<UsuariosSnapshot> {
  if (!userId) {
    return buildSnapshot([], "supabase");
  }

  const { data, error } = await supabase
    .from("usuarios_empresa")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[usuarios] Error al cargar usuarios:", error.message);
    return buildSnapshot([], "supabase");
  }

  return buildSnapshot((data ?? []).map(mapRowToUsuario), "supabase");
}

export async function createUsuario(userId: string, input: CreateUsuarioPayload) {
  const validationError = validateCreateUsuarioInput(input, input.esBorrador ? "draft" : "create");
  if (validationError) {
    throw new Error(validationError);
  }

  const codigo = await generateNextCodigo(userId);
  const payload = payloadToInsert(input);

  const { data, error } = await supabase
    .from("usuarios_empresa")
    .insert({
      user_id: userId,
      codigo,
      ...payload,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe un usuario con ese correo o usuario interno");
    }
    throw new Error(error.message);
  }

  return mapRowToUsuario(data);
}

export async function updateUsuario(
  userId: string,
  usuarioId: string,
  input: CreateUsuarioPayload,
) {
  const validationError = validateUpdateUsuarioInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const payload: UsuarioEmpresaUpdate = payloadToInsert({ ...input, esBorrador: false });

  const { data, error } = await supabase
    .from("usuarios_empresa")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", usuarioId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe un usuario con ese correo o usuario interno");
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("No se encontró el usuario a actualizar");
  }

  return mapRowToUsuario(data);
}

export { getUsuarioEstadoStyles } from "@/lib/usuarios-mock-data";
