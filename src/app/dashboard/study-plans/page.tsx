import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans, universityCourses, organization, semesters } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { CreatePlanDialog } from "./_components/create-plan-dialog";
import { TeacherPlansTable } from "./_components/teacher-plans-table";

export default async function StudyPlansPage() {
  const session = await auth.api.getSession();

  if (!session) return null;

  const userStudyPlans = await db.query.studyPlans.findMany({
    where: eq(studyPlans.userId, session.user.id),
    with: {
      courses: true,
    },
    orderBy: [desc(studyPlans.updatedAt)],
  });

  const availableCourses = await db.query.universityCourses.findMany({
    orderBy: [asc(universityCourses.name)]
  });

  const allOrganizations = await db.query.organization.findMany({
    orderBy: [asc(organization.name)]
  });

  const activeSemester = await db.query.semesters.findFirst({
    where: eq(semesters.ativo, true)
  });

  const filteredOrgs = allOrganizations.filter(o => o.name !== "Geral");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Meus Planos de Ensino
          </h1>
          <p className="text-slate-500">
            Gerencie seus rascunhos e acompanhe o status das suas submissões.
          </p>
        </div>
        
        <CreatePlanDialog 
          courses={availableCourses} 
          organizations={filteredOrgs} 
          activeSemester={activeSemester?.name || "2026.1"}
        />
      </div>

      <TeacherPlansTable plans={userStudyPlans} />
    </div>
  );
}
