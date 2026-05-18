import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CoordinatorPlansTable } from "./_components/coordinator-plans-table";

export default async function CoordinatorDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  // Safely fetch active member/organization
  let activeMember = null;
  try {
      // getActiveMember might throw 400 if none active, or return null
      activeMember = await auth.api.getActiveMember({
          headers: await headers()
      });
      console.log("Active member from API:", activeMember?.id);
  } catch (e) {
      console.log("getActiveMember threw error (expected if none active):", (e as any)?.status || (e as any)?.message);
  }

  // Fallback if not active in session
  if (!activeMember) {
      try {
          const memberships = await auth.api.listOrganizations({
              headers: await headers()
          });
          console.log("Found memberships for user:", memberships?.length);
          
          if (memberships && memberships.length > 0 && session.user.id) {
              // Try to find the member record in DB manually to get the role
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
                  console.log("Manual fallback to first membership:", activeMember.organizationId, "Role:", activeMember.role);
              } else {
                  // Final check: look for ANY coordination role for this user
                  const anyCoordRole = await db.query.member.findFirst({
                      where: (members, { and, or, eq }) => and(
                          eq(members.userId, session.user.id),
                          or(eq(members.role, "coordenador"), eq(members.role, "chefe"))
                      )
                  });
                  if (anyCoordRole) {
                      activeMember = {
                          organizationId: anyCoordRole.organizationId,
                          role: anyCoordRole.role
                      };
                      console.log("Deep fallback to coordination role:", activeMember.organizationId, "Role:", activeMember.role);
                  }
              }
          }
      } catch (err) {
          console.error("Error in membership fallback:", err);
      }
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userRole = (activeMember as any)?.role as string;

if (!activeMember || (userRole !== "coordenador" && userRole !== "chefe")) {
    console.log("Access denied for role:", userRole, "in org:", activeMember?.organizationId);
    return (
        <div className="flex items-center justify-center h-[60vh]">
...
              <div className="text-center space-y-2">
                  <h1 className="text-xl font-bold">Acesso Negado</h1>
                  <p className="text-slate-500">Apenas coordenadores podem acessar esta página.</p>
              </div>
          </div>
      );
  }

  // Fetch all plans for this organization
  const allPlans = await db.query.studyPlans.findMany({
      where: eq(studyPlans.organizationId, activeMember.organizationId),
      with: {
          user: true,
          courses: true
      },
      orderBy: [desc(studyPlans.updatedAt)]
  });
  
  const newSubmissions = allPlans.filter(p => p.status === 'submitted');
  const inReview = allPlans.filter(p => p.status === 'pending_review');
  const finished = allPlans.filter(p => p.status === 'approved' || p.status === 'rejected');

  const statusLabels: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
    draft: { label: "Rascunho", variant: "secondary", icon: Clock },
    submitted: { label: "Nova Submissão", variant: "default", icon: Clock },
    pending_review: { label: "Em Revisão", variant: "default", icon: Clock },
    approved: { label: "Aprovado", variant: "outline", icon: CheckCircle },
    rejected: { label: "Rejeitado", variant: "destructive", icon: XCircle },
  };

  return (
    <div className="space-y-12 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Revisão de Planos de Ensino
        </h1>
        <p className="text-slate-500 max-w-2xl">
          Gerencie e revise as submissões dos professores do curso. Acompanhe o fluxo de aprovação e mantenha o arquivo atualizado.
        </p>
      </div>

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
