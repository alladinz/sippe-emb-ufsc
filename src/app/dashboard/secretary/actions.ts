"use server";

import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error("Não autenticado");

    const adminMembership = await db.query.member.findFirst({
        where: (m, { and, or, eq }) => and(
            eq(m.userId, session.user.id),
            or(eq(m.role, "secretario"), eq(m.role, "chefe"))
        )
    });

    if (!adminMembership) throw new Error("Acesso negado");
    return adminMembership;
}

export async function archivePlanAction(id: string) {
    await verifyAdmin();
    await db.update(studyPlans)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(studyPlans.id, id));
    revalidatePath("/dashboard/secretary");
}

export async function bulkDeletePlansAction(ids: string[]) {
    const admin = await verifyAdmin();
    if (admin.role !== "chefe") throw new Error("Apenas o chefe de departamento pode excluir registros permanentemente.");
    
    if (!ids || ids.length === 0) return;

    await db.delete(studyPlans).where(inArray(studyPlans.id, ids));
    
    revalidatePath("/dashboard/secretary");
}
