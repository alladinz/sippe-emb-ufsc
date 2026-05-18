"use server";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studyPlans, courses, bibliography } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { StudyPlanFormValues, isValidTransition, StudyPlanStatus } from "@/lib/schemas/study-plan";
import { createNotification } from "@/lib/notifications";
import { member } from "@/db/schema";

export async function saveStudyPlanAction(id: string, data: StudyPlanFormValues) {
  console.log("Saving Study Plan:", id, "Data semester:", data.semester);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Não autorizado");
  }

  const plan = await db.query.studyPlans.findFirst({
    where: eq(studyPlans.id, id),
  });

  if (!plan || plan.userId !== session.user.id) {
    throw new Error("Plano não encontrado ou acesso negado");
  }

  // Server-side read-only check
  const isReadOnly = plan.status !== "draft" && plan.status !== "rejected";
  if (isReadOnly) {
    throw new Error(`Este plano está em modo de apenas leitura (status: ${plan.status}) e não pode ser editado.`);
  }

  // Use a transaction to ensure all updates happen together
  await db.transaction(async (tx) => {
    // 1. Update main plan fields
    await tx.update(studyPlans)
      .set({
        semester: data.semester,
        campus: data.campus,
        center: data.center,
        courseName: data.courseName,
        universityAcronym: data.universityAcronym,
        prerequisites: data.prerequisites,
        syllabus: data.syllabus,
        objectives: data.objectives,
        programContent: data.programContent,
        methodology: data.methodology,
        evaluation: data.evaluation,
        evaluationFormula: data.evaluationFormula,
        finalEvaluationRules: data.finalEvaluationRules,
        finalConsiderations: data.finalConsiderations,
        schedule: data.schedule,
        weeklySchedule: data.weeklySchedule,
        updatedAt: new Date(),
      })
      .where(eq(studyPlans.id, id));

    // 2. Update Courses (Simple sync: delete and re-insert)
    if (data.courses) {
        await tx.delete(courses).where(eq(courses.studyPlanId, id));
        // Filter out completely empty courses
        const validCourses = data.courses.filter(c => c.code?.trim() || c.name?.trim());
        if (validCourses.length > 0) {
            await tx.insert(courses).values(
                validCourses.map((c) => ({
                    studyPlanId: id,
                    code: c.code || "",
                    name: c.name || "",
                    // Handle NaN from valueAsNumber: true in form
                    workload: (typeof c.workload === 'number' && !isNaN(c.workload)) ? c.workload : null,
                    classType: c.classType,
                    credits: (typeof c.credits === 'number' && !isNaN(c.credits)) ? c.credits : null,
                    classIdentifier: c.classIdentifier,
                }))
            );
        }
    }

    // 3. Update Bibliography
    if (data.bibliography) {
        await tx.delete(bibliography).where(eq(bibliography.studyPlanId, id));
        // Filter out bibliography items that are completely empty to avoid DB NOT NULL constraints
        const validBib = data.bibliography.filter(b => b.author?.trim() && b.title?.trim());
        
        if (validBib.length > 0) {
            await tx.insert(bibliography).values(
                validBib.map((b) => ({
                    studyPlanId: id,
                    type: b.type,
                    author: b.author,
                    title: b.title,
                    // Handle NaN from valueAsNumber: true in form
                    year: (typeof b.year === 'number' && !isNaN(b.year)) ? b.year : null,
                    publisher: b.publisher,
                    isbn: b.isbn,
                }))
            );
        }
    }
  });
}

export async function submitStudyPlanAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const plan = await db.query.studyPlans.findFirst({
        where: eq(studyPlans.id, id),
    });

    if (!plan || plan.userId !== session.user.id) {
        throw new Error("Plano não encontrado ou acesso negado");
    }

    if (!isValidTransition(plan.status as StudyPlanStatus, "submitted")) {
        throw new Error(`O plano não pode ser submetido no estado atual: ${plan.status}`);
    }

    await db.update(studyPlans)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(eq(studyPlans.id, id));

    // Notify the department chief
    // First, find who the chief is for this organization
    const chiefs = await db.query.member.findMany({
        where: (m, { and, eq }) => and(
            eq(m.organizationId, plan.organizationId),
            eq(m.role, "chefe")
        )
    });

    // If no chief in the organization, fallback to global chiefs (if any) or just skip
    // Based on requirements, we notify the department chief.
    for (const chief of chiefs) {
        await createNotification({
            userId: chief.userId,
            type: 'nova_submissao',
            title: 'Nova submissão de plano',
            message: `${session.user.name} submeteu um plano para revisão`,
            planId: plan.id
        });
    }

    revalidatePath("/dashboard/study-plans");
    redirect("/dashboard/study-plans");
}
