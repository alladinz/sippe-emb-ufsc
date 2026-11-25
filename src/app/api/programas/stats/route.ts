import { NextResponse } from "next/server";
import { requireRoleSession } from "@/lib/auth/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { db } from "@/db";
import { programasEnsino } from "@/db/schema_programas";
import { eq, count, and } from "drizzle-orm";

export async function GET() {
  const authCheck = await requireRoleSession([
    "chefe",
    "coordenador",
    "comissao",
    "secretario",
  ]);
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const isCoordenador = hasAnyRole(authCheck.memberships, ["coordenador"]);
    const isChefe = hasAnyRole(authCheck.memberships, ["chefe"]);

    const getCount = async (status: string, roleSpecific: boolean = false) => {
      const conditions = [eq(programasEnsino.status, status)];

      if (roleSpecific && !isCoordenador && !isChefe) {
        conditions.push(eq(programasEnsino.criadoPor, authCheck.session.user.id));
      }

      const res = await db
        .select({ value: count() })
        .from(programasEnsino)
        .where(and(...conditions));
      return res[0].value;
    };

    const draft = await getCount("draft", true);
    const submitted = await getCount("submitted");
    const approved = await getCount("approved");
    const archived = await getCount("archived");

    return NextResponse.json({
      total: draft + submitted + approved + archived,
      rascunhos: draft,
      submetidos: submitted,
      aprovados: approved,
      arquivados: archived,
    });
  } catch (error) {
    console.error("Error fetching program stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
