/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProgramaByDisciplinaId } from "@/services/programaEnsinoService";

export async function GET(request: Request, context: { params: { disciplinaId: string } }) {
  try {
    const session = await auth.api.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { disciplinaId } = await context.params;
    const programa = await getProgramaByDisciplinaId(disciplinaId);
    
    // Returns null if not found
    return NextResponse.json(programa || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
