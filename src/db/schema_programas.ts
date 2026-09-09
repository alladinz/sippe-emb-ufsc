import { pgTable, text, timestamp, jsonb, integer, uuid, varchar } from "drizzle-orm/pg-core";
import { disciplinas, user } from "./schema";

export const programasEnsino = pgTable("programas_ensino", {
  id: uuid("id").primaryKey().defaultRandom(),
  disciplinaId: uuid("disciplina_id").notNull().references(() => disciplinas.id, { onDelete: 'restrict' }),
  status: varchar("status", { length: 30 }).notNull().default('draft'),
  criadoPor: text("criado_por").notNull().references(() => user.id, { onDelete: 'restrict' }),
  atualizadoPor: text("atualizado_por").references(() => user.id, { onDelete: 'set null' }),
  
  codigoDisciplina: varchar("codigo_disciplina", { length: 20 }),
  nomeDisciplina: varchar("nome_disciplina", { length: 255 }),
  cursosVinculados: text("cursos_vinculados").array(),
  
  cargaHorariaTeorica: integer("carga_horaria_teorica").default(0),
  cargaHorariaPratica: integer("carga_horaria_pratica").default(0),
  cargaHorariaExtensao: integer("carga_horaria_extensao").default(0),
  cargaHorariaTotal: integer("carga_horaria_total").default(0),
  creditosTeoricos: integer("creditos_teoricos").default(0),
  creditosPraticos: integer("creditos_praticos").default(0),
  creditosExtensao: integer("creditos_extensao").default(0),
  
  ementa: text("ementa"),
  objetivos: text("objetivos"),
  conteudoProgramatico: text("conteudo_programatico"),
  criteriosAvaliacao: text("criterios_avaliacao"),
  
  bibliografia: jsonb("bibliografia").default([]),
  
  cursoAprovacao: varchar("curso_aprovacao", { length: 255 }),
  aprovadoPor: text("aprovado_por").references(() => user.id, { onDelete: 'set null' }),
  feedbackAprovacao: text("feedback_aprovacao"),
  
  submetidoEm: timestamp("submetido_em"),
  aprovadoEm: timestamp("aprovado_em"),
  arquivadoEm: timestamp("arquivado_em"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const historicoProgramas = pgTable("historico_programas", {
  id: uuid("id").primaryKey().defaultRandom(),
  programaId: uuid("programa_id").notNull().references(() => programasEnsino.id, { onDelete: 'cascade' }),
  usuarioId: text("usuario_id").notNull().references(() => user.id, { onDelete: 'restrict' }),
  tipoEvento: varchar("tipo_evento", { length: 50 }).notNull(),
  descricao: text("descricao"),
  snapshot: jsonb("snapshot"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const programaAprovacoes = pgTable("programa_aprovacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  programaId: uuid("programa_id").notNull().references(() => programasEnsino.id, { onDelete: 'cascade' }),
  curso: varchar("curso", { length: 255 }).notNull(),
  coordenadorId: text("coordenador_id").references(() => user.id, { onDelete: 'set null' }),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  feedback: text("feedback"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
