import { pgTable, foreignKey, text, timestamp, unique, boolean, uuid, integer, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const member = pgTable("member", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	role: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organization_id_organization_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_user_id_user_id_fk"
		}),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const universityCourses = pgTable("university_courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	name: text().notNull(),
	phase: integer(),
	workloadHours: integer("workload_hours"),
	syllabus: text(),
	bibliography: jsonb(),
	graduation: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	prerequisites: jsonb(),
}, (table) => [
	unique("university_courses_code_unique").on(table.code),
]);

export const semesters = pgTable("semesters", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("semesters_name_unique").on(table.name),
]);

export const studyPlans = pgTable("study_plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id").notNull(),
	semester: text(),
	status: text().default('draft').notNull(),
	methodology: text(),
	evaluation: text(),
	schedule: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	feedback: text(),
	campus: text(),
	center: text(),
	courseName: text("course_name"),
	universityAcronym: text("university_acronym").default('UFSC'),
	prerequisites: text(),
	syllabus: text(),
	objectives: text(),
	programContent: text("program_content"),
	evaluationFormula: text("evaluation_formula"),
	finalEvaluationRules: text("final_evaluation_rules"),
	finalConsiderations: text("final_considerations"),
	weeklySchedule: jsonb("weekly_schedule"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "study_plans_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "study_plans_organization_id_organization_id_fk"
		}),
]);

export const bibliography = pgTable("bibliography", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studyPlanId: uuid("study_plan_id").notNull(),
	type: text().default('basic').notNull(),
	author: text().notNull(),
	title: text().notNull(),
	year: integer(),
	publisher: text(),
	isbn: text(),
}, (table) => [
	foreignKey({
			columns: [table.studyPlanId],
			foreignColumns: [studyPlans.id],
			name: "bibliography_study_plan_id_study_plans_id_fk"
		}).onDelete("cascade"),
]);

export const organization = pgTable("organization", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text(),
	logo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	metadata: jsonb(),
}, (table) => [
	unique("organization_slug_unique").on(table.slug),
]);

export const invitation = pgTable("invitation", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	email: text().notNull(),
	role: text(),
	status: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organization_id_organization_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "invitation_user_id_user_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const courses = pgTable("courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studyPlanId: uuid("study_plan_id").notNull(),
	code: text().notNull(),
	name: text().notNull(),
	workload: integer(),
	classType: text("class_type"),
	credits: integer(),
	classIdentifier: text("class_identifier"),
}, (table) => [
	foreignKey({
			columns: [table.studyPlanId],
			foreignColumns: [studyPlans.id],
			name: "courses_study_plan_id_study_plans_id_fk"
		}).onDelete("cascade"),
]);
