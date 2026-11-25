/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireRoleSession } from "@/lib/auth/auth";
import { canAccessProgramaView, isValidUuid } from "@/lib/auth/roles";
import {
  getProgramaById,
  updatePrograma,
  deletePrograma,
} from "@/services/programaEnsinoService";
import { updateProgramaSchema } from "@/schemas/programaEnsinoSchema";

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

    const programa = await getProgramaById(id);
    if (!programa) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!canAccessProgramaView(authCheck.memberships, programa.status)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(programa);
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRoleSession(["chefe", "comissao"]);
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
    const result = updateProgramaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.format() },
        { status: 400 }
      );
    }

    try {
      const updated = await updatePrograma(
        id,
        result.data,
        authCheck.session.user.id,
        authCheck.session.user.papel
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRoleSession(["chefe", "comissao"]);
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
      await deletePrograma(id);
      return NextResponse.json({ success: true });
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
