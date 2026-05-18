import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans, organization, universityCourses, user, member, semesters, courses } from "@/db/schema";
import { eq, desc, and, ilike, or, inArray, sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  School, 
  Database, 
  Calendar, 
  Users 
} from "lucide-react";
import Link from "next/link";
import { PlansTable } from "./_components/plans-table";
import { MasterCourseList } from "./_components/master-course-list";
import { SemesterManagement } from "./_components/semester-management";
import { UserManagement } from "./_components/user-management";
import { ImportarPlanilha } from "@/components/ImportarPlanilha";
import { SearchInput } from "./_components/search-input";
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const params = await searchParams;
  const activeTab = params.tab || "overview";
  const currentPage = parseInt(params.page || "1");
  const pageSize = parseInt(params.limit || "20");
  const offset = (currentPage - 1) * pageSize;
  const searchTerm = params.search || "";

  // ... (verifyChef remains same)

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
              ilike(user.name, `%${searchTerm}%`),
              ilike(courses.code, `%${searchTerm}%`),
              ilike(courses.name, `%${searchTerm}%`),
              ilike(studyPlans.courseName, `%${searchTerm}%`)
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
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Painel do Chefe de Departamento
            </h1>
            <p className="text-slate-500">
            Monitoramento global e gerenciamento de atribuições.
            </p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full flex flex-col">
        <TabsList className="bg-white border p-1 h-12 shadow-sm rounded-lg mb-8 flex justify-start w-fit">
            <TabsTrigger 
                value="overview" 
                className="gap-2 px-6 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none transition-all"
            >
                <School className="w-4 h-4" />
                Visão Geral
            </TabsTrigger>
            <TabsTrigger 
                value="management" 
                className="gap-2 px-6 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none transition-all"
            >
                <Database className="w-4 h-4" />
                Gerenciamento de Disciplinas
            </TabsTrigger>
            <TabsTrigger 
                value="semesters" 
                className="gap-2 px-6 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none transition-all"
            >
                <Calendar className="w-4 h-4" />
                Configuração de Semestres
            </TabsTrigger>
            <TabsTrigger 
                value="users" 
                className="gap-2 px-6 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none transition-all"
            >
                <Users className="w-4 h-4" />
                Usuários
            </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Search and Filters Bar */}
            <div className="bg-white p-6 border rounded-xl shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <SearchInput placeholder="Buscar por professor ou disciplina..." />
                </div>

                <div className="space-y-4">
                    {/* Row 1: Course Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium w-10 flex-shrink-0">Curso</span>
                        <div className="flex gap-2 flex-wrap items-center">
                            <Link href={`/dashboard/chef?tab=overview${params.search ? `&search=${params.search}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}>
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "cursor-pointer border-none transition-all",
                                        !params.course ? "bg-gray-800 text-white hover:bg-gray-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                >
                                    Todos os Cursos
                                </Badge>
                            </Link>
                            {allOrgs.map(org => (
                                <Link key={org.id} href={`/dashboard/chef?tab=overview&course=${org.slug}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}>
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "cursor-pointer border-none transition-all",
                                            params.course === org.slug ? "bg-gray-800 text-white hover:bg-gray-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {org.name}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Row 2: Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium w-10 flex-shrink-0">Status</span>
                        <div className="flex gap-2 flex-wrap items-center">
                            <Link href={`/dashboard/chef?tab=overview${params.course ? `&course=${params.course}` : ''}${params.search ? `&search=${params.search}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}>
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "cursor-pointer border-none transition-all",
                                        !params.status ? "bg-gray-800 text-white hover:bg-gray-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                >
                                    Todos os Status
                                </Badge>
                            </Link>
                            {Object.entries({
                                draft: { label: "Rascunho", active: "bg-gray-600 text-white", inactive: "bg-gray-100 text-gray-600" },
                                submitted: { label: "Nova Submissão", active: "bg-yellow-500 text-white", inactive: "bg-yellow-100 text-yellow-700" },
                                pending_review: { label: "Em Revisão", active: "bg-blue-600 text-white", inactive: "bg-blue-100 text-blue-700" },
                                approved: { label: "Aprovado", active: "bg-green-600 text-white", inactive: "bg-green-100 text-green-700" },
                                rejected: { label: "Rejeitado", active: "bg-red-600 text-white", inactive: "bg-red-100 text-red-700" },
                            }).map(([key, config]) => (
                                <Link key={key} href={`/dashboard/chef?tab=overview&status=${key}${params.course ? `&course=${params.course}` : ''}${params.search ? `&search=${params.search}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}>
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "cursor-pointer border-none transition-all",
                                            params.status === key ? config.active : config.inactive
                                        )}
                                    >
                                        {config.label}
                                    </Badge>
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

        <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <UserManagement members={allMembers} organizations={allOrgs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
