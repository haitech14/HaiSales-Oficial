export type UserRole = "admin" | "vendedor" | "contador";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  contador: "Contador",
};

const ROLE_HIDDEN_HREFS: Record<UserRole, string[]> = {
  admin: [],
  vendedor: [
    "/app/contabilidad",
    "/app/planillas",
    "/app/usuarios",
    "/app/integraciones",
    "/app/parametros",
  ],
  contador: ["/app/pipeline", "/app/ventas-crm", "/app/inbox", "/app/integraciones"],
};

export function normalizeRole(value: string | null | undefined): UserRole {
  if (value === "vendedor" || value === "contador") return value;
  return "admin";
}

export function isHrefAllowedForRole(href: string | undefined, role: UserRole): boolean {
  if (!href) return true;
  return !ROLE_HIDDEN_HREFS[role].includes(href);
}

export function filterNavSectionsByRole<T extends { items: { href?: string }[] }>(
  sections: T[],
  role: UserRole,
): T[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isHrefAllowedForRole(item.href, role)),
    }))
    .filter((section) => section.items.length > 0);
}
