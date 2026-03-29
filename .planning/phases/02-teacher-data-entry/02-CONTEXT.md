# Phase 2: Teacher Data Entry - Context

**Gathered:** March 29, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable Teachers to efficiently create, manage, and submit Study Plan data. This includes a comprehensive form with multiple sections, auto-save functionality, CSV import for course details, and a dedicated submission preview step.

</domain>

<decisions>
## Implementation Decisions

### Form Layout & Structure
- **Layout:** Use **Horizontal Tabs** to categorize the extensive Study Plan form (e.g., General Information, Pedagogy, Schedule, Evaluation, Bibliography).
- **Auto-save:** Triggered using **Debouncing (2s)** after user input to ensure a smooth, low-interruption experience.
- **Status Indicator:** Show a status indicator (e.g., "Salvando..." or "Última alteração em HH:MM") in the **Top Header/Status Bar** of the form.

### Data Management & Import
- **CSV Import UX:** Use an **Upload + Manual Mapping** approach. Teachers upload any CSV file and pick the "Course Code" and "Course Name" columns from dropdowns to pre-populate those fields.
- **Drafts:** Allow saving drafts even with empty or invalid fields (real-time Zod validation), but block final submission until all fields are valid.

### Complex Field Input
- **Bibliography:** Use a **Structured Dynamic List** with "Add Item" buttons for each reference (fields: Author, Title, Year, etc.).
- **Schedule (Cronograma):** Use a **Rich Text/Markdown Block** to allow flexibility for teachers who often copy-paste from existing documents.

### Teacher Dashboard (First Experience)
- **Primary View:** A **Comprehensive Table View** showing all the teacher's Study Plans across different states (Draft, Submitted, Approved, Archived).

### Submission Flow
- **Preview Step:** A dedicated **Full Document Preview Page** (non-editable) that formats the entire study plan as a document for final review before submission.

### Claude's Discretion
- Exact labels for the horizontal tabs (following common university syllabus categories).
- Layout and styling of the "Manual Mapping" interface for CSV imports.
- Specific Rich Text editor library selection (e.g., Tiptap, Quill, or standard Markdown editor).
- Design of the "Comprehensive Table" (sorting, filtering by status).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Core
- `.planning/PROJECT.md` — Overall project goals and requirements.
- `.planning/REQUIREMENTS.md` — Specific v1 requirements (FORM-01, FORM-02, FORM-03, FORM-04, DATA-01).
- `.planning/ROADMAP.md` — Phase 2 goals and success criteria.

### Technical Foundation (from Phase 1)
- `.planning/phases/01-foundation-authentication/01-CONTEXT.md` — Tech stack, roles, and degree list.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Layout:** The dashboard shell from Phase 1 should provide the base navigation and sidebar.
- **Auth:** Role-based access control (RBAC) ensures only Teachers can access these creation/edit pages.

### Established Patterns
- Use **Next.js 15 Server Actions** for form persistence and auto-save.
- Use **Drizzle ORM** for relational storage of draft data.
- Use **Zod** for schema validation (both client-side and server-side).
- Follow the **Portuguese (Brazil)** localization decided in Phase 1.

### Integration Points
- This phase connects directly to the authenticated Dashboard created in Phase 1.
- Data captured here is consumed by the Review Workflow in Phase 3.

</code_context>

<specifics>
## Specific Ideas

- "I want the auto-save to feel invisible, but I need to know it's working through the status bar."
- "CSV mapping is critical because every department has their own messy Excel files for course codes."
- "The preview page should look like a draft version of the final PDF."

</specifics>

<deferred>
## Deferred Ideas

- **Digital Signatures:** v2 requirement for formal verification.
- **Library API Integration:** v2 requirement for automated bibliography suggestions.

</deferred>

---

*Phase: 02-teacher-data-entry*
*Context gathered: March 29, 2026*
