export type UserRole = "admin" | "ventas" | "tecnico";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  ventas: "Ventas",
  tecnico: "Tecnico",
};

export const USER_ROLE_OPTIONS = Object.values(ROLE_LABELS);

const LEGACY_ROLE_ALIASES: Record<string, UserRole> = {
  admin: "admin",
  administrador: "admin",
  vendedor: "ventas",
  ventas: "ventas",
  contador: "tecnico",
  tecnico: "tecnico",
  "gerente comercial": "ventas",
  "gerente-comercial": "ventas",
  "ejecutiva de ventas": "ventas",
  "ejecutiva-ventas": "ventas",
  operador: "tecnico",
  "operador-planta": "tecnico",
  almacenero: "tecnico",
  "coordinador-almacen": "tecnico",
  "analista rr.hh.": "tecnico",
  "asistente-rrhh": "tecnico",
  "supervisor logística": "tecnico",
  "supervisor-logistico": "tecnico",
  "asistente administrativa": "tecnico",
};

const ROLE_HIDDEN_HREFS: Record<UserRole, string[]> = {
  admin: [],
  ventas: [
    "/app/contabilidad",
    "/app/planillas",
    "/app/usuarios",
    "/app/integraciones",
    "/app/parametros",
  ],
  tecnico: ["/app/pipeline", "/app/inbox", "/app/integraciones"],
};

export function normalizeRole(value: string | null | undefined): UserRole {
  if (!value) return "admin";
  const key = value.trim().toLowerCase();
  const mapped = LEGACY_ROLE_ALIASES[key];
  if (mapped) return mapped;
  return "admin";
}

export function getRoleLabel(value: string | null | undefined): string {
  return ROLE_LABELS[normalizeRole(value)];
}

export function isHrefAllowedForRole(href: string | undefined, role: UserRole): boolean {
  if (!href) return true;
  return !ROLE_HIDDEN_HREFS[role].includes(href);
}

export function filterNavGroupByRole<
  T extends { href?: string; items: { href: string }[] },
>(group: T, role: UserRole): T | null {
  const items = group.items.filter((item) => isHrefAllowedForRole(item.href, role));
  if (items.length === 0) return null;

  const href = group.href && isHrefAllowedForRole(group.href, role) ? group.href : items[0]?.href;

  return { ...group, href, items };
}

export function filterNavSectionsByRole<
  T extends { title: string; items: { href?: string }[]; groups?: { href?: string; items: { href: string }[] }[] },
>(sections: T[], role: UserRole): T[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isHrefAllowedForRole(item.href, role)),
      groups: section.groups
        ?.map((group) => filterNavGroupByRole(group, role))
        .filter((group): group is NonNullable<typeof group> => group !== null),
    }))
    .filter((section) => section.items.length > 0 || (section.groups?.length ?? 0) > 0);
}
