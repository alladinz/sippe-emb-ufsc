import { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { programasEnsino } from "@/db/schema_programas";
import { eq, desc } from "drizzle-orm";


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
    <div className="space-y-12 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Revisão de Programas de Ensino
        </h1>
        <p className="text-slate-500 max-w-2xl">
          Analise e aprove os programas de ensino submetidos.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="h-8 w-1 bg-amber-500 rounded-full" />
                Novas Submissões
                <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    {programasSubmetidos.length}
                </span>
            </h2>
        </div>
        <SubmissionsTable initialData={programasSubmetidos} />
      </div>
    </div>
  );
}
