import fs from 'fs';

const filePath = './src/services/programaEnsinoService.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add missing imports
content = content.replace(
  'import { programasEnsino, historicoProgramas } from "../db/schema_programas";',
  'import { programasEnsino, historicoProgramas, programaAprovacoes } from "../db/schema_programas";'
);
content = content.replace(
  'import { disciplinas, user, universityCourses, notifications } from "@/db/schema";',
  'import { disciplinas, user, universityCourses, notifications, member } from "@/db/schema";'
);
content = content.replace(
  'import { eq, and, ilike, or, desc, sql, ne } from "drizzle-orm";',
  'import { eq, and, ilike, or, desc, sql, ne, inArray } from "drizzle-orm";'
);

// 2. Replace the functions submitPrograma, reviewPrograma, archivePrograma
//    and inject reviewByChefe, getAprovacoes

const newFunctions = `
export async function submitPrograma(id: string, userId: string, papel?: string): Promise<ProgramaEnsino> {
  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  
  const missing = [];
  if (!prog.ementa?.trim()) missing.push('ementa');
  if (!prog.objetivos?.trim()) missing.push('objetivos');
  if (!prog.conteudo_programatico?.trim()) missing.push('conteudo_programatico');

  if (missing.length > 0) {
    const error: any = new Error(\`Missing required fields: \${missing.join(', ')}\`);
    error.code = 'MISSING_FIELDS';
    error.fields = missing;
    throw error;
  }

  const disciplineName = prog.nome_disciplina ?? 'Disciplina';

  if (papel === 'comissao') {
    if (prog.status !== 'draft') throw new Error('Only draft can be submitted by comissao');

    await db.update(programasEnsino)
      .set({
        status: 'pending_chefe',
        submetidoEm: new Date(),
        atualizadoPor: userId,
        updatedAt: new Date()
      })
      .where(eq(programasEnsino.id, id));

    await db.insert(historicoProgramas).values({
      programaId: id,
      usuarioId: userId,
      tipoEvento: 'encaminhado_chefia',
      descricao: \`Programa encaminhado para revisão da chefia\`,
    });

    const chefes = await db.select({ id: user.id }).from(user)
      .innerJoin(member, eq(user.id, member.userId))
      .where(
        and(
          eq(member.role, 'chefe'),
          eq(user.status, 'active')
        )
      );

    for (const ch of chefes) {
      await db.insert(notifications).values({
        userId: ch.id,
        type: 'programa_aguarda_revisao_chefe',
        title: 'Programa encaminhado pela Comissão',
        message: \`O programa de "\${disciplineName}" foi encaminhado para sua revisão.\`,
        programaId: id,
      });
    }
  } else {
    // chefe flow
    if (prog.status !== 'draft' && prog.status !== 'pending_chefe') {
      throw new Error('Only draft or pending_chefe can be submitted to coordinations');
    }

    await db.update(programasEnsino)
      .set({
        status: 'submitted',
        submetidoEm: new Date(),
        atualizadoPor: userId,
        updatedAt: new Date()
      })
      .where(eq(programasEnsino.id, id));

    await db.insert(historicoProgramas).values({
      programaId: id,
      usuarioId: userId,
      tipoEvento: 'encaminhado_coordenacoes',
      descricao: \`Programa submetido para aprovação das coordenações\`,
    });

    // Create rows in programa_aprovacoes for each curso
    const cursos = prog.cursos_vinculados || [];
    for (const c of cursos) {
      // Upsert in case it already exists but we are resubmitting? We can just delete existing or ignore
      // But typically we should clear previous or rely on unique constraints?
      // Wait, there is a unique constraint. We should delete pending or existing rows?
      // Actually, if it's resubmitted, the previous might have been rejected. 
      // Let's delete existing rows for this program first to reset the state.
      await db.delete(programaAprovacoes).where(eq(programaAprovacoes.programaId, id));
    }
    
    for (const c of cursos) {
      await db.insert(programaAprovacoes).values({
        programaId: id,
        curso: c,
        status: 'pending'
      });
    }

    const coordenadores = await db.select({ id: user.id }).from(user)
      .innerJoin(member, eq(user.id, member.userId))
      .where(
        and(
          eq(member.role, 'coordenador'),
          eq(user.status, 'active')
        )
      );

    for (const coor of coordenadores) {
      await db.insert(notifications).values({
        userId: coor.id,
        type: 'programa_aguarda_aprovacao',
        title: 'Programa aguarda sua aprovação',
        message: \`O programa de "\${disciplineName}" foi encaminhado para aprovação.\`,
        programaId: id,
      });
    }
  }

  return (await getProgramaById(id))!;
}

export async function reviewByChefe(id: string, action: 'forward' | 'reject_back', feedback: string | undefined, userId: string): Promise<ProgramaEnsino> {
  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  if (prog.status !== 'pending_chefe') throw new Error('Program must be pending_chefe');

  if (action === 'forward') {
    return await submitPrograma(id, userId, 'chefe');
  } else {
    // reject_back
    if (!feedback?.trim()) throw new Error('Feedback is required to reject');

    await db.update(programasEnsino)
      .set({
        status: 'draft',
        feedbackAprovacao: feedback,
        atualizadoPor: userId,
        updatedAt: new Date()
      })
      .where(eq(programasEnsino.id, id));

    await db.insert(historicoProgramas).values({
      programaId: id,
      usuarioId: userId,
      tipoEvento: 'devolvido_comissao',
      descricao: \`Programa devolvido para comissão. Motivo: \${feedback}\`,
    });

    const disciplineName = prog.nome_disciplina ?? 'Disciplina';
    
    // Notify comissao
    if (prog.criado_por) {
      await db.insert(notifications).values({
        userId: prog.criado_por,
        type: 'programa_devolvido_comissao',
        title: 'Programa devolvido para revisão',
        message: \`O programa de "\${disciplineName}" foi devolvido pela chefia. Motivo: \${feedback}\`,
        programaId: id,
      });
    }
    
    return (await getProgramaById(id))!;
  }
}

export async function reviewPrograma(id: string, action: 'approve' | 'reject', feedback: string | undefined, userId: string, curso: string): Promise<ProgramaEnsino> {
  if (action === 'reject' && !feedback?.trim()) {
    const error: any = new Error('Feedback obrigatório ao rejeitar');
    error.code = 'FEEDBACK_REQUIRED';
    throw error;
  }

  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  if (prog.status !== 'submitted') throw new Error('Apenas programas submetidos podem ser revisados');

  const disciplineName = prog.nome_disciplina ?? 'Disciplina';

  // Find aprovacao row
  const aprovacaoRows = await db.select().from(programaAprovacoes)
    .where(
      and(
        eq(programaAprovacoes.programaId, id),
        eq(programaAprovacoes.curso, curso)
      )
    ).limit(1);

  if (aprovacaoRows.length === 0) {
    throw new Error('Este programa não foi encaminhado para este curso');
  }
  
  const aprovacao = aprovacaoRows[0];
  if (aprovacao.status !== 'pending') {
    throw new Error('Esta coordenação já registrou sua decisão');
  }

  // Update aprovacao row
  await db.update(programaAprovacoes)
    .set({
      status: action === 'approve' ? 'approved' : 'rejected',
      feedback: feedback || null,
      coordenadorId: userId,
      decidedAt: new Date()
    })
    .where(eq(programaAprovacoes.id, aprovacao.id));

  if (action === 'reject') {
    // REJECT
    await db.update(programasEnsino)
      .set({
        status: 'rejected',
        feedbackAprovacao: feedback,
        atualizadoPor: userId,
        updatedAt: new Date()
      })
      .where(eq(programasEnsino.id, id));
    
    await db.insert(historicoProgramas).values({
      programaId: id,
      usuarioId: userId,
      tipoEvento: 'rejeitado',
      descricao: \`Programa devolvido (\${curso}). Feedback: \${feedback}\`,
    });

    if (prog.criado_por) {
      await db.insert(notifications).values({
        userId: prog.criado_por,
        type: 'programa_devolvido',
        title: 'Programa de Ensino devolvido para revisão',
        message: \`O programa de "\${disciplineName}" foi devolvido pela coordenação. Motivo: \${feedback}\`,
        programaId: id,
      });
    }

    // Also notify chefe
    const chefes = await db.select({ id: user.id }).from(user)
      .innerJoin(member, eq(user.id, member.userId))
      .where(
        and(
          eq(member.role, 'chefe'),
          eq(user.status, 'active')
        )
      );

    for (const ch of chefes) {
      await db.insert(notifications).values({
        userId: ch.id,
        type: 'programa_devolvido',
        title: 'Programa de Ensino devolvido para revisão',
        message: \`O programa de "\${disciplineName}" foi devolvido pela coordenação de \${curso}. Motivo: \${feedback}\`,
        programaId: id,
      });
    }

  } else {
    // APPROVE
    await db.insert(historicoProgramas).values({
      programaId: id,
      usuarioId: userId,
      tipoEvento: 'aprovado_coordenacao',
      descricao: \`Programa aprovado pela coordenação (\${curso})\`,
      snapshot: { aprovado_por: userId, aprovado_em: new Date().toISOString() },
    });

    // Check if ALL are approved
    const remaining = await db.select().from(programaAprovacoes)
      .where(
        and(
          eq(programaAprovacoes.programaId, id),
          eq(programaAprovacoes.status, 'pending')
        )
      );
      
    if (remaining.length === 0) {
      // ALL approved, mark as archived!
      await db.update(programasEnsino)
        .set({
          status: 'archived',
          aprovadoEm: new Date(),
          arquivadoEm: new Date(),
          updatedAt: new Date()
        })
        .where(eq(programasEnsino.id, id));

      await db.insert(historicoProgramas).values({
        programaId: id,
        usuarioId: userId,
        tipoEvento: 'aprovado_todas_coordenacoes',
        descricao: \`Programa aprovado por todas as coordenações e arquivado\`,
      });

      // notify chefe and comissao
      if (prog.criado_por) {
        await db.insert(notifications).values({
          userId: prog.criado_por,
          type: 'programa_aprovado',
          title: 'Programa aprovado por todas as coordenações',
          message: \`O programa de "\${disciplineName}" foi aprovado por todas as coordenações.\`,
          programaId: id,
        });
      }
    }
  }

  return (await getProgramaById(id))!;
}

export async function archivePrograma(id: string, userId: string): Promise<ProgramaEnsino> {
  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  if (prog.status !== 'approved') throw new Error('Apenas programas aprovados podem ser arquivados');

  await db.update(programasEnsino)
    .set({
      status: 'archived',
      arquivadoEm: new Date(),
      atualizadoPor: userId,
      updatedAt: new Date()
    })
    .where(eq(programasEnsino.id, id));

  await db.insert(historicoProgramas).values({
    programaId: id,
    usuarioId: userId,
    tipoEvento: 'arquivado',
    descricao: 'Programa arquivado definitivamente.',
    snapshot: prog as any, 
  });

  return (await getProgramaById(id))!;
}

export async function getProgramaAprovacoes(id: string) {
  return await db.select().from(programaAprovacoes)
    .where(eq(programaAprovacoes.programaId, id))
    .orderBy(programaAprovacoes.curso);
}

`;

// replace lines 333 to 506
const lines = content.split('\\n');
const before = lines.slice(0, 332);
const after = lines.slice(505);

const newContent = before.join('\\n') + '\\n' + newFunctions + '\\n' + after.join('\\n');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log("Successfully updated programaEnsinoService.ts");
