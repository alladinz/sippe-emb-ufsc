# Phase 2: Teacher Data Entry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** March 29, 2026
**Phase:** 02-teacher-data-entry
**Areas discussed:** Form Layout & Structure, Auto-save Behavior, CSV Import UX, Complex Field Input (Cronograma/Biblio), Teacher Dashboard (Empty State), Submission Preview Step

---

## Form Layout & Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single Scroll + Sidebar Nav | All fields on one page with a sticky navigation sidebar for quick jumping. | |
| Horizontal Tabs | Categorized horizontal tabs (e.g., General, Pedagogy, Schedule, etc.). | ✓ |
| Multi-step Wizard | Multi-step "Next/Back" flow. | |

**User's choice:** Horizontal Tabs

---

## Auto-save Behavior

### Trigger
| Option | Description | Selected |
|--------|-------------|----------|
| Debounced (Every change) | Save 1-2 seconds after the user stops typing. | ✓ |
| On Blur (Focus change) | Save only when the user clicks or tabs out of a field. | |

**User's choice:** Debounced (Every change)

### Status Indicator
| Option | Description | Selected |
|--------|-------------|----------|
| Top Header/Status Bar | Show "Saving..." or "Last saved at HH:MM" in the top bar. | ✓ |
| Inline per field | Show a quick "Saved" checkmark next to each field as it's processed. | |

**User's choice:** Top Header/Status Bar

---

## CSV Import UX

| Option | Description | Selected |
|--------|-------------|----------|
| Upload + Manual Mapping | Upload any CSV, then pick the Code and Name columns from dropdowns. | ✓ |
| Template-only Upload | Provide a template; if the format doesn't match, the upload fails. | |

**User's choice:** Upload + Manual Mapping

---

## Complex Field Input (Cronograma/Biblio)

| Option | Description | Selected |
|--------|-------------|----------|
| Structured Dynamic List | "Add Week", "Add Reference" buttons with structured fields. | |
| Rich Text/Markdown Block | A single rich-text area for each. | |
| Hybrid | Structured Bibliography but Rich Text for the Schedule. | ✓ |

**User's choice:** Hybrid (Structured Biblio / Rich Text Schedule)

---

## Teacher Dashboard (Empty State)

| Option | Description | Selected |
|--------|-------------|----------|
| Comprehensive Table View | Show a searchable table of all your Study Plans (Draft, Submitted, Approved, Archived). | ✓ |
| Current-focus View | Show only the "Active" plan for the current semester prominently. | |

**User's choice:** Comprehensive Table View

---

## Submission Preview Step

| Option | Description | Selected |
|--------|-------------|----------|
| Full Document Preview Page | A dedicated non-editable view showing the whole form formatted as a document. | ✓ |
| Summary Tab (within Form) | A final "Review & Submit" tab within the form itself. | |

**User's choice:** Full Document Preview Page

---

## Claude's Discretion

- Exact labels for the horizontal tabs.
- Layout and styling of the "Manual Mapping" interface for CSV imports.
- Specific Rich Text editor library selection.
- Design of the "Comprehensive Table" (sorting, filtering by status).

## Deferred Ideas

- **Digital Signatures** (Phase v2)
- **Library API Integration** (Phase v2)
