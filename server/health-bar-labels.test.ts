import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("health bar labels in Indicadores card", () => {
  const financasPath = path.resolve(
    __dirname,
    "../client/src/pages/Financas.tsx"
  );
  const financasContent = fs.readFileSync(financasPath, "utf-8");

  it("should display 'Excelente' instead of 'Lucro máximo' as the right label", () => {
    expect(financasContent).not.toContain(">Lucro máximo<");
    expect(financasContent).toContain(">Excelente<");
  });

  it("should display 'Boa' as the middle label", () => {
    expect(financasContent).toContain(">Boa<");
  });

  it("should have three labels: Prejuízo, Boa, Excelente in order", () => {
    const prejuizoIndex = financasContent.indexOf(">Prejuízo<");
    const boaIndex = financasContent.indexOf(">Boa<");
    const excelenteIndex = financasContent.indexOf(">Excelente<");

    expect(prejuizoIndex).toBeGreaterThan(-1);
    expect(boaIndex).toBeGreaterThan(-1);
    expect(excelenteIndex).toBeGreaterThan(-1);

    // Verify order: Prejuízo < Boa < Excelente
    expect(prejuizoIndex).toBeLessThan(boaIndex);
    expect(boaIndex).toBeLessThan(excelenteIndex);
  });

  it("should still have 'Prejuízo' as the left label", () => {
    expect(financasContent).toContain(">Prejuízo<");
  });

  it("should use red color for 'Prejuízo' label", () => {
    expect(financasContent).toContain('text-red-500">Prejuízo<');
  });

  it("should use amber color for 'Boa' label", () => {
    expect(financasContent).toContain('text-amber-500">Boa<');
  });

  it("should use emerald/green color for 'Excelente' label", () => {
    expect(financasContent).toContain('text-emerald-500">Excelente<');
  });
});
