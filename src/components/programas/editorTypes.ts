import type { BibliografiaItem } from "../../types/programaEnsino";

export interface ProgramaFormState {
  codigo_disciplina: string;
  nome_disciplina: string;
  cursos_vinculados: string[];

  carga_horaria_teorica: number;
  carga_horaria_pratica: number;
  carga_horaria_extensao: number;
  carga_horaria_total: number;
  creditos_teoricos: number;
  creditos_praticos: number;
  creditos_extensao: number;

  ementa: string;
  objetivos: string;
  conteudo_programatico: string;
  criterios_avaliacao: string;
  
  bibliografia: BibliografiaItem[];
}

export interface EditorTabProps {
  formState: ProgramaFormState;
  updateField: <K extends keyof ProgramaFormState>(field: K, value: ProgramaFormState[K]) => void;
  isReadOnly: boolean;
}
