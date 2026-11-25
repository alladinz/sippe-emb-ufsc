import { describe, it, expect } from "vitest";
import { splitTurmaCell, expandAndDeduplicateTurmas } from "@/utils/turmaExpansion";
import type { DisciplinaRow } from "@/services/sheetsParser";

const makeRow = (overrides: Partial<DisciplinaRow>): DisciplinaRow => ({
  disciplinaNome: "Cálculo I",
  disciplinaCodigo: "EMB5001",
  curso: "Ciência e Tecnologia",
  turma: "01601",
  oferta: true,
  vagas: 40,
  creditosTeorico: 4,
  creditosPratico: 0,
  professorNome: "Docente Teste",
  ...overrides,
});

describe("Turma expansion and deduplication", () => {
  it("should split grouped turma cells separated by slash, comma, semicolon or 'e'", () => {
    expect(splitTurmaCell("05601/05602")).toEqual(["05601", "05602"]);
    expect(splitTurmaCell("05601, 05602; 05603")).toEqual(["05601", "05602", "05603"]);
    expect(splitTurmaCell("05601 e 05602")).toEqual(["05601", "05602"]);
    expect(splitTurmaCell("01601A")).toEqual(["01601A"]);
  });

  it("should expand grouped row into separate rows resolving course by 3-digit suffix and deduplicate across sheet", () => {
    const rows: DisciplinaRow[] = [
      makeRow({ turma: "05601/05602", curso: "601/602" }),
      makeRow({ turma: "05602" }),
    ];

    const { expanded, skippedDuplicates } = expandAndDeduplicateTurmas(rows);
    expect(expanded).toHaveLength(2);
    expect(expanded[0].turma).toBe("05601");
    expect(expanded[0].curso).toBe("Ciência e Tecnologia");
    expect(expanded[1].turma).toBe("05602");
    expect(expanded[1].curso).toBe("Engenharia Aeroespacial");
    expect(skippedDuplicates).toBe(1);
  });

  it("should deduplicate repeated turma rows for the same discipline even with mixed case or whitespace", () => {
    const rows: DisciplinaRow[] = [
      makeRow({ disciplinaCodigo: "emb5001", turma: " 01601a " }),
      makeRow({ disciplinaCodigo: "EMB5001", turma: "01601A" }),
    ];

    const { expanded, skippedDuplicates } = expandAndDeduplicateTurmas(rows);
    expect(expanded).toHaveLength(1);
    expect(expanded[0].turma).toBe("01601a");
    expect(skippedDuplicates).toBe(1);
  });
});
