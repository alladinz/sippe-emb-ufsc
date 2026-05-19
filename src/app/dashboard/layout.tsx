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
  };

  // Use the highest priority role for the label
  const displayRole = roles.includes("chefe") ? "chefe" : 
                     roles.includes("coordenador") ? "coordenador" : 
                     roles.includes("secretario") ? "secretario" : "professor";

  const roleLabel = roleLabels[displayRole] || "Usuário";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        isReviewer={isReviewer} 
        isChef={isChef} 
        isAdmin={isAdmin} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-gray-800">
                {departmentName}
              </span>
              <span className="text-xs text-gray-400">
                Semestre {activeSemester}
              </span>
            </div>
            
            <span className="hidden md:inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium border border-blue-100 ml-4">
              <Calendar className="w-3 h-3" />
              {activeSemester}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu user={user} roleLabel={roleLabel} roleId={displayRole} />
          </div>
        </header>

        <main className="p-6 overflow-y-auto flex-1">
          <DynamicBreadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
