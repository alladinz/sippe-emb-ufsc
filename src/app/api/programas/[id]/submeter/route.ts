/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { submitPrograma } from "@/services/programaEnsinoService";
import { submitProgramaSchema } from "@/schemas/programaEnsinoSchema";

export async function POST(request: Request, context: { params: { id: string } }) {
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
      const updated = await submitPrograma(id, result.data.curso_aprovacao, session.user.id);
      return NextResponse.json(updated);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
