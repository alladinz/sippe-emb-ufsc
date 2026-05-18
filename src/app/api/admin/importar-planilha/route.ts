import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { member } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { fetchSheetData } from "@/services/googleSheetsService";
import { parseSheetRows } from "@/services/sheetsParser";
import { importDisciplinasFromRows } from "@/services/disciplinasImportService";

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
    const rawRows = await fetchSheetData();
    const parsedRows = parseSheetRows(rawRows);
    
    const summary = await importDisciplinasFromRows(parsedRows);

    // Update last import timestamp on success
    lastImportMap.set(session.user.id, now);

    return NextResponse.json(summary);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao importar dados da planilha";
    console.error("Error in sheets import:", errorMessage);
    
    // Determine status code based on error message if possible, otherwise 500
    let status = 500;
    if (errorMessage.includes("Nenhum semestre ativo")) status = 400;
    
    return new NextResponse(errorMessage, { status });
  }
}
