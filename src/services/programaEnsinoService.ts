/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { programasEnsino, historicoProgramas } from "../db/schema_programas";
import { disciplinas, user, universityCourses, notifications } from "@/db/schema";
import { eq, and, ilike, or, desc, sql, ne } from "drizzle-orm";
import { buildBoldReference, extractTitleAndBold } from '@/utils/bibliografiaUtils';
import { 
  ProgramaEnsino, 
  ProgramaListItem, 
  UpdateProgramaDto 
} from "../types/programaEnsino";

export function computeCompletude(programa: Partial<ProgramaEnsino>): number {
  const fields = [
    programa.ementa,
    programa.objetivos,
    programa.conteudo_programatico,
    programa.criterios_avaliacao,
    programa.bibliografia?.length ? 'filled' : undefined,
  ];
  const filled = fields.filter(f => f !== null && f !== undefined && f !== '').length;
  return Math.round((filled / fields.length) * 100);
}

export async function listProgramas(filters: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: ProgramaListItem[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  let whereClause = undefined;
  
  if (filters.status && filters.search) {
    whereClause = and(
      eq(programasEnsino.status, filters.status),
      or(
        ilike(programasEnsino.nomeDisciplina, `%${filters.search}%`),
        ilike(programasEnsino.codigoDisciplina, `%${filters.search}%`)
      )
    );
  } else if (filters.status) {
    whereClause = eq(programasEnsino.status, filters.status);
  } else if (filters.search) {
    whereClause = or(
      ilike(programasEnsino.nomeDisciplina, `%${filters.search}%`),
      ilike(programasEnsino.codigoDisciplina, `%${filters.search}%`)
    );
  }

  const query = db
    .select({
      id: programasEnsino.id,
      disciplina_id: programasEnsino.disciplinaId,
      status: programasEnsino.status,
      codigo_disciplina: programasEnsino.codigoDisciplina,
      nome_disciplina: programasEnsino.nomeDisciplina,
      cursos_vinculados: programasEnsino.cursosVinculados,
      updated_at: programasEnsino.updatedAt,
      criador_nome: (user as any).name,
      ementa: programasEnsino.ementa,
      objetivos: programasEnsino.objetivos,
      conteudo_programatico: programasEnsino.conteudoProgramatico,
      criterios_avaliacao: programasEnsino.criteriosAvaliacao,
      bibliografia: programasEnsino.bibliografia,
    })
    .from(programasEnsino)
    .leftJoin(user, eq(programasEnsino.criadoPor, user.id));

  if (whereClause) {
    query.where(whereClause);
  }

  query.orderBy(desc(programasEnsino.updatedAt)).limit(limit).offset(offset);

  const results = await query;
  
  // Count total
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(programasEnsino);
  if (whereClause) countQuery.where(whereClause);
  const [{ count }] = await countQuery;

  const data: ProgramaListItem[] = results.map(r => ({
    id: r.id,
    disciplina_id: r.disciplina_id,
    status: r.status as any,
    codigo_disciplina: r.codigo_disciplina,
    nome_disciplina: r.nome_disciplina,
    cursos_vinculados: r.cursos_vinculados,
    updated_at: r.updated_at,
    criador_nome: r.criador_nome,
    completude: computeCompletude({
      ementa: r.ementa,
      objetivos: r.objetivos,
      conteudo_programatico: r.conteudo_programatico,
      criterios_avaliacao: r.criterios_avaliacao,
      bibliografia: r.bibliografia as any,
    })
  }));

  return { data, total: Number(count) };
}

export async function getProgramaById(id: string): Promise<ProgramaEnsino | null> {
  const result = await db
    .select({
      programa: programasEnsino,
      disciplina: disciplinas,
      criador: user,
    })
    .from(programasEnsino)
    .leftJoin(disciplinas, eq(programasEnsino.disciplinaId, disciplinas.id))
    .leftJoin(user, eq(programasEnsino.criadoPor, user.id))
    .where(eq(programasEnsino.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];
  const p = row.programa;
  
  return {
    id: p.id,
    disciplina_id: p.disciplinaId,
    status: p.status as any,
    criado_por: p.criadoPor,
    atualizado_por: p.atualizadoPor || undefined,
    codigo_disciplina: p.codigoDisciplina,
    nome_disciplina: p.nomeDisciplina,
    cursos_vinculados: p.cursosVinculados,
    carga_horaria_teorica: p.cargaHorariaTeorica,
    carga_horaria_pratica: p.cargaHorariaPratica,
    carga_horaria_total: p.cargaHorariaTotal,
    creditos_teoricos: p.creditosTeoricos,
    creditos_praticos: p.creditosPraticos,
    ementa: p.ementa,
    objetivos: p.objetivos,
    conteudo_programatico: p.conteudoProgramatico,
    criterios_avaliacao: p.criteriosAvaliacao,
    bibliografia: p.bibliografia as any,
    curso_aprovacao: p.cursoAprovacao,
    aprovado_por: p.aprovadoPor || undefined,
    feedback_aprovacao: p.feedbackAprovacao,
    submetido_em: p.submetidoEm,
    aprovado_em: p.aprovadoEm,
    arquivado_em: p.arquivadoEm,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    disciplina: row.disciplina ? {
      id: row.disciplina.id,
      codigo: row.disciplina.codigo,
      nome: row.disciplina.nome,
      curso: row.disciplina.curso,
      carga_horaria_total: undefined, // Not in Drizzle schema for disciplinas directly
      creditos_teorico: row.disciplina.creditosTeorico,
      creditos_pratico: row.disciplina.creditosPratico,
    } : undefined,
    criador: row.criador ? {
      id: row.criador.id,
      nome: (row.criador as any).name,
      papel: 'criador'
    } : undefined
  };
}

export async function deletePrograma(id: string) {
  // Must be 'draft' to be deleted
  const result = await db.select().from(programasEnsino).where(eq(programasEnsino.id, id)).limit(1);
  const programa = result[0];

  if (!programa) throw new Error("Programa not found");
  if (programa.status !== "draft") throw new Error("Only draft programs can be deleted");

  await db.delete(programasEnsino).where(eq(programasEnsino.id, id));
  
  return { success: true };
}

export async function getProgramaByDisciplinaId(disciplinaId: string): Promise<ProgramaEnsino | null> {
  const result = await db
    .select({ programa: programasEnsino })
    .from(programasEnsino)
    .where(
      and(
        eq(programasEnsino.disciplinaId, disciplinaId),
        ne(programasEnsino.status, 'archived'),
        ne(programasEnsino.status, 'rejected')
      )
    )
    .limit(1);

  if (result.length === 0) return null;
  return getProgramaById(result[0].programa.id);
}

export async function createPrograma(disciplinaId: string, userId: string): Promise<ProgramaEnsino> {
  const existing = await getProgramaByDisciplinaId(disciplinaId);
  if (existing) {
    throw new Error('Active program already exists for this disciplina');
  }

  const discResult = await db.select().from(disciplinas).where(eq(disciplinas.id, disciplinaId)).limit(1);
  if (discResult.length === 0) {
    throw new Error('Disciplina not found');
  }
  const disc = discResult[0];

  const pccs = await db.select().from(universityCourses).where(eq(universityCourses.code, disc.codigo));
  let ementaToSave = null;
  const bibToSave: any[] = [];
  
  if (pccs.length > 0) {
    const getPriority = (p: any) => {
      const grad = (p.graduation || '').toLowerCase();
      if (grad.includes('isolada')) return 3;
      if (grad.includes('básico') || grad.includes('basico') || grad.includes('geral')) return 2;
      return 1;
    };
    
    pccs.sort((a, b) => getPriority(b) - getPriority(a));
    const bestPcc = pccs[0];
    
    ementaToSave = bestPcc.syllabus || null;
    
    const bibData = bestPcc.bibliography as any;
    if (bibData) {
      const processItems = (items: any[], tipo: 'basica' | 'complementar') => {
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
          let ref = "";
          if (typeof item === 'object' && item !== null) {
            if (item.authors && item.details) {
              ref = buildBoldReference({
                authors: item.authors,
                details: item.details,
                full: item.full
              });
            } else if (item.full) {
              // Fallback if only "full" is available
              const authorMatch = item.full.match(/^([A-Z][^.]+\.)\s+([\s\S]*)$/);
              if (authorMatch) {
                ref = `${authorMatch[1]} ` + extractTitleAndBold(authorMatch[2]);
              } else {
                ref = extractTitleAndBold(item.full);
              }
            } else {
              ref = `${item.authors || ''} ${item.details || ''}`.trim();
            }
          } else if (typeof item === 'string') {
            ref = extractTitleAndBold(item);
          }
          if (ref) {
            bibToSave.push({
              id: crypto.randomUUID(),
              tipo,
              referencia: ref,
              ordem: bibToSave.length
            });
          }
        });
      };
      
      processItems(bibData.basic || bibData.basica || [], 'basica');
      processItems(bibData.complementary || bibData.complementar || [], 'complementar');
    }
  }

  const [newProgram] = await db.insert(programasEnsino).values({
    disciplinaId,
    criadoPor: userId,
    status: 'draft',
    codigoDisciplina: disc.codigo,
    nomeDisciplina: disc.nome,
    cursosVinculados: disc.curso ? [disc.curso] : [],
    creditosTeoricos: disc.creditosTeorico,
    creditosPraticos: disc.creditosPratico,
    ementa: ementaToSave,
    bibliografia: bibToSave.length > 0 ? bibToSave : null,
  }).returning();

  await db.insert(historicoProgramas).values({
    programaId: newProgram.id,
    usuarioId: userId,
    tipoEvento: 'criado',
    descricao: 'Programa criado',
  });

  return (await getProgramaById(newProgram.id))!;
}

export async function updatePrograma(id: string, data: UpdateProgramaDto, userId: string): Promise<ProgramaEnsino> {
  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  if (prog.status !== 'draft') throw new Error('Cannot update non-draft program');

  const updateData: any = {
    atualizadoPor: userId,
    updatedAt: new Date(),
  };

  if (data.codigo_disciplina !== undefined) updateData.codigoDisciplina = data.codigo_disciplina;
  if (data.nome_disciplina !== undefined) updateData.nomeDisciplina = data.nome_disciplina;
  if (data.cursos_vinculados !== undefined) updateData.cursosVinculados = data.cursos_vinculados;
  if (data.carga_horaria_teorica !== undefined) updateData.cargaHorariaTeorica = data.carga_horaria_teorica;
  if (data.carga_horaria_pratica !== undefined) updateData.cargaHorariaPratica = data.carga_horaria_pratica;
  if (data.carga_horaria_total !== undefined) updateData.cargaHorariaTotal = data.carga_horaria_total;
  if (data.creditos_teoricos !== undefined) updateData.creditosTeoricos = data.creditos_teoricos;
  if (data.creditos_praticos !== undefined) updateData.creditosPraticos = data.creditos_praticos;
  if (data.ementa !== undefined) updateData.ementa = data.ementa;
  if (data.objetivos !== undefined) updateData.objetivos = data.objetivos;
  if (data.conteudo_programatico !== undefined) updateData.conteudoProgramatico = data.conteudo_programatico;
  if (data.criterios_avaliacao !== undefined) updateData.criteriosAvaliacao = data.criterios_avaliacao;
  if (data.bibliografia !== undefined) updateData.bibliografia = data.bibliografia;

  await db.update(programasEnsino)
    .set(updateData)
    .where(eq(programasEnsino.id, id));

  await db.insert(historicoProgramas).values({
    programaId: id,
    usuarioId: userId,
    tipoEvento: 'editado',
    descricao: 'Programa editado',
    snapshot: updateData,
  });

  return (await getProgramaById(id))!;
}

export async function submitPrograma(id: string, cursoAprovacao: string, userId: string): Promise<ProgramaEnsino> {
  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  if (prog.status !== 'draft') throw new Error('Only draft can be submitted');

  const missing = [];
  if (!prog.ementa?.trim()) missing.push('ementa');
  if (!prog.objetivos?.trim()) missing.push('objetivos');
  if (!prog.conteudo_programatico?.trim()) missing.push('conteudo_programatico');

  if (missing.length > 0) {
    const error: any = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.code = 'MISSING_FIELDS';
    error.fields = missing;
    throw error;
  }

  await db.update(programasEnsino)
    .set({
      status: 'submitted',
      cursoAprovacao,
      submetidoEm: new Date(),
      atualizadoPor: userId,
      updatedAt: new Date()
    })
    .where(eq(programasEnsino.id, id));

  await db.insert(historicoProgramas).values({
    programaId: id,
    usuarioId: userId,
    tipoEvento: 'submetido',
    descricao: `Programa submetido para aprovação da coordenação: ${cursoAprovacao}`,
  });

  // Notifications
  const disciplineName = prog.nome_disciplina ?? 'Disciplina';
  
  // Find users with role 'coordenador' or 'chefe'
  const recipients = await db.select({ id: user.id }).from(user)
    .where(
      and(
        sql`papel IN ('coordenador', 'chefe')`,
        eq(user.status, 'active'),
        ne(user.id, userId)
      )
    );

  if (recipients.length > 0) {
    for (const recipient of recipients) {
      // check deduplication
      const existingNotif = await db.select().from(notifications)
        .where(
          and(
            eq(notifications.programaId, id),
            eq(notifications.type, 'programa_submetido'),
            eq(notifications.read, false),
            eq(notifications.userId, recipient.id)
          )
        ).limit(1);

      if (existingNotif.length === 0) {
        await db.insert(notifications).values({
          userId: recipient.id,
          type: 'programa_submetido',
          title: 'Programa de Ensino aguarda aprovação',
          message: `O programa de ensino de "${disciplineName}" foi submetido para aprovação da coordenação de ${cursoAprovacao}.`,
          programaId: id,
        });
      }
    }
  }

  return (await getProgramaById(id))!;
}

export async function reviewPrograma(id: string, action: 'approve' | 'reject', feedback: string | undefined, userId: string): Promise<ProgramaEnsino> {
  if (action === 'reject' && !feedback?.trim()) {
    const error: any = new Error('Feedback obrigatório ao rejeitar');
    error.code = 'FEEDBACK_REQUIRED';
    throw error;
  }

  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  if (prog.status !== 'submitted') throw new Error('Apenas programas submetidos podem ser revisados');

  const disciplineName = prog.nome_disciplina ?? 'Disciplina';

  if (action === 'approve') {
    await db.update(programasEnsino)
      .set({
        status: 'approved',
        aprovadoPor: userId,
        aprovadoEm: new Date(),
        atualizadoPor: userId,
        updatedAt: new Date()
      })
      .where(eq(programasEnsino.id, id));

    await db.insert(historicoProgramas).values({
      programaId: id,
      usuarioId: userId,
      tipoEvento: 'aprovado',
      descricao: 'Programa aprovado pela coordenação',
      snapshot: { aprovado_por: userId, aprovado_em: new Date().toISOString() },
    });

    if (prog.criado_por) {
      await db.insert(notifications).values({
        userId: prog.criado_por,
        type: 'programa_aprovado',
        title: 'Programa de Ensino aprovado',
        message: `O programa de ensino de "${disciplineName}" foi aprovado pela coordenação.`,
        programaId: id,
      });
    }

  } else {
    // reject
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
      tipoEvento: 'rejeitado',
      descricao: `Programa devolvido para revisão. Feedback: ${feedback}`,
    });

    if (prog.criado_por) {
      await db.insert(notifications).values({
        userId: prog.criado_por,
        type: 'programa_devolvido',
        title: 'Programa de Ensino devolvido para revisão',
        message: `O programa de "${disciplineName}" foi devolvido pela coordenação. Motivo: ${feedback}`,
        programaId: id,
      });
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

export async function getHistorico(programaId: string): Promise<any[]> {
  return await db.select({
    id: historicoProgramas.id,
    programaId: historicoProgramas.programaId,
    usuarioId: historicoProgramas.usuarioId,
    tipoEvento: historicoProgramas.tipoEvento,
    descricao: historicoProgramas.descricao,
    snapshot: historicoProgramas.snapshot,
    createdAt: historicoProgramas.createdAt,
    usuarioNome: (user as any).name
  })
  .from(historicoProgramas)
  .leftJoin(user, eq(historicoProgramas.usuarioId, user.id))
  .where(eq(historicoProgramas.programaId, programaId))
  .orderBy(desc(historicoProgramas.createdAt));
}
