import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  usuarios as mockUsuarios,
  usuariosKpis as staticKpis,
  type UsuarioEstado,
  type UsuarioRecord,
} from "@/lib/usuarios-mock-data";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type UsuariosSnapshot = {
  users: UsuarioRecord[];
  kpis: typeof staticKpis;
  tabCounts: Record<string, number | null>;
  totalRecords: number;
  source: "supabase" | "mock";
};

function mapProfileToUsuario(profile: ProfileRow, email?: string | null): UsuarioRecord {
  const nombre = profile.full_name ?? profile.company_name ?? "Usuario";
  const initials = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "US";

  return {
    id: profile.user_id.slice(0, 8).toUpperCase(),
    nombre,
    initials,
    avatarBg: "bg-blue-100",
    avatarColor: "text-blue-700",
    correo: email ?? "usuario@haisales.pe",
    rol: "Administrador",
    sede: profile.company_name ?? "Principal",
    estado: "Activo" as UsuarioEstado,
    has2fa: false,
  };
}

function buildSnapshot(users: UsuarioRecord[], source: "supabase" | "mock"): UsuariosSnapshot {
  const activos = users.filter((u) => u.estado === "Activo").length;
  const invitados = users.filter((u) => u.estado === "Invitado").length;
  const inactivos = users.filter((u) => u.estado === "Inactivo").length;

  return {
    users,
    kpis: staticKpis.map((kpi, index) => {
      if (index === 0) return { ...kpi, value: String(activos || users.length) };
      return kpi;
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

export async function fetchUsuariosSnapshot(userId: string | null, email?: string | null): Promise<UsuariosSnapshot> {
  if (!userId) {
    return buildSnapshot(mockUsuarios, "mock");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    console.warn("[usuarios] Error al cargar perfil:", error?.message);
    return buildSnapshot(mockUsuarios, "mock");
  }

  const currentUser = mapProfileToUsuario(data, email);
  const team = mockUsuarios.filter((user) => user.correo !== currentUser.correo);
  return buildSnapshot([currentUser, ...team], "supabase");
}

export { getUsuarioEstadoStyles } from "@/lib/usuarios-mock-data";
