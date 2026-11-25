import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { member } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProgramaEnsinoEditorClient } from "./_components/ProgramaEnsinoEditorClient";
import { hasAnyRole, isValidUuid } from "@/lib/auth/roles";

export default async function ProgramaEnsinoEditorPage(props: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession();

    if (!session) {
        redirect("/login");
    }

    const params = await props.params;
    const id = params.id;

    if (!isValidUuid(id)) {
        notFound();
    }

    const memberships = await db.query.member.findMany({
        where: eq(member.userId, session.user.id),
        with: { organization: true }
    });

    if (!hasAnyRole(memberships, ["chefe", "comissao"])) {
        redirect("/dashboard/programas-ensino");
    }

    // Fetch default criteria for Programas de Ensino
    const setting = await db.query.systemSettings.findFirst({
        where: (settings, { eq }) => eq(settings.key, "DEFAULT_CRITERIOS_AVALIACAO_PROGRAMA")
    });
    const defaultCriterios = setting?.value || "";

    return <ProgramaEnsinoEditorClient id={id} defaultCriterios={defaultCriterios} />;
}
