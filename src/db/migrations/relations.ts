import { relations } from "drizzle-orm/relations";
import { user, account, organization, member, studyPlans, bibliography, invitation, session, courses } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	members: many(member),
	studyPlans: many(studyPlans),
	invitations: many(invitation),
	sessions: many(session),
}));

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	members: many(member),
	studyPlans: many(studyPlans),
	invitations: many(invitation),
}));

export const studyPlansRelations = relations(studyPlans, ({one, many}) => ({
	user: one(user, {
		fields: [studyPlans.userId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [studyPlans.organizationId],
		references: [organization.id]
	}),
	bibliographies: many(bibliography),
	courses: many(courses),
}));

export const bibliographyRelations = relations(bibliography, ({one}) => ({
	studyPlan: one(studyPlans, {
		fields: [bibliography.studyPlanId],
		references: [studyPlans.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const coursesRelations = relations(courses, ({one}) => ({
	studyPlan: one(studyPlans, {
		fields: [courses.studyPlanId],
		references: [studyPlans.id]
	}),
}));