export interface DisciplinaRow {
  // Discipline
  disciplinaNome:    string;
  disciplinaCodigo:  string;
  curso:             string;

  // Class section — THIS IS WHAT MAKES EACH ROW UNIQUE
  turma:             string;

  // Offering
  oferta:            boolean;
  vagas:             number;
  formato:           string | null | undefined;
  creditosTeorico:   number;
  ambienteTeorico:   string | null | undefined;
  lotacaoTeorico:    number | undefined;
  creditosPratico:   number;
  ambientePratico:   string | null | undefined;
  lotacaoPratico:    number | undefined;

  // Grouping (informational only)
  agrupamentoTeorico:          string | null | undefined;
  vagasAgrupamentoTeorico:     number | undefined;
  agrupamentoPratico:          string | null | undefined;
  vagasAgrupamentoPratico:     number | undefined;

  // Professor — THE OTHER KEY FIELD
  professorIndicacao:  string | null | undefined;
  professorNome:       string;
  indicacaoHorario:    string | null | undefined;
}

function parseDisciplinaCodigo(colA: string, colG: string): string {
  // Priority: use Column G (index 6) if available (cleaner code)
  if (colG && colG.trim()) return colG.trim();
  
  // Fall back to parsing Column A (index 0)
  // Format: "EMB5001 - Cálculo Diferencial e Integral I"
  const parts = colA.split(' - ');
  if (parts.length >= 1) {
    const possibleCode = parts[0].trim();
    // Validate it looks like a discipline code (e.g. EMB5001, EGR5611)
    if (/^[A-Z]{2,4}\d{4,5}$/.test(possibleCode)) {
      return possibleCode;
    }
  }
  return '';
}

function parseDisciplinaNome(colA: string): string {
  const parts = colA.split(' - ');
  if (parts.length >= 2) {
    return parts.slice(1).join(' - ').trim();
  }
  return colA.trim();
}

export function parseSheetRows(
  rows: string[][]
): DisciplinaRow[] {
  if (!rows || rows.length < 2) return [];

  const resultado: DisciplinaRow[] = [];

  // Carry-forward state for merged cells
  let ultimaDisciplinaNome = '';
  let ultimaDisciplinaCodigo = '';
  let ultimoCurso = '';

  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Safely get cell value (handle sparse rows)
    const cel = (idx: number): string => 
      (row[idx] ?? '').toString().trim();

    // ── Update carry-forward if Col A has content ──────
    // A=0, B=1, C=2, G=6, I=8, J=9, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, V=21, W=22, X=23, Y=24, AD=29, AE=30, AF=31
    if (cel(0)) {
      ultimaDisciplinaNome  = parseDisciplinaNome(cel(0));
      ultimaDisciplinaCodigo = parseDisciplinaCodigo(cel(0), cel(6));
      ultimoCurso = cel(1) || ultimoCurso;
    } else if (cel(6)) {
      // Col A empty but Col G has code
      ultimaDisciplinaCodigo = cel(6);
    }

    if (cel(1)) ultimoCurso = cel(1);

    // ── Skip rows that should not generate plans ───────

    // Must have Oferta (Col I = index 8) = "Sim"
    if (cel(8).toLowerCase() !== 'sim') continue;

    // Must have a turma (Col C = index 2)
    const turma = cel(2);
    if (!turma) continue;

    // Must have a professor name (Col AE = index 30)
    const professorNome = cel(30);
    if (!professorNome) continue;

    // Must have a discipline (from carry-forward or current)
    if (!ultimaDisciplinaCodigo && !ultimaDisciplinaNome) {
      continue;
    }

    // ── Build the row object ───────────────────────────
    resultado.push({
      disciplinaNome:   ultimaDisciplinaNome,
      disciplinaCodigo: ultimaDisciplinaCodigo,
      curso:            ultimoCurso,
      turma:            turma,
      oferta:           true,
      vagas:            parseInt(cel(9)) || 0,
      formato:          cel(11),
      creditosTeorico:  parseInt(cel(12)) || 0,
      ambienteTeorico:  cel(13),
      lotacaoTeorico:   parseInt(cel(14)) || 0,
      creditosPratico:  parseInt(cel(15)) || 0,
      ambientePratico:  cel(16),
      lotacaoPratico:   parseInt(cel(17)) || 0,
      agrupamentoTeorico:       cel(21),
      vagasAgrupamentoTeorico:  parseInt(cel(22)) || 0,
      agrupamentoPratico:       cel(23),
      vagasAgrupamentoPratico:  parseInt(cel(24)) || 0,
      professorIndicacao:  cel(29),
      professorNome:       professorNome,
      indicacaoHorario:    cel(31),
    });
  }

  return resultado;
}

export function getImportSummary(rows: DisciplinaRow[]) {
  const ofertadas = rows.length;
  const cursos = Array.from(new Set(rows.map(r => r.curso))).filter(Boolean).sort();
  
  // Group by discipline
  const discMap = new Map<string, { codigo: string, nome: string, turmas: { turma: string, professor: string, vagas: number }[] }>();
  
  rows.forEach(r => {
    const key = r.disciplinaCodigo;
    if (!discMap.has(key)) {
      discMap.set(key, { codigo: r.disciplinaCodigo, nome: r.disciplinaNome, turmas: [] });
    }
    discMap.get(key)!.turmas.push({ turma: r.turma, professor: r.professorNome, vagas: r.vagas });
  });

  const disciplinas = Array.from(discMap.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  
  // Extract and split all professor names
  const allProfessorNames = rows.flatMap(r => 
    (r.professorNome || '').split(/[/,]/).map(n => n.trim()).filter(Boolean)
  );
  const professores = Array.from(new Set(allProfessorNames)).sort();
  
  return {
    total: rows.length,
    ofertadas,
    cursos,
    professores,
    disciplinas
  };
}
