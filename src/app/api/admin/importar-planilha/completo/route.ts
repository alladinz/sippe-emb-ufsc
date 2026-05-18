import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { member, semesters } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { fetchSheetData } from "@/services/googleSheetsService";
import { parseSheetRows } from "@/services/sheetsParser";
import { validateRows } from "@/schemas/planilhaSchema";
import { importProfessoresEPlanos } from "@/services/professorPlanImportService";
import { createNotification } from "@/lib/notifications";

// In-memory map for rate limiting (cooldown)
const lastImportMap = new Map<string, number>();
const COOLDOWN_MS = 30000; // 30 seconds

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Rate limiting check
  const now = Date.now();
  const lastImport = lastImportMap.get(session.user.id) || 0;
  if (now - lastImport < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - lastImport)) / 1000);
    return new NextResponse(`Aguarde ${remaining} segundos antes de tentar importar novamente.`, { status: 429 });
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
    // 1. Get active semester
    const activeSemester = await db.query.semesters.findFirst({
      where: eq(semesters.ativo, true),
    });

    if (!activeSemester) {
      return new NextResponse("Nenhum semestre ativo encontrado. Configure um semestre antes de importar.", { status: 400 });
    }

    // 2. Fetch and parse data
    const rawRows = await fetchSheetData();
    const parsedRows = parseSheetRows(rawRows);
    
    // 3. Validate rows
    const { valid, invalid } = validateRows(parsedRows);

    if (valid.length === 0) {
      return NextResponse.json({ 
        error: "Nenhuma linha válida encontrada para importação.",
        invalidReport: invalid
      }, { status: 422 });
    }

    // 4. Run import within transaction
    const result = await importProfessoresEPlanos(valid, activeSemester.id);

    // 5. Update last import timestamp
    lastImportMap.set(session.user.id, now);

    // 6. Create notification for the chief if there are pending emails
    if (result.pendentesEmail.length > 0) {
        await createNotification({
            userId: session.user.id,
            type: 'professores_pendentes_email',
            title: `${result.pendentesEmail.length} professores aguardam cadastro de e-mail`,
            message: 'Acesse Gestão de Usuários para adicionar os e-mails dos novos professores importados.'
        });
    }

    return NextResponse.json({
        ...result,
        validationReport: { invalid }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao importar dados da planilha";
    console.error("Error in full sheets import:", errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}
