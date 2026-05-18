import { NextResponse } from "next/server";
import { db } from "@/db";
import { semesters } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const activeSemester = await db.query.semesters.findFirst({
      where: eq(semesters.ativo, true),
    });

    if (!activeSemester) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      semestre: activeSemester.name,
      dataInicio: activeSemester.startDate.toISOString().split("T")[0],
      dataFim: activeSemester.endDate.toISOString().split("T")[0],
      dataLimiteSubmissao: activeSemester.dataLimiteSubmissao 
        ? activeSemester.dataLimiteSubmissao.toISOString().split("T")[0]
        : activeSemester.endDate.toISOString().split("T")[0] // Fallback se não houver data limite
    });
  } catch (error) {
    console.error("Error fetching active semester:", error);
    // Return null on error to let frontend handle it gracefully as instructed
    return NextResponse.json(null);
  }
}
