import { db } from "@/db";
import { programasEnsino, historicoProgramas } from "../db/schema_programas";
import { disciplinas, user } from "@/db/schema";
import { eq, and, ilike, or, desc, sql, ne } from "drizzle-orm";
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

  const [newProgram] = await db.insert(programasEnsino).values({
    disciplinaId,
    criadoPor: userId,
    status: 'draft',
    codigoDisciplina: disc.codigo,
    nomeDisciplina: disc.nome,
    cursosVinculados: disc.curso ? [disc.curso] : [],
    creditosTeoricos: disc.creditosTeorico,
    creditosPraticos: disc.creditosPratico,
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
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
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
    descricao: `Submetido para o curso ${cursoAprovacao}`,
  });

  return (await getProgramaById(id))!;
}

export async function reviewPrograma(id: string, action: 'approve' | 'reject', feedback: string | undefined, userId: string): Promise<ProgramaEnsino> {
  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  if (prog.status !== 'submitted') throw new Error('Only submitted programs can be reviewed');

  if (action === 'approve') {
    await db.update(programasEnsino)
      .set({
        status: 'approved',
        aprovadoPor: userId,
        aprovadoEm: new Date(),
        updatedAt: new Date()
      })
      .where(eq(programasEnsino.id, id));

    await db.insert(historicoProgramas).values({
      programaId: id,
      usuarioId: userId,
      tipoEvento: 'aprovado',
      descricao: 'Programa aprovado',
    });
  } else {
    // rejected
    await db.update(programasEnsino)
      .set({
        status: 'draft', // Reset to allow editing
        feedbackAprovacao: feedback,
        updatedAt: new Date()
      })
      .where(eq(programasEnsino.id, id));
    
    // According to instructions, we also need to record that it was rejected
    // But setting status to 'draft' immediately makes it editable. 
    // Wait, prompt says: 
    // UPDATE status = 'rejected', feedback_aprovacao = feedback
    // Also reset to allow re-editing: status = 'draft' after recording the rejection
    // Let's just set it to 'draft' and rely on historico_programas for the rejection record
    await db.insert(historicoProgramas).values({
      programaId: id,
      usuarioId: userId,
      tipoEvento: 'rejeitado',
      descricao: feedback,
    });
  }

  return (await getProgramaById(id))!;
}

export async function archivePrograma(id: string, userId: string): Promise<ProgramaEnsino> {
  const prog = await getProgramaById(id);
  if (!prog) throw new Error('Programa not found');
  if (prog.status !== 'approved') throw new Error('Only approved programs can be archived');

  await db.update(programasEnsino)
    .set({
      status: 'archived',
      arquivadoEm: new Date(),
      updatedAt: new Date()
    })
    .where(eq(programasEnsino.id, id));

  await db.insert(historicoProgramas).values({
    programaId: id,
    usuarioId: userId,
    tipoEvento: 'arquivado',
    descricao: 'Programa arquivado',
    snapshot: prog, // snapshot full prog
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
