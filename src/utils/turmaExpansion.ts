import { CODE_COURSE_MAP } from "./courseUtils";
import type { DisciplinaRow } from "@/services/sheetsParser";

export function splitTurmaCell(rawTurma: string): string[] {
  if (!rawTurma) return [];
  const parts = rawTurma
    .split(/\s*(?:[/,;]|\be\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function resolveCourseForTurma(
  turmaCode: string,
  fallbackCourse: string,
  index: number
): string {
  // Standard UFSC Joinville class pattern: 2 phase digits + 3 course digits (+ optional suffix, e.g., 05602, 01601A)
  const match = turmaCode.match(/^\d{2}(\d{3})/);
  if (match && CODE_COURSE_MAP[match[1]]) {
    return CODE_COURSE_MAP[match[1]];
  }

  const courseParts = fallbackCourse
    .split(/\s*[/,;]\s*/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (courseParts[index]) {
    return CODE_COURSE_MAP[courseParts[index]] ?? courseParts[index];
  }

  return fallbackCourse;
}

export function expandAndDeduplicateTurmas(rows: DisciplinaRow[]): {
  expanded: DisciplinaRow[];
  skippedDuplicates: number;
} {
  const seenKeys = new Set<string>();
  const expanded: DisciplinaRow[] = [];
  let skippedDuplicates = 0;

  for (const row of rows) {
    const turmasSplit = splitTurmaCell(row.turma);
    const candidates = turmasSplit.length > 0 ? turmasSplit : [row.turma.trim()];

    candidates.forEach((singleTurma, idx) => {
      const normalizedDiscCode = (row.disciplinaCodigo || row.disciplinaNome).trim().toUpperCase();
      const normalizedTurma = singleTurma.trim().toUpperCase();
      const dedupKey = `${normalizedDiscCode}::${normalizedTurma}`;

      if (seenKeys.has(dedupKey)) {
        skippedDuplicates++;
        return;
      }

      seenKeys.add(dedupKey);
      expanded.push({
        ...row,
        turma: singleTurma.trim(),
        curso:
          candidates.length > 1
            ? resolveCourseForTurma(singleTurma.trim(), row.curso, idx)
            : row.curso,
      });
    });
  }

  return { expanded, skippedDuplicates };
}
