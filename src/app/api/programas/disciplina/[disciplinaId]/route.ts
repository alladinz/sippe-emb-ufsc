/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireRoleSession } from "@/lib/auth/auth";
import { isValidUuid } from "@/lib/auth/roles";
import { getProgramaByDisciplinaId } from "@/services/programaEnsinoService";

export async function GET(
  _request: Request,
  context: { params: Promise<{ disciplinaId: string }> }
) {
  try {
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

    const { disciplinaId } = await context.params;
    if (!isValidUuid(disciplinaId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const programa = await getProgramaByDisciplinaId(disciplinaId);
    return NextResponse.json(programa || null);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Erro interno do servidor"
            : error.message,
      },
      { status: 500 }
    );
  }
}
