import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { disciplinas } from "@/db/schema";
import { or, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let query = db.select().from(disciplinas);
    
    if (search) {
      query = query.where(
        or(
          sql`unaccent(${disciplinas.nome}) ilike unaccent(${`%${search}%`})`,
          sql`unaccent(${disciplinas.codigo}) ilike unaccent(${`%${search}%`})`
        )
      ) as unknown as typeof query;
    }
    
    const results = await query.limit(50);
    return NextResponse.json({ data: results });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
