/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireRoleSession } from "@/lib/auth/auth";
import { listProgramas, createPrograma } from "@/services/programaEnsinoService";
import { createProgramaSchema } from "@/schemas/programaEnsinoSchema";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await listProgramas({ status, search, page, limit });
    return NextResponse.json({ ...result, page, limit });
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

export async function POST(request: Request) {
  try {
    const authCheck = await requireRoleSession(["chefe", "comissao"]);
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const result = createProgramaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.format() },
        { status: 400 }
      );
    }

    const { disciplina_id } = result.data;

    try {
      const programa = await createPrograma(
        disciplina_id,
        authCheck.session.user.id
      );
      return NextResponse.json(programa, { status: 201 });
    } catch (e: any) {
      if (e.message.includes("already exists")) {
        return NextResponse.json({ error: e.message }, { status: 409 });
      }
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
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
