export type ProgramaStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface BibliografiaItem {
  id:         string;   // client-side UUID for React key
  tipo:       'basica' | 'complementar';
  referencia: string;
  ordem:      number;
}

export interface ProgramaEnsino {
  id:                    string;
  disciplina_id:         string;
  status:                ProgramaStatus;
  criado_por:            string;
  atualizado_por?:       string;

  // Section 1 — Identificação
  codigo_disciplina?:    string | null;
  nome_disciplina?:      string | null;
  cursos_vinculados?:    string[] | null;

  // Section 2 — Carga Horária
  carga_horaria_teorica?:  number | null;
  carga_horaria_pratica?:  number | null;
  carga_horaria_total?:    number | null;
  creditos_teoricos?:      number | null;
  creditos_praticos?:      number | null;

  // Section 3–6 — Content
  ementa?:                 string | null;
  objetivos?:              string | null;
  conteudo_programatico?:  string | null;
  criterios_avaliacao?:    string | null;

  // Sections 7–8 — Bibliography
  bibliografia:            BibliografiaItem[] | null;

  // Approval
  curso_aprovacao?:        string | null;
  aprovado_por?:           string | null;
  feedback_aprovacao?:     string | null;
  submetido_em?:           Date | string | null;
  aprovado_em?:            Date | string | null;
  arquivado_em?:           Date | string | null;

  // Timestamps
  created_at:              Date | string;
  updated_at:              Date | string;

  // Joined fields (from API responses)
  disciplina?: {
    id:     string;
    codigo: string;
    nome:   string;
    curso:  string | null;
    carga_horaria_total?: number | null;
    creditos_teorico?:    number | null;
    creditos_pratico?:    number | null;
    graduacoes?:          string[];
  } | null;
  criador?: {
    id:    string;
    nome:  string;
    papel: string;
  } | null;
}

export interface CreateProgramaDto {
  disciplina_id: string;
}

export interface UpdateProgramaDto {
  codigo_disciplina?:       string;
  nome_disciplina?:         string;
  cursos_vinculados?:       string[];
  carga_horaria_teorica?:   number;
  carga_horaria_pratica?:   number;
  carga_horaria_total?:     number;
  creditos_teoricos?:       number;
  creditos_praticos?:       number;
  ementa?:                  string;
  objetivos?:               string;
  conteudo_programatico?:   string;
  criterios_avaliacao?:     string;
  bibliografia?:            BibliografiaItem[];
}

export interface SubmitProgramaDto {
  curso_aprovacao: string;
}

export interface ReviewProgramaDto {
  action:   'approve' | 'reject';
  feedback?: string;
}

export interface ProgramaListItem {
  id:               string;
  disciplina_id:    string;
  status:           ProgramaStatus;
  codigo_disciplina?: string | null;
  nome_disciplina?:   string | null;
  cursos_vinculados?: string[] | null;
  updated_at:         Date | string;
  criador_nome?:      string | null;
  completude:         number; // 0–100 percent filled
}
