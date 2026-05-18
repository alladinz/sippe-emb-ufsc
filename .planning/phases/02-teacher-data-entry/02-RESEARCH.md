# Phase 2: Teacher Data Entry - Research

**Researched:** March 29, 2026
**Domain:** Form Management, Data Persistence, CSV Processing
**Confidence:** HIGH

## Summary
This phase focuses on the Teacher's primary workflow: creating and managing Study Plans. Key technical challenges include managing a complex, multi-section form, implementing a reliable auto-save mechanism using Next.js 15 Server Actions, and providing a user-friendly CSV import for course data mapping.

**Primary recommendation:** Use `react-hook-form` with `zodResolver` and a debounced `useEffect` to trigger Server Actions for auto-saving. For the CSV import, use `PapaParse` on the client side to allow users to map their own headers to the required "Course Code" and "Course Name" fields.

<user_constraints>
## User Constraints (from 02-CONTEXT.md)

### Locked Decisions
- **Layout:** Horizontal Tabs (General Information, Pedagogy, Schedule, Evaluation, Bibliography).
- **Auto-save:** Debouncing (2s) after user input.
- **Status Indicator:** Visible in Top Header/Status Bar.
- **CSV Import UX:** Upload + Manual Mapping interface.
- **Drafts:** Saveable even with invalid fields; submission blocked until valid.
- **Bibliography:** Structured Dynamic List.
- **Schedule:** Rich Text/Markdown Block.
- **Dashboard:** Comprehensive Table View with status filters.
- **Preview:** Dedicated non-editable Full Document Preview Page.

### Claude's Discretion
- Exact labels for the horizontal tabs.
- Design of the "Manual Mapping" interface for CSV.
- Selection of Rich Text editor (Recommendation: Tiptap).
- Design of the Comprehensive Table (sorting, filtering).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FORM-01 | Create/edit/save drafts | Server Actions + Drizzle handles persistent draft state. |
| FORM-02 | Specific form fields | Multi-tab Shadcn UI components organize these fields. |
| FORM-03 | Auto-save functionality | Debounced `watch()` from RHF triggers background Server Actions. |
| FORM-04 | Zod validation | Shared Zod schemas used for real-time client feedback and server-side safety. |
| DATA-01 | CSV Import course data | PapaParse handles client-side parsing; mapping UI allows flexible input. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.1.0 | Framework | Server Actions for auto-save; App Router for navigation. |
| React Hook Form| 7.54.0 | Form State | Best-in-class performance for complex forms. |
| Zod | 3.24.0 | Validation | Type-safe schema validation for form and database. |
| PapaParse | 5.4.1 | CSV Parsing | Robust client-side parsing for mapping UI. |
| Tiptap | 2.10.3 | Rich Text | Highly extensible; compatible with React 19/Next 15. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| use-debounce | 10.0.0 | Debouncing | Simple hook for the 2s auto-save requirement. |
| Lucide React | Latest | Icons | Status indicators and dashboard actions. |

**Installation:**
```bash
npm install react-hook-form @hookform/resolvers zod papaparse @tiptap/react @tiptap/starter-kit use-debounce
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── dashboard/
│       └── study-plans/
│           ├── [id]/          # Edit/Draft view
│           │   ├── page.tsx
│           │   └── preview/   # Preview page
│           └── new/           # Creation flow
├── components/
│   └── forms/
│       ├── study-plan-form/   # Multi-tab form component
│       └── csv-importer/      # Mapping UI
└── lib/
    └── schemas/
        └── study-plan.ts      # Shared Zod schemas
```

### Pattern: Debounced Auto-save
Use `watch` from `react-hook-form` and a debounced value to trigger a Server Action. Ensure the Server Action handles "partial" updates if possible, or saves the entire draft as a JSON/relational structure.

## Common Pitfalls

### Pitfall: Tiptap Hydration Mismatch
**What goes wrong:** Next.js 15/React 19 stricter hydration causes errors when Tiptap renders on the server.
**How to avoid:** Set `immediatelyRender: false` in the `useEditor` hook configuration.

### Pitfall: CSV Column Mapping
**What goes wrong:** Teachers upload files with headers like "CODIGO" instead of "Course Code".
**How to avoid:** Implement a mapping step where users select which CSV column corresponds to "Code" and "Name".

## Code Examples

### Debounced Auto-save Logic
```typescript
const { watch, control } = useForm({ ... });
const formData = watch();
const [debouncedData] = useDebounce(formData, 2000);

useEffect(() => {
  if (isDirty) {
    startTransition(async () => {
      await saveDraftAction(studyPlanId, debouncedData);
    });
  }
}, [debouncedData]);
```

### Tiptap Next.js 15 Configuration
```typescript
const editor = useEditor({
  extensions: [StarterKit],
  immediatelyRender: false, // Required for Next.js 15
});
```

## Environment Availability
- **Node.js:** Available (v20+)
- **PostgreSQL:** Required for Drizzle drafts.
- **npm:** Available for package installation.

## Validation Architecture
- **Framework:** Vitest (suggested in Phase 1)
- **Strategy:** Unit tests for Zod schemas; Integration tests for the CSV mapping logic.

---
*Note: Due to turn limits, I was unable to execute the `write_file` tool to save this content to `.planning/phases/02-teacher-data-entry/02-RESEARCH.md`. The planner should use the content provided above.*
