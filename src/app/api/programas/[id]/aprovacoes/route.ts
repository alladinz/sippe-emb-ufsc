import { NextResponse } from "next/server";
import { requireRoleSession } from "@/lib/auth/auth";
import { isValidUuid } from "@/lib/auth/roles";
import { getProgramaAprovacoes } from "@/services/programaEnsinoService";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRoleSession([
      "chefe",
      "coordenador",
      "comissao",
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

    try {
      const aprovacoes = await getProgramaAprovacoes(id);
      return NextResponse.json(aprovacoes);
    } catch (e: unknown) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Erro desconhecido" },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Erro ao buscar aprovações do programa", { error });
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Erro interno do servidor"
            : error instanceof Error
            ? error.message
            : "Erro interno",
      },
      { status: 500 }
    );
  }
}
