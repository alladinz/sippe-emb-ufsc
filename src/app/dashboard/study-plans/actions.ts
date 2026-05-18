"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { courses, bibliography, universityCourses, organization as orgTable } from "@/db/schema";

export async function createStudyPlanFromSelectionAction(
  courseId: string,
  semester: string,
  organizationIds: string[]
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  if (!organizationIds || organizationIds.length === 0) {
      throw new Error("Selecione ao menos um curso/graduação.");
  }

  // 1. Get metadata
  const metadata = await db.query.universityCourses.findFirst({
      where: eq(universityCourses.id, courseId)
  });

  if (!metadata) throw new Error("Metadados da disciplina não encontrados");

  // Fetch the selected organizations
  const selectedOrgs = await db.query.organization.findMany({
      where: inArray(orgTable.id, organizationIds)
  });

  // Graduation Mapping
  const GRADUATION_MAP: Record<string, string> = {
      "Ciência e Tecnologia": "601",
      "Engenharia Aeroespacial": "602",
      "Engenharia Automotiva": "603",
      "Engenharia Ferroviária e Metroviária": "604",
      "Engenharia Mecatrônica": "605",
      "Engenharia Naval": "606",
      "Engenharia Civil de Infraestrutura": "607",
      "Engenharia de Transportes e Logística": "608",
      "Engenharia de Transporte e Logística": "608",
  };

  const createdPlanIds: string[] = [];

  for (const org of selectedOrgs) {
      const gradCode = GRADUATION_MAP[org.name] || "000";
      const phaseStr = metadata.phase ? metadata.phase.toString().padStart(2, '0') : "00";
      const automatedClassIdentifier = `${phaseStr}${gradCode}`;

      // Process Prerequisites
      let formattedPrerequisites = "";
      if (metadata.prerequisites && Array.isArray(metadata.prerequisites) && metadata.prerequisites.length > 0) {
          const prereqCodes = metadata.prerequisites as string[];
          const prereqMetadata = await db.query.universityCourses.findMany({
              where: inArray(universityCourses.code, prereqCodes)
          });

          formattedPrerequisites = prereqCodes.map(code => {
              const m = prereqMetadata.find(p => p.code === code);
              return m ? `${code} - ${m.name}` : code;
          }).join("; ");
      }

      // 2. Create Study Plan
      const [newPlan] = await db.insert(studyPlans).values({
        userId: session.user.id,
        organizationId: org.id,
        status: "draft",
        semester: semester || "2026.1",
        courseName: org.name,
        syllabus: metadata.syllabus,
        prerequisites: formattedPrerequisites,
        campus: "Campus de Joinville",
        center: "Centro Tecnológico de Joinville",
        universityAcronym: "UFSC",
        finalEvaluationRules: `O(a) aluno(a) com **frequência suficiente** e **média das notas entre três (3,0) e cinco vírgula cinco (5,5)** terá direito a uma **nova avaliação** no final do semestre que versará sobre todo o conteúdo da disciplina, conforme o que dispõe o **§ 2º do Art. 70 e § 3º do Art. 71 da Resolução nº 17/Cun/97**. Neste caso, a **média final** será calculada através da **média aritmética simples** entre a média das notas das avaliações feitas durante o semestre e a nota obtida na nova avaliação. A **nota mínima de aprovação é seis (6,0)**.

Caso o(a) aluno(a) **não compareça a 75% da carga horária** da disciplina estará **automaticamente reprovado com nota 0,0(zero)**, independentemente da sua média nas avaliações individuais, conforme dispõem no **Art. 69 § 2º da Resolução 017/CUn/97**.

Os(as) alunos(as) que eventualmente faltarem em alguma avaliação que foram perdidas por motivos extremos, mediante justificativa; dentro do prazo de **3 (três) dias úteis** após a avaliação conforme o que dispõe o **Art. 74, da Resolução 017/CUn/97**, poderão solicitar na secretaria acadêmica do Centro de Engenharias da Mobilidade o pedido de **segunda chamada**. Após a análise do pedido e seu deferimento, os(as) alunos(as) poderão realizar a avaliação de segunda chamada na data, no local e horário definido no cronograma.`,
      }).returning();

      // 3. Add Course Junction
      const creditsValue = metadata.workloadHours ? Math.floor(metadata.workloadHours / 18) : null;

      await db.insert(courses).values({
          studyPlanId: newPlan.id,
          code: metadata.code,
          name: metadata.name,
          workload: metadata.workloadHours,
          classType: "Teórica", // Default
          credits: creditsValue,
          classIdentifier: automatedClassIdentifier,
      });

      // 4. Add Bibliography
      const bib = metadata.bibliography as unknown as { basic: (string | { authors: string, details: string })[], complementary: (string | { authors: string, details: string })[] };
      if (bib) {
          const bibItems: { type: "basic" | "complementary", author: string, title: string }[] = [];
          const prepareItems = (items: (string | { authors: string, details: string })[], type: "basic" | "complementary") => {
              if (!items || !Array.isArray(items)) return;
              for (const item of items) {
                  let fullReference = "";
                  if (typeof item === 'object' && item !== null) {
                      const authors = (item.authors || "").trim();
                      const details = (item.details || "").trim();
                      fullReference = (authors && details) ? `${authors}. ${details}` : (authors || details);
                  } else if (typeof item === 'string') {
                      fullReference = item;
                  }
                  if (fullReference) {
                      bibItems.push({
                          studyPlanId: newPlan.id,
                          type,
                          author: "Referência",
                          title: fullReference,
                      });
                  }
              }
          };
          prepareItems(bib.basic, "basic");
          prepareItems(bib.complementary, "complementary");
          if (bibItems.length > 0) {
              await db.insert(bibliography).values(bibItems);
          }
      }

      createdPlanIds.push(newPlan.id);
  }

  revalidatePath("/dashboard/study-plans");
  return { id: createdPlanIds[0], count: createdPlanIds.length };
}
export async function createStudyPlanAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    console.error("No session found in createStudyPlanAction");
    redirect("/login");
  }

  // Safely fetch organization
  let organizationId = null;
  try {
      const activeMember = await auth.api.getActiveMember({
          headers: await headers()
      });
      organizationId = activeMember?.organizationId;
      console.log("Active member orgId:", organizationId);
  } catch (e) {
      console.warn("getActiveMember failed, trying listOrganizations:", e);
      const memberships = await auth.api.listOrganizations({
          headers: await headers()
      });
      if (memberships && memberships.length > 0) {
          organizationId = memberships[0].id;
          console.log("Fallback orgId from listOrganizations:", organizationId);
      }
  }

  if (!organizationId) {
    console.error("No organizationId found for user:", session.user.id);
    throw new Error("Usuário não está vinculado a nenhum departamento/curso.");
  }

  // Create new draft
  const [newPlan] = await db.insert(studyPlans).values({
    userId: session.user.id,
    organizationId: organizationId,
    status: "draft",
    semester: "2026.1",
    campus: "Campus de Joinville",
    center: "Centro Tecnológico de Joinville",
    finalEvaluationRules: `O(a) aluno(a) com **frequência suficiente** e **média das notas entre três (3,0) e cinco vírgula cinco (5,5)** terá direito a uma **nova avaliação** no final do semestre que versará sobre todo o conteúdo da disciplina, conforme o que dispõe o **§ 2º do Art. 70 e § 3º do Art. 71 da Resolução nº 17/Cun/97**. Neste caso, a **média final** será calculada através da **média aritmética simples** entre a média das notas das avaliações feitas durante o semestre e a nota obtida na nova avaliação. A **nota mínima de aprovação é seis (6,0)**.

Caso o(a) aluno(a) **não compareça a 75% da carga horária** da disciplina estará **automaticamente reprovado com nota 0,0(zero)**, independentemente da sua média nas avaliações individuais, conforme dispõem no **Art. 69 § 2º da Resolução 017/CUn/97**.

Os(as) alunos(as) que eventualmente faltarem em alguma avaliação que foram perdidas por motivos extremos, mediante justificativa; dentro do prazo de **3 (três) dias úteis** após a avaliação conforme o que dispõe o **Art. 74, da Resolução 017/CUn/97**, poderão solicitar na secretaria acadêmica do Centro de Engenharias da Mobilidade o pedido de **segunda chamada**. Após a análise do pedido e seu deferimento, os(as) alunos(as) poderão realizar a avaliação de segunda chamada na data, no local e horário definido no cronograma.`,
  }).returning();

  if (!newPlan) {
    console.error("Failed to insert new study plan");
    throw new Error("Falha ao criar o plano de ensino.");
  }

  console.log("Created new plan:", newPlan.id);
  revalidatePath("/dashboard/study-plans");
  redirect(`/dashboard/study-plans/${newPlan.id}`);
}

export async function deleteStudyPlanAction(id: string, shouldRedirect = false) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) redirect("/login");

    const plan = await db.query.studyPlans.findFirst({
        where: eq(studyPlans.id, id),
    });

    if (!plan || plan.userId !== session.user.id) {
        throw new Error("Plano não encontrado ou acesso negado");
    }

    // Only allow deleting drafts or rejected plans
    if (plan.status !== "draft" && plan.status !== "rejected") {
        throw new Error(`Não é possível excluir um plano com status: ${plan.status}`);
    }

    await db.delete(studyPlans).where(eq(studyPlans.id, id));

    revalidatePath("/dashboard/study-plans");
    
    if (shouldRedirect) {
        redirect("/dashboard/study-plans");
    }
}
