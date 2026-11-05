import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { programasEnsino } from "@/db/schema_programas";
import { eq, desc, count } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileEdit, ArrowRight, Clock, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function DashboardPage() {
  const session = await auth.api.getSession();

  if (!session) return null;
  const user = session.user;
  const userRole = (user as { papel?: string }).papel;

  if (userRole === "comissao") {
    redirect("/dashboard/programas-ensino");
  }

  // Fetch pending drafts/assignments for this teacher
  const pendingPlans = await db.query.studyPlans.findMany({
    where: eq(studyPlans.userId, user.id),
    with: {
      courses: true,
      organization: true,
    },
    orderBy: [desc(studyPlans.updatedAt)],
  });

  const drafts = pendingPlans.filter((p) => p.status === "draft");
  const inReview = pendingPlans.filter(
    (p) => p.status === "submitted" || p.status === "pending_review"
  );
  const approved = pendingPlans.filter((p) => p.status === "approved");

  const total = pendingPlans.length;
  const submittedCount = total - drafts.length;
  const progressPercent = total > 0 ? (submittedCount / total) * 100 : 0;

  // Programas stats for chefe/coordenador
  const programasStats = { submetidos: 0, aprovados: 0 };
  if (userRole === "coordenador" || userRole === "chefe") {
    const [sub, apr] = await Promise.all([
      db
        .select({ value: count() })
        .from(programasEnsino)
        .where(eq(programasEnsino.status, "submitted")),
      db
        .select({ value: count() })
        .from(programasEnsino)
        .where(eq(programasEnsino.status, "approved")),
    ]);
    programasStats.submetidos = sub[0].value;
    programasStats.aprovados = apr[0].value;
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={`Bem-vindo, ${user.name}`}
        description="Gerencie seus planos de ensino e acompanhe o processo de revisão."
      />

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Assigned Courses Section */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#023E8A]" />
              Disciplinas Atribuídas (Pendentes)
            </h2>
            <Link href="/dashboard/study-plans">
              <Button variant="ghost" size="sm" className="text-[#023E8A] hover:text-[#023E8A] font-bold text-xs">
                Ver todos
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {drafts.length === 0 ? (
            <Card className="bg-slate-50/60 border-dashed border-slate-200/80 rounded-xl">
              <div className="py-8 px-4 text-center">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  Nenhuma disciplina atribuída pendente de preenchimento.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Todos os seus planos de ensino atribuídos já foram enviados ou não há novas atribuições.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 items-stretch">
              {drafts.map((plan) => (
                <Card
                  key={plan.id}
                  className="border border-slate-200/80 bg-white rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-4 pb-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100">
                        {plan.organization.name}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono font-bold">
                        {plan.semester}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#102E52] line-clamp-1 leading-snug" title={plan.courses[0]?.name}>
                      {plan.courses[0]?.name || "Plano sem nome"}
                    </h3>
                    <p className="font-mono text-xs text-slate-500 font-normal mt-0.5">
                      {plan.courses[0]?.code || "-"}
                    </p>
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Rascunho</span>
                    <Link href={`/dashboard/study-plans/${plan.id}`}>
                      <Button size="sm" className="gap-1.5 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold rounded-lg h-8 text-xs px-3">
                        <FileEdit className="w-3.5 h-3.5" />
                        Continuar Plano
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Status Summary Column */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              Resumo (Planos de Ensino)
            </h2>

            <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
              <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Rascunhos
                  </p>
                  <p className="text-xl font-bold text-[#102E52] mt-0.5 leading-none">
                    {drafts.length}
                  </p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Aguardando Revisão
                  </p>
                  <p className="text-xl font-bold text-[#102E52] mt-0.5 leading-none">
                    {inReview.length}
                  </p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Aprovados
                  </p>
                  <p className="text-xl font-bold text-[#102E52] mt-0.5 leading-none">
                    {approved.length}
                  </p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Progresso do Semestre
                </p>
                <p className="text-[11px] font-normal text-slate-500">Planos entregues</p>
              </div>
              <p className="text-xs font-bold text-[#023E8A]">
                {submittedCount}{" "}
                <span className="text-slate-400 font-normal">de</span> {total}
              </p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#023E8A] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Programas de Ensino Section (Full-width balanced section for Coordenador / Chefe) */}
      {(userRole === "coordenador" || userRole === "chefe") && (
        <div className="space-y-3 pt-3 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#023E8A]" />
                Programas de Ensino
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhamento dos programas de ensino vinculados ao departamento.
              </p>
            </div>
            <Link href={userRole === "chefe" ? "/dashboard/revisao-programas" : "/dashboard/programas-ensino"}>
              <Button variant="ghost" size="sm" className="text-[#023E8A] hover:text-[#023E8A] font-bold text-xs">
                {userRole === "chefe" ? "Revisar programas" : "Ver programas"}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Aguardando Revisão
                </p>
                <p className="text-2xl font-bold text-[#102E52] mt-0.5 leading-none">
                  {programasStats.submetidos}
                </p>
                <p className="text-xs text-slate-400 mt-1">Pendentes de análise</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Aprovados
                </p>
                <p className="text-2xl font-bold text-[#102E52] mt-0.5 leading-none">
                  {programasStats.aprovados}
                </p>
                <p className="text-xs text-slate-400 mt-1">Homologados no sistema</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Gestão Documental
                </p>
                <p className="text-sm font-bold text-[#102E52] mt-0.5">
                  {userRole === "chefe" ? "Fila de Homologação" : "Elaboração de Programas"}
                </p>
              </div>
              <Link
                href={userRole === "chefe" ? "/dashboard/revisao-programas" : "/dashboard/programas-ensino"}
                className="mt-2 text-xs font-bold text-[#023E8A] hover:underline flex items-center gap-1"
              >
                Acessar módulo <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center font-normal">
        Total de {total} planos atribuídos.
      </p>
    </div>
  );
}
