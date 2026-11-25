"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isValidTransition, StudyPlanStatus } from "@/lib/schemas/study-plan";
import { createNotification } from "@/lib/notifications";
import {
  findCoordinatorMembership,
  hasAnyRole,
  isValidUuid,
  normalizeMembershipRole,
} from "@/lib/auth/roles";

async function verifyCoordinator(planId: string) {
  if (!isValidUuid(planId)) {
    throw new Error("ID de plano inválido");
  }

  const session = await auth.api.getSession();

  if (!session) throw new Error("Não autenticado");

  const memberships = await auth.api.listOrganizations();
  const isChef = hasAnyRole(memberships, ["chefe"]);
  const hasCoordRole = isChef || hasAnyRole(memberships, ["coordenador"]);

  if (!hasCoordRole) {
    throw new Error("Não autorizado: Apenas coordenadores podem realizar esta ação");
  }

  const plan = await db.query.studyPlans.findFirst({
    where: eq(studyPlans.id, planId),
  });

  if (!plan) throw new Error("Plano não encontrado");

  const canManageOrg =
    isChef ||
    memberships.some(
      (m) =>
        normalizeMembershipRole(m) === "coordenador" &&
        m.organizationId === plan.organizationId
    );

  if (!canManageOrg) {
    throw new Error("Não autorizado: Este plano pertence a outro curso");
  }

  const activeMember = findCoordinatorMembership(memberships, plan.organizationId);
  return { session, activeMember, plan };
}

export async function startReviewAction(id: string) {
  const { plan } = await verifyCoordinator(id);

  if (!isValidTransition(plan.status as StudyPlanStatus, "pending_review")) {
    throw new Error(`Não é possível iniciar a revisão deste plano: estado atual é ${plan.status}`);
  }

  await db.update(studyPlans)
    .set({ status: "pending_review", updatedAt: new Date() })
    .where(eq(studyPlans.id, id));

  revalidatePath("/dashboard/coordinator");
  revalidatePath(`/dashboard/study-plans/${id}/preview`);
}

export async function approveStudyPlanAction(id: string) {
  const { session, plan } = await verifyCoordinator(id);

  if (!isValidTransition(plan.status as StudyPlanStatus, "approved")) {
    throw new Error(`Este plano não pode ser aprovado: estado atual é ${plan.status}`);
  }

  await db.update(studyPlans)
    .set({
        status: "approved",
        feedback: null, // Clear feedback upon approval
        updatedAt: new Date()
    })
    .where(eq(studyPlans.id, id));

    // Notify the professor
    await createNotification({
      userId: plan.userId,
      type: 'plano_aprovado',
      title: 'Plano aprovado',
      message: `Seu plano de ensino foi aprovado por ${session.user.name}`,
      planId: plan.id
    });

    revalidatePath("/dashboard/coordinator");
    revalidatePath(`/dashboard/study-plans/${id}/preview`);
}

export async function rejectStudyPlanAction(id: string, feedback: string) {
  if (!feedback || feedback.trim().length < 5) {
    throw new Error("O feedback de rejeição é obrigatório e deve ser descritivo");
  }

  const { session, plan } = await verifyCoordinator(id);

  if (!isValidTransition(plan.status as StudyPlanStatus, "rejected")) {
    throw new Error(`Este plano não pode ser rejeitado: estado atual é ${plan.status}`);
  }

  await db.update(studyPlans)
    .set({
        status: "rejected",
        feedback: feedback,
        updatedAt: new Date()
    })
    .where(eq(studyPlans.id, id));

    // Notify the professor
    await createNotification({
      userId: plan.userId,
      type: 'plano_rejeitado',
      title: 'Plano devolvido para revisão',
      message: `Seu plano de ensino foi devolvido por ${session.user.name} com comentários`,
      planId: plan.id
    });

    revalidatePath("/dashboard/coordinator");
    revalidatePath(`/dashboard/study-plans/${id}/preview`);
}

async function verifyAdmin(planId: string) {
  const session = await auth.api.getSession();

  if (!session) throw new Error("Não autenticado");

  // Similar logic to verifyCoordinator but specifically for admin/secretary roles
  let activeMember = null;
  try {
      activeMember = await auth.api.getActiveMember();
  } catch {
      // Ignore
  }

  if (!activeMember) {
      const memberships = await auth.api.listOrganizations();
      if (memberships && memberships.length > 0) {
          const memberRecord = await db.query.member.findFirst({
              where: (members, { and, eq }) => and(
                  eq(members.userId, session.user.id),
                  eq(members.organizationId, memberships[0].id)
              )
          });
          if (memberRecord) {
              activeMember = {
                  ...memberships[0],
                  organizationId: memberships[0].id,
                  role: memberRecord.role
              };
          } else {
              const anyAdminRole = await db.query.member.findFirst({
                  where: (m, { and, or, eq }) => and(
                      eq(m.userId, session.user.id),
                      or(eq(m.role, "secretario"), eq(m.role, "chefe"))
                  )
              });
              if (anyAdminRole) {
                  activeMember = { organizationId: anyAdminRole.organizationId, role: anyAdminRole.role };
              }
          }
      }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (activeMember as any)?.role as string;
  if (!activeMember || (userRole !== "secretario" && userRole !== "chefe")) {
    throw new Error("Não autorizado: Apenas secretários ou chefes podem realizar esta ação");
  }

  const plan = await db.query.studyPlans.findFirst({
    where: eq(studyPlans.id, planId),
  });

  if (!plan) throw new Error("Plano não encontrado");

  return { session, activeMember, plan };
}

export async function archiveStudyPlanAction(id: string) {
  const { plan } = await verifyAdmin(id);

  if (!isValidTransition(plan.status as StudyPlanStatus, "archived")) {
    throw new Error(`Não é possível arquivar este plano: estado atual é ${plan.status}`);
  }

  await db.update(studyPlans)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(studyPlans.id, id));

  revalidatePath("/dashboard/secretary");
  revalidatePath(`/dashboard/study-plans/${id}/preview`);
}
