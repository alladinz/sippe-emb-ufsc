import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans, organization, universityCourses, user, member, semesters, courses } from "@/db/schema";
import { eq, desc, and, or, inArray, sql } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  School,
  Database,
  Calendar,
  Users,
  Settings
} from "lucide-react";
import Link from "next/link";
import { PlansTable } from "./_components/plans-table";
import { MasterCourseList } from "./_components/master-course-list";
import { SemesterManagement } from "./_components/semester-management";
import { UserManagement } from "./_components/user-management";
import { EvaluationSettings } from "./_components/evaluation-settings";
import { ImportarPlanilha } from "@/components/ImportarPlanilha";
import { SearchInput } from "./_components/search-input";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";

interface ChefDashboardPageProps {
    searchParams: Promise<{
        course?: string;
        status?: string;
        tab?: string;
        page?: string;
        limit?: string;
        search?: string;
    }>;
}

export default async function ChefDashboardPage({ searchParams }: ChefDashboardPageProps) {
  const session = await auth.api.getSession();

  if (!session) redirect("/login");

  const params = await searchParams;
  const activeTab = params.tab || "overview";
  const currentPage = parseInt(params.page || "1");
  const pageSize = parseInt(params.limit || "20");
  const offset = (currentPage - 1) * pageSize;
  const searchTerm = params.search || "";

  // Verify Chef role
  const chefMembership = await db.query.member.findFirst({
      where: (m, { and, eq }) => and(
          eq(m.userId, session.user.id),
          eq(m.role, "chefe")
      )
  });

  if (!chefMembership) {
      return (
          <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-2">
                  <h1 className="text-xl font-bold text-slate-900">Acesso Negado</h1>
                  <p className="text-slate-500 text-sm">Apenas o Chefe de Departamento pode acessar esta página.</p>
              </div>
          </div>
      );
  }

  // Fetch all organizations
  const allOrgs = await db.query.organization.findMany({
      orderBy: [organization.name]
  });

  // Fetch all teachers (users who are members of these orgs)
  const teachers = await db.query.user.findMany({
      orderBy: [user.name]
  });

  // Fetch all members for user management
  const allMembers = await db.query.member.findMany({
      with: {
          user: true,
          organization: true
      },
      orderBy: [desc(member.createdAt)]
  });

  // Fetch settings
  const settings = await db.query.systemSettings.findMany();
  const defaultEvaluationSetting = settings.find(s => s.key === "DEFAULT_FINAL_EVALUATION")?.value || "";

  // --- FILTERS LOGIC FOR PLANS ---
  // We need to resolve orgId if course slug is provided
  let filterOrgId: string | undefined = undefined;
  if (params.course) {
      const org = allOrgs.find(o => o.slug === params.course);
      if (org) filterOrgId = org.id;
  }

  // 1. If searching, find matching plan IDs first using joins to avoid alias issues
  let matchingIds: string[] | null = null;
  if (searchTerm) {
      const searchResults = await db.select({ id: studyPlans.id })
          .from(studyPlans)
          .leftJoin(user, eq(studyPlans.userId, user.id))
          .leftJoin(courses, eq(studyPlans.id, courses.studyPlanId))
          .where(or(
              sql`unaccent(${user.name}) ilike unaccent(${`%${searchTerm}%`})`,
              sql`unaccent(${courses.code}) ilike unaccent(${`%${searchTerm}%`})`,
              sql`unaccent(${courses.name}) ilike unaccent(${`%${searchTerm}%`})`,
              sql`unaccent(${studyPlans.courseName}) ilike unaccent(${`%${searchTerm}%`})`
          ))
          .groupBy(studyPlans.id);

      matchingIds = searchResults.map(r => r.id);
  }

  const whereClause = and(
      filterOrgId ? eq(studyPlans.organizationId, filterOrgId) : undefined,
      params.status ? eq(studyPlans.status, params.status) : undefined,
      searchTerm ? (
          matchingIds && matchingIds.length > 0
            ? inArray(studyPlans.id, matchingIds)
            : sql`FALSE`
      ) : undefined
  );

  // Get total count for pagination
  const allMatchingPlans = await db.query.studyPlans.findMany({
      where: whereClause,
      columns: { id: true }
  });
  const totalPlans = allMatchingPlans.length;

  // Fetch paginated plans
  const plans = await db.query.studyPlans.findMany({
      where: whereClause,
      with: {
          user: true,
          organization: true,
          courses: true,
          turma: true
      },
      orderBy: [desc(studyPlans.updatedAt)],
      limit: pageSize,
      offset: offset
  });

  // Fetch imported master courses
  const masterCourses = await db.query.universityCourses.findMany({
      orderBy: [desc(universityCourses.createdAt)]
  });

  // Fetch semesters
  const allSemesters = await db.query.semesters.findMany({
      orderBy: [desc(semesters.name)]
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel do Chefe de Departamento"
        description="Monitoramento global e gerenciamento de atribuições."
      />

      <Tabs defaultValue={activeTab} className="w-full flex flex-col">
        <TabsList className="bg-slate-100/80 border border-slate-200/80 p-1 h-auto shadow-2xs rounded-xl mb-6 flex flex-wrap justify-start gap-1">
            <TabsTrigger
                value="overview"
                className="gap-2 px-4 py-2 text-xs font-bold text-slate-600 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#023E8A] data-[state=active]:shadow-xs transition-all"
            >
                <School className="w-4 h-4" />
                Visão Geral
            </TabsTrigger>
            <TabsTrigger
                value="management"
                className="gap-2 px-4 py-2 text-xs font-bold text-slate-600 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#023E8A] data-[state=active]:shadow-xs transition-all"
            >
                <Database className="w-4 h-4" />
                Gerenciamento de Disciplinas
            </TabsTrigger>
            <TabsTrigger
                value="semesters"
                className="gap-2 px-4 py-2 text-xs font-bold text-slate-600 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#023E8A] data-[state=active]:shadow-xs transition-all"
            >
                <Calendar className="w-4 h-4" />
                Configuração de Semestres
            </TabsTrigger>
            <TabsTrigger
                value="evaluation-settings"
                className="gap-2 px-4 py-2 text-xs font-bold text-slate-600 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#023E8A] data-[state=active]:shadow-xs transition-all"
            >
                <Settings className="w-4 h-4" />
                Configuração de Avaliação
            </TabsTrigger>
            <TabsTrigger
                value="users"
                className="gap-2 px-4 py-2 text-xs font-bold text-slate-600 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#023E8A] data-[state=active]:shadow-xs transition-all"
            >
                <Users className="w-4 h-4" />
                Usuários
            </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Search and Filters Bar */}
            <div className="bg-white p-5 border border-slate-200/80 rounded-xl shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <SearchInput placeholder="Buscar por professor ou disciplina..." />
                </div>

                <div className="space-y-3 pt-1 border-t border-slate-100">
                    {/* Row 1: Course Filter */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-bold w-12 flex-shrink-0">Curso:</span>
                        <div className="flex gap-1.5 flex-wrap items-center">
                            <Link href={`/dashboard/chef?tab=overview${params.search ? `&search=${params.search}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}>
                                <span
                                    className={cn(
                                        "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                        !params.course
                                            ? "bg-[#023E8A] text-white border-[#023E8A]"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    Todos os Cursos
                                </span>
                            </Link>
                            {allOrgs.map(org => (
                                <Link key={org.id} href={`/dashboard/chef?tab=overview&course=${org.slug}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}>
                                    <span
                                        className={cn(
                                            "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                            params.course === org.slug
                                                ? "bg-[#023E8A] text-white border-[#023E8A]"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        {org.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Row 2: Status Filter */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-bold w-12 flex-shrink-0">Status:</span>
                        <div className="flex gap-1.5 flex-wrap items-center">
                            <Link href={`/dashboard/chef?tab=overview${params.course ? `&course=${params.course}` : ''}${params.search ? `&search=${params.search}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}>
                                <span
                                    className={cn(
                                        "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                        !params.status
                                            ? "bg-[#023E8A] text-white border-[#023E8A]"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    Todos os Status
                                </span>
                            </Link>
                            {[
                                { key: "draft", label: "Rascunho" },
                                { key: "submitted", label: "Nova Submissão" },
                                { key: "pending_review", label: "Em Revisão" },
                                { key: "approved", label: "Aprovado" },
                                { key: "rejected", label: "Rejeitado" },
                            ].map(opt => (
                                <Link key={opt.key} href={`/dashboard/chef?tab=overview&status=${opt.key}${params.course ? `&course=${params.course}` : ''}${params.search ? `&search=${params.search}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}>
                                    <span
                                        className={cn(
                                            "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                            params.status === opt.key
                                                ? "bg-[#023E8A] text-white border-[#023E8A]"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        {opt.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Table */}
            <PlansTable
                initialPlans={plans}
                total={totalPlans}
                pageSize={pageSize}
                currentPage={currentPage}
            />
        </TabsContent>

        <TabsContent value="management" className="animate-in fade-in slide-in-from-right-4 duration-300">
            <MasterCourseList
                courses={masterCourses}
                teachers={teachers}
                organizations={allOrgs}
            />
        </TabsContent>

        <TabsContent value="semesters" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ImportarPlanilha />
            <SemesterManagement semesters={allSemesters} />
        </TabsContent>

        <TabsContent value="evaluation-settings" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <EvaluationSettings
                initialValue={defaultEvaluationSetting || "O(a) aluno(a) com frequência suficiente e média das notas entre três (3,0) e cinco vírgula cinco (5,5) terá direito a uma nova avaliação no final do semestre que versará sobre todo o conteúdo da disciplina, conforme o que dispõe o § 2º do Art. 70 e § 3º do Art. 71 da Resolução nº 17/Cun/97. Neste caso, a média final será calculada através da média aritmética simples entre a média das notas das avaliações feitas durante o semestre e a nota obtida na nova avaliação. A nota mínima de aprovação é seis (6,0).\n\nCaso o(a) aluno(a) não compareça a 75% da carga horária da disciplina estará automaticamente reprovado com nota 0,0(zero), independentemente da sua média nas avaliações individuais, conforme dispõem no Art. 69 § 2º da Resolução 017/CUn/97.\n\nOs(as) alunos(as) que eventualmente faltarem em alguma avaliação que foram perdidas por motivos extremos, mediante justificativa; dentro do prazo de 3 (três) dias úteis após a avaliação conforme o que dispõe o Art. 74, da Resolução 017/CUn/97, poderão solicitar na secretaria acadêmica do Centro de Engenharias da Mobilidade o pedido de segunda chamada. Após a análise do pedido e seu deferimento, os(as) alunos(as) poderão realizar a avaliação de segunda chamada na data, no local e horário definido no cronograma."}
                initialProgramaValue={settings.find(s => s.key === "DEFAULT_CRITERIOS_AVALIACAO_PROGRAMA")?.value || ""}
            />
        </TabsContent>

        <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <UserManagement members={allMembers} organizations={allOrgs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
