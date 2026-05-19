import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq, and, ne, inArray, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planoAtualId = searchParams.get("planoAtualId");
    const disciplinaCode = searchParams.get("disciplinaId");

    const plans = await db.query.studyPlans.findMany({
      where: and(
        eq(studyPlans.userId, session.user.id),
        ne(studyPlans.id, planoAtualId || ""),
        inArray(studyPlans.status, ["submitted", "pending_review", "approved"])
      ),
      with: {
        courses: true,
      },
      orderBy: [desc(studyPlans.updatedAt)],
    });

    // Custom sorting: same discipline code first
    const sortedPlans = [...plans].sort((a, b) => {
      const aHasCode = a.courses?.some(c => c.code === disciplinaCode);
      const bHasCode = b.courses?.some(c => c.code === disciplinaCode);
      
      if (aHasCode && !bHasCode) return -1;
      if (!aHasCode && bHasCode) return 1;
      return 0;
    });

    const result = sortedPlans.map(p => ({
      id: p.id,
      status: p.status,
      updatedAt: p.updatedAt.toISOString(),
      semester: p.semester,
      disciplina_nome: p.courses?.[0]?.name || "Sem Disciplina",
      disciplina_codigo: p.courses?.[0]?.code || "-",
      // Copyable fields
      objectives: p.objectives,
      programContent: p.programContent,
      methodology: p.methodology,
      evaluation: p.evaluation,
      evaluationFormula: p.evaluationFormula,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching copiable plans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
