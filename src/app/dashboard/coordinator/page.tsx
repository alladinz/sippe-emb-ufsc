import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { CoordinatorPlansTable } from "./_components/coordinator-plans-table";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  SAFE_USER_COLUMNS,
  hasAnyRole,
  normalizeMembershipRole,
} from "@/lib/auth/roles";

export default async function CoordinatorDashboardPage() {
  const session = await auth.api.getSession();

  if (!session) redirect("/login");

  const memberships = await auth.api.listOrganizations();
  const isChef = hasAnyRole(memberships, ["chefe"]);
  const coordinatorOrgIds = memberships
    .filter((m) => normalizeMembershipRole(m) === "coordenador")
    .map((m) => m.organizationId)
    .filter(Boolean);

  if (!isChef && coordinatorOrgIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Acesso Negado</h1>
          <p className="text-slate-500">Apenas coordenadores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Fetch plans for coordinator's course(s) (or all if chefe)
  const allPlans = await db.query.studyPlans.findMany({
      where: isChef
        ? undefined
        : coordinatorOrgIds.length === 1
        ? eq(studyPlans.organizationId, coordinatorOrgIds[0])
        : inArray(studyPlans.organizationId, coordinatorOrgIds),
      with: {
          user: {
            columns: SAFE_USER_COLUMNS,
          },
          courses: true
      },
      orderBy: [desc(studyPlans.updatedAt)]
  });
  
  const newSubmissions = allPlans.filter(p => p.status === 'submitted');
  const inReview = allPlans.filter(p => p.status === 'pending_review');
  const finished = allPlans.filter(p => p.status === 'approved' || p.status === 'rejected');

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Revisão de Planos de Ensino"
        description="Gerencie e revise as submissões dos professores do curso. Acompanhe o fluxo de aprovação e mantenha o arquivo atualizado."
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="h-8 w-1 bg-amber-500 rounded-full" />
                Novas Submissões
                <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    {newSubmissions.length}
                </span>
            </h2>
        </div>
        <CoordinatorPlansTable 
            plans={newSubmissions} 
            emptyMessage="Nenhuma nova submissão aguardando." 
            actionLabel="Iniciar Revisão"
            statusVariant="amber"
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="h-8 w-1 bg-brand-blue rounded-full" />
                Em Minha Revisão
                <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {inReview.length}
                </span>
            </h2>
        </div>
        <CoordinatorPlansTable 
            plans={inReview} 
            emptyMessage="Você não possui planos em revisão ativa no momento." 
            actionLabel="Continuar Revisão"
            statusVariant="blue"
        />
      </div>

      {finished.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="h-8 w-1 bg-slate-300 rounded-full" />
                    Histórico Recente
                </h2>
            </div>
            <div className="opacity-90">
                <CoordinatorPlansTable 
                    plans={finished} 
                    emptyMessage="Nenhum plano processado recentemente." 
                    actionLabel="Ver Detalhes"
                />
            </div>
          </div>
      )}
    </div>
  );
}
