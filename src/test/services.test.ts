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
    expect(defaultEmpresaConfig.monedas).toEqual(["PEN"]);
    expect(defaultEmpresaConfig.telefonoPrefijo).toBe("+51");
    expect(defaultEmpresaConfig.impuestoRenta).toBe(1.5);
    expect(defaultEmpresaConfig.pais).toBe("Perú");
    expect(defaultEmpresaConfig.zonaHoraria).toBe("America/Lima");
    expect(defaultEmpresaConfig.serieNotaCredito).toBe("FC01");
    expect(defaultEmpresaConfig.serieNotaDebito).toBe("FD01");
    expect(defaultEmpresaConfig.regimenTributario).toBe("regimen_general");
    expect(defaultEmpresaConfig.setupCompleted).toBe(false);
  });

  it("genera iniciales de empresa", async () => {
    const { getEmpresaInitials } = await import("@/lib/parametros/empresa-service");
    expect(getEmpresaInitials("Hai Sales Technology S.A.C.")).toBe("HS");
    expect(getEmpresaInitials("")).toBe("HS");
  });
});
