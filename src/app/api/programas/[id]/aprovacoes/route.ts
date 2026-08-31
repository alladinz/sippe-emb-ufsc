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
    } catch (e: unknown) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar aprovações do programa', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
