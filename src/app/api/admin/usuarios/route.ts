import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { user, member } from "@/db/schema";
import { and, eq, or, ilike } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession();

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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const countOnly = searchParams.get("count") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const whereClause = and(
    status ? eq(user.status, status) : undefined,
    search ? or(
        ilike(user.name, `%${search}%`),
        ilike(user.email, `%${search}%`)
    ) : undefined
  );

  try {
    if (countOnly) {
      const result = await db.query.user.findMany({
        where: whereClause,
      });
      return NextResponse.json({ count: result.length });
    }

    // Get total count for pagination metadata
    const allMatching = await db.query.user.findMany({
        where: whereClause,
    });
    const total = allMatching.length;

    const usuarios = await db.query.user.findMany({
      where: whereClause,
      orderBy: [user.name],
      limit: limit,
      offset: offset,
      with: {
          members: {
              with: {
                  organization: true
              }
          }
      }
    });

    return NextResponse.json({
        usuarios,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar usuários";
    return new NextResponse(errorMessage, { status: 500 });
  }
}
