/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { submitPrograma } from "@/services/programaEnsinoService";
import { submitProgramaSchema } from "@/schemas/programaEnsinoSchema";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();
    const result = submitProgramaSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
    }

    try {
      const user = session.user as { papel?: string; id: string };
      const updated = await submitPrograma(id, user.id, user.papel);
      return NextResponse.json(updated);
    } catch (err: any) {
      if (err.code === 'MISSING_FIELDS') {
        return NextResponse.json({
          error: err.message,
          fields: err.fields
        }, { status: 400 });
      }
      if (err.message.includes('draft') || err.message.includes('rascunho')) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      return NextResponse.json({ error: 'Erro ao submeter programa' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
