/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireRoleSession } from "@/lib/auth/auth";
import { isValidUuid } from "@/lib/auth/roles";
import { reviewPrograma } from "@/services/programaEnsinoService";
import { reviewProgramaSchema } from "@/schemas/programaEnsinoSchema";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRoleSession(["coordenador", "chefe"]);
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

    const body = await request.json();
    const result = reviewProgramaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.format() },
        { status: 400 }
      );
    }

    try {
      const updated = await reviewPrograma(
        id,
        result.data.action,
        result.data.feedback,
        authCheck.session.user.id,
        result.data.curso
      );
      return NextResponse.json(updated);
    } catch (e: any) {
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
