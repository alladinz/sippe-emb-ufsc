import { db } from "./index";
import * as schema from "./schema";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // 1. Seed Organizations (Bachelor Degrees)
  const degrees = [
    "Ciência e Tecnologia",
    "Engenharia Aeroespacial",
    "Engenharia Automotiva",
    "Engenharia Naval",
    "Engenharia de Transportes e Logística",
    "Engenharia Ferroviária e Metroviária",
    "Engenharia Mecatrônica",
    "Engenharia Civil de Infraestrutura",
  ];

  const orgs = [];
  for (const name of degrees) {
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    const [org] = await db.insert(schema.organization).values({
      id: uuidv4(),
      name,
      slug,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
        target: schema.organization.slug,
        set: { name }
    })
    .returning();
    orgs.push(org);
    console.log(`- Seeded organization: ${name}`);
  }

  // 2. Seed Users and Roles
  const usersData = [
    { name: "Professor Teste", email: "professor@teste.com", role: "professor", orgSlug: "bacharelado-em-ciencia-e-tecnologia" },
    { name: "Professor Automotiva", email: "professor-auto@teste.com", role: "professor", orgSlug: "engenharia-automotiva" },
    { name: "Coordenador Teste", email: "coordenador@teste.com", role: "coordenador", orgSlug: "engenharia-automotiva" },
    { name: "Chefe Teste", email: "chefe@teste.com", role: "chefe", orgSlug: "bacharelado-em-ciencia-e-tecnologia" },
    { name: "Secretaria Teste", email: "secretaria@teste.com", role: "secretario", orgSlug: "bacharelado-em-ciencia-e-tecnologia" },
  ];

  for (const u of usersData) {
    // Check if user exists
    const existingUser = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.email, u.email)
    });

    let userId = existingUser?.id;

    if (!existingUser) {
        userId = uuidv4();
        await db.insert(schema.user).values({
            id: userId,
            name: u.name,
            email: u.email,
            emailVerified: true,
            status: 'active',
            senhaHash: passwordHash, // New column
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Still keep account for backward compatibility if needed by Better Auth
        await db.insert(schema.account).values({
            id: uuidv4(),
            accountId: u.email,
            providerId: "credential",
            userId: userId,
            password: passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    } else {
        // Update existing user with the hash
        await db.update(schema.user)
            .set({ senhaHash: passwordHash, status: 'active' })
            .where(eq(schema.user.id, existingUser.id));
    }

    // Ensure membership exists
    if (u.orgSlug && userId) {
        const org = orgs.find(o => o.slug === u.orgSlug);
        if (org) {
            const existingMember = await db.query.member.findFirst({
                where: (members, { and, eq }) => and(
                    eq(members.userId, userId),
                    eq(members.organizationId, org.id)
                )
            });

            if (!existingMember) {
                await db.insert(schema.member).values({
                    id: uuidv4(),
                    organizationId: org.id,
                    userId: userId,
                    role: u.role,
                    createdAt: new Date(),
                });
            }
        }
    }

    console.log(`- Seeded user: ${u.email} (${u.role})`);
  }

  console.log("✅ Seeding complete!");
}

seed().catch((e) => {
  console.error("❌ Seeding failed:");
  console.error(e);
  process.exit(1);
});
