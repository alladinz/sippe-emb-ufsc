import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { ArquivoCentralClient } from "./_components/arquivo-central-client";
import { PageHeader } from "@/components/dashboard/page-header";

interface SecretaryDashboardPageProps {
    searchParams: Promise<{
        q?: string;
    }>;
}

export default async function SecretaryDashboardPage({ searchParams }: SecretaryDashboardPageProps) {
  const session = await auth.api.getSession();

  if (!session) redirect("/login");

  const params = await searchParams;

  // Verify Secretary/Chef role
  const adminMembership = await db.query.member.findFirst({
      where: (m, { and, or, eq }) => and(
          eq(m.userId, session.user.id),
          or(eq(m.role, "secretario"), eq(m.role, "chefe"))
      )
  });

  if (!adminMembership) {
      return (
          <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-2">
                  <h1 className="text-xl font-bold">Acesso Negado</h1>
                  <p className="text-slate-500">Apenas secretários ou chefes de departamento podem acessar o arquivo.</p>
              </div>
          </div>
      );
  }

  // Fetch finalized plans (approved or archived)
  const plans = await db.query.studyPlans.findMany({
      where: inArray(studyPlans.status, ["approved", "archived"]),
      with: {
          user: true,
          organization: true,
          courses: true
      },
      orderBy: [desc(studyPlans.updatedAt)]
  });

  const query = params.q || "";

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Arquivo Central"
        description="Consulte e gerencie todos os planos de ensino aprovados e arquivados."
      />

      <ArquivoCentralClient plans={plans} query={query} />
    </div>
  );
}
