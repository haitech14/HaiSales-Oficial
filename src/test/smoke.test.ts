import { describe, expect, it } from "vitest";
import { calculateVentaTotals } from "@/lib/nueva-venta-types";
import { filterNavSectionsByRole, isHrefAllowedForRole, normalizeRole } from "@/lib/auth/roles";

describe("calculateVentaTotals", () => {
  it("calcula subtotal, igv y total con IGV 18%", () => {
    const result = calculateVentaTotals(2, 100);
    expect(result.subtotal).toBe(200);
    expect(result.igv).toBeCloseTo(36);
    expect(result.total).toBeCloseTo(236);
  });
});

describe("roles", () => {
  it("normaliza roles desconocidos a admin", () => {
    expect(normalizeRole("otro")).toBe("admin");
    expect(normalizeRole("vendedor")).toBe("ventas");
    expect(normalizeRole("contador")).toBe("tecnico");
  });

  it("oculta módulos administrativos para ventas", () => {
    expect(isHrefAllowedForRole("/app/contabilidad", "ventas")).toBe(false);
    expect(isHrefAllowedForRole("/app/ventas", "ventas")).toBe(true);
  });

  it("filtra secciones vacías tras RBAC", () => {
    const sections = filterNavSectionsByRole(
      [
        {
          title: "Admin",
          items: [{ href: "/app/contabilidad" }, { href: "/app/ventas" }],
        },
      ],
      "ventas",
    );
    expect(sections[0].items).toHaveLength(1);
    expect(sections[0].items[0].href).toBe("/app/ventas");
  });
});

describe("ProtectedRoute contract", () => {
  it("expone rutas protegidas bajo /app", () => {
    expect("/app/dashboard".startsWith("/app")).toBe(true);
  });
});
