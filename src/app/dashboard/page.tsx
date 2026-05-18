import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileEdit, ArrowRight, Clock, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;
  const user = session.user;

  // Fetch pending drafts/assignments for this teacher
  const pendingPlans = await db.query.studyPlans.findMany({
      where: eq(studyPlans.userId, user.id),
      with: {
          courses: true,
          organization: true
      },
      orderBy: [desc(studyPlans.updatedAt)]
  });

  const drafts = pendingPlans.filter(p => p.status === "draft");
  const inReview = pendingPlans.filter(p => p.status === "submitted" || p.status === "pending_review");
  const approved = pendingPlans.filter(p => p.status === "approved");
  
  const total = pendingPlans.length;
  const submittedCount = total - drafts.length;
  const progressPercent = total > 0 ? (submittedCount / total) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Bem-vindo, {user.name}
        </h1>
        <p className="text-slate-500">
          Gerencie seus planos de ensino e acompanhe o processo de revisão.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Assigned Courses Section */}
        <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-blue" />
                    Disciplinas Atribuídas (Pendentes)
                </h2>
                <Link href="/dashboard/study-plans">
                    <Button variant="ghost" size="sm" className="text-brand-blue">
                        Ver todos
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
            </div>

            {drafts.length === 0 ? (
                <Card className="bg-slate-50 border-dashed">
                    <CardContent className="py-10 text-center">
                        <p className="text-slate-500">Nenhuma disciplina atribuída pendente de preenchimento.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 items-stretch">
                    {drafts.map(plan => (
                        <Card key={plan.id} className="hover:shadow-[inset_0_2px_8px_0px_rgba(0,0,0,0.05)] transition-shadow transition delay-50 duration-200 ease-in hover:-translate-y-0.5 hover:scale-[1.005] border-slate-200 flex flex-col h-full rounded-md overflow-hidden">
                            <CardHeader className="pb-2 flex-none">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="text-[8px] uppercase">{plan.organization.name}</Badge>
                                    <span className="text-[10px] text-slate-400 font-mono">{plan.semester}</span>
                                </div>
                                <CardTitle className="text-lg mt-2 line-clamp-2 min-h-[3.5rem] flex items-center">
                                    {plan.courses[0]?.name || "Plano sem nome"}
                                </CardTitle>
                                <CardDescription className="font-mono text-xs">
                                    {plan.courses[0]?.code}
                                </CardDescription>
                            </CardHeader>
                            {/* Adding an empty flex-grow div if needed, though mt-auto on footer should suffice */}
                            <div className="flex-grow" />
                            <CardFooter className="pt-2 mt-auto border-t">
                                <Link href={`/dashboard/study-plans/${plan.id}`} className="w-full">
                                    <Button className="w-full gap-2 bg-brand-blue hover:bg-brand-blue rounded-sm">
                                        <FileEdit className="w-4 h-4" />
                                        Continuar Plano
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>

        {/* Status Summary Column */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                Resumo
            </h2>
            
            <div className="grid gap-3">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-400">
                    <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wider">Rascunhos</p>
                    <p className="text-[28px] font-semibold text-slate-900 mt-1 leading-none">{drafts.length}</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-400">
                    <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wider">Aguardando Revisão</p>
                    <p className="text-[28px] font-semibold text-slate-900 mt-1 leading-none">{inReview.length}</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-400">
                    <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wider">Aprovados</p>
                    <p className="text-[28px] font-semibold text-slate-900 mt-1 leading-none">{approved.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm space-y-4 border border-slate-100">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">Progresso do Semestre</p>
                        <p className="text-xs text-slate-500">Planos entregues</p>
                    </div>
                    <p className="text-sm font-bold text-brand-blue">
                        {submittedCount} <span className="text-slate-400 font-normal">de</span> {total}
                    </p>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-brand-blue h-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center italic">
                Total de {total} documentos no sistema.
            </p>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "secondary" }) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
            variant === "default" ? "bg-slate-900 text-white border-transparent" : "bg-slate-100 text-slate-900 border-slate-200",
            className
        )}>
            {children}
        </span>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
