import { z, ZodIssue } from 'zod';

export const DisciplinaRowSchema = z.object({
  disciplinaNome:    z.string().min(1, 'Nome da disciplina obrigatório'),
  disciplinaCodigo:  z.string().min(1, 'Código da disciplina obrigatório'),
  curso:             z.string().min(1, 'Curso obrigatório'),
  turma:             z.string().min(1, 'Turma obrigatória'),
  oferta:            z.boolean(),
  vagas:             z.number().int().nonnegative(),
  formato:           z.string().optional().nullable(),
  creditosTeorico:   z.number().int().nonnegative(),
  ambienteTeorico:   z.string().optional().nullable(),
  lotacaoTeorico:    z.number().int().nonnegative().optional(),
  creditosPratico:   z.number().int().nonnegative(),
  ambientePratico:   z.string().optional().nullable(),
  lotacaoPratico:    z.number().int().nonnegative().optional(),
  agrupamentoTeorico:       z.string().optional().nullable(),
  vagasAgrupamentoTeorico:  z.number().int().nonnegative().optional(),
  agrupamentoPratico:       z.string().optional().nullable(),
  vagasAgrupamentoPratico:  z.number().int().nonnegative().optional(),
  professorNome:     z.string().min(1, 'Nome do professor obrigatório'),
  professorIndicacao:z.string().optional().nullable(),
  indicacaoHorario:  z.string().optional().nullable(),
});

export type DisciplinaRowInput = z.infer<typeof DisciplinaRowSchema>;

export const PlanilhaSchema = z.array(DisciplinaRowSchema);

// Validation result shape
export interface ValidationReport {
  valid: DisciplinaRowInput[];
  invalid: { row: number; issues: string[] }[];
}

export function validateRows(rows: unknown[]): ValidationReport {
  const valid: DisciplinaRowInput[] = [];
  const invalid: { row: number; issues: string[] }[] = [];

  rows.forEach((row, index) => {
    const result = DisciplinaRowSchema.safeParse(row);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({
        row: index + 2, // +2 because index 0 = row 2 in spreadsheet
        issues: result.error.issues.map((e: ZodIssue) => 
          `${e.path.join('.')}: ${e.message}`)
      });
    }
  });

  return { valid, invalid };
}
