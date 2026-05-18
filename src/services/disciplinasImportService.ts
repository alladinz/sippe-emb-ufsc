import { db } from "@/db";
import { disciplinas, turmas, semesters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DisciplinaRow } from "./sheetsParser";
import { namesMatch } from "../utils/nameUtils";

export interface ImportSummary {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export async function importDisciplinasFromRows(rows: DisciplinaRow[]): Promise<ImportSummary> {
  const summary: ImportSummary = {
    total: rows.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // 1. Get active semester
  const activeSemester = await db.query.semesters.findFirst({
    where: eq(semesters.ativo, true),
  });

  if (!activeSemester) {
    throw new Error("Nenhum semestre ativo encontrado. Configure um semestre antes de importar.");
  }

  // Use a transaction for safety
  await db.transaction(async (tx) => {
    let rowIndex = 2; // Starting from row 2 (after header)

    // Fetch all users once for better matching
    const allUsers = await tx.query.user.findMany();

    for (const row of rows) {
      try {
        // a) Find or create the disciplina record by codigo
        const existingDisciplina = await tx.query.disciplinas.findFirst({
          where: eq(disciplinas.codigo, row.disciplinaCodigo),
        });

        let disciplinaId: string;

        if (existingDisciplina) {
          await tx
            .update(disciplinas)
            .set({
              nome: row.disciplinaNome,
              curso: row.curso,
              creditosTeorico: row.creditosTeorico,
              creditosPratico: row.creditosPratico,
              ambienteTeorico: row.ambienteTeorico,
              ambientePratico: row.ambientePratico,
              formato: row.formato,
              importadoEm: new Date(),
              updatedAt: new Date(),
              fonte: 'sheets',
            })
            .where(eq(disciplinas.id, existingDisciplina.id));
          disciplinaId = existingDisciplina.id;
        } else {
          const [newDisc] = await tx
            .insert(disciplinas)
            .values({
              codigo: row.disciplinaCodigo,
              nome: row.disciplinaNome,
              curso: row.curso,
              creditosTeorico: row.creditosTeorico,
              creditosPratico: row.creditosPratico,
              ambienteTeorico: row.ambienteTeorico,
              ambientePratico: row.ambientePratico,
              formato: row.formato,
              importadoEm: new Date(),
              fonte: 'sheets',
            })
            .returning();
          disciplinaId = newDisc.id;
        }
        
        // b) Match professor name to existing user
        let professorId: string | null = null;
        if (row.professorNome) {
          const names = row.professorNome.split(/[/,]/).map(n => n.trim()).filter(Boolean);
          const rawName = names[0] || '';
          
          if (rawName) {
            const matchedUser = allUsers.find(u => namesMatch(u.name, rawName));
            if (matchedUser) {
              professorId = matchedUser.id;
            }
          }
        }

        // c) Upsert the turma record
        const existingTurma = await tx.query.turmas.findFirst({
          where: and(
            eq(turmas.disciplinaId, disciplinaId),
            eq(turmas.semestreId, activeSemester.id),
            eq(turmas.turma, row.turma)
          ),
        });

        if (existingTurma) {
          await tx
            .update(turmas)
            .set({
              vagas: row.vagas,
              lotacaoTeorico: row.lotacaoTeorico,
              lotacaoPratico: row.lotacaoPratico,
              agrupamentoTeorico: row.agrupamentoTeorico,
              agrupamentoPratico: row.agrupamentoPratico,
              vagasAgrupamentoTeorico: row.vagasAgrupamentoTeorico,
              vagasAgrupamentoPratico: row.vagasAgrupamentoPratico,
              professorNome: row.professorNome,
              professorIndicacao: row.professorIndicacao,
              professorId: professorId,
              indicacaoHorario: row.indicacaoHorario,
              importadoEm: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(turmas.id, existingTurma.id));
          summary.updated++;
        } else {
          await tx.insert(turmas).values({
            disciplinaId,
            semestreId: activeSemester.id,
            turma: row.turma,
            vagas: row.vagas,
            lotacaoTeorico: row.lotacaoTeorico,
            lotacaoPratico: row.lotacaoPratico,
            agrupamentoTeorico: row.agrupamentoTeorico,
            agrupamentoPratico: row.agrupamentoPratico,
            vagasAgrupamentoTeorico: row.vagasAgrupamentoTeorico,
            vagasAgrupamentoPratico: row.vagasAgrupamentoPratico,
            professorNome: row.professorNome,
            professorIndicacao: row.professorIndicacao,
            professorId: professorId,
            indicacaoHorario: row.indicacaoHorario,
            importadoEm: new Date(),
          });
          summary.inserted++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao processar linha";
        summary.errors.push({
          row: rowIndex,
          message: errorMessage,
        });
        // We throw to rollback the entire transaction as requested in step 7d
        throw new Error(`Erro na linha ${rowIndex}: ${errorMessage}`);
      }
      rowIndex++;
    }
  });

  return summary;
}
