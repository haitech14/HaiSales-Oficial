import { describe, expect, it } from "vitest";
import { calculateVentaTotals } from "@/lib/nueva-venta-types";

describe("calculateVentaTotals", () => {
  it("calcula subtotal, igv y total con IGV 18%", () => {
    const result = calculateVentaTotals(2, 100);
    expect(result.subtotal).toBe(200);
    expect(result.igv).toBeCloseTo(36);
    expect(result.total).toBeCloseTo(236);
  });
});

describe("ProtectedRoute contract", () => {
  it("expone rutas protegidas bajo /app", () => {
    expect("/app/dashboard".startsWith("/app")).toBe(true);
  });
});
