import { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { programasEnsino } from "@/db/schema_programas";
import { eq, desc } from "drizzle-orm";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import SubmissionsTable from "@/components/programas/SubmissionsTable";

export const metadata: Metadata = {
  title: "Revisão de Programas de Ensino - SIPPE",
  description: "Página de revisão de programas de ensino submetidos.",
};

export default async function RevisaoProgramasPage() {
  const session = await auth.api.getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Only allow coordenador or chefe
  const userRole = (session.user as { papel?: string }).papel;
  if (userRole !== "coordenador" && userRole !== "chefe") {
    redirect("/dashboard");
  }

  const statusFilter = userRole === "chefe" ? "pending_chefe" : "submitted";

  // Fetch submitted programs
  const programasSubmetidos = await db.select()
    .from(programasEnsino)
    .where(eq(programasEnsino.status, statusFilter))
    .orderBy(desc(programasEnsino.submetidoEm));

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="flex-none bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Breadcrumb className="mb-4 sm:mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Revisão de Programas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Revisão de Programas</h1>
              <p className="mt-1 text-sm sm:text-base text-slate-500">
                Analise e aprove os programas de ensino submetidos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <SubmissionsTable initialData={programasSubmetidos} />
        </div>
      </div>
    </div>
  );
}
