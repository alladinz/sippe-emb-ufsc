/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireRoleSession } from "@/lib/auth/auth";
import { isValidUuid } from "@/lib/auth/roles";
import { getHistorico } from "@/services/programaEnsinoService";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const historico = await getHistorico(id);
    return NextResponse.json(historico);
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
