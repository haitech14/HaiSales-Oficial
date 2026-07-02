import { describe, expect, it } from "vitest";
import { calculateMovimientoSummary } from "@/lib/almacenes-form-data";

describe("almacenes-form-data", () => {
  it("calcula stock resultante en movimiento de entrada", () => {
    const summary = calculateMovimientoSummary("10", "25", 100);
    expect(summary.stockResultante).toBe(110);
    expect(summary.costoPromedio).toBe(25);
  });
});

describe("empresa config defaults", () => {
  it("usa IGV 18% por defecto", async () => {
    const { defaultEmpresaConfig } = await import("@/lib/parametros/empresa-service");
    expect(defaultEmpresaConfig.igvPorcentaje).toBe(18);
    expect(defaultEmpresaConfig.moneda).toBe("PEN");
  });
});
