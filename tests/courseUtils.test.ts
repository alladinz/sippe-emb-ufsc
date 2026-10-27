import { describe, it, expect } from "vitest";
import { formatCursoVinculado, formatCursosVinculados, getCourseCode } from "../src/utils/courseUtils";

describe("courseUtils", () => {
  it("formats course names with their respective codes", () => {
    expect(formatCursoVinculado("Ciência e Tecnologia")).toBe("601 - Ciência e Tecnologia");
    expect(formatCursoVinculado("Engenharia Aeroespacial")).toBe("602 - Engenharia Aeroespacial");
    expect(formatCursoVinculado("Engenharia Automotiva")).toBe("603 - Engenharia Automotiva");
    expect(formatCursoVinculado("Engenharia Ferroviária e Metroviária")).toBe("604 - Engenharia Ferroviária e Metroviária");
    expect(formatCursoVinculado("Engenharia Mecatrônica")).toBe("605 - Engenharia Mecatrônica");
    expect(formatCursoVinculado("Engenharia Naval")).toBe("606 - Engenharia Naval");
    expect(formatCursoVinculado("Engenharia Civil de Infraestrutura")).toBe("607 - Engenharia Civil de Infraestrutura");
    expect(formatCursoVinculado("Engenharia de Transportes e Logística")).toBe("608 - Engenharia de Transportes e Logística");
  });

  it("extracts course codes properly", () => {
    expect(getCourseCode("Ciência e Tecnologia")).toBe(601);
    expect(getCourseCode("605 - Engenharia Mecatrônica")).toBe(605);
    expect(getCourseCode("Geral")).toBeNull();
  });

  it("handles 'Geral' and unknown courses appropriately", () => {
    expect(formatCursoVinculado("Geral")).toBe("Geral");
    expect(formatCursoVinculado("Outro Curso")).toBe("Outro Curso");
    expect(formatCursoVinculado("")).toBe("");
  });

  it("does not duplicate code if already present", () => {
    expect(formatCursoVinculado("601 - Ciência e Tecnologia")).toBe("601 - Ciência e Tecnologia");
    expect(formatCursoVinculado("601")).toBe("601 - Ciência e Tecnologia");
  });

  it("formats list of courses in ascending numeric order regardless of selection order", () => {
    const input = [
      "Engenharia Naval",                     // 606
      "Engenharia Automotiva",                // 603
      "Ciência e Tecnologia",                 // 601
      "Engenharia de Transportes e Logística", // 608
      "Engenharia Mecatrônica",               // 605
    ];
    expect(formatCursosVinculados(input)).toBe(
      "601 - Ciência e Tecnologia, 603 - Engenharia Automotiva, 605 - Engenharia Mecatrônica, 606 - Engenharia Naval, 608 - Engenharia de Transportes e Logística"
    );
  });

  it("handles empty or null lists", () => {
    expect(formatCursosVinculados([])).toBe("-");
    expect(formatCursosVinculados(null)).toBe("-");
    expect(formatCursosVinculados(undefined)).toBe("-");
  });
});
