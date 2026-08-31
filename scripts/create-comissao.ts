import { db } from "../src/db";
import { user, member, organization } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

async function main() {
    const email = "comissao@teste.com";
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await db.query.user.findFirst({
        where: eq(user.email, email)
    });

    let userId = existingUser?.id;

    if (!existingUser) {
        userId = uuidv4();
        await db.insert(user).values({
            id: userId,
            name: "Comissão de Ensino",
            email,
            senhaHash: hashedPassword,
            emailVerified: true
        });
        console.log(`User created: ${email}`);
    } else {
        await db.update(user).set({ senhaHash: hashedPassword }).where(eq(user.id, userId!));
        console.log(`User updated: ${email}`);
    }

    // Try to find an organization (Chefia or any)
    let orgId = null;
    const allOrgs = await db.query.organization.findMany();
    if (allOrgs.length > 0) {
        orgId = allOrgs[0].id;
    }

    if (orgId) {
        const existingMember = await db.query.member.findFirst({
            where: (m, { and, eq }) => and(eq(m.userId, userId!), eq(m.organizationId, orgId!))
        });

        if (!existingMember) {
            await db.insert(member).values({
                id: uuidv4(),
                userId: userId!,
                organizationId: orgId,
                role: "comissao",
                createdAt: new Date()
            });
            console.log(`Member added for org ${orgId}`);
        } else {
            await db.update(member).set({ role: "comissao" }).where(eq(member.id, existingMember.id));
            console.log(`Member updated for org ${orgId}`);
        }
    } else {
        // Create an organization if none exists
        orgId = uuidv4();
        await db.insert(organization).values({
            id: orgId,
            name: "Chefia",
            slug: "chefia",
            createdAt: new Date()
        });
        await db.insert(member).values({
            id: uuidv4(),
            userId: userId!,
            organizationId: orgId,
            role: "comissao",
            createdAt: new Date()
        });
        console.log(`Created org and member added for org ${orgId}`);
    }

    console.log("Done.");
    process.exit(0);
}

main().catch(console.error);
