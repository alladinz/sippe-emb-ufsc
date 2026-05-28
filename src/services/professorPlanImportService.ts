import { db } from "@/db";
import { user, member, disciplinas, turmas, studyPlans, organization, semesters, universityCourses, courses, bibliography } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { namesMatch } from "../utils/nameUtils";
import { DisciplinaRow } from "./sheetsParser";
import { v4 as uuidv4 } from "uuid";

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

/**
 * Resolves a course name from either a name or a code (e.g. "608" -> "Engenharia de Transportes e Logística")
 */
function resolveCourseName(input: string): string {
    if (!input) return "Geral";
    const trimmed = input.trim();
    // If it's already a known name, return it
    if (GRADUATION_MAP[trimmed]) return trimmed;
    
    // If it's a code, find the first matching name
    const nameByCode = Object.keys(GRADUATION_MAP).find(name => GRADUATION_MAP[name] === trimmed);
    return nameByCode || trimmed;
}

/**
 * Resolves a course code from either a name or a code (e.g. "Engenharia Naval" -> "606")
 */
function resolveCourseCode(input: string): string {
    if (!input) return "000";
    const trimmed = input.trim();
    if (GRADUATION_MAP[trimmed]) return GRADUATION_MAP[trimmed];
    if (Object.values(GRADUATION_MAP).includes(trimmed)) return trimmed;
    return "000";
}

export interface ImportResult {
  totalLinhasLidas:      number;
  totalLinhasValidas:    number;
  totalLinhasIgnoradas:  number;
  professoresNovos:      number;
  professoresExistentes: number;
  disciplinasCriadas:    number;
  disciplinasAtualizadas:number;
  turmasCriadas:         number;
  turmasAtualizadas:     number;
  planosCriados:         number;
  planosJaExistentes:    number;
  pendentesEmail:        { 
    nome: string; 
    turma: string; 
    disciplina: string;
    codigo: string;
  }[];
  erros: { 
    row: number; 
    professor: string;
    disciplina: string;
    turma: string;
    message: string; 
  }[];
}

export async function importProfessoresEPlanos(
  rows: DisciplinaRow[],
  semestreId: string
): Promise<ImportResult> {

  const result: ImportResult = {
    totalLinhasLidas: rows.length, // Already filtered in parser? No, rows is usually only valid ones.
    totalLinhasValidas: rows.length,
    totalLinhasIgnoradas: 0, 
    professoresNovos: 0,
    professoresExistentes: 0,
    disciplinasCriadas: 0,
    disciplinasAtualizadas: 0,
    turmasCriadas:         0,
    turmasAtualizadas:     0,
    planosCriados:       0,
    planosJaExistentes:  0,
    pendentesEmail: [],
    erros: []
  };

  if (!semestreId) {
    throw new Error("ID de semestre não fornecido.");
  }

  await db.transaction(async (tx) => {
    let geralOrg = await tx.query.organization.findFirst({
        where: eq(organization.slug, 'geral')
    });

    if (!geralOrg) {
        const geralId = uuidv4();
        [geralOrg] = await tx.insert(organization).values({
            id: geralId,
            name: "Geral",
            slug: "geral",
            createdAt: new Date(),
        }).returning();
    }

    const targetOrgId = geralOrg.id;
    const allOrgs = await tx.query.organization.findMany();

    const activeSem = await tx.query.semesters.findFirst({
        where: eq(semesters.id, semestreId)
    });
    const semesterName = activeSem?.name || "2026.1";

    const allUsers = await tx.query.user.findMany();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;

      try {
        const fullCourseName = resolveCourseName(row.curso);
        const fullCourseCode = resolveCourseCode(row.curso);

        // --- STEP 0: Resolve Discipline Code (Handle "CODE1/CODE2") ---
        const codes = row.disciplinaCodigo.split(/[/,]/).map(c => c.trim()).filter(Boolean);
        let resolvedCodigo = row.disciplinaCodigo;

        if (codes.length > 1) {
            // Find in master database to see which one is PPC 2025
            const masterRecords = await tx.query.universityCourses.findMany({
                where: inArray(universityCourses.code, codes)
            });
            const record2025 = masterRecords.find(m => m.curriculum?.includes("2025"));
            resolvedCodigo = record2025 ? record2025.code : codes[0];
        }

        // --- STEP A: Find or create professor ---
        const names = row.professorNome.split(/[/,]/).map(n => n.trim()).filter(Boolean);
        const rawName = names[0] || 'Não Informado';

        const existingProf = allUsers.find(u => namesMatch(u.name, rawName));
        let professorId: string;

        if (existingProf) {
          professorId = existingProf.id;
          result.professoresExistentes++;

          const existingMember = await tx.query.member.findFirst({
            where: and(
              eq(member.userId, professorId),
              eq(member.organizationId, targetOrgId)
            )
          });

          if (!existingMember) {
            await tx.insert(member).values({
              id: uuidv4(),
              userId: professorId,
              organizationId: targetOrgId,
              role: 'professor',
              createdAt: new Date(),
            });
          }
        } else {
          professorId = uuidv4();
          const [newProf] = await tx.insert(user).values({
            id: professorId,
            name: rawName,
            email: null,
            emailVerified: false,
            status: 'pending_email',
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();

          allUsers.push(newProf);

          await tx.insert(member).values({
            id: uuidv4(),
            userId: professorId,
            organizationId: targetOrgId,
            role: 'professor',
            createdAt: new Date(),
          });

          result.professoresNovos++;
          result.pendentesEmail.push({
            nome: rawName,
            turma: row.turma,
            disciplina: row.disciplinaNome,
            codigo: resolvedCodigo
          });
        }

        // --- STEP B: Upsert disciplina ---
        const existingDisc = await tx.query.disciplinas.findFirst({
          where: eq(disciplinas.codigo, resolvedCodigo)
        });

        let disciplinaId: string;

        if (existingDisc) {
          disciplinaId = existingDisc.id;
          await tx.update(disciplinas)
            .set({
              nome: row.disciplinaNome,
              curso: fullCourseName,
              creditosTeorico: row.creditosTeorico,
              creditosPratico: row.creditosPratico,
              ambienteTeorico: row.ambienteTeorico,
              ambientePratico: row.ambientePratico,
              formato: row.formato,
              updatedAt: new Date(),
            })
            .where(eq(disciplinas.id, disciplinaId));
          result.disciplinasAtualizadas++;
        } else {
          disciplinaId = uuidv4();
          await tx.insert(disciplinas).values({
            id: disciplinaId,
            codigo: resolvedCodigo,
            nome: row.disciplinaNome,
            curso: fullCourseName,
            creditosTeorico: row.creditosTeorico,
            creditosPratico: row.creditosPratico,
            ambienteTeorico: row.ambienteTeorico,
            ambientePratico: row.ambientePratico,
            formato: row.formato,
            fonte: 'sheets',
            importadoEm: new Date(),
          });
          result.disciplinasCriadas++;
        }

        // --- STEP C: Upsert turma ---
        const [turmaUpserted] = await tx.insert(turmas)
          .values({
            id: uuidv4(),
            disciplinaId,
            semestreId,
            turma: row.turma,
            vagas: row.vagas,
            lotacaoTeorico: row.lotacaoTeorico,
            lotacaoPratico: row.lotacaoPratico,
            agrupamentoTeorico: row.agrupamentoTeorico,
            agrupamentoPratico: row.agrupamentoPratico,
            vagasAgrupamentoTeorico: row.vagasAgrupamentoTeorico,
            vagasAgrupamentoPratico: row.vagasAgrupamentoPratico,
            professorId,
            professorNome: row.professorNome,
            professorIndicacao: row.professorIndicacao,
            indicacaoHorario: row.indicacaoHorario,
            importadoEm: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [turmas.disciplinaId, turmas.semestreId, turmas.turma],
            set: {
              professorId: professorId,
              professorNome: row.professorNome,
              vagas: row.vagas,
              lotacaoTeorico: row.lotacaoTeorico,
              lotacaoPratico: row.lotacaoPratico,
              agrupamentoTeorico: row.agrupamentoTeorico,
              agrupamentoPratico: row.agrupamentoPratico,
              vagasAgrupamentoTeorico: row.vagasAgrupamentoTeorico,
              vagasAgrupamentoPratico: row.vagasAgrupamentoPratico,
              updatedAt: new Date(),
            }
          })
          .returning();
        
        const turmaId = turmaUpserted.id;
        // In onConflictDoUpdate, returning may return existing if no update happened or EXCLUDED
        // Actually Drizzle returning() works with upsert.
        // We'll track if it was created or updated.
        const wasUpdated = (turmaUpserted as { updatedAt: Date, createdAt: Date }).updatedAt > (turmaUpserted as { updatedAt: Date, createdAt: Date }).createdAt; // Simple heuristic
        if (wasUpdated) result.turmasAtualizadas++; else result.turmasCriadas++;

        // --- STEP D: Create draft plan if none exists ---
        const existingPlan = await tx.query.studyPlans.findFirst({
          where: and(
            eq(studyPlans.userId, professorId),
            eq(studyPlans.turmaId, turmaId),
            eq(studyPlans.semestreId, semestreId)
          )
        });

        if (!existingPlan) {
          const metadata = await tx.query.universityCourses.findFirst({
              where: eq(universityCourses.code, resolvedCodigo)
          });

          const matchedOrg = allOrgs.find(o => o.name === fullCourseName);
          const planOrgId = matchedOrg?.id || targetOrgId;

          const planId = uuidv4();
          
          if (metadata) {
              const gradCode = fullCourseCode;
              const phaseStr = metadata.phase ? metadata.phase.toString().padStart(2, '0') : "00";
              // Priority: Column C (row.turma) is the source of truth for the class code
              const classIdentifier = row.turma || `${phaseStr}${gradCode}`;

              let formattedPrerequisites = "";
              if (metadata.prerequisites && Array.isArray(metadata.prerequisites) && metadata.prerequisites.length > 0) {
                  const prereqCodes = metadata.prerequisites as string[];
                  const prereqMetadata = await tx.query.universityCourses.findMany({
                      where: inArray(universityCourses.code, prereqCodes)
                  });
                  formattedPrerequisites = prereqCodes.map(code => {
                      const m = prereqMetadata.find(p => p.code === code);
                      return m ? `${code} - ${m.name}` : code;
                  }).join("; ");
              }

              await tx.insert(studyPlans).values({
                  id: planId,
                  userId: professorId,
                  organizationId: planOrgId,
                  turmaId: turmaId,
                  disciplinaId: disciplinaId,
                  semestreId: semestreId,
                  status: 'draft',
                  semester: semesterName,
                  courseName: fullCourseName,
                  syllabus: metadata.syllabus,
                  prerequisites: formattedPrerequisites,
                  campus: "Campus de Joinville",
                  center: "Centro Tecnológico de Joinville",
                  universityAcronym: "UFSC",
                  finalEvaluationRules: `O(a) aluno(a) com **frequência suficiente** e **média das notas entre três (3,0) e cinco vírgula cinco (5,5)** terá direito a uma **nova avaliação** no final do semestre que versará sobre todo o conteúdo da disciplina, conforme o que dispõe o **§ 2º do Art. 70 e § 3º do Art. 71 da Resolução nº 17/Cun/97**. Neste caso, a **média final** será calculada através da **média aritmética simples** entre a média das notas das avaliações feitas durante o semestre e a nota obtida na nova avaliação. A **nota mínima de aprovação é seis (6,0)**.

Caso o(a) aluno(a) **não compareça a 75% da carga horária** da disciplina estará **automaticamente reprovado com nota 0,0(zero)**, independentemente da sua média nas avaliações individuais, conforme dispõem no **Art. 69 § 2º da Resolução 017/CUn/97**.

Os(as) alunos(as) que eventualmente faltarem em alguma avaliação que foram perdidas por motivos extremos, mediante justificativa; dentro do prazo de **3 (três) dias úteis** após a avaliação conforme o que dispõe o **Art. 74, da Resolução 017/CUn/97**, poderão solicitar na secretaria acadêmica do Centro de Engenharias da Mobilidade o pedido de **segunda chamada**. Após a análise do pedido e seu deferimento, los(as) alunos(as) poderão realizar a avaliação de segunda chamada na data, no local e horário definido no cronograma.`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
              });

              const creditsValue = metadata.workloadHours ? Math.floor(metadata.workloadHours / 18) : null;
              await tx.insert(courses).values({
                  studyPlanId: planId,
                  code: metadata.code,
                  name: metadata.name,
                  workload: metadata.workloadHours,
                  classType: "Teórica",
                  credits: creditsValue,
                  classIdentifier: classIdentifier,
              });

              type BibItem = string | { authors: string, details: string };
              const bib = metadata.bibliography as unknown as { basic: BibItem[], complementary: BibItem[] };
              const insertBibItems = async (items: BibItem[], type: "basic" | "complementary") => {
                  if (!items || !Array.isArray(items)) return;
                  for (const item of items) {
                      let fullReference = "";
                      if (typeof item === 'object' && item !== null) {
                          const authors = (item.authors || "").trim();
                          const details = (item.details || "").trim();
                          fullReference = (authors && details) ? `${authors}. ${details}` : (authors || details);
                      } else if (typeof item === 'string') {
                          fullReference = item;
                      }
                      if (!fullReference) continue;
                      await tx.insert(bibliography).values({
                          studyPlanId: planId,
                          type,
                          author: "Referência",
                          title: fullReference,
                      });
                  }
              };
              await insertBibItems(bib.basic, "basic");
              await insertBibItems(bib.complementary, "complementary");
          } else {
              await tx.insert(studyPlans).values({
                id: planId,
                userId: professorId,
                organizationId: targetOrgId,
                turmaId: turmaId,
                disciplinaId: disciplinaId,
                semestreId: semestreId,
                semester: semesterName,
                status: 'draft',
                courseName: fullCourseName,
                syllabus: row.disciplinaNome, 
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              // Also create the course record for the plan even if no master metadata exists
              await tx.insert(courses).values({
                id: uuidv4(),
                studyPlanId: planId,
                code: resolvedCodigo,
                name: row.disciplinaNome,
                classType: "Teórica",
                classIdentifier: row.turma,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
          }
          result.planosCriados++;
        } else {
          result.planosJaExistentes++;
          if (existingPlan.status !== 'draft') {
              result.erros.push({
                  row: rowIndex,
                  professor: row.professorNome,
                  disciplina: row.disciplinaNome,
                  turma: row.turma,
                  message: `Plano já está em status '${existingPlan.status}' — mantido sem alteração.`
              });
          }
        }
      } catch (err) {
        result.erros.push({
          row: rowIndex,
          professor: row.professorNome,
          disciplina: row.disciplinaNome,
          turma: row.turma,
          message: err instanceof Error ? err.message : 'Erro desconhecido'
        });
        throw err; 
      }
    }
  });

  return result;
}
