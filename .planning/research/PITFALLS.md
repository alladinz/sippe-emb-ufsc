# Domain Pitfalls: University Study Plan Management

**Domain:** University Academic Administration / Syllabus Management
**Researched:** 2026-03-28
**Overall confidence:** HIGH

## Critical Pitfalls

Mistakes that cause workflow deadlocks, permission leaks, or data integrity issues.

### 1. The "Vanishing Approver" Deadlock
**What goes wrong:** A Study Plan is submitted to a specific Bachelor Degree Coordinator who goes on leave, falls ill, or leaves the university. The plan remains "Pending" indefinitely, and the Teacher cannot proceed with classes or accreditation.
**Why it happens:** Rigid 1-to-1 mapping between a degree and a single human approver without delegation or override mechanisms.
**Consequences:** Delayed course approvals, accreditation risks, and administrative frustration.
**Prevention:** 
- Implement a "Department Chef" role with "Super-Approver" permissions to override or reassign any plan.
- Support "Delegated Approvers" where a Coordinator can assign a temporary deputy.
**Detection:** "Stale Plan" dashboard alerts for plans pending more than X days.
**Phase:** Phase 2 (Review Workflow)

### 2. The "Late Edit" Permission Leak
**What goes wrong:** A Teacher edits their Study Plan *after* the Coordinator has approved it but *before* the Secretary has archived it. The archived version no longer matches what was reviewed.
**Why it happens:** Lack of state-based immutability. The "Edit" permission is tied to the "Teacher" role rather than the "Status" of the plan.
**Consequences:** Discrepancy between approved methodology and actual archived document; potential "ghost changes" to evaluation criteria.
**Prevention:**
- Lock the form (Read-Only) as soon as the status is "Submitted" or "Approved".
- Only allow editing if the Coordinator "Rejects" the plan back to "Draft/Revision" status.
**Detection:** Checksum comparison between submitted and archived versions.
**Phase:** Phase 2 (Review Workflow)

### 3. Self-Approval Conflict of Interest
**What goes wrong:** A Bachelor Degree Coordinator is also a Teacher for a course within that same degree. They submit their own Study Plan and then approve it themselves.
**Why it happens:** System assumes the "Submitter" and "Approver" are always different people based on roles, but in university settings, roles often overlap.
**Consequences:** Lack of oversight; potential for non-compliant study plans to be archived.
**Prevention:**
- Implement a rule: `If Submitter == Approver, then Forward to Department Chef for Approval`.
- Audit trail must explicitly flag self-approved plans.
**Detection:** Query for `submitted_by == approved_by`.
**Phase:** Phase 2 (Review Workflow)

---

## Moderate Pitfalls

### 1. The "Which Version is Final?" Confusion
**What goes wrong:** After multiple rejection/revision cycles, the Teacher and Coordinator lose track of which PDF reflects the latest agreed-upon changes.
**Why it happens:** Overwriting the same record instead of maintaining a versioned history.
**Prevention:** 
- Treat each submission as a "Snapshot".
- Maintain a version history (v1, v2, v3) accessible to both roles.
- Label the final archived PDF with a version timestamp.
**Phase:** Phase 3 (Archiving & Exports)

### 2. PDF Formatting "Explosion"
**What goes wrong:** The cronogram (schedule) or bibliography tables break across pages, or special mathematical/scientific characters (e.g., Σ, π, ü) turn into garbage symbols in the generated PDF.
**Why it happens:** Using client-side PDF libraries that don't handle Unicode/UTF-8 well, or failing to use `page-break-inside: avoid` in CSS.
**Prevention:**
- Use server-side PDF generation (e.g., Puppeteer, Playwright) for better CSS support.
- Embed Unicode-compliant fonts (e.g., Noto Sans).
- Use standard templates for tables to prevent width overflows.
**Phase:** Phase 3 (Archiving & Exports)

### 3. Inconsistent Multi-Degree Standards
**What goes wrong:** Coordinators for different bachelor degrees apply different standards for "Methodology" or "Evaluation," leading to departmental inconsistency.
**Why it happens:** Purely text-based fields without guidance or shared institutional "locked" fields.
**Prevention:**
- Use "Locked Institutional Policy" sections that appear on all forms.
- Provide "Example/Guidance" text within the form fields to nudge users toward consistency.
**Phase:** Phase 1 (Teacher Form)

---

## Minor Pitfalls

### 1. Form Fatigue & Data Loss
**What goes wrong:** Teachers spend 2 hours filling out a long Study Plan form, their session expires or the browser crashes, and all data is lost.
**Why it happens:** Expecting a single-session completion of a complex administrative document.
**Prevention:**
- Implement "Draft" status with persistent server-side storage.
- Auto-save every 60 seconds or on field change.
**Phase:** Phase 1 (Teacher Form)

### 2. CSV Import Mapping Errors
**What goes wrong:** Course codes in the CSV don't match the internal format, or column headers change, causing the import to fail or create duplicate courses.
**Why it happens:** Fragile CSV parsing logic without a "Mapping/Preview" step.
**Prevention:**
- Provide a downloadable CSV template.
- Implement a "Preview" step where users confirm column mapping before import.
**Phase:** Phase 1 (Data Import)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Teacher Form | Data Loss / Form Fatigue | Server-side drafts + Auto-save. |
| Phase 1: CSV Import | Data Duplication | Conflict resolution strategy (Skip/Overwrite/Rename). |
| Phase 2: Workflow | Vanishing Approver | Department Chef "Super-Approver" override. |
| Phase 2: Permissions | Post-Approval Edits | Immutable state locking on Approval. |
| Phase 3: PDF Export | Encoding/Table Breakage | Server-side rendering + Unicode font embedding. |
| Phase 3: Archiving | Version Confusion | Immutable snapshots with version numbers. |

## Sources

- [Coursedog - Syllabus Management Best Practices](https://www.coursedog.com/blog/syllabus-management-best-practices)
- [CleanCatalog - Workflow Automation Pitfalls](https://cleancatalog.com/blog/workflow-automation-pitfalls)
- [University of Minnesota - Syllabus Approval Process Guidelines](https://policy.umn.edu/education/syllabus) (Proxy for general university standards)
- [StackOverflow - Common PDF generation issues with tables](https://stackoverflow.com/questions/tagged/pdf-generation)
