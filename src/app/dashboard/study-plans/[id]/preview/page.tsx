import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, MessageSquare, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ReviewActions } from "./review-actions";
import { ArchiveButton } from "@/app/dashboard/secretary/_components/archive-button";
import { Badge } from "@/components/ui/badge";

import { DownloadPDFButton } from "@/components/pdf/DownloadPDFButton";
import { RichTextViewer } from "@/components/latex/RichTextViewer";
import { LatexFormula } from "@/components/latex/LatexFormula";
import { formatPlanScheduleSummary } from "@/lib/schedule/ufsc-schedule";
import { StudyPlanStatus } from "@/lib/schemas/study-plan";

import { cn } from "@/lib/utils";
import { ScheduleItem } from "@/types/study-plan";
import {
  canViewStudyPlan,
  hasAnyRole,
  isValidUuid,
  normalizeMembershipRole,
} from "@/lib/auth/roles";

interface PreviewStudyPlanPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pdf?: string }>;
}

export default async function PreviewStudyPlanPage({ params, searchParams }: PreviewStudyPlanPageProps) {
  const { id } = await params;
  const { pdf } = await searchParams;
  const isForPdf = pdf === "true";
  const session = await auth.api.getSession();

  if (!session) {
    redirect("/login");
  }

  if (!isValidUuid(id)) {
    notFound();
  }

  const memberships = await auth.api.listOrganizations();

  const plan = await db.query.studyPlans.findFirst({
    where: eq(studyPlans.id, id),
    with: {
      courses: true,
      bibliography: true,
      organization: true,
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      turma: {
        columns: {
          id: true,
          turma: true,
          indicacaoHorario: true,
        },
      },
    }
  });

  if (!plan) {
    notFound();
  }

  if (!canViewStudyPlan({ plan, userId: session.user.id, memberships })) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold text-slate-900">Acesso Negado</h1>
          <p className="text-slate-500 text-sm">
            Você não possui permissão para visualizar este plano de ensino.
          </p>
          <Link
            href="/dashboard/study-plans"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#023E8A] hover:underline pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Meus Planos
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = plan.userId === session.user.id;
  const isChef = hasAnyRole(memberships, ["chefe"]);
  const isSecretary = hasAnyRole(memberships, ["secretario"]);
  const isOrgCoordinator = memberships.some(
    (m) =>
      normalizeMembershipRole(m) === "coordenador" &&
      m.organizationId === plan.organizationId
  );

  const canArchive = (isChef || isSecretary) && plan.status === "approved";

  const schedule = (plan.schedule as unknown as ScheduleItem[]) || [];
  const numSelectedDays = schedule.filter((s: ScheduleItem) => s.enabled).length;
  const hasMoreThanOneDay = numSelectedDays !== 1;

  // Chef doesn't approve directly; only course coordinators for that org see review actions
  const showReviewActions =
    isOrgCoordinator &&
    !isChef &&
    (plan.status === "submitted" || plan.status === "pending_review");

  const backHref = isOwner
    ? `/dashboard/study-plans/${id}`
    : isOrgCoordinator
    ? "/dashboard/coordinator"
    : isChef
    ? "/dashboard/chef"
    : "/dashboard/secretary";
  const backLabel = isOwner
    ? "Voltar para edição"
    : isOrgCoordinator
    ? "Voltar para Lista"
    : isChef
    ? "Voltar para Visão Geral"
    : "Voltar para Arquivo";

  const statusLabels: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Rascunho", variant: "secondary" },
    submitted: { label: "Nova Submissão", variant: "default" },
    pending_review: { label: "Em Revisão", variant: "default" },
    approved: { label: "Aprovado", variant: "outline" },
    rejected: { label: "Rejeitado", variant: "destructive" },
    archived: { label: "Arquivado", variant: "outline" },
  };

  return (
    <div className={cn("max-w-4xl mx-auto space-y-8 pb-20 print-container", isForPdf && "pb-0 pt-0")}>
      {!isForPdf && (
        <div className="flex items-center justify-between no-print">
          <Link href={backHref}>
            <button className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </button>
          </Link>
          <div className="flex items-center gap-4">
              <Badge variant={statusLabels[plan.status]?.variant || "outline"}>
                  {statusLabels[plan.status]?.label || plan.status}
              </Badge>
              <DownloadPDFButton
                plano={plan}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
              >
                <Download className="w-[18px] h-[18px] shrink-0" />
                <span>Baixar PDF</span>
              </DownloadPDFButton>

          </div>
        </div>
      )}

      {showReviewActions && !isForPdf && (
          <ReviewActions studyPlanId={id} status={plan.status as StudyPlanStatus} />
      )}

      {canArchive && !isForPdf && (
          <div className="flex items-center justify-between p-4 bg-brand-blue text-white rounded-lg shadow-lg border-brand-blue animate-in fade-in slide-in-from-bottom-4 no-print">
              <div className="flex-1">
                  <p className="text-sm font-medium">Finalização de Documento</p>
                  <p className="text-xs text-indigo-300">Este plano foi aprovado e está pronto para ser arquivado.</p>
              </div>
              <ArchiveButton id={id} />
          </div>
      )}

      {plan.status === 'rejected' && plan.feedback && !isForPdf && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 no-print">
              <MessageSquare className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                  <p className="text-sm font-bold text-destructive">Feedback de Rejeição:</p>
                  <p className="text-sm text-destructive/80 italic">{plan.feedback}</p>
              </div>
          </div>
      )}

      <div className={cn(
          "bg-white p-12 shadow-lg border rounded-sm min-h-[1100px] font-serif text-slate-900 print:shadow-none print:border-0 print:p-0",
          isForPdf && "p-0 shadow-none border-0 m-0 rounded-none w-full"
      )}>
        {/* Header with Logo and Institutional Hierarchy */}
        <header className="relative flex flex-col items-center mb-12 border-b pb-8">
          <div className="absolute left-0 top-0">
            <Image 
              src="/brasao_UFSC.svg" 
              alt="Brasão UFSC" 
              width={80} 
              height={80}
              className="object-contain"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-sm font-bold uppercase">Universidade Federal de Santa Catarina</h1>
            <p className="text-xs font-semibold uppercase">{plan.campus || "CAMPUS Joinville"}</p>
            <p className="text-xs uppercase">{plan.center || "Centro Tecnológico de Joinville - CTJ"}</p>
            <p className="text-xs uppercase">{plan.courseName || plan.organization.name}</p>
            <p className="text-xs font-bold mt-4 uppercase">SEMESTRE - {plan.semester}</p>
          </div>
        </header>

        <section className="space-y-10">
          {/* I. IDENTIFICAÇÃO */}
          <div>
            <h4 className="font-bold mb-4">I. IDENTIFICAÇÃO DA DISCIPLINA</h4>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-xs border p-4 rounded-sm bg-slate-50/30">
              {plan.courses.map((course) => (
                <div key={course.id} className="contents">
                  <p><span className="font-bold">Disciplina:</span> {course.name}</p>
                  <p><span className="font-bold">Código:</span> {course.code}</p>
                  <p><span className="font-bold">Carga horária:</span> {course.workload ? `${course.workload} horas` : "-"}</p>
                  <p><span className="font-bold">Créditos:</span> {course.credits || "-"}</p>
                  <p className="col-span-2">
                    <span className="font-bold">Pré-requisito:</span>{" "}
                    {plan.prerequisites?.trim() || "Não há pré-requisitos cadastrados."}
                  </p>
                  <p className="col-span-2">
                    <span className="font-bold">Turma:</span>{" "}
                    {course.classIdentifier || plan.turma?.turma || "-"}
                  </p>
                </div>
              ))}
              {plan.courses.length === 0 && (
                <>
                  <p className="col-span-2">
                    <span className="font-bold">Pré-requisito:</span>{" "}
                    {plan.prerequisites?.trim() || "Não há pré-requisitos cadastrados."}
                  </p>
                  <p className="col-span-2">
                    <span className="font-bold">Turma:</span>{" "}
                    {plan.turma?.turma || "-"}
                  </p>
                </>
              )}
              <p className="col-span-2">
                <span className="font-bold">Horário da aula:</span>{" "}
                {formatPlanScheduleSummary(plan.schedule, plan.turma?.indicacaoHorario)}
              </p>
              <p><span className="font-bold">Professor(a):</span> {plan.user.name}</p>
              <p>
                <span className="font-bold">Contato:</span>{" "}
                {plan.contact?.trim() || plan.user.email || "-"}
              </p>
              <p className="col-span-2">
                <span className="font-bold">Horário de atendimento:</span>{" "}
                {plan.officeHours?.trim() || "A combinar / não informado."}
              </p>
            </div>
          </div>

          {/* II. EMENTA */}
          <div>
            <h4 className="font-bold mb-3">II. EMENTA</h4>
            <RichTextViewer
              content={plan.syllabus}
              emptyText="Não informada."
              className="text-xs leading-relaxed text-justify"
            />
          </div>

          {/* III. OBJETIVOS */}
          <div>
            <h4 className="font-bold mb-3">III. OBJETIVOS</h4>
            <RichTextViewer
              content={plan.objectives}
              emptyText="Não informados."
              className="text-xs leading-relaxed text-justify"
            />
          </div>

          {/* IV. CONTEÚDO PROGRAMÁTICO */}
          <div>
            <h4 className="font-bold mb-3">IV. CONTEÚDO PROGRAMÁTICO</h4>
            <RichTextViewer
              content={plan.programContent}
              emptyText="Não informado."
              className="text-xs leading-relaxed pl-4 border-l-2 border-slate-100"
            />
          </div>

          {/* V. METODOLOGIA DE ENSINO */}
          <div>
            <h4 className="font-bold mb-3 uppercase">V. METODOLOGIA DE ENSINO</h4>
            <RichTextViewer
              content={plan.methodology}
              emptyText="Não informada."
              className="text-xs leading-relaxed text-justify"
            />
          </div>

          {/* VI. METODOLOGIA DE AVALIAÇÃO */}
          <div className="break-inside-avoid">
            <h4 className="font-bold mb-3">VI. METODOLOGIA DE AVALIAÇÃO</h4>
            <div className="text-xs space-y-4">
              <RichTextViewer
                content={plan.evaluation}
                emptyText="Não informada."
                className="text-xs leading-relaxed text-justify"
              />
              {plan.evaluationFormula && (
                <div className="bg-slate-50 p-4 border border-dashed rounded-md text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Fórmula de Cálculo da Média</p>
                  <div className="flex justify-center overflow-x-auto">
                    <LatexFormula formula={plan.evaluationFormula} display />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VII. AVALIAÇÃO FINAL */}
          <div>
            <h4 className="font-bold mb-3">VII. AVALIAÇÃO FINAL</h4>
            <RichTextViewer
              content={plan.finalEvaluationRules || "Conforme resoluções vigentes da Universidade."}
              className="text-xs leading-relaxed text-justify"
            />
            {plan.finalConsiderations?.trim() && (
              <RichTextViewer
                content={plan.finalConsiderations}
                className="text-xs leading-relaxed text-justify mt-3"
              />
            )}
          </div>

          {/* VIII. CRONOGRAMA DE AULA */}
          <div className="break-before-page pt-8">
            <h4 className="font-bold mb-4 uppercase text-center">VIII. CRONOGRAMA DE AULA</h4>
            <div className="border rounded-sm overflow-hidden">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="border-r p-2 text-center w-12">Semana</th>
                    <th className="border-r p-2 text-center w-12">Aula</th>
                    <th className="border-r p-2 text-left">Conteúdo</th>
                    {hasMoreThanOneDay && (
                      <>
                        <th className="border-r p-2 text-center w-12">Aula</th>
                        <th className="p-2 text-left">Conteúdo</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {Array.isArray(plan.weeklySchedule) && (plan.weeklySchedule as any[]).length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (plan.weeklySchedule as any[]).map((week: any) => (
                      <tr key={week.week} className="border-b last:border-0">
                        <td className="border-r p-2 text-center font-bold bg-slate-50/30">{week.week}</td>
                        <td className="border-r p-2 text-center">{week.class1.number}</td>
                        <td className="border-r p-2 text-justify italic">{week.class1.content || "-"}</td>
                        {hasMoreThanOneDay && (
                          <>
                            <td className="border-r p-2 text-center">{week.class2.number}</td>
                            <td className="p-2 text-justify italic">{week.class2.content || "-"}</td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={hasMoreThanOneDay ? 5 : 3} className="p-8 text-center text-slate-400 italic">Cronograma não detalhado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[9px] text-slate-500 italic mt-2">* O cronograma está sujeito a alterações conforme o andamento da disciplina.</p>
          </div>

          {/* IX. BIBLIOGRAFIA */}
          <div>
            <h4 className="font-bold mb-4 uppercase">IX. BIBLIOGRAFIA</h4>
            <div className="space-y-6 pl-2">
              <div>
                <h5 className="font-bold text-xs mb-2.5 text-slate-800">Bibliografia Básica</h5>
                <ul className="space-y-2 pl-4">
                  {plan.bibliography.filter(b => b.type === 'basic').map((b) => (
                    <li key={b.id} className="text-xs list-decimal pl-2">
                      {b.title}
                    </li>
                  ))}
                  {plan.bibliography.filter(b => b.type === 'basic').length === 0 && <li className="text-xs italic text-slate-400">Nenhuma informada.</li>}
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-xs mb-2.5 text-slate-800">Bibliografia Complementar</h5>
                <ul className="space-y-2 pl-4">
                  {plan.bibliography.filter(b => b.type === 'complementary').map((b) => (
                    <li key={b.id} className="text-xs list-decimal pl-2">
                      {b.title}
                    </li>
                  ))}
                  {plan.bibliography.filter(b => b.type === 'complementary').length === 0 && <li className="text-xs italic text-slate-400">Nenhuma informada.</li>}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-24 pt-12 text-center">
            <div className="text-[9px] text-slate-400 border-t pt-4">
                Atualizado em: {new Date(plan.updatedAt).toLocaleDateString('pt-BR')} às {new Date(plan.updatedAt).toLocaleTimeString('pt-BR')}
            </div>
        </footer>
      </div>
    </div>
  );
}
