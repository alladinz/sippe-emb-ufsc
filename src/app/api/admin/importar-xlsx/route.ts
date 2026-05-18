import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { member, semesters } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { parseXLSXBuffer } from "@/services/xlsxParser";
import { validateRows } from "@/schemas/planilhaSchema";
import { importProfessoresEPlanos } from "@/services/professorPlanImportService";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
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
    const formData = await request.formData();
    const file = formData.get("planilha") as File;

    if (!file) {
      return new NextResponse("Nenhum arquivo enviado.", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { rows, missingColumns } = parseXLSXBuffer(buffer);

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: "Colunas obrigatórias não encontradas",
        missingColumns
      }, { status: 422 });
    }

    // 1. Get active semester
    const activeSemester = await db.query.semesters.findFirst({
      where: eq(semesters.ativo, true),
    });

    if (!activeSemester) {
      return new NextResponse("Nenhum semestre ativo encontrado. Configure um semestre antes de importar.", { status: 400 });
    }

    // 2. Validate rows
    const { valid, invalid } = validateRows(rows);

    if (valid.length === 0) {
      return NextResponse.json({ 
        error: "Nenhuma linha válida encontrada para importação.",
        invalidRows: invalid
      }, { status: 422 });
    }

    // 3. Run import
    const result = await importProfessoresEPlanos(valid, activeSemester.id, userMember.organizationId);

    // 4. Create notification if needed
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
    const errorMessage = error instanceof Error ? error.message : "Erro ao importar arquivo XLSX";
    console.error("Error in XLSX import:", errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}
