import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { SearchFilter } from "./_components/search-filter";
import { CentralArchiveTable } from "./_components/central-archive-table";

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Arquivo Central
        </h1>
        <p className="text-slate-500">
          Consulte e gerencie todos os planos de ensino aprovados e arquivados.
        </p>
      </div>

      <div className="flex justify-between items-center bg-white p-4 border rounded-xl shadow-sm">
        <SearchFilter />
        <div className="text-sm text-slate-500 font-medium">
            {plans.length} planos no arquivo
        </div>
      </div>

      <CentralArchiveTable plans={plans} initialQuery={query} />
    </div>
  );
}
