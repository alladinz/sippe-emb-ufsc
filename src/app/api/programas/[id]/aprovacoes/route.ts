import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProgramaAprovacoes } from "@/services/programaEnsinoService";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as { papel?: string; id: string };
    if (!['chefe', 'coordenador', 'comissao'].includes(user.papel || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    
    try {
      const aprovacoes = await getProgramaAprovacoes(id);
      return NextResponse.json(aprovacoes);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
