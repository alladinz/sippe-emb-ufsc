import { z } from 'zod';

export const createProgramaSchema = z.object({
  disciplina_id: z.string().uuid('ID de disciplina inválido'),
});

export const updateProgramaSchema = z.object({
  codigo_disciplina:       z.string().max(20).optional(),
  nome_disciplina:         z.string().max(255).optional(),
  cursos_vinculados:       z.array(z.string()).optional(),
  carga_horaria_teorica:   z.number().int().min(0).optional(),
  carga_horaria_pratica:   z.number().int().min(0).optional(),
  carga_horaria_total:     z.number().int().min(0).optional(),
  creditos_teoricos:       z.number().int().min(0).optional(),
  creditos_praticos:       z.number().int().min(0).optional(),
  ementa:                  z.string().optional(),
  objetivos:               z.string().optional(),
  conteudo_programatico:   z.string().optional(),
  criterios_avaliacao:     z.string().optional(),
  bibliografia: z.array(z.object({
    id:         z.string(),
    tipo:       z.enum(['basica', 'complementar']),
    referencia: z.string().min(1),
    ordem:      z.number().int().min(0),
  })).optional(),
});

export const submitProgramaSchema = z.object({
  curso_aprovacao: z.string().min(1, 'Informe o curso para aprovação'),
});

export const reviewProgramaSchema = z.object({
  action: z.enum(['approve', 'reject']),
  feedback: z.string().optional(),
}).refine(
  data => data.action !== 'reject' || (data.feedback && data.feedback.trim().length > 0),
  {
    message: 'Feedback é obrigatório ao rejeitar',
    path: ['feedback'],
  }
);
