import * as XLSX from 'xlsx';
import { normalizeName } from '../utils/nameUtils';
import { DisciplinaRow } from './sheetsParser';

// Required column names (case-insensitive match)
const REQUIRED_COLUMNS = [
  'disciplina', 'turma', 'professor'
];

export function parseXLSXBuffer(buffer: Buffer): {
  rows: DisciplinaRow[];
  missingColumns: string[];
} {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to array of arrays to handle merged cells carry-forward like sheetsParser
  const rowsRaw = XLSX.utils.sheet_to_json(sheet, { 
    header: 1,
    defval: ''
  }) as string[][];

  if (rowsRaw.length < 2) {
    return { rows: [], missingColumns: REQUIRED_COLUMNS };
  }

  // Find header indices
  const headers = rowsRaw[0].map(h => normalizeName(String(h || '')));
  
  const getIdx = (keywords: string[]) => 
    headers.findIndex(h => keywords.some(k => h.includes(normalizeName(k))));

  const idxMap = {
    disciplina: getIdx(['disciplina']),
    curso:      getIdx(['curso']),
    turma:      getIdx(['turma']),
    codigo:     getIdx(['codigo', 'cod', 'transicao']),
    oferta:     getIdx(['oferta']),
    vagas:      getIdx(['vagas']),
    formato:    getIdx(['formato']),
    creditosT:  getIdx(['creditos teorica', 'creditos teorico', 'cr. t']),
    ambienteT:  getIdx(['ambiente teorica', 'ambiente teorico']),
    lotacaoT:   getIdx(['lotacao teorica', 'lotacao teorico']),
    creditosP:  getIdx(['creditos pratica', 'creditos pratico', 'cr. p']),
    ambienteP:  getIdx(['ambiente pratica', 'ambiente pratico']),
    lotacaoP:   getIdx(['lotacao pratica', 'lotacao pratico']),
    agrupT:     getIdx(['agrupamento teorico']),
    vagasAgrupT:getIdx(['vagas agrupamento teorico', 'vagas no agrupamento teorico']),
    agrupP:     getIdx(['agrupamento pratico']),
    vagasAgrupP:getIdx(['vagas agrupamento pratico', 'vagas no agrupamento pratico']),
    profIndic:  getIdx(['indicacao de professor', 'indicacao professor']),
    professor:  getIdx(['professor']),
    horario:    getIdx(['indicacao de horario', 'horario']),
  };

  // Check required
  const missingColumns = [];
  if (idxMap.disciplina === -1) missingColumns.push('disciplina');
  if (idxMap.turma === -1) missingColumns.push('turma');
  if (idxMap.professor === -1) missingColumns.push('professor');

  if (missingColumns.length > 0) {
    return { rows: [], missingColumns };
  }

  const result: DisciplinaRow[] = [];
  
  let ultimaDisciplinaNome = '';
  let ultimaDisciplinaCodigo = '';
  let ultimoCurso = '';

  for (let i = 1; i < rowsRaw.length; i++) {
    const row = rowsRaw[i];
    const cel = (idx: number) => (idx !== -1 ? String(row[idx] || '').trim() : '');

    const rawA = cel(idxMap.disciplina);
    const rawG = cel(idxMap.codigo);
    const rawB = cel(idxMap.curso);

    if (rawA) {
      const parts = rawA.split(' - ');
      if (parts.length >= 2) {
        ultimaDisciplinaNome = parts.slice(1).join(' - ').trim();
        ultimaDisciplinaCodigo = rawG || parts[0].trim();
      } else {
        ultimaDisciplinaNome = rawA;
        ultimaDisciplinaCodigo = rawG;
      }
      ultimoCurso = rawB || ultimoCurso;
    } else if (rawG) {
      ultimaDisciplinaCodigo = rawG;
    }
    
    if (rawB) ultimoCurso = rawB;

    // Filter
    const oferta = cel(idxMap.oferta).toLowerCase();
    if (oferta && oferta !== 'sim') continue;

    const turma = cel(idxMap.turma);
    const professor = cel(idxMap.professor);
    if (!turma || !professor || (!ultimaDisciplinaNome && !ultimaDisciplinaCodigo)) continue;

    result.push({
      disciplinaNome:   ultimaDisciplinaNome,
      disciplinaCodigo: ultimaDisciplinaCodigo,
      curso:            ultimoCurso,
      turma:            turma,
      oferta:           true,
      vagas:            parseInt(cel(idxMap.vagas)) || 0,
      formato:          cel(idxMap.formato),
      creditosTeorico:  parseInt(cel(idxMap.creditosT)) || 0,
      ambienteTeorico:  cel(idxMap.ambienteT),
      lotacaoTeorico:   parseInt(cel(idxMap.lotacaoT)) || 0,
      creditosPratico:  parseInt(cel(idxMap.creditosP)) || 0,
      ambientePratico:  cel(idxMap.ambienteP),
      lotacaoPratico:   parseInt(cel(idxMap.lotacaoP)) || 0,
      agrupamentoTeorico:       cel(idxMap.agrupT),
      vagasAgrupamentoTeorico:  parseInt(cel(idxMap.vagasAgrupT)) || 0,
      agrupamentoPratico:       cel(idxMap.agrupP),
      vagasAgrupamentoPratico:  parseInt(cel(idxMap.vagasAgrupP)) || 0,
      professorIndicacao:  cel(idxMap.profIndic),
      professorNome:       professor,
      indicacaoHorario:    cel(idxMap.horario),
    });
  }

  return { rows: result, missingColumns: [] };
}
