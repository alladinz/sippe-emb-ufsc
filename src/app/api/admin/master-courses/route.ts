import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { universityCourses, member } from "@/db/schema";
import { and, eq, or, ilike, sql, desc, asc } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check role: only 'chefe'
  const userMember = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      eq(member.role, "chefe")
    ),
  });

  if (!userMember) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const phase = searchParams.get("phase") || "all";
  const graduation = searchParams.get("graduation") || "all";
  const curriculum = searchParams.get("curriculum") || "all";
  
  const offset = (page - 1) * limit;

  try {
    // Build where clause
    const conditions = [];
    
    if (search) {
        conditions.push(or(
            ilike(universityCourses.code, `%${search}%`),
            ilike(universityCourses.name, `%${search}%`)
        ));
    }
    
    if (phase !== "all") {
        conditions.push(eq(universityCourses.phase, parseInt(phase)));
    }
    
    if (graduation !== "all") {
        conditions.push(ilike(universityCourses.graduation, `%${graduation}%`));
    }

    if (curriculum !== "all") {
        conditions.push(ilike(universityCourses.curriculum, `%${curriculum}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const allMatching = await db.select({ count: sql`count(*)` })
        .from(universityCourses)
        .where(whereClause);
    
    const total = Number(allMatching[0].count);

    const courses = await db.query.universityCourses.findMany({
      where: whereClause,
      orderBy: [asc(universityCourses.code)],
      limit: limit,
      offset: offset,
    });

    return NextResponse.json({
        courses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error.message, { status: 500 });
  }
}
