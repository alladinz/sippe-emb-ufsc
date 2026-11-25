# SIPPE — Plano de Implementação: Identificação, Grade Horária UFSC, Formatação Rica/LaTeX e Turmas Individuais nos Planos de Ensino

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adequar os Planos de Ensino do SIPPE aos novos tópicos de Identificação (incluindo Pré-requisito, Horário da Aula com grade oficial da UFSC, Contato pré-preenchido com e-mail e Horário de Atendimento), garantir individualização de 1 plano por turma na atribuição e importação de planilha, ativar TiptapEditor em Avaliação, suportar LaTeX nas fórmulas/avaliação com fidelidade visual no Preview Web e no PDF gerado pelo `@react-pdf/renderer`, e renumerar as seções de I a IX.

**Architecture:** Evolução incremental retrocompatível sobre PostgreSQL/Drizzle (`study_plans.contact` e `study_plans.office_hours` nullable + enriquecimento de `study_plans.schedule` JSONB com slots da grade UFSC). Para fidelidade tipográfica e matemática offline, usa `mathjax-full` (SVG para Web e pré-renderização 4x PNG DataURL via Canvas no browser antes da compilação do `PlanoPDF`) combinado com um parser estruturado HTML/Tiptap -> blocos nativos `@react-pdf/renderer` (`Times-Roman`, `Times-Bold`, `Times-Italic`, `Times-BoldItalic`, listas multinível com recuo real).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Drizzle ORM, PostgreSQL, Zod, React Hook Form, Tiptap v3, `@react-pdf/renderer` 4.5, `mathjax-full`, Vitest, Tailwind CSS.

## Global Constraints

- Preservar integralmente planos de ensino já cadastrados/aprovados/arquivados (colunas novas sempre nullable; leitura de `schedule` e `evaluation` retrocompatível com registros legados sem `slots` ou em texto puro).
- Grade oficial da UFSC (slots de 50 min): Manhã `07:30 - 08:20`, `08:40 - 09:30`, `09:30 - 10:20`, `10:30 - 11:20`, `11:20 - 12:10`; Tarde/Noite `13:30 - 14:20`, `14:20 - 15:10`, `15:10 - 16:00`, `16:20 - 17:10`, `17:10 - 18:00`, `18:00 - 18:50`, `18:50 - 19:40` (mínimo 2 créditos seguidos por dia de aula).
- Ordem e campos exatos em **I. IDENTIFICAÇÃO DA DISCIPLINA**:
  1. `DISCIPLINA:` | `CÓDIGO:`
  2. `CARGA HORÁRIA:` | `CRÉDITOS:`
  3. `PRÉ-REQUISITO:`
  4. `TURMA:`
  5. `HORÁRIO DA AULA:`
  6. `PROFESSOR:` | `CONTATO:`
  7. `HORÁRIO DE ATENDIMENTO:`
  *(Sem campo separado de Fase; Curso e Semestre mantidos no cabeçalho institucional superior.)*
- Numeração oficial exata no Preview Web e PDF:
  - `I. IDENTIFICAÇÃO DA DISCIPLINA`
  - `II. EMENTA`
  - `III. OBJETIVOS`
  - `IV. CONTEÚDO PROGRAMÁTICO`
  - `V. METODOLOGIA DE ENSINO`
  - `VI. METODOLOGIA DE AVALIAÇÃO`
  - `VII. AVALIAÇÃO FINAL`
  - `VIII. CRONOGRAMA DE AULA`
  - `IX. BIBLIOGRAFIA` (`Bibliografia Básica` e `Bibliografia Complementar`)
- Preservar identidade visual **Minimalismo Institucional Contemporâneo** (Lato, `#023E8A`, `#102E52`), autosave serial (`flushSave`) e regras RBAC existentes.
- Não realizar commits, push, merge ou deploy automáticos ao final sem autorização explícita.
- Segurança: nunca serializar campos sensíveis de `user` (como `senhaHash`, `resetToken`) para Client Components como `DownloadPDFButton` ou `StudyPlanForm`.

## Review Focus

1. **Planos legados antes das alterações:** planos já salvos no banco possuem `contact = null`, `officeHours = null`, `evaluation` em texto puro (sem tags `<p>`) e `schedule` antigo sem array `slots` — a UI, Preview e PDF devem exibi-los sem erros nem perda de quebras de linha.
2. **Fórmulas não-LaTeX e valores monetários (`$`) em textos:** `evaluationFormula` simples (ex.: `MF = 0,5*P1 + 0,5*P2`) ou textos com `R$ 50,00` não podem quebrar o parser de LaTeX nem gerar erros de renderização no PDF.
3. **Negrito + itálico combinados e listas multinível no PDF:** `<strong><em>texto</em></strong>`, `<li><p>...</p><ul><li><p>...</p></li></ul></li>` e quebras de linha longas dentro de `<li>` devem manter o estilo de fonte correto (`Times-BoldItalic`) e recuo alinhado no PDF sem vazar marcadores `**` nem entidades `&ccedil;`.
4. **Planilha com turmas agrupadas na mesma célula e/ou duplicadas na mesma planilha:** célula com `"05601/05602"` ou `"05601, 05602"` deve virar 2 linhas individuais mapeadas para os respectivos cursos (`601`, `602`), e uma segunda ocorrência da mesma `(disciplina, turma)` na mesma planilha não pode gerar erro de chave única nem duplicar criação.
5. **Fórmula LaTeX inline ou bloco no `@react-pdf/renderer`:** `<Text>` do `@react-pdf/renderer` rejeita `<Image>` / `<Svg>` como filho direto; o renderizador de PDF nunca deve aninhar `<Image>` dentro de `<Text>`.

---

## Mapa de Arquivos Afetados

| Arquivo | Ação | Responsabilidade |
| :--- | :--- | :--- |
| `package.json` | Modificar | Instalar dependência `mathjax-full` (conversão LaTeX → SVG offline). |
| `src/db/schema.ts` | Modificar | Adicionar `contact` e `officeHours` em `studyPlans`. |
| `src/db/migrations/20261124_add_plan_contact_office_hours.sql` | Criar | Migração SQL idempotente + backfill inicial de `contact` com `user.email`. |
| `src/lib/schedule/ufsc-schedule.ts` | Criar | Grade horária oficial UFSC, agrupamento de blocos contínuos, formatação para exibição e validação de mínimo 2 créditos. |
| `src/lib/schemas/study-plan.ts` | Modificar | Atualizar `scheduleDaySchema` (`slots?: string[]`) e `studyPlanSchema` (`contact`, `officeHours`). |
| `src/utils/turmaExpansion.ts` | Criar | Expansão de células com múltiplas turmas (`05601/05602`) e deduplicação intra-planilha. |
| `src/services/professorPlanImportService.ts` | Modificar | Usar `expandAndDeduplicateTurmas`, deduplicação em memória + DB, e preencher `contact` padrão. |
| `src/services/disciplinasImportService.ts` | Modificar | Aplicar a mesma expansão/deduplicação de turmas ao importar apenas disciplinas/turmas. |
| `src/app/dashboard/chef/actions.ts` | Modificar | Corrigir `assignTeacherToCourseAction` para gerar 1 plano individual por curso/turma (sem concatenar `01601/01602`). |
| `src/app/dashboard/chef/_components/assignment-dialog.tsx` | Modificar | Atualizar feedback visual ao atribuir múltiplos planos individuais. |
| `src/app/dashboard/study-plans/actions.ts` | Modificar | Pré-preencher `contact` com `session.user.email` ao criar plano. |
| `src/app/dashboard/study-plans/[id]/page.tsx` | Modificar | Carregar `user` (somente `id`, `name`, `email`) para passar nome/contato padrão ao `StudyPlanForm`. |
| `src/app/dashboard/study-plans/[id]/actions.ts` | Modificar | Persistir `contact`, `officeHours` e `schedule` em `saveStudyPlanAction`. |
| `src/app/api/planos/copiavel/route.ts` | Modificar | Incluir rascunhos (`draft`), turma (`classIdentifier`), `schedule`, `contact` e `officeHours`. |
| `src/components/planos/CopiarPlanoModal.tsx` | Modificar | Permitir selecionar e copiar *Horário da Aula*, *Contato* e *Horário de Atendimento* além dos campos pedagógicos, indicando status/turma. |
| `src/lib/latex/mathjax.ts` | Criar | Motor offline `mathjax-full` para gerar SVG limpo (`fontCache: 'none'`) e converter texto misto com `$...$` / `$$...$$`. |
| `src/lib/latex/pdfLatexRenderer.ts` | Criar | Utilitário client-side que converte fórmulas LaTeX do plano em PNG DataURL 4x via Canvas para o `@react-pdf/renderer`. |
| `src/components/latex/LatexFormula.tsx` | Criar | Componente React Web para renderizar fórmulas LaTeX (e fallback texto simples) no editor e no Preview. |
| `src/components/latex/RichTextViewer.tsx` | Criar | Renderizador Web unificado para HTML/Tiptap + texto puro legado + LaTeX inline/display + `.viewer-rich-content`. |
| `src/components/forms/study-plan-form/ClassSchedulePicker.tsx` | Criar | Seletor interativo de dias da semana e slots da grade horária UFSC com resumo formatado e aviso de mínimo 2 créditos. |
| `src/components/forms/study-plan-form/index.tsx` | Modificar | Reorganizar Aba Identificação, mover `prerequisites` para Identificação, integrar `ClassSchedulePicker`, `contact`, `officeHours`, trocar `evaluation` para `TiptapEditor`, adicionar live preview LaTeX em `evaluationFormula` e sincronizar dias do Cronograma. |
| `src/components/pdf/pdfHelpers.ts` | Modificar | Parser AST estruturado de HTML/Tiptap + `**negrito**` + entidades HTML completas + detecção LaTeX mantendo funções legadas para `ProgramaPDF`. |
| `src/components/pdf/PdfRichContent.tsx` | Criar | Renderizador AST → componentes nativos `@react-pdf/renderer` (`View`, `Text`, listas multinível com recuo, negrito/itálico/negrito-itálico, imagens LaTeX). |
| `src/components/pdf/DownloadPDFButton.tsx` | Modificar | Pré-gerar `latexImages` via `prepareLatexImagesForPdf` antes de gerar Blob do `PlanoPDF`; incluir `contact`, `officeHours`, `schedule`, `user.email` em `PlanoData`. |
| `src/components/pdf/PlanoPDF.tsx` | Modificar | Atualizar layout de `I. IDENTIFICAÇÃO`, aplicar numeração `I..IX`, e usar `PdfRichContent` + fórmulas LaTeX em todas as seções narrativas. |
| `src/app/dashboard/study-plans/[id]/preview/page.tsx` | Modificar | Atualizar `I. IDENTIFICAÇÃO`, aplicar numeração `I..IX`, usar `RichTextViewer` e `LatexFormula`, e selecionar apenas `{ id, name, email }` em `user`. |
| `tests/ufsc-schedule.test.ts` | Criar | Testes unitários para grade UFSC e formatação de horários. |
| `tests/turma-expansion.test.ts` | Criar | Testes unitários para expansão e deduplicação de turmas em planilhas. |
| `tests/pdf-rich-content.test.ts` | Criar | Testes unitários para parser HTML→AST (negrito, itálico, listas multinível, entidades) e LaTeX SVG. |

---

### Task 1: Banco de Dados, Migração SQL e Schemas Zod

**Files:**
- Modify: `src/db/schema.ts:131-177`
- Create: `src/db/migrations/20261124_add_plan_contact_office_hours.sql`
- Create: `scripts/run-study-plan-id-migration.ts` (ou estender script de migração seguro)
- Modify: `src/lib/schemas/study-plan.ts:23-95`
- Test: `src/lib/db/__tests__/schema.test.ts` & `src/lib/schemas/__tests__/study-plan.test.ts`

**Interfaces:**
- Produces: colunas `studyPlans.contact` (`text`), `studyPlans.officeHours` (`text`), tipo `ScheduleDay` com `slots?: string[]`, e campos opcionais `contact`, `officeHours` em `StudyPlanFormValues`.

- [ ] **Step 1: Atualizar teste unitário do schema para exigir os novos campos**

```ts
// Adicionar caso em src/lib/schemas/__tests__/study-plan.test.ts
it("should validate study plan with contact, officeHours and UFSC schedule slots", () => {
  const plan = {
    semester: "2026.1",
    status: "draft",
    contact: "prof@ufsc.br | Ramal 1234",
    officeHours: "Terças-feiras, 14:00 às 16:00",
    schedule: [
      {
        day: "Segunda-feira",
        enabled: true,
        slots: ["08:40 - 09:30", "09:30 - 10:20"],
        startTime: "08:40",
        endTime: "10:20",
      },
    ],
  };

  const result = studyPlanSchema.safeParse(plan);
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.contact).toBe("prof@ufsc.br | Ramal 1234");
    expect(result.data.officeHours).toBe("Terças-feiras, 14:00 às 16:00");
    expect(Array.isArray(result.data.schedule)).toBe(true);
    if (Array.isArray(result.data.schedule)) {
      expect(result.data.schedule[0].slots).toEqual(["08:40 - 09:30", "09:30 - 10:20"]);
    }
  }
});
```

- [ ] **Step 2: Rodar o teste para verificar que `slots` é descartado/falha antes da implementação**

Run: `npx vitest run src/lib/schemas/__tests__/study-plan.test.ts`
Expected: FAIL na verificação de `result.data.schedule[0].slots` / `contact`.

- [ ] **Step 3: Atualizar `src/db/schema.ts` e criar arquivo de migração SQL**

Em `src/db/schema.ts` dentro de `studyPlans`:
```ts
  // General Info
  semester: text("semester"), // e.g., "2026.1"
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected
  feedback: text("feedback"),
  contact: text("contact"),
  officeHours: text("office_hours"),
```

Criar `src/db/migrations/20261124_add_plan_contact_office_hours.sql`:
```sql
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS office_hours TEXT;

UPDATE study_plans sp
SET contact = u.email
FROM "user" u
WHERE sp.user_id = u.id
  AND (sp.contact IS NULL OR BTRIM(sp.contact) = '')
  AND u.email IS NOT NULL;
```

- [ ] **Step 4: Atualizar `src/lib/schemas/study-plan.ts`**

```ts
export const scheduleDaySchema = z.object({
  day: z.string(),
  enabled: z.boolean().default(false),
  slots: z.array(z.string()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});
```
E dentro de `studyPlanSchema`:
```ts
  // General Info & Teacher Contact
  contact: z.string().optional().nullable(),
  officeHours: z.string().optional().nullable(),
```

- [ ] **Step 5: Rodar os testes e conferir criação da coluna em `src/lib/db/__tests__/schema.test.ts`**

Adicionar assertion em `src/lib/db/__tests__/schema.test.ts`:
```ts
expect(schema.studyPlans.contact).toBeDefined();
expect(schema.studyPlans.officeHours).toBeDefined();
```
Run: `npx vitest run src/lib/schemas/__tests__/study-plan.test.ts src/lib/db/__tests__/schema.test.ts`
Expected: PASS.

*(Nota operacional: aplicar a migração SQL no banco PostgreSQL configurado antes de subir ou testar no dev server local.)*

---

### Task 2: Utilitário da Grade Horária UFSC (`src/lib/schedule/ufsc-schedule.ts`)

**Files:**
- Create: `src/lib/schedule/ufsc-schedule.ts`
- Test: `tests/ufsc-schedule.test.ts`

**Interfaces:**
- Produces: `UFSC_TIME_SLOTS`, `UFSC_WEEKDAYS`, `UFSCTimeSlot`, `ScheduleDayInput`, `groupContiguousSlots`, `formatDaySchedule`, `formatPlanScheduleSummary`, `getDaysWithInsufficientCredits`.

- [ ] **Step 1: Escrever testes unitários em `tests/ufsc-schedule.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  UFSC_TIME_SLOTS,
  groupContiguousSlots,
  formatPlanScheduleSummary,
  getDaysWithInsufficientCredits,
} from "@/lib/schedule/ufsc-schedule";

describe("UFSC Schedule Utilities", () => {
  it("should contain all 12 official UFSC time slots", () => {
    expect(UFSC_TIME_SLOTS).toHaveLength(12);
    expect(UFSC_TIME_SLOTS[0].id).toBe("07:30 - 08:20");
    expect(UFSC_TIME_SLOTS[11].id).toBe("18:50 - 19:40");
  });

  it("should merge 2 consecutive credits like 08:40-09:30 and 09:30-10:20 into 08:40 - 10:20", () => {
    const blocks = groupContiguousSlots(["09:30 - 10:20", "08:40 - 09:30"]);
    expect(blocks).toEqual([
      { startTime: "08:40", endTime: "10:20", label: "08:40 - 10:20", credits: 2 },
    ]);
  });

  it("should merge same-shift adjacent slots across short break (<=20min) and separate lunch break", () => {
    const blocks = groupContiguousSlots([
      "08:40 - 09:30",
      "09:30 - 10:20",
      "10:30 - 11:20",
      "11:20 - 12:10",
      "13:30 - 14:20",
      "14:20 - 15:10",
    ]);
    expect(blocks.map((b) => b.label)).toEqual(["08:40 - 12:10", "13:30 - 15:10"]);
  });

  it("should keep non-adjacent slots in same shift separated", () => {
    const blocks = groupContiguousSlots(["07:30 - 08:20", "10:30 - 11:20"]);
    expect(blocks.map((b) => b.label)).toEqual(["07:30 - 08:20", "10:30 - 11:20"]);
  });

  it("should format complete plan schedule summary cleanly", () => {
    const summary = formatPlanScheduleSummary([
      { day: "Segunda-feira", enabled: true, slots: ["08:40 - 09:30", "09:30 - 10:20"] },
      { day: "Terça-feira", enabled: false, slots: [] },
      { day: "Quarta-feira", enabled: true, slots: ["13:30 - 14:20", "14:20 - 15:10"] },
    ]);
    expect(summary).toBe("Segunda-feira: 08:40 - 10:20 | Quarta-feira: 13:30 - 15:10");
  });

  it("should flag active days with fewer than 2 credits", () => {
    const invalid = getDaysWithInsufficientCredits([
      { day: "Segunda-feira", enabled: true, slots: ["08:40 - 09:30"] },
      { day: "Quarta-feira", enabled: true, slots: ["08:40 - 09:30", "09:30 - 10:20"] },
    ]);
    expect(invalid).toEqual(["Segunda-feira"]);
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar falha inicial**

Run: `npx vitest run tests/ufsc-schedule.test.ts`
Expected: FAIL (módulo ainda não existe).

- [ ] **Step 3: Implementar `src/lib/schedule/ufsc-schedule.ts`**

```ts
export interface UFSCTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  period: "Manhã" | "Tarde" | "Noite";
  index: number;
}

export const UFSC_TIME_SLOTS: UFSCTimeSlot[] = [
  { id: "07:30 - 08:20", startTime: "07:30", endTime: "08:20", period: "Manhã", index: 0 },
  { id: "08:40 - 09:30", startTime: "08:40", endTime: "09:30", period: "Manhã", index: 1 },
  { id: "09:30 - 10:20", startTime: "09:30", endTime: "10:20", period: "Manhã", index: 2 },
  { id: "10:30 - 11:20", startTime: "10:30", endTime: "11:20", period: "Manhã", index: 3 },
  { id: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", period: "Manhã", index: 4 },
  { id: "13:30 - 14:20", startTime: "13:30", endTime: "14:20", period: "Tarde", index: 5 },
  { id: "14:20 - 15:10", startTime: "14:20", endTime: "15:10", period: "Tarde", index: 6 },
  { id: "15:10 - 16:00", startTime: "15:10", endTime: "16:00", period: "Tarde", index: 7 },
  { id: "16:20 - 17:10", startTime: "16:20", endTime: "17:10", period: "Tarde", index: 8 },
  { id: "17:10 - 18:00", startTime: "17:10", endTime: "18:00", period: "Tarde", index: 9 },
  { id: "18:00 - 18:50", startTime: "18:00", endTime: "18:50", period: "Noite", index: 10 },
  { id: "18:50 - 19:40", startTime: "18:50", endTime: "19:40", period: "Noite", index: 11 },
];

export const UFSC_WEEKDAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export interface ScheduleDayInput {
  day: string;
  enabled: boolean;
  slots?: string[];
  startTime?: string;
  endTime?: string;
}

export interface ContiguousScheduleBlock {
  startTime: string;
  endTime: string;
  label: string;
  credits: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function groupContiguousSlots(slots: string[]): ContiguousScheduleBlock[] {
  const validSlots = slots
    .map((id) => UFSC_TIME_SLOTS.find((s) => s.id === id))
    .filter((s): s is UFSCTimeSlot => Boolean(s))
    .sort((a, b) => a.index - b.index);

  if (validSlots.length === 0) return [];

  const blocks: ContiguousScheduleBlock[] = [];
  let currentStart = validSlots[0].startTime;
  let currentEnd = validSlots[0].endTime;
  let currentIndex = validSlots[0].index;
  let credits = 1;

  for (let i = 1; i < validSlots.length; i++) {
    const slot = validSlots[i];
    const gapMinutes = toMinutes(slot.startTime) - toMinutes(currentEnd);
    const isConsecutiveInGrade = slot.index === currentIndex + 1 && gapMinutes <= 20;

    if (isConsecutiveInGrade) {
      currentEnd = slot.endTime;
      currentIndex = slot.index;
      credits += 1;
    } else {
      blocks.push({
        startTime: currentStart,
        endTime: currentEnd,
        label: `${currentStart} - ${currentEnd}`,
        credits,
      });
      currentStart = slot.startTime;
      currentEnd = slot.endTime;
      currentIndex = slot.index;
      credits = 1;
    }
  }

  blocks.push({
    startTime: currentStart,
    endTime: currentEnd,
    label: `${currentStart} - ${currentEnd}`,
    credits,
  });

  return blocks;
}

export function formatDaySchedule(dayItem: ScheduleDayInput): string {
  if (dayItem.slots && dayItem.slots.length > 0) {
    return groupContiguousSlots(dayItem.slots)
      .map((b) => b.label)
      .join(", ");
  }
  return "";
}

export function formatPlanScheduleSummary(
  schedule: unknown,
  fallbackIndicacaoHorario?: string | null
): string {
  if (typeof schedule === "string" && schedule.trim()) {
    return schedule.trim();
  }

  if (Array.isArray(schedule)) {
    const formattedDays = (schedule as ScheduleDayInput[])
      .filter((d) => d.enabled || (Array.isArray(d.slots) && d.slots.length > 0))
      .map((d) => {
        const times = formatDaySchedule(d);
        return times ? `${d.day}: ${times}` : d.day;
      })
      .filter(Boolean);

    const hasAnyExplicitSlots = (schedule as ScheduleDayInput[]).some(
      (d) => Array.isArray(d.slots) && d.slots.length > 0
    );

    if (hasAnyExplicitSlots && formattedDays.length > 0) {
      return formattedDays.join(" | ");
    }

    if (fallbackIndicacaoHorario?.trim()) {
      return fallbackIndicacaoHorario.trim();
    }

    if (formattedDays.length > 0) {
      return formattedDays.join(" | ");
    }
  }

  return fallbackIndicacaoHorario?.trim() || "Não informado";
}

export function getDaysWithInsufficientCredits(schedule: ScheduleDayInput[]): string[] {
  return schedule
    .filter((d) => d.enabled)
    .filter((d) => (d.slots?.length ?? 0) < 2)
    .map((d) => d.day);
}
```

- [ ] **Step 4: Rodar testes para confirmar aprovação**

Run: `npx vitest run tests/ufsc-schedule.test.ts`
Expected: PASS (6/6).

---

### Task 3: Individualização de Turmas na Atribuição do Chefe e na Planilha

**Files:**
- Create: `src/utils/turmaExpansion.ts`
- Modify: `src/services/professorPlanImportService.ts:123-425`
- Modify: `src/services/disciplinasImportService.ts:40-158`
- Modify: `src/app/dashboard/chef/actions.ts:515-671`
- Modify: `src/app/dashboard/chef/_components/assignment-dialog.tsx:54-68`
- Modify: `src/app/dashboard/study-plans/actions.ts:74-86,170-180`
- Test: `tests/turma-expansion.test.ts`

**Interfaces:**
- Produces: `expandAndDeduplicateTurmas(rows: DisciplinaRow[]): { expanded: DisciplinaRow[]; skippedDuplicates: number }`, criação individual em `assignTeacherToCourseAction` retornando `{ count: number; ids: string[] }`.

- [ ] **Step 1: Escrever testes em `tests/turma-expansion.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { splitTurmaCell, expandAndDeduplicateTurmas } from "@/utils/turmaExpansion";
import type { DisciplinaRow } from "@/services/sheetsParser";

const makeRow = (overrides: Partial<DisciplinaRow>): DisciplinaRow => ({
  disciplinaNome: "Cálculo I",
  disciplinaCodigo: "EMB5001",
  curso: "Ciência e Tecnologia",
  turma: "01601",
  oferta: true,
  vagas: 40,
  creditosTeorico: 4,
  creditosPratico: 0,
  professorNome: "Docente Teste",
  ...overrides,
});

describe("Turma expansion and deduplication", () => {
  it("should split grouped turma cells separated by slash, comma, semicolon or 'e'", () => {
    expect(splitTurmaCell("05601/05602")).toEqual(["05601", "05602"]);
    expect(splitTurmaCell("05601, 05602; 05603")).toEqual(["05601", "05602", "05603"]);
    expect(splitTurmaCell("05601 e 05602")).toEqual(["05601", "05602"]);
    expect(splitTurmaCell("01601A")).toEqual(["01601A"]);
  });

  it("should expand grouped row into separate rows resolving course by 3-digit suffix and deduplicate across sheet", () => {
    const rows: DisciplinaRow[] = [
      makeRow({ turma: "05601/05602", curso: "601/602" }),
      makeRow({ turma: "05602" }), // duplicate of expanded 05602 from row 1
    ];

    const { expanded, skippedDuplicates } = expandAndDeduplicateTurmas(rows);
    expect(expanded).toHaveLength(2);
    expect(expanded[0].turma).toBe("05601");
    expect(expanded[0].curso).toBe("Ciência e Tecnologia");
    expect(expanded[1].turma).toBe("05602");
    expect(expanded[1].curso).toBe("Engenharia Aeroespacial");
    expect(skippedDuplicates).toBe(1);
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar falha**

Run: `npx vitest run tests/turma-expansion.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/utils/turmaExpansion.ts`**

Reaproveitar `CODE_COURSE_MAP` de `src/utils/courseUtils.ts`:
```ts
import { CODE_COURSE_MAP } from "./courseUtils";
import type { DisciplinaRow } from "@/services/sheetsParser";

export function splitTurmaCell(rawTurma: string): string[] {
  if (!rawTurma) return [];
  const parts = rawTurma
    .split(/\s*(?:[/,;]|\be\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function resolveCourseForTurma(turmaCode: string, fallbackCourse: string): string {
  // Padrão UFSC Joinville: 2 dígitos da fase + 3 dígitos do curso (+ sufixo opcional, ex: 05602, 01601A)
  const match = turmaCode.match(/^\d{2}(\d{3})/);
  if (match && CODE_COURSE_MAP[match[1]]) {
    return CODE_COURSE_MAP[match[1]];
  }
  return fallbackCourse;
}

export function expandAndDeduplicateTurmas(rows: DisciplinaRow[]): {
  expanded: DisciplinaRow[];
  skippedDuplicates: number;
} {
  const seenKeys = new Set<string>();
  const expanded: DisciplinaRow[] = [];
  let skippedDuplicates = 0;

  for (const row of rows) {
    const turmasSplit = splitTurmaCell(row.turma);
    const candidates = turmasSplit.length > 0 ? turmasSplit : [row.turma.trim()];

    for (const singleTurma of candidates) {
      const normalizedDiscCode = row.disciplinaCodigo.trim().toUpperCase();
      const normalizedTurma = singleTurma.toUpperCase();
      const dedupKey = `${normalizedDiscCode}::${normalizedTurma}`;

      if (seenKeys.has(dedupKey)) {
        skippedDuplicates++;
        continue;
      }

      seenKeys.add(dedupKey);
      expanded.push({
        ...row,
        turma: singleTurma,
        curso:
          candidates.length > 1
            ? resolveCourseForTurma(singleTurma, row.curso)
            : row.curso,
      });
    }
  }

  return { expanded, skippedDuplicates };
}
```

- [ ] **Step 4: Integrar `expandAndDeduplicateTurmas` nos serviços de importação e pré-preencher `contact` com e-mail do docente**

Em `src/services/professorPlanImportService.ts`:
- No início de `importProfessoresEPlanos(rawRows, semestreId)`: chamar `const { expanded: rows } = expandAndDeduplicateTurmas(rawRows);` e manter também um `processedPlanKeys = new Set<string>()` para `(professorId, resolvedCodigo, row.turma)` dentro da transação; além de verificar `existingPlan` no DB por `(userId, turmaId, semestreId)` e também por `(disciplinaId, turmaId, semestreId)` caso já exista turma criada no mesmo semestre.
- Ao inserir em `studyPlans` (`tx.insert(studyPlans).values({...})`): passar `contact: existingProf?.email ?? null` (para novos usuários com e-mail pendente fica `null` até cadastrarem).
Em `src/services/disciplinasImportService.ts`:
- Chamar `const { expanded: rows } = expandAndDeduplicateTurmas(rawRows);` no início de `importDisciplinasFromRows`.

- [ ] **Step 5: Corrigir `assignTeacherToCourseAction` em `src/app/dashboard/chef/actions.ts` e `createStudyPlanFromSelectionAction` em `src/app/dashboard/study-plans/actions.ts`**

Em `src/app/dashboard/chef/actions.ts`:
- Buscar o docente selecionado: `const targetTeacher = await db.query.user.findFirst({ where: eq(user.id, teacherId), columns: { id: true, name: true, email: true } });`
- Substituir a junção `codes.map(...).join("/")` por um loop `for (const org of selectedOrgs)`:
  - `const gradCode = GRADUATION_MAP[org.name] || "000";`
  - `const automatedClassIdentifier = `${phaseStr}${gradCode}`;`
  - Inserir **1 `studyPlans`** para `org.id` (`courseName: org.name`, `contact: targetTeacher?.email || null`), **1 `courses`** (`classIdentifier: automatedClassIdentifier`) e as bibliografias desse plano.
  - Enviar notificação mencionando se foi 1 ou múltiplos planos criados (`createdPlanIds.length`).
- Atualizar `AssignmentDialog` (`src/app/dashboard/chef/_components/assignment-dialog.tsx`) para exibir feedback adequado (1 ou N planos atribuídos).
- Em `src/app/dashboard/study-plans/actions.ts`: definir `contact: session.user.email || null` nos dois pontos de `db.insert(studyPlans).values(...)`.

- [ ] **Step 6: Rodar testes**

Run: `npx vitest run tests/turma-expansion.test.ts`
Expected: PASS.

---

### Task 4: Cópia de Planos (Incluindo Rascunhos + Horário, Contato e Atendimento)

**Files:**
- Modify: `src/app/api/planos/copiavel/route.ts:19-55`
- Modify: `src/components/planos/CopiarPlanoModal.tsx:17-160`
- Modify: `src/components/forms/study-plan-form/index.tsx:472-507,1150-1157`

**Interfaces:**
- Produces: payload de `GET /api/planos/copiavel` com `status` incluindo `'draft'`, `classIdentifier`, `schedule`, `contact`, `officeHours`.

- [ ] **Step 1: Atualizar `src/app/api/planos/copiavel/route.ts`**

- Alterar `inArray(studyPlans.status, ["draft", "submitted", "pending_review", "approved"])`.
- Incluir no objeto retornado:
  ```ts
  turma: p.courses?.[0]?.classIdentifier || null,
  schedule: p.schedule,
  contact: p.contact,
  officeHours: p.officeHours,
  ```

- [ ] **Step 2: Atualizar `src/components/planos/CopiarPlanoModal.tsx` e `handleCopiarCampos` em `StudyPlanForm`**

- Exibir a `turma` e badge de status (`Rascunho`, `Submetido`, `Aprovado`, etc.) em cada card de plano elegível no modal.
- Permitir checkboxes de seleção (todos marcados por padrão ou marcando se preenchidos) para:
  - Campos pedagógicos (`objectives`, `programContent`, `methodology`, `evaluation`, `evaluationFormula`)
  - Dados de oferta/docente (`schedule` — *Horário da Aula*, `contact` — *Contato*, `officeHours` — *Horário de Atendimento*)
- No `StudyPlanForm.handleCopiarCampos`: aplicar `setValue("schedule", ..., { shouldDirty: true })`, `setValue("contact", ..., { shouldDirty: true })`, `setValue("officeHours", ..., { shouldDirty: true })` quando selecionados na cópia.

---

### Task 5: Motor Offline de LaTeX + Renderização Rica (HTML/Tiptap + LaTeX) para Web e PDF

**Files:**
- Modify: `package.json` (via `npm install mathjax-full`)
- Create: `src/lib/latex/mathjax.ts`
- Create: `src/lib/latex/textWithLatex.ts`
- Create: `src/lib/latex/pdfLatexRenderer.ts`
- Create: `src/components/latex/LatexFormula.tsx`
- Create: `src/components/latex/RichTextViewer.tsx`
- Modify: `src/components/pdf/pdfHelpers.ts`
- Create: `src/components/pdf/PdfRichContent.tsx`
- Test: `tests/pdf-rich-content.test.ts`

**Interfaces:**
- Produces:
  - `latexToSvg(latex: string, display?: boolean): { svg: string; widthEx: number; heightEx: number } | null`
  - `hasLatexSyntax(formula: string): boolean`
  - `splitTextWithLatex(text: string): Array<{ type: 'text' | 'latex-inline' | 'latex-block'; value: string }>`
  - `parseHtmlToRichBlocks(raw: unknown): PdfRichBlock[]`
  - `prepareLatexImagesForPdf(plan): Promise<Record<string, LatexPdfImage>>`
  - `<RichTextViewer content={...} />`, `<LatexFormula formula={...} />`, `<PdfRichContent content={...} latexImages={...} />`

- [ ] **Step 1: Instalar `mathjax-full`**

Run: `cd /Users/abdeeldacruz/studyplan-management && npm install mathjax-full`
Expected: instalado em `dependencies` sem vulnerabilidades críticas.

- [ ] **Step 2: Escrever testes em `tests/pdf-rich-content.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { parseHtmlToRichBlocks, decodeHtmlEntities } from "@/components/pdf/pdfHelpers";
import { latexToSvg, splitTextWithLatex, hasLatexSyntax } from "@/lib/latex/mathjax";

describe("Rich HTML to PDF AST & LaTeX Engine", () => {
  it("should preserve bold, italic and bold+italic inline spans", () => {
    const html = "<p>Texto <strong>negrito</strong>, <em>itálico</em> e <strong><em>ambos</em></strong>.</p>";
    const blocks = parseHtmlToRichBlocks(html);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    if (blocks[0].type === "paragraph") {
      expect(blocks[0].runs).toEqual([
        { text: "Texto ", bold: false, italic: false },
        { text: "negrito", bold: true, italic: false },
        { text: ", ", bold: false, italic: false },
        { text: "itálico", bold: false, italic: true },
        { text: " e ", bold: false, italic: false },
        { text: "ambos", bold: true, italic: true },
        { text: ".", bold: false, italic: false },
      ]);
    }
  });

  it("should parse nested ordered and bullet lists from Tiptap HTML with 1 / 1.1 markers", () => {
    const html = "<ol><li><p>Unidade 1</p><ol><li><p>Subtópico <strong>A</strong></p></li></ol></li></ol><ul><li><p>Item bullet</p></li></ul>";
    const blocks = parseHtmlToRichBlocks(html);
    const listItems = blocks.filter((b) => b.type === "list-item");
    expect(listItems).toHaveLength(3);
    expect(listItems[0]).toMatchObject({ type: "list-item", marker: "1.", depth: 0 });
    expect(listItems[1]).toMatchObject({ type: "list-item", marker: "1.1.", depth: 1 });
    expect(listItems[2]).toMatchObject({ type: "list-item", marker: "•", depth: 0 });
  });

  it("should decode extended HTML entities safely", () => {
    expect(decodeHtmlEntities("Avalia&ccedil;&atilde;o &ndash; m&eacute;dia &ge; 6,0")).toBe(
      "Avaliação – média ≥ 6,0"
    );
  });

  it("should distinguish LaTeX vs plain formula and ignore currency '$'", () => {
    expect(hasLatexSyntax("MF = \\frac{P_1 + P_2}{2}")).toBe(true);
    expect(hasLatexSyntax("MF = 0,5*P1 + 0,5*P2")).toBe(false);
    expect(splitTextWithLatex("Taxa R$ 10,00 ou nota $P_1 + P_2$.")).toEqual([
      { type: "text", value: "Taxa R$ 10,00 ou nota " },
      { type: "latex-inline", value: "P_1 + P_2" },
      { type: "text", value: "." },
    ]);
  });

  it("should render LaTeX expression to standalone SVG synchronously via MathJax", () => {
    const rendered = latexToSvg("MF = \\frac{P_1 + P_2}{2}", true);
    expect(rendered).not.toBeNull();
    expect(rendered?.svg).toContain("<svg");
    expect(rendered?.svg).toContain("<path");
    expect(rendered?.svg).not.toContain("<use");
  });
});
```

- [ ] **Step 3: Rodar teste para confirmar falha inicial**

Run: `npx vitest run tests/pdf-rich-content.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementar `src/lib/latex/mathjax.ts` e `src/lib/latex/pdfLatexRenderer.ts`**

Em `src/lib/latex/mathjax.ts`:
- Inicializar instância única de `mathjax.document("", { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: "none" }) })` usando `liteAdaptor()`.
- Exportar `latexToSvg(formula: string, display = true)` extraindo `<svg ...>...</svg>` limpo, largura e altura em `ex` convertidas para fator escalável.
- Exportar `hasLatexSyntax(text: string): boolean`: detecta delimitadores `$...$` / `$$...$$`, barra invertida seguida de comando (`\\[a-zA-Z]+`), ou notação matemática explícita (`_`, `^`, `{...}`).
- Exportar `splitTextWithLatex(text: string)`: tokeniza `$$...$$` (`latex-block`) e `$...$` (`latex-inline`, exigindo que não comece/termine com espaço logo após `$` ou antes do `$` final para não confundir `R$ 10,00` com abertura LaTeX!).
- Exportar `isComplexLatex(latex: string): boolean`: identifica `\frac`, `\dfrac`, `\sum`, `\int`, `\prod`, `\lim`, `\sqrt`, `\begin`, `\left`, `\binom` para decidir quando destacar em bloco no PDF vs tentar conversão inline limpa (sub/sobrescritos e símbolos comuns) quando dentro de parágrafo justificado.

Em `src/lib/latex/pdfLatexRenderer.ts` (client-side):
- Função `svgToHighResPngDataUrl(svgString: string, fontSizePt: number): Promise<{ dataUrl: string; width: number; height: number } | null>`:
  - Calcula dimensões reais em `pt` usando `widthEx` e `heightEx` (`1ex ≈ 0.45 * fontSizePt`), cria `Image` com Blob SVG (`image/svg+xml`), desenha em `<canvas>` 4x (`scale = 4`), retorna `canvas.toDataURL("image/png")`.
- Função `prepareLatexImagesForPdf(plan): Promise<Record<string, { dataUrl: string; width: number; height: number }>>`:
  - Coleta todas as expressões LaTeX únicas presentes em `plan.evaluationFormula` e nas seções ricas (`syllabus`, `objectives`, `programContent`, `methodology`, `evaluation`, `finalEvaluationRules`), renderiza em paralelo no browser antes de chamar `pdf(<PlanoPDF />).toBlob()`.

- [ ] **Step 5: Implementar parser AST completo em `src/components/pdf/pdfHelpers.ts` e renderizador `<PdfRichContent />`**

Em `src/components/pdf/pdfHelpers.ts`:
- Manter intactas as exportações usadas por `ProgramaPDF.tsx` (`resolveContent`, `stripHtmlForPdf`, `tiptapToPlainText`, `parseBoldMarkers`, etc.).
- Adicionar `decodeHtmlEntities(text: string): string` suportando entidades nomeadas comuns em português/matemática (`&aacute;`..`&uuml;`, `&ccedil;`, `&ndash;`, `&mdash;`, `&le;`, `&ge;`, `&ne;`, `&times;`, `&middot;`, `&plusmn;`, `&nbsp;`, `&quot;`, `&amp;`, `&lt;`, `&gt;`) e numéricas decimais/hex (`&#(\d+);`, `&#x([0-9a-fA-F]+);`).
- Adicionar `parseHtmlToRichBlocks(raw: unknown): PdfRichBlock[]`:
  - Normaliza Tiptap JSON, HTML ou texto puro legado (`\n\n` -> parágrafos, `\n` -> `<br/>`, `**negrito**` preservado).
  - Pilha de estilos inline (`bold`, `italic`) percorrendo nós/tags `<strong|b>`, `<em|i>`, `<br>`, `<p>`, `<h1>..<h6>`, `<blockquote>`, `<ul>`, `<ol>`, `<li>` corretamente sem perder recuo nem duplicar quebras em `<li><p>...</p></li>`.
  - Mantém contadores multinível para `<ol>` (`1.`, `1.1.`, `1.1.1.`) e marcadores `•` / `◦` para `<ul>`.
  - Detecta blocos LaTeX (`$$...$$`) para gerar bloco `{ type: 'latex-block', latex }`.

Em `src/components/pdf/PdfRichContent.tsx`:
- Renderiza cada `PdfRichBlock`:
  - `paragraph` / `heading`: `<View style={styles.paragraphContainer}>` contendo fragmentos de texto (`Times-Roman`, `Times-Bold`, `Times-Italic`, `Times-BoldItalic`) + eventual `<View alignItems="center"><Image /></View>` se houver LaTeX 2D complexo no meio do texto (nunca aninhando `<Image>` dentro de `<Text>`!).
  - `list-item`: `<View style={[styles.listItem, { marginLeft: depth * 12 }]} wrap={false}>` (ou `wrap` se item muito grande) com `<Text style={styles.listBullet}>{marker}</Text>` + `<View style={{ flex: 1 }}>...</View>` contendo o conteúdo formatado com recuo real alinhado à coluna do texto!
  - `latex-block`: `<View style={{ alignItems: 'center', marginVertical: 4 }}><Image src={img.dataUrl} style={{ width: img.width, height: img.height }} /></View>` (fallback texto se `latexImages` não estiver disponível).

- [ ] **Step 6: Implementar `src/components/latex/LatexFormula.tsx` e `src/components/latex/RichTextViewer.tsx`**

- `LatexFormula`:
  - Recebe `formula: string`, `display?: boolean`.
  - Se `hasLatexSyntax(formula)`, extrai eventual delimitador `$...$`/`$$...$$` e renderiza `latexToSvg` em `<span dangerouslySetInnerHTML={{ __html: svg }} />` com tratamento seguro caso haja erro de sintaxe LaTeX em tempo de digitação (exibindo alerta discreto no preview do editor sem quebrar a página!).
  - Se for fórmula simples sem LaTeX, renderiza em fonte monoespaçada limpa (`font-mono font-bold`) mantendo 100% de retrocompatibilidade.
- `RichTextViewer`:
  - Normaliza Tiptap JSON / HTML / texto puro legado com quebras de linha `\n` -> `<p>`/`<br/>` e `**negrito**`.
  - Processa trechos `$...$` / `$$...$$` fora de tags HTML convertendo via `latexToSvg` antes de montar o conteúdo com a classe `.viewer-rich-content text-xs leading-relaxed text-justify` (sem conflito de tamanho `prose-sm` nem `whitespace-pre-wrap` espúrio!).

- [ ] **Step 7: Rodar testes da Task 5**

Run: `npx vitest run tests/pdf-rich-content.test.ts`
Expected: PASS.

---

### Task 6: Editor do Plano de Ensino (`StudyPlanForm`, Grade Horária UFSC, `TiptapEditor` em Avaliação e Live LaTeX)

**Files:**
- Create: `src/components/forms/study-plan-form/ClassSchedulePicker.tsx`
- Modify: `src/components/forms/study-plan-form/index.tsx`
- Modify: `src/app/dashboard/study-plans/[id]/page.tsx`
- Modify: `src/app/dashboard/study-plans/[id]/actions.ts`

**Interfaces:**
- Consumes: `UFSC_TIME_SLOTS`, `UFSC_WEEKDAYS`, `formatPlanScheduleSummary`, `getDaysWithInsufficientCredits`, `LatexFormula`.
- Produces: prop `teacherInfo?: { name: string; email: string | null }` em `StudyPlanFormProps`; salvamento completo de `contact`, `officeHours`, `schedule`, `evaluation` (HTML Tiptap), `evaluationFormula`.

- [ ] **Step 1: Atualizar `src/app/dashboard/study-plans/[id]/page.tsx` e `actions.ts`**

- Em `[id]/page.tsx`: carregar `user: { columns: { id: true, name: true, email: true } }` junto com `plan`, e passar `teacherInfo={{ name: plan.user?.name || session.user.name, email: plan.user?.email || session.user.email || null }}` para `<StudyPlanForm />`.
- Em `[id]/actions.ts` (`saveStudyPlanAction`): adicionar `contact: data.contact`, `officeHours: data.officeHours` ao `.set({...})` dentro da transação.

- [ ] **Step 2: Criar `src/components/forms/study-plan-form/ClassSchedulePicker.tsx`**

- Permite ativar dias (`Segunda-feira` a `Sábado`, mantendo compatibilidade se `Domingo` estiver salvo) e clicar nos 12 slots oficiais da grade UFSC organizados em **Manhã** e **Tarde/Noite**.
- Mostra ao vivo a prévia formatada (ex.: `Segunda-feira: 08:40 - 10:20 | Quarta-feira: 13:30 - 15:10`).
- Exibe aviso amigável em âmbar caso algum dia habilitado possua `< 2` créditos selecionados (*"Mínimo de 2 créditos seguidos por dia de aula"*).
- Ao atualizar os slots de um dia, atualiza automaticamente `startTime` e `endTime` do primeiro/último bloco daquele dia mantendo retrocompatibilidade.

- [ ] **Step 3: Atualizar `src/components/forms/study-plan-form/index.tsx`**

- Normalizar `fullDefaultValues`:
  - `contact`: `initialData.contact ?? teacherInfo?.email ?? ""`
  - `officeHours`: `initialData.officeHours ?? ""`
  - `evaluation`: helper `normalizePlainTextToHtml(initialData.evaluation)` para que textos antigos salvos em `<Textarea>` apareçam com parágrafos corretos no `<TiptapEditor>` sem acionar falsos autosaves logo ao abrir (`lastSavedDataRef` recebe o mesmo valor normalizado!).
- **Aba Identificação:**
  - Bloco *Institucional e Disciplina*: Disciplina, Código, Carga Horária, Créditos, **Pré-requisito** (movido para cá, readOnly), Turma, Tipo, Curso, Semestre Letivo.
  - Bloco *Docente, Contato e Horários*:
    - `Professor`: input readOnly exibindo `teacherInfo?.name`
    - `Contato`: input editável `register("contact")` (com descrição orientando e-mail/ramal/outro)
    - `Horário de Atendimento`: textarea curto ou input `register("officeHours")`
    - `Horário da Aula`: `<ClassSchedulePicker />` vinculado a `schedule`
- **Aba Conteúdo:** remover `prerequisites` (mantendo Ementa, Objetivos e Conteúdo Programático).
- **Aba Avaliação:**
  - Trocar `<Textarea {...register("evaluation")} />` por `<Controller name="evaluation" ... render={({ field }) => <TiptapEditor ... />} />`.
  - Abaixo do `<Input {...register("evaluationFormula")} />`, adicionar caixa de pré-visualização em tempo real `<LatexFormula formula={watch("evaluationFormula") || ""} display />` com dica de sintaxe LaTeX (`Ex: MF = \frac{P_1 + P_2}{2} ou $...$ nos textos de avaliação`).
- **Aba Cronograma:**
  - Mostrar aviso sincronizado com os dias habilitados em `Horário da Aula` na Identificação (mantendo a possibilidade de editar rapidamente ali também, compartilhando o mesmo estado `schedule`).
- Atualizar `getTabStatus('identificacao')` e validação de submissão em `onFinalSubmit` (avisando se houver dia com `< 2` créditos antes de submeter).

---

### Task 7: Preview Web, `DownloadPDFButton` e `PlanoPDF` (Identificação, Nova Numeração I–IX, Formatação Rica e LaTeX)

**Files:**
- Modify: `src/app/dashboard/study-plans/[id]/preview/page.tsx`
- Modify: `src/components/pdf/DownloadPDFButton.tsx`
- Modify: `src/components/pdf/PlanoPDF.tsx`
- Modify: `src/app/globals.css` (se precisar refinar `.viewer-rich-content` para alinhamento de `text-xs` e fórmulas SVG)

**Interfaces:**
- Consumes: `RichTextViewer`, `LatexFormula`, `formatPlanScheduleSummary`, `prepareLatexImagesForPdf`, `PdfRichContent`.

- [ ] **Step 1: Atualizar `src/app/dashboard/study-plans/[id]/preview/page.tsx`**

- Na query Drizzle `db.query.studyPlans.findFirst`:
  ```ts
  with: {
    courses: true,
    bibliography: true,
    organization: true,
    turma: { columns: { id: true, turma: true, indicacaoHorario: true } },
    user: { columns: { id: true, name: true, email: true } },
  }
  ```
- Na Seção **I. IDENTIFICAÇÃO DA DISCIPLINA**, renderizar exatamente na ordem e agrupamento:
  1. `DISCIPLINA:` `{course.name}` | `CÓDIGO:` `{course.code}`
  2. `CARGA HORÁRIA:` `{workload}` | `CRÉDITOS:` `{credits}`
  3. `PRÉ-REQUISITO:` `{plan.prerequisites || "Não há pré-requisitos cadastrados."}` *(col-span-2)*
  4. `TURMA:` `{course.classIdentifier || "-"}` *(col-span-2)*
  5. `HORÁRIO DA AULA:` `{formatPlanScheduleSummary(plan.schedule, plan.turma?.indicacaoHorario)}` *(col-span-2)*
  6. `PROFESSOR:` `{plan.user.name}` | `CONTATO:` `{plan.contact || plan.user.email || "-"}`
  7. `HORÁRIO DE ATENDIMENTO:` `{plan.officeHours || "-"}` *(col-span-2)*
- Renumerar e ajustar títulos das seções exatamente conforme especificação:
  - **II. EMENTA** -> `<RichTextViewer content={plan.syllabus} emptyText="Não informada." />`
  - **III. OBJETIVOS** -> `<RichTextViewer content={plan.objectives} emptyText="Não informados." />`
  - **IV. CONTEÚDO PROGRAMÁTICO** -> `<RichTextViewer content={plan.programContent} emptyText="Não informado." className="pl-4 border-l-2 border-slate-100" />`
  - **V. METODOLOGIA DE ENSINO** -> `<RichTextViewer content={plan.methodology} emptyText="Não informada." />`
  - **VI. METODOLOGIA DE AVALIAÇÃO** -> `<RichTextViewer content={plan.evaluation} emptyText="Não informada." />` + caixa tracejada com `<LatexFormula formula={plan.evaluationFormula} display />`
  - **VII. AVALIAÇÃO FINAL** -> `<RichTextViewer content={plan.finalEvaluationRules} emptyText="Conforme resoluções vigentes da Universidade." />`
  - **VIII. CRONOGRAMA DE AULA**
  - **IX. BIBLIOGRAFIA** -> subtítulos **Bibliografia Básica** e **Bibliografia Complementar**.

- [ ] **Step 2: Atualizar `src/components/pdf/DownloadPDFButton.tsx`**

- Estender `PlanoData` com `contact?: string | null`, `officeHours?: string | null`, `schedule?: unknown`, `turma?: { turma: string; indicacaoHorario?: string | null } | null`, `user?: { name: string; email?: string | null }`.
- Dentro de `handleDownload`: antes de chamar `pdf(...)`, gerar `const latexImages = await prepareLatexImagesForPdf(plano);` e passar `<PlanoPDF plano={plano} logoBlob={logoBlob} latexImages={latexImages} />`.

- [ ] **Step 3: Atualizar `src/components/pdf/PlanoPDF.tsx`**

- Receber `latexImages?: Record<string, LatexPdfImage>`.
- Atualizar `I. IDENTIFICAÇÃO DA DISCIPLINA` com a mesma ordem exata de linhas/colunas da especificação:
  - Linha 1: `DISCIPLINA:` (esq) | `CÓDIGO:` (dir)
  - Linha 2: `CARGA HORÁRIA:` (esq) | `CRÉDITOS:` (dir)
  - Linha 3: `PRÉ-REQUISITO:`
  - Linha 4: `TURMA:`
  - Linha 5: `HORÁRIO DA AULA:`
  - Linha 6: `PROFESSOR:` (esq) | `CONTATO:` (dir)
  - Linha 7: `HORÁRIO DE ATENDIMENTO:`
- Renumerar e substituir seções II–IX usando `<PdfRichContent content={...} latexImages={latexImages} />`:
  - `II. EMENTA`
  - `III. OBJETIVOS`
  - `IV. CONTEÚDO PROGRAMÁTICO`
  - `V. METODOLOGIA DE ENSINO`
  - `VI. METODOLOGIA DE AVALIAÇÃO` (+ caixa fórmula renderizando `<Image src={latexImages[formulaKey].dataUrl} />` se houver PNG gerado, ou texto `formulaText` para fórmulas simples não-LaTeX)
  - `VII. AVALIAÇÃO FINAL`
  - `VIII. CRONOGRAMA DE AULA`
  - `IX. BIBLIOGRAFIA` com subtítulos `Bibliografia Básica` e `Bibliografia Complementar`.

---

### Task 8: Verificação Técnica e Regressão Final

**Files:**
- All modified/created files across Tasks 1–7.

- [ ] **Step 1: Conferir formatação e whitespaces**

Run: `cd /Users/abdeeldacruz/studyplan-management && git diff --check`
Expected: Exit code 0 (zero avisos).

- [ ] **Step 2: Checagem estrita de tipos TypeScript**

Run: `cd /Users/abdeeldacruz/studyplan-management && npx tsc --noEmit`
Expected: Exit code 0 (zero erros).

- [ ] **Step 3: Linter ESLint**

Run: `cd /Users/abdeeldacruz/studyplan-management && npm run lint`
Expected: `✔ No ESLint warnings or errors`.

- [ ] **Step 4: Suíte completa de testes unitários**

Run: `cd /Users/abdeeldacruz/studyplan-management && npm run test:unit`
Expected: Todas as suítes (antigas + 3 novas) aprovadas sem falhas.

- [ ] **Step 5: Build de produção Next.js**

Run: `cd /Users/abdeeldacruz/studyplan-management && NODE_OPTIONS="--max-old-space-size=4096" npm run build`
Expected: Exit code 0, todas as rotas compiladas com sucesso.

- [ ] **Step 6: Validação funcional/visual no Preview e PDF**

Testar localmente (`npm run dev`):
- Criar/atribuir plano para 2 cursos simultâneos como Chefe -> confirmar criação de 2 planos separados (`05601`, `05602`).
- Abrir plano: preencher Contato, Horário de Atendimento, selecionar grade UFSC (ex: Segunda `08:40 - 09:30` + `09:30 - 10:20`), formatar negrito/itálico/listas multinível em Conteúdo, Metodologia e Avaliação (TiptapEditor), inserir fórmula LaTeX (`MF = \frac{P_1 + P_2}{2}` + `$N_1 \ge 6,0$`).
- Verificar Preview Web (`I` a `IX`) e baixar PDF verificando fidelidade exata de Identificação, formatação rica e fórmulas LaTeX.
