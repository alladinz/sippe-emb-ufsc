import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { programasEnsino } from "@/db/schema_programas";
import { eq, count, and } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = session.user as { papel?: string; id?: string };
    const isCoordenador = user.papel === "coordenador";
    const isChefe = user.papel === "chefe";

    const getCount = async (status: string, roleSpecific: boolean = false) => {
      const conditions = [eq(programasEnsino.status, status)];
      
      if (roleSpecific && !isCoordenador && !isChefe) {
        conditions.push(eq(programasEnsino.criadoPor, session.user.id));
      }

      const res = await db.select({ value: count() }).from(programasEnsino).where(and(...conditions));
      return res[0].value;
    };

    const draft = await getCount('draft', true);
    const submitted = await getCount('submitted');
    const approved = await getCount('approved');
    const archived = await getCount('archived');

    return NextResponse.json({
      total: draft + submitted + approved + archived,
      rascunhos: draft,
      submetidos: submitted,
      aprovados: approved,
      arquivados: archived
    });
  } catch (error) {
    console.error("Error fetching program stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
