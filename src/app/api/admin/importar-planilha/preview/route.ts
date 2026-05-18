import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { member, semesters, studyPlans, turmas, disciplinas as disciplinasTable, universityCourses } from "@/db/schema";
import { and, eq, or, inArray } from "drizzle-orm";
import { fetchSheetData } from "@/services/googleSheetsService";
import { parseSheetRows, getImportSummary } from "@/services/sheetsParser";
import { namesMatch } from "@/utils/nameUtils";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check role: only 'chefe' and 'coordenador'
  const userMember = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      or(eq(member.role, "chefe"), eq(member.role, "coordenador"))
    ),
  });

  if (!userMember) {
    return new NextResponse("Forbidden: Access restricted to Chefe or Coordenador", { status: 403 });
  }

  try {
    const rawRows = await fetchSheetData();
    const parsedRows = parseSheetRows(rawRows);
    const summary = getImportSummary(parsedRows);

    // Get active semester
    const activeSemester = await db.query.semesters.findFirst({
      where: eq(semesters.ativo, true),
    });

    let professoresNovos = 0;
    let planosPorCriar = 0;

    if (activeSemester) {
      const allUsers = await db.query.user.findMany();
      
      // 1. Resolve all codes first
      const allPotentialCodes = Array.from(new Set(parsedRows.flatMap(r => 
          r.disciplinaCodigo.split(/[/,]/).map(c => c.trim()).filter(Boolean)
      )));

      const masterRecords = await db.query.universityCourses.findMany({
          where: inArray(universityCourses.code, allPotentialCodes)
      });

      const resolvedCodeMap = new Map<string, string>();
      parsedRows.forEach(r => {
          const codes = r.disciplinaCodigo.split(/[/,]/).map(c => c.trim()).filter(Boolean);
          if (codes.length <= 1) {
              resolvedCodeMap.set(r.disciplinaCodigo, r.disciplinaCodigo);
          } else {
              const record2025 = masterRecords.find(m => codes.includes(m.code) && m.curriculum?.includes("2025"));
              resolvedCodeMap.set(r.disciplinaCodigo, record2025 ? record2025.code : codes[0]);
          }
      });

      // 2. Check professors
      summary.professores.forEach(pName => {
        if (!allUsers.some(u => namesMatch(u.name, pName))) {
          professoresNovos++;
        }
      });

      // 3. Check plans
      const allResolvedCodes = Array.from(new Set(resolvedCodeMap.values()));
      const existingDiscs = await db.query.disciplinasTable.findMany({
          where: inArray(disciplinasTable.codigo, allResolvedCodes)
      });

      const existingPlans = await db.query.studyPlans.findMany({
          where: eq(studyPlans.semestreId, activeSemester.id)
      });

      const existingTurmas = await db.query.turmas.findMany({
          where: eq(turmas.semestreId, activeSemester.id)
      });

      for (const row of parsedRows) {
        const resolvedCodigo = resolvedCodeMap.get(row.disciplinaCodigo) || row.disciplinaCodigo;
        const prof = allUsers.find(u => namesMatch(u.name, row.professorNome));
        const disc = existingDiscs.find(d => d.codigo === resolvedCodigo);
        
        let planExists = false;
        if (prof && disc) {
            const turma = existingTurmas.find(t => 
                t.disciplinaId === disc.id && 
                t.turma === row.turma
            );
            if (turma) {
                planExists = existingPlans.some(p => 
                    p.userId === prof.id && 
                    p.turmaId === turma.id
                );
            }
        }
        
        if (!planExists) {
            planosPorCriar++;
        }
      }
    }


    return NextResponse.json({
      totalLinhas: rawRows.length,
      linhasValidas: parsedRows.length,
      linhasIgnoradas: rawRows.length - parsedRows.length - 1, // -1 for header
      planosPorCriar,
      professoresNovos,
      disciplinas: summary.disciplinas,
    });
  } catch (error: any) {
    console.error("Error in sheets preview:", error.message);
    return new NextResponse(error.message || "Erro ao processar planilha", { status: 500 });
  }
}
