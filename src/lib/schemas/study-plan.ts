import { z } from "zod";

export const courseSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, "O código da disciplina é obrigatório"),
  name: z.string().min(1, "O nome da disciplina é obrigatório"),
  workload: z.number().int().min(0, "A carga horária não pode ser negativa").optional().nullable(),
  classType: z.enum(["Teórica", "Prática", "Teórico-Prática"]).optional().nullable(),
  credits: z.number().int().min(0).optional().nullable(),
  classIdentifier: z.string().optional().nullable(),
});

export const bibliographyItemSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["basic", "complementary"]),
  author: z.string().min(1, "O autor é obrigatório"),
  title: z.string().min(1, "O título é obrigatório"),
  year: z.number().int().optional().nullable(),
  publisher: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
});

export const scheduleDaySchema = z.object({
  day: z.string(),
  enabled: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const weeklyScheduleItemSchema = z.object({
  week: z.string(),
  class1: z.object({
    number: z.string(),
    content: z.string(),
  }),
  class2: z.object({
    number: z.string(),
    content: z.string(),
  }),
});

export const studyPlanStatusEnum = z.enum(["draft", "submitted", "pending_review", "approved", "rejected", "archived"]);
export type StudyPlanStatus = z.infer<typeof studyPlanStatusEnum>;

export function isValidTransition(from: StudyPlanStatus, to: StudyPlanStatus): boolean {
  const transitions: Record<StudyPlanStatus, StudyPlanStatus[]> = {
    draft: ["submitted"],
    submitted: ["pending_review"],
    pending_review: ["approved", "rejected"],
    approved: ["archived"], // Transition to archival state
    rejected: ["submitted"], // Allow re-submission
    archived: [], // Final immutable state
  };

  return transitions[from].includes(to);
}

export const studyPlanSchema = z.object({
  id: z.string().uuid().optional(),
  semester: z.string().min(1, "O semestre é obrigatório"),
  status: studyPlanStatusEnum,
  feedback: z.string().optional().nullable(),

  // Institutional Hierarchy
  universityAcronym: z.string().default("UFSC"),
  campus: z.string().optional().nullable(),
  center: z.string().optional().nullable(),
  courseName: z.string().optional().nullable(),

  // Academic Content
  prerequisites: z.string().optional().nullable(),
  syllabus: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  programContent: z.string().optional().nullable(),

  // Pedagogy & Evaluation
  methodology: z.string().optional().nullable(),
  evaluation: z.string().optional().nullable(),
  evaluationFormula: z.string().optional().nullable(),
  finalEvaluationRules: z.string().optional().nullable(),
  finalConsiderations: z.string().optional().nullable(),

  // Schedule
  schedule: z.union([z.string(), z.array(scheduleDaySchema)]).optional().nullable(),
  weeklySchedule: z.array(weeklyScheduleItemSchema).optional().nullable(),

  // Relations (to be handled in sub-forms)
  courses: z.array(courseSchema).optional(),
  bibliography: z.array(bibliographyItemSchema).optional(),
}).passthrough();


export type StudyPlanFormValues = z.infer<typeof studyPlanSchema>;
export type CourseFormValues = z.infer<typeof courseSchema>;
export type BibliographyFormValues = z.infer<typeof bibliographyItemSchema>;
