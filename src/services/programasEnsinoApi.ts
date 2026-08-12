import api from '../lib/api';
import type {
  ProgramaEnsino,
  ProgramaListItem,
  CreateProgramaDto,
  UpdateProgramaDto,
  SubmitProgramaDto,
  ReviewProgramaDto,
} from '../types/programaEnsino';

export const programasEnsinoApi = {
  // List with filters and pagination
  list: async (params?: {
    status?:  string;
    search?:  string;
    page?:    number;
    limit?:   number;
  }) => {
    const { data } = await api.get('/programas', { params });
    return data as { data: ProgramaListItem[]; total: number };
  },

  // Get single program by ID
  getById: async (id: string) => {
    const { data } = await api.get(`/programas/${id}`);
    return data as ProgramaEnsino;
  },

  // Get program by discipline ID
  getByDisciplinaId: async (disciplinaId: string) => {
    const { data } = await api.get(
      `/programas/disciplina/${disciplinaId}`
    );
    return data as ProgramaEnsino | null;
  },

  // Create a new program (pre-fills from disciplina)
  create: async (body: CreateProgramaDto) => {
    const { data } = await api.post('/programas', body);
    return data as ProgramaEnsino;
  },

  // Auto-save patch
  update: async (id: string, body: UpdateProgramaDto) => {
    const { data } = await api.patch(`/programas/${id}`, body);
    return data as ProgramaEnsino;
  },

  // Submit for coordinator approval
  submit: async (id: string, body: SubmitProgramaDto) => {
    const { data } = await api.post(
      `/programas/${id}/submeter`, body
    );
    return data as ProgramaEnsino;
  },

  // Coordinator approves or rejects
  review: async (id: string, body: ReviewProgramaDto) => {
    const { data } = await api.post(
      `/programas/${id}/revisar`, body
    );
    return data as ProgramaEnsino;
  },

  // Archive an approved program
  archive: async (id: string) => {
    const { data } = await api.post(
      `/programas/${id}/arquivar`
    );
    return data as ProgramaEnsino;
  },

  // Get audit history
  getHistorico: async (id: string) => {
    const { data } = await api.get(
      `/programas/${id}/historico`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any[];
  },
};
