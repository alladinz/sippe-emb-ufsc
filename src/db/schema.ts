import { pgTable, text, timestamp, boolean, jsonb, integer, uuid, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- AUTH TABLES (Better Auth) ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  status: text("status").default('active'), // active, pending_email
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Security Hardening Columns
  senhaHash: text("senha_hash"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  resetTokenUsado: boolean("reset_token_usado").default(false),
  ultimoLogin: timestamp("ultimo_login"),
  tentativasLogin: integer("tentativas_login").default(0),
  bloqueadoAte: timestamp("bloqueado_ate"),
}, (table) => {
  return {
    resetTokenIdx: index("idx_usuarios_reset_token").on(table.resetToken),
  };
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuarioId: text("usuario_id")
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  tokenHash: text("token_hash").notNull().unique(),
  expiry: timestamp("expiry").notNull(),
  revogado: boolean("revogado").default(false),
  criadoEm: timestamp("criado_em").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: jsonb("metadata"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const semesters = pgTable("semesters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // e.g., "2026.1"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  ativo: boolean("ativo").default(false),
  dataLimiteSubmissao: timestamp("data_limite_submissao"),
  holidays: jsonb("holidays").$type<{ date: string; description: string }[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- STUDY PLAN TABLES ---

export const studyPlans = pgTable("study_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  
  // General Info
  semester: text("semester"), // e.g., "2026.1"
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected
  feedback: text("feedback"),

  // Institutional Hierarchy
  campus: text("campus"),
  center: text("center"),
  courseName: text("course_name"),
  universityAcronym: text("university_acronym").default("UFSC"),
  
  // Academic Content
  turmaId: uuid("turma_id").references(() => turmas.id),
  disciplinaId: uuid("disciplina_id").references(() => disciplinas.id),
  semestreId: uuid("semestre_id").references(() => semesters.id),
  prerequisites: text("prerequisites"),
  syllabus: text("syllabus"), // Ementa
  objectives: text("objectives"),
  programContent: text("program_content"), // Conteúdo Programático
  
  // Pedagogy & Evaluation
  methodology: text("methodology"),
  evaluation: text("evaluation"),
  evaluationFormula: text("evaluation_formula"),
  finalEvaluationRules: text("final_evaluation_rules"), // Avaliação Final rules
  finalConsiderations: text("final_considerations"),
  
  // Schedule (Structured JSON)
  schedule: jsonb("schedule"),
  weeklySchedule: jsonb("weekly_schedule"), // 5-column table structure
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniquePlan: unique("study_plans_professor_turma_semestre_unique").on(table.userId, table.turmaId, table.semestreId),
  };
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyPlanId: uuid("study_plan_id")
    .notNull()
    .references(() => studyPlans.id, { onDelete: 'cascade' }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  workload: integer("workload"),
  classType: text("class_type"), // e.g., "Teórica", "Prática"
  credits: integer("credits"),
  classIdentifier: text("class_identifier"), // Turma
});

export const bibliography = pgTable("bibliography", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyPlanId: uuid("study_plan_id")
    .notNull()
    .references(() => studyPlans.id, { onDelete: 'cascade' }),
  type: text("type").notNull().default("basic"), // basic, complementary
  author: text("author").notNull(),
  title: text("title").notNull(),
  year: integer("year"),
  publisher: text("publisher"),
  isbn: text("isbn"),
});

export const universityCourses = pgTable("university_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  curriculum: text("curriculum"), // e.g., "2016", "2025"
  phase: integer("phase"),
  workloadHours: integer("workload_hours"),
  syllabus: text("syllabus"),
  bibliography: jsonb("bibliography"), // { basic: string[], complementary: string[] }
  prerequisites: jsonb("prerequisites"), // string[] (course codes)
  graduation: text("graduation"), // e.g., "Engenharia Aeroespacial"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // novo_plano, nova_submissao, plano_aprovado, plano_rejeitado, programa_submetido, etc.
  title: text("title").notNull(),
  message: text("message"),
  read: boolean("read").default(false),
  planId: uuid("plan_id").references(() => studyPlans.id, { onDelete: 'set null' }),
  programaId: uuid("programa_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const disciplinas = pgTable("disciplinas", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").notNull().unique(),
  nome: text("nome").notNull(),
  curso: text("curso"),
  formato: text("formato"),
  ambienteTeorico: text("ambiente_teorico"),
  ambientePratico: text("ambiente_pratico"),
  creditosTeorico: integer("creditos_teorico").default(0),
  creditosPratico: integer("creditos_pratico").default(0),
  importadoEm: timestamp("importado_em"),
  fonte: text("fonte").default('manual'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const turmas = pgTable("turmas", {
  id: uuid("id").primaryKey().defaultRandom(),
  disciplinaId: uuid("disciplina_id")
    .notNull()
    .references(() => disciplinas.id, { onDelete: 'cascade' }),
  semestreId: uuid("semestre_id")
    .notNull()
    .references(() => semesters.id, { onDelete: 'cascade' }),
  turma: text("turma").notNull(),
  vagas: integer("vagas").default(0),
  lotacaoTeorico: integer("lotacao_teorico"),
  lotacaoPratico: integer("lotacao_pratico"),
  agrupamentoTeorico: text("agrupamento_teorico"),
  agrupamentoPratico: text("agrupamento_pratico"),
  vagasAgrupamentoTeorico: integer("vagas_agrupamento_teorico"),
  vagasAgrupamentoPratico: integer("vagas_agrupamento_pratico"),
  professorNome: text("professor_nome"),
  professorIndicacao: text("professor_indicacao"),
  professorId: text("professor_id")
    .references(() => user.id, { onDelete: 'set null' }),
  indicacaoHorario: text("indicacao_horario"),
  importadoEm: timestamp("importado_em"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueTurma: unique("turmas_disciplina_semestre_turma_unique").on(table.disciplinaId, table.semestreId, table.turma),
  };
});

// --- RELATIONS ---

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
}));

export const userRelations = relations(user, ({ many }) => ({
  notifications: many(notifications),
  members: many(member),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
  plan: one(studyPlans, {
    fields: [notifications.planId],
    references: [studyPlans.id],
  }),
}));

export const disciplinasRelations = relations(disciplinas, ({ many }) => ({
  turmas: many(turmas),
}));

export const turmasRelations = relations(turmas, ({ one }) => ({
  disciplina: one(disciplinas, {
    fields: [turmas.disciplinaId],
    references: [disciplinas.id],
  }),
  semestre: one(semesters, {
    fields: [turmas.semestreId],
    references: [semesters.id],
  }),
  professor: one(user, {
    fields: [turmas.professorId],
    references: [user.id],
  }),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const studyPlansRelations = relations(studyPlans, ({ many, one }) => ({
  user: one(user, {
    fields: [studyPlans.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [studyPlans.organizationId],
    references: [organization.id],
  }),
  turma: one(turmas, {
    fields: [studyPlans.turmaId],
    references: [turmas.id],
  }),
  disciplina: one(disciplinas, {
    fields: [studyPlans.disciplinaId],
    references: [disciplinas.id],
  }),
  semestre: one(semesters, {
    fields: [studyPlans.semestreId],
    references: [semesters.id],
  }),
  courses: many(courses),
  bibliography: many(bibliography),
}));

export const coursesRelations = relations(courses, ({ one }) => ({
  studyPlan: one(studyPlans, {
    fields: [courses.studyPlanId],
    references: [studyPlans.id],
  }),
}));

export const bibliographyRelations = relations(bibliography, ({ one }) => ({
  studyPlan: one(studyPlans, {
    fields: [bibliography.studyPlanId],
    references: [studyPlans.id],
  }),
}));
