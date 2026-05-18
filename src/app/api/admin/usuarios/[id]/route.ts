import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, member } from "@/db/schema";
import { and, eq, or, ne } from "drizzle-orm";
import { fetchSheetData } from "@/services/googleSheetsService";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check role: only 'chefe' and 'coordenador'
  const userMember = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      or(eq(member.role, "chefe"), eq(member.role, "coordenador"))
    ),
  });

  if (!userMember) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const { email, status } = await request.json();

  try {
    // Check if email already exists
    if (email) {
        const existing = await db.query.user.findFirst({
            where: and(eq(user.email, email), ne(user.id, id))
        });
        if (existing) {
            return new NextResponse("Este e-mail já está cadastrado no sistema.", { status: 400 });
        }
    }

    await db.update(user)
      .set({ 
        email, 
        status: status || 'active',
        updatedAt: new Date()
      })
      .where(eq(user.id, id));

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
