export type UsuarioEstado = "Activo" | "Invitado" | "Inactivo";

export type UsuarioRecord = {
  id: string;
  nombre: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  correo: string;
  rol: string;
  sede: string;
  estado: UsuarioEstado;
  has2fa: boolean;
};

export const usuariosKpis = [
  {
    label: "Usuarios activos",
    value: "48",
    change: "+12 vs. mes anterior",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [32, 34, 36, 38, 40, 42, 44, 45, 47, 48],
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    label: "Roles",
    value: "12",
    change: "+1 vs. mes anterior",
    changePositive: true,
    sparkColor: "#a855f7",
    sparkPoints: [9, 9, 10, 10, 10, 11, 11, 11, 12, 12],
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
  {
    label: "Sesiones hoy",
    value: "186",
    change: "+13 vs. ayer",
    changePositive: true,
    sparkColor: "#22c55e",
    sparkPoints: [142, 150, 158, 162, 168, 172, 176, 180, 183, 186],
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    label: "Alertas seguridad",
    value: "3",
    change: "-2 vs. ayer",
    changePositive: false,
    sparkColor: "#ef4444",
    sparkPoints: [8, 7, 6, 6, 5, 5, 4, 4, 3, 3],
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
  },
];

export const usuarios: UsuarioRecord[] = [
  {
    id: "USR-001",
    nombre: "Jhelcen Romero",
    initials: "JR",
    avatarBg: "bg-blue-100",
    avatarColor: "text-blue-700",
    correo: "jhelcen.romero@haisales.pe",
    rol: "Administrador",
    sede: "Lima Centro",
    estado: "Activo",
    has2fa: true,
  },
  {
    id: "USR-002",
    nombre: "Ana Martínez",
    initials: "AM",
    avatarBg: "bg-violet-100",
    avatarColor: "text-violet-700",
    correo: "ana.martinez@haisales.pe",
    rol: "Gerente Comercial",
    sede: "Lima Surco",
    estado: "Activo",
    has2fa: true,
  },
  {
    id: "USR-003",
    nombre: "María Gómez",
    initials: "MG",
    avatarBg: "bg-emerald-100",
    avatarColor: "text-emerald-700",
    correo: "maria.gomez@haisales.pe",
    rol: "Contador",
    sede: "Lima Centro",
    estado: "Activo",
    has2fa: true,
  },
  {
    id: "USR-004",
    nombre: "Juan Campos",
    initials: "JC",
    avatarBg: "bg-orange-100",
    avatarColor: "text-orange-700",
    correo: "juan.campos@haisales.pe",
    rol: "Vendedor",
    sede: "Arequipa",
    estado: "Activo",
    has2fa: false,
  },
  {
    id: "USR-005",
    nombre: "Carlos Vargas",
    initials: "CV",
    avatarBg: "bg-cyan-100",
    avatarColor: "text-cyan-700",
    correo: "carlos.vargas@haisales.pe",
    rol: "Almacenero",
    sede: "Callao",
    estado: "Invitado",
    has2fa: false,
  },
  {
    id: "USR-006",
    nombre: "Verónica Salas",
    initials: "VS",
    avatarBg: "bg-pink-100",
    avatarColor: "text-pink-700",
    correo: "veronica.salas@haisales.pe",
    rol: "Analista RR.HH.",
    sede: "Lima Surco",
    estado: "Activo",
    has2fa: true,
  },
  {
    id: "USR-007",
    nombre: "Roberto Díaz",
    initials: "RD",
    avatarBg: "bg-indigo-100",
    avatarColor: "text-indigo-700",
    correo: "roberto.diaz@haisales.pe",
    rol: "Supervisor Logística",
    sede: "Trujillo",
    estado: "Activo",
    has2fa: true,
  },
  {
    id: "USR-008",
    nombre: "Patricia Ríos",
    initials: "PR",
    avatarBg: "bg-amber-100",
    avatarColor: "text-amber-700",
    correo: "patricia.rios@haisales.pe",
    rol: "Ejecutiva de Ventas",
    sede: "Lima Centro",
    estado: "Invitado",
    has2fa: false,
  },
  {
    id: "USR-009",
    nombre: "Luis Mendoza",
    initials: "LM",
    avatarBg: "bg-red-100",
    avatarColor: "text-red-700",
    correo: "luis.mendoza@haisales.pe",
    rol: "Operador",
    sede: "Piura",
    estado: "Inactivo",
    has2fa: false,
  },
  {
    id: "USR-010",
    nombre: "Carmen Delgado",
    initials: "CD",
    avatarBg: "bg-teal-100",
    avatarColor: "text-teal-700",
    correo: "carmen.delgado@haisales.pe",
    rol: "Asistente Administrativa",
    sede: "Lima Surco",
    estado: "Activo",
    has2fa: true,
  },
];

export const usuariosPorRol = [
  { label: "Administrador", count: 12, percent: 25, color: "#3b82f6" },
  { label: "Gerente", count: 10, percent: 21, color: "#a855f7" },
  { label: "Contador", count: 8, percent: 17, color: "#22c55e" },
  { label: "Vendedor", count: 7, percent: 15, color: "#f97316" },
  { label: "Almacenero", count: 6, percent: 12, color: "#06b6d4" },
  { label: "Otros", count: 5, percent: 10, color: "#94a3b8" },
];

export const actividadReciente = [
  { usuario: "Jhelcen Romero", accion: "Inicio de sesión", tiempo: "Hace 8 min" },
  { usuario: "Ana Martínez", accion: "Actualizó permisos de rol", tiempo: "Hace 24 min" },
  { usuario: "María Gómez", accion: "Exportó reporte de usuarios", tiempo: "Hace 1 h" },
  { usuario: "Carlos Vargas", accion: "Aceptó invitación", tiempo: "Hace 2 h" },
];

export const alertasSeguridad = [
  { label: "3 intentos de inicio de sesión fallidos", color: "bg-red-500", width: "100%" },
  { label: "2 usuarios sin 2FA activo", color: "bg-orange-500", width: "67%" },
  { label: "1 sesión expirada por inactividad", color: "bg-amber-400", width: "33%" },
];

export const usuarioSedes = [
  "Lima Centro",
  "Lima Surco",
  "Callao",
  "Arequipa",
  "Trujillo",
  "Piura",
];

export const usuarioRoles = [
  "Administrador",
  "Gerente Comercial",
  "Contador",
  "Vendedor",
  "Almacenero",
  "Analista RR.HH.",
  "Supervisor Logística",
  "Operador",
];

export const usuarioPermisosEspeciales = [
  "Aprobación de compras",
  "Emisión de comprobantes",
  "Gestión de nómina",
  "Configuración del sistema",
];

export const usuarioModulos = [
  "Ventas y CRM",
  "Inventario",
  "Contabilidad",
  "Planillas",
  "Logística",
  "Reportes",
];

export const usuarioOpciones2fa = ["Obligatorio", "Opcional", "Deshabilitado"];
export const usuarioEstadosIniciales = ["Invitado", "Activo", "Inactivo"];
export const usuarioOpcionesInvitacion = [
  "Sí, enviar por correo",
  "No, crear sin enviar",
  "Enviar y requerir cambio de clave",
];

export function getUsuarioEstadoStyles(estado: UsuarioEstado): string {
  switch (estado) {
    case "Activo":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Invitado":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Inactivo":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}
