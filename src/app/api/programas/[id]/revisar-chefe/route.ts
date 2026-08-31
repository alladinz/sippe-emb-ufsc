import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { reviewByChefe } from "@/services/programaEnsinoService";
import { reviewChefeProgramaSchema } from "@/schemas/programaEnsinoSchema";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as { papel?: string; id: string };
    if (user.papel !== 'chefe') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const result = reviewChefeProgramaSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
    }

    try {
      const updated = await reviewByChefe(id, result.data.action, result.data.feedback, user.id);
      return NextResponse.json(updated);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
