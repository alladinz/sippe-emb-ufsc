/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getHistorico } from "@/services/programaEnsinoService";

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const historico = await getHistorico(id);
    
    return NextResponse.json(historico);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
