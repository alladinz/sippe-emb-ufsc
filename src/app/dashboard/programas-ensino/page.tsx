import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { member } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProgramasEnsinoClient } from "./_components/ProgramasEnsinoClient";

export default async function ProgramasEnsinoPage() {
    const session = await auth.api.getSession();

    if (!session) {
        redirect("/login");
    }

    const memberships = await db.query.member.findMany({
        where: eq(member.userId, session.user.id),
        with: { organization: true }
    });

    const isComissao = memberships.some(m => m.role === "comissao");
    const isChef = memberships.some(m => m.role === "chefe" || m.organization?.name === "Chefia");
    const isReviewer = memberships.some(m => m.role === "coordenador");

    if (!isChef && !isReviewer && !isComissao) {
        redirect("/dashboard");
    }

    return (
        <ProgramasEnsinoClient isChef={isChef} isComissao={isComissao} />
    );
}
