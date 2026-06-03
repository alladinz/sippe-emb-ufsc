import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans, semesters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StudyPlanForm } from "@/components/forms/study-plan-form";
import { StudyPlanFormValues } from "@/lib/schemas/study-plan";
import { saveStudyPlanAction, submitStudyPlanAction } from "./actions";

interface EditStudyPlanPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudyPlanPage({ params }: EditStudyPlanPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession();

  if (!session) {
    redirect("/login");
  }

  const plan = await db.query.studyPlans.findFirst({
    where: eq(studyPlans.id, id),
    with: {
      courses: true,
      bibliography: true,
    }
  });

  if (!plan) {
    notFound();
  }

  // Fetch semester dates
  const semesterData = plan.semester ? await db.query.semesters.findFirst({
      where: eq(semesters.name, plan.semester)
  }) : null;

  // Security: Only owner can edit
  if (plan.userId !== session.user.id) {
    redirect("/dashboard/study-plans");
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Editar Plano de Ensino
        </h1>
        <p className="text-slate-500">
          As alterações são salvas automaticamente enquanto você digita.
        </p>
      </div>

      <StudyPlanForm 
        studyPlanId={id} 
        initialData={plan as unknown as StudyPlanFormValues} 
        onSave={saveStudyPlanAction.bind(null, id)} 
        onSubmit={submitStudyPlanAction.bind(null, id)}
        semesterDates={semesterData ? {
            startDate: semesterData.startDate,
            endDate: semesterData.endDate
        } : undefined}
        holidays={semesterData?.holidays || []}
      />
    </div>
  );
}
