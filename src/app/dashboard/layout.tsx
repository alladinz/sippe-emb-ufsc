import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { semesters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Calendar } from "lucide-react";
import { Sidebar } from "./_components/sidebar";
import { UserMenu } from "./_components/user-menu";
import { NotificationBell } from "./_components/notification-bell";
import { DynamicBreadcrumb } from "@/components/dashboard/dynamic-breadcrumb";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  
  // Fetch all memberships to determine global roles
  const memberships = await db.query.member.findMany({
      where: (m, { eq }) => eq(m.userId, user.id),
      with: {
          organization: true
      }
  });

  // Fetch active semester
  const activeSemesterRow = await db.query.semesters.findFirst({
    where: eq(semesters.ativo, true)
  });
  const activeSemester = activeSemesterRow?.name || "Nenhum";

  // Determine roles based on ALL memberships
  const roles = memberships.map(m => m.role);
  const isReviewer = roles.includes("coordenador") || roles.includes("chefe");
  const isChef = roles.includes("chefe");
  const isAdmin = roles.includes("secretario") || roles.includes("chefe");
  const isComissao = roles.includes("comissao");

  // For the header display, try to find an active one or just use the first
  let activeMember = null;
  try {
      activeMember = await auth.api.getActiveMember();
  } catch {
      // Ignore
  }

  if (!activeMember && memberships.length > 0) {
      activeMember = memberships[0];
  }

  const departmentName = isChef ? "Departamento" : (activeMember?.organization?.name || "Sem Departamento");

  const roleLabels: Record<string, string> = {
    professor: "Professor(a)",
    coordenador: "Coordenador(a)",
    chefe: "Chefe de Departamento",
    secretario: "Secretário(a) do Departamento",
    comissao: "Comissão",
  };

  // Use the highest priority role for the label
  const displayRole = roles.includes("chefe") ? "chefe" : 
                     roles.includes("coordenador") ? "coordenador" : 
                     roles.includes("secretario") ? "secretario" : 
                     roles.includes("comissao") ? "comissao" : "professor";

  const roleLabel = roleLabels[displayRole] || "Usuário";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        isReviewer={isReviewer} 
        isChef={isChef} 
        isAdmin={isAdmin}
        isComissao={isComissao}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-[#102E52]">
                {departmentName}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                Semestre {activeSemester}
              </span>
            </div>
            
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs bg-blue-50 text-[#023E8A] px-3 py-1 rounded-full font-bold border border-blue-100 ml-3">
              <Calendar className="w-3.5 h-3.5" />
              {activeSemester}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu user={user} roleLabel={roleLabel} roleId={displayRole} />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
          <DynamicBreadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
