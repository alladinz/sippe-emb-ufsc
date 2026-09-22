import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { member } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProgramaEnsinoEditorClient } from "./_components/ProgramaEnsinoEditorClient";

export default async function ProgramaEnsinoEditorPage(props: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession();

    if (!session) {
        redirect("/login");
    }

    const memberships = await db.query.member.findMany({
        where: eq(member.userId, session.user.id),
        with: { organization: true }
    });

    const isChef = memberships.some(m => m.role === "chefe" || m.organization?.name === "Chefia");
    const isComissao = memberships.some(m => m.role === "comissao");

    if (!isChef && !isComissao) {
        redirect("/dashboard/programas-ensino");
    }

    const params = await props.params;
    const id = params.id;

    // Fetch default criteria for Programas de Ensino
    const setting = await db.query.systemSettings.findFirst({
        where: (settings, { eq }) => eq(settings.key, "DEFAULT_CRITERIOS_AVALIACAO_PROGRAMA")
    });
    const defaultCriterios = setting?.value || "";

    return <ProgramaEnsinoEditorClient id={id} defaultCriterios={defaultCriterios} />;
}
