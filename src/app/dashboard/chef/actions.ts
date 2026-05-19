"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { universityCourses, studyPlans, courses, bibliography, member, semesters, organization, user, session, account, invitation, notifications } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

import { createNotification } from "@/lib/notifications";

interface RawBibliographyItem {
    authors?: string;
    details?: string;
    full?: string;
}

interface RawCourse {
    code?: string;
    name?: string;
    phase?: string | number;
    workload_hours?: string | number;
    description?: string;
    syllabus?: string;
    bibliography?: {
        basic?: (string | RawBibliographyItem)[];
        complementary?: (string | RawBibliographyItem)[];
    };
    basic_bibliography?: RawBibliographyItem[];
    complementary_bibliography?: RawBibliographyItem[];
}

async function verifyChef() {
    const session = await auth.api.getSession();

    if (!session) throw new Error("Não autenticado");

    const chefMembership = await db.query.member.findFirst({
        where: (m, { and, eq }) => and(
            eq(m.userId, session.user.id),
            eq(m.role, "chefe")
        )
    });

    if (!chefMembership) {
        throw new Error("Não autorizado: Apenas o Chefe de Departamento pode realizar esta ação");
    }

    return { session, chefMembership };
}

export async function importMasterCoursesAction(coursesList: RawCourse[], graduation: string) {
    await verifyChef();
    await processCoursesBatch(coursesList, graduation);
    revalidatePath("/dashboard/chef");
}

export async function syncMasterDataFolderAction() {
    await verifyChef();
    
    const gradMap: Record<string, string> = {
        "aero": "Engenharia Aeroespacial",
        "auto": "Engenharia Automotiva",
        "cientec": "Ciência e Tecnologia",
        "ferro": "Engenharia Ferroviária e Metroviária",
        "meca": "Engenharia Mecatrônica",
        "naval": "Engenharia Naval",
        "infra": "Engenharia Civil de Infraestrutura",
        "tlog": "Engenharia de Transportes e Logística"
    };

    const jsonDir = path.join(process.cwd(), "public", "json");
    if (!fs.existsSync(jsonDir)) throw new Error("Diretório /public/json não encontrado");

    const files = fs.readdirSync(jsonDir).filter(f => f.endsWith(".json"));
    
    for (const file of files) {
        const filePath = path.join(jsonDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);
        
        // Handle variations in JSON structure
        const coursesList = data.disciplines || data;
        
        // Extract year from filename (e.g. ppc_auto_2016.json -> 2016)
        const yearMatch = file.match(/_(\d{4})\.json$/);
        const year = yearMatch ? yearMatch[1] : "2016";

        // Extract slug from filename (e.g. ppc_aero_2016.json -> aero)
        const slug = file.replace("ppc_", "").replace(`_${year}.json`, "").replace(".json", "").toLowerCase();
        const graduationName = gradMap[slug] || slug.toUpperCase();
        
        await processCoursesBatch(coursesList, graduationName, year);
    }

    revalidatePath("/dashboard/chef");
}

async function processCoursesBatch(coursesList: RawCourse[], graduation: string, year: string = "2016") {
    for (const rawCourse of coursesList) {
        // Normalization
        let code = rawCourse.code?.trim();
        const name = rawCourse.name?.trim();
        
        if (!name) continue;

        // If code is missing (bug in JSON), try to find by Name
        if (!code) {
            const matchByName = await db.query.universityCourses.findFirst({
                where: (c, { sql }) => sql`LOWER(${c.name}) = LOWER(${name})`
            });
            if (matchByName) {
                code = matchByName.code;
            } else {
                // If still no code, we can't reliably identify it for assignment
                console.warn(`Skipping course without code: ${name}`);
                continue;
            }
        }

        // Clean phase string ("1ª" -> 1)
        const phase = typeof rawCourse.phase === 'string' 
            ? parseInt(rawCourse.phase.replace(/\D/g, "")) 
            : rawCourse.phase;
            
        // Clean workload ("72" -> 72)
        const workload = typeof rawCourse.workload_hours === 'string'
            ? parseInt(rawCourse.workload_hours)
            : rawCourse.workload_hours;

        // Normalize Bibliography (support both string arrays and object arrays)
        const normalizedBib = {
            basic: [] as { authors: string, details: string }[],
            complementary: [] as { authors: string, details: string }[]
        };

        if (rawCourse.bibliography && !Array.isArray(rawCourse.bibliography)) {
            normalizedBib.basic = (rawCourse.bibliography.basic || []).map((b) => typeof b === 'string' ? { authors: "", details: b } : { authors: b.authors || "", details: b.details || b.full || "" });
            normalizedBib.complementary = (rawCourse.bibliography.complementary || []).map((b) => typeof b === 'string' ? { authors: "", details: b } : { authors: b.authors || "", details: b.details || b.full || "" });
        } else {
            // Support new structure: basic_bibliography: [{authors: "", details: ""}]
            normalizedBib.basic = (rawCourse.basic_bibliography || []).map((b) => ({
                authors: b.authors || "",
                details: b.details || b.full || ""
            }));
            normalizedBib.complementary = (rawCourse.complementary_bibliography || []).map((b) => ({
                authors: b.authors || "",
                details: b.details || b.full || ""
            }));
        }

        // Deduplication & Upsert
        // We group by (code, name) as requested
        const existing = await db.query.universityCourses.findFirst({
            where: (c, { and, eq, sql }) => and(
                eq(c.code, code),
                sql`LOWER(${c.name}) = LOWER(${name})`
            )
        });

        if (existing) {
            // Update and append graduation if new
            const currentGrads = existing.graduation?.split(", ") || [];
            const newGrads = currentGrads.includes(graduation) 
                ? currentGrads 
                : [...currentGrads, graduation];

            const currentCurriculums = existing.curriculum?.split(", ") || [];
            const newCurriculums = currentCurriculums.includes(year)
                ? currentCurriculums
                : [...currentCurriculums, year];

            await db.update(universityCourses).set({
                phase: isNaN(phase) ? existing.phase : phase,
                workloadHours: isNaN(workload) ? existing.workloadHours : workload,
                syllabus: rawCourse.description || rawCourse.syllabus || existing.syllabus,
                bibliography: normalizedBib.basic.length > 0 ? normalizedBib : existing.bibliography,
                graduation: newGrads.sort().join(", "),
                curriculum: newCurriculums.sort().join(", "),
                updatedAt: new Date(),
            }).where(eq(universityCourses.id, existing.id));
        } else {
            await db.insert(universityCourses).values({
                code,
                name,
                curriculum: year,
                phase: isNaN(phase) ? null : phase,
                workloadHours: isNaN(workload) ? null : workload,
                syllabus: rawCourse.description || rawCourse.syllabus,
                bibliography: normalizedBib,
                graduation: graduation,
                updatedAt: new Date(),
            });
        }
    }
}

export async function updateUniversityCourseAction(id: string, data: Partial<RawCourse>) {
    await verifyChef();
    await db.update(universityCourses)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(universityCourses.id, id));
    revalidatePath("/dashboard/chef");
}

export async function deleteUniversityCourseAction(id: string) {
    await verifyChef();
    await db.delete(universityCourses).where(eq(universityCourses.id, id));
    revalidatePath("/dashboard/chef");
}

export async function clearMasterDatabaseAction() {
    await verifyChef();
    await db.delete(universityCourses);
    revalidatePath("/dashboard/chef");
}

export async function upsertSemesterAction(name: string, startDate: string, endDate: string) {
    await verifyChef();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Datas inválidas");
    }

    await db.insert(semesters).values({
        name,
        startDate: start,
        endDate: end,
        updatedAt: new Date(),
    })
    .onConflictDoUpdate({
        target: semesters.name,
        set: {
            startDate: start,
            endDate: end,
            updatedAt: new Date(),
        }
    });

    revalidatePath("/dashboard/chef");
}

export async function deleteSemesterAction(id: string) {
    await verifyChef();
    await db.delete(semesters).where(eq(semesters.id, id));
    revalidatePath("/dashboard/chef");
}

export async function addUserAction(email: string, name: string, role: string, organizationId?: string) {
    await verifyChef();

    // Ensure Departamento exists if role is chefe or secretario
    let targetOrgId = organizationId;
    if (role === "chefe" || role === "secretario") {
        let depto = await db.query.organization.findFirst({
            where: eq(organization.slug, "departamento")
        });

        if (!depto) {
            const newId = uuidv4();
            [depto] = await db.insert(organization).values({
                id: newId,
                name: "Departamento",
                slug: "departamento",
                createdAt: new Date(),
            }).returning();
        }
        targetOrgId = depto.id;
    }

    if (!targetOrgId && role === "coordenador") {
        throw new Error("Coordenadores devem estar vinculados a uma graduação.");
    }

    // Check if user exists
    let existingUser = await db.query.user.findFirst({
        where: eq(user.email, email)
    });

    if (!existingUser) {
        // Create user
        const newId = uuidv4();
        [existingUser] = await db.insert(user).values({
            id: newId,
            email,
            name,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
    }

    // Add member if we have an org
    if (targetOrgId) {
        await db.insert(member).values({
            id: uuidv4(),
            userId: existingUser.id,
            organizationId: targetOrgId,
            role,
            createdAt: new Date(),
        });
    } else {
        // If it's a professor without specific org, we might need a default 'CTJ' or similar,
        // but based on request "not necessary a graduation", we might skip member record 
        // or link to a generic one. Let's create a "Geral" org if none provided.
        let general = await db.query.organization.findFirst({
            where: eq(organization.slug, "geral")
        });
        if (!general) {
            const newId = uuidv4();
            [general] = await db.insert(organization).values({
                id: newId,
                name: "Geral",
                slug: "geral",
                createdAt: new Date(),
            }).returning();
        }
        await db.insert(member).values({
            id: uuidv4(),
            userId: existingUser.id,
            organizationId: general.id,
            role,
            createdAt: new Date(),
        });
    }

    revalidatePath("/dashboard/chef");
}

export async function updateUserAccessAction(memberId: string, role: string, organizationId?: string) {
    await verifyChef();
    
    const updateData: { role: string; organizationId?: string } = { role };
    if (organizationId) {
        updateData.organizationId = organizationId;
    }

    await db.update(member).set(updateData).where(eq(member.id, memberId));
    revalidatePath("/dashboard/chef");
}

export async function removeMemberAction(memberId: string) {
    await verifyChef();
    await db.delete(member).where(eq(member.id, memberId));
    revalidatePath("/dashboard/chef");
}

export async function deleteUserAccountAction(userId: string) {
    await verifyChef();
    
    // Check if user exists
    const existing = await db.query.user.findFirst({
        where: eq(user.id, userId)
    });
    if (!existing) return;

    await db.transaction(async (tx) => {
        // Study plans references user.
        await tx.delete(studyPlans).where(eq(studyPlans.userId, userId));
        
        await tx.delete(session).where(eq(session.userId, userId));
        await tx.delete(account).where(eq(account.userId, userId));
        await tx.delete(member).where(eq(member.userId, userId));
        await tx.delete(invitation).where(eq(invitation.inviterId, userId));
        
        try {
            await tx.delete(notifications).where(eq(notifications.userId, userId));
        } catch {
            // skip if error
        }

        // 2. Finally delete the user
        await tx.delete(user).where(eq(user.id, userId));
    });

    revalidatePath("/dashboard/chef");
}

export async function bulkDeleteUsersAction(userIds: string[]) {
    await verifyChef();
    if (!userIds || userIds.length === 0) return;

    await db.transaction(async (tx) => {
        await tx.delete(studyPlans).where(inArray(studyPlans.userId, userIds));
        await tx.delete(session).where(inArray(session.userId, userIds));
        await tx.delete(account).where(inArray(account.userId, userIds));
        await tx.delete(member).where(inArray(member.userId, userIds));
        await tx.delete(invitation).where(inArray(invitation.inviterId, userIds));
        try {
            await tx.delete(notifications).where(inArray(notifications.userId, userIds));
        } catch {}
        await tx.delete(user).where(inArray(user.id, userIds));
    });

    revalidatePath("/dashboard/chef");
}

export async function bulkRemoveMembersAction(memberIds: string[]) {
    await verifyChef();
    if (!memberIds || memberIds.length === 0) return;
    
    await db.delete(member).where(inArray(member.id, memberIds));
    revalidatePath("/dashboard/chef");
}

export async function assignTeacherToCourseAction(
    teacherId: string,
    courseId: string,
    semester: string,
    organizationIds: string[]
) {
    if (!organizationIds || organizationIds.length === 0) {
        throw new Error("Selecione ao menos um curso/graduação.");
    }

    const { session } = await verifyChef();

    // 1. Get metadata
    const metadata = await db.query.universityCourses.findFirst({
        where: eq(universityCourses.id, courseId)
    });

    if (!metadata) throw new Error("Metadados da disciplina não encontrados");

    // Fetch the selected organizations to get their names
    const selectedOrgs = await db.query.organization.findMany({
        where: inArray(organization.id, organizationIds)
    });

    // Graduation Mapping
    const GRADUATION_MAP: Record<string, string> = {
        "Ciência e Tecnologia": "601",
        "Engenharia Aeroespacial": "602",
        "Engenharia Automotiva": "603",
        "Engenharia Ferroviária e Metroviária": "604",
        "Engenharia Mecatrônica": "605",
        "Engenharia Naval": "606",
        "Engenharia Civil de Infraestrutura": "607",
        "Engenharia de Transportes e Logística": "608",
        "Engenharia de Transporte e Logística": "608",
    };

    // Calculate Class Identifier and Course Name from SELECTED organizations
    const grads = selectedOrgs.map(o => o.name);
    const codes = grads.map(g => GRADUATION_MAP[g]).filter(Boolean);
    const phaseStr = metadata.phase ? metadata.phase.toString().padStart(2, '0') : "00";

    // Automation for TURMA (classIdentifier) and Curso (courseName)
    const automatedClassIdentifier = codes.map(code => `${phaseStr}${code}`).join("/");
    const automatedCourseName = grads.join("; ");

    // Process Prerequisites (Fetch names for codes)

    let formattedPrerequisites = "";
    if (metadata.prerequisites && Array.isArray(metadata.prerequisites) && (metadata.prerequisites as string[]).length > 0) {
        const prereqCodes = metadata.prerequisites as string[];
        const prereqMetadata = await db.query.universityCourses.findMany({
            where: inArray(universityCourses.code, prereqCodes)
        });
        
        formattedPrerequisites = prereqCodes.map(code => {
            const m = prereqMetadata.find(p => p.code === code);
            return m ? `${code} - ${m.name}` : code;
        }).join("; ");
    }

    // 2. Create Study Plan
    const [newPlan] = await db.insert(studyPlans).values({
        userId: teacherId,
        organizationId: organizationIds[0],
        status: "draft",
        semester: semester,
        courseName: automatedCourseName || metadata.graduation,
        syllabus: metadata.syllabus,
        prerequisites: formattedPrerequisites,
        campus: "Campus de Joinville",
        center: "Centro Tecnológico de Joinville",
        universityAcronym: "UFSC",
        finalEvaluationRules: `O(a) aluno(a) com **frequência suficiente** e **média das notas entre três (3,0) e cinco vírgula cinco (5,5)** terá direito a uma **nova avaliação** no final do semestre que versará sobre todo o conteúdo da disciplina, conforme o que dispõe o **§ 2º do Art. 70 e § 3º do Art. 71 da Resolução nº 17/Cun/97**. Neste caso, a **média final** será calculada através da **média aritmética simples** entre a média das notas das avaliações feitas durante o semestre e a nota obtida na nova avaliação. A **nota mínima de aprovação é seis (6,0)**.

Caso o(a) aluno(a) **não compareça a 75% da carga horária** da disciplina estará **automaticamente reprovado com nota 0,0(zero)**, independentemente da sua média nas avaliações individuais, conforme dispõem no **Art. 69 § 2º da Resolução 017/CUn/97**.

Os(as) alunos(as) que eventualmente faltarem em alguma avaliação que foram perdidas por motivos extremos, mediante justificativa; dentro do prazo de **3 (três) dias úteis** após a avaliação conforme o que dispõe o **Art. 74, da Resolução 017/CUn/97**, poderão solicitar na secretaria acadêmica do Centro de Engenharias da Mobilidade o pedido de **segunda chamada**. Após a análise do pedido e seu deferimento, os(as) alunos(as) poderão realizar a avaliação de segunda chamada na data, no local e horário definido no cronograma.`,
    }).returning();

    // 3. Add Course Junction
    const creditsValue = metadata.workloadHours ? Math.floor(metadata.workloadHours / 18) : null;

    await db.insert(courses).values({
        studyPlanId: newPlan.id,
        code: metadata.code,
        name: metadata.name,
        workload: metadata.workloadHours,
        classType: "Teórica", // Default
        credits: creditsValue,
        classIdentifier: automatedClassIdentifier,
    });

    // 4. Add Bibliography
    const bib = metadata.bibliography as { basic: RawBibliographyItem[], complementary: RawBibliographyItem[] };
    
    const insertBibItems = async (items: (string | RawBibliographyItem)[], type: "basic" | "complementary") => {
        if (!items || !Array.isArray(items)) return;
        
        for (const item of items) {
            let fullReference = "";

            if (typeof item === 'object' && item !== null) {
                // Combine authors and details into a single string
                const authors = (item.authors || "").trim();
                const details = (item.details || item.full || "").trim();
                
                if (authors && details) {
                    fullReference = `${authors}. ${details}`;
                } else {
                    fullReference = authors || details;
                }
            } else if (typeof item === 'string') {
                fullReference = item;
            }

            if (!fullReference) continue;

            await db.insert(bibliography).values({
                studyPlanId: newPlan.id,
                type,
                author: "Referência", // Use a placeholder since field is required
                title: fullReference, // Store the full string here
                year: null,
                publisher: null,
                isbn: null
            });
        }
    };

    await insertBibItems(bib.basic, "basic");
    await insertBibItems(bib.complementary, "complementary");

    // Create notification for the professor
    await createNotification({
        userId: teacherId,
        type: 'novo_plano',
        title: 'Novo plano de ensino para preencher',
        message: `${session.user.name} criou o rascunho de plano para ${metadata.code} - ${metadata.name}`,
        planId: newPlan.id
    });

    revalidatePath("/dashboard/chef");
    revalidatePath("/dashboard/study-plans");
}

export async function toggleActiveSemesterAction(id: string) {
    await verifyChef();
    
    // Set all to false
    await db.update(semesters).set({ ativo: false });
    
    // Set selected to true
    await db.update(semesters).set({ ativo: true }).where(eq(semesters.id, id));
    
    revalidatePath("/dashboard/chef");
}
