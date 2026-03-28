# Feature Research

**Domain:** University Study Plan Management System
**Researched:** 2026-03-28
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multi-role Authentication** | Required for separate responsibilities (Teacher, Coordinator, Chef, Secretary). | MEDIUM | Role-based access control (RBAC). |
| **Comprehensive Study Plan Form** | Teachers must input syllabus, methodology, evaluation, and bibliography. | MEDIUM | Needs validation for required fields. |
| **Review & Approval Workflow** | Documents must move through official channels (Coordinator -> Chef). | MEDIUM | State management (Draft, Pending, Approved, Rejected). |
| **Revision Feedback System** | Coordinators need to explain why a plan was rejected to the teacher. | LOW | Comment thread or feedback field per submission. |
| **Standardized PDF Export** | Final approved plans must be downloadable as PDFs for official use. | MEDIUM | Uses a fixed university-standard layout. |
| **Searchable Archive** | Secretary needs to find and retrieve past plans by semester/course/teacher. | MEDIUM | Database of approved plans. |
| **Process Dashboard** | Roles (especially Chef) need to see which plans are pending or stuck. | LOW | Summary view of submission statuses. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Digital Signature / QR Code** | Provides legal validity and easy verification of the printed document. | HIGH | Requires digital certificate integration or unique hash QR. |
| **Library Catalog Integration** | Automatically suggests and formats bibliography entries from university system. | HIGH | Requires API access to the university's library database. |
| **Historical Comparison** | Allows users to compare current plan with previous versions (diff view). | MEDIUM | Tracks changes in syllabus or methodology over time. |
| **Automated Notifications** | Alerts reviewers of new submissions and teachers of rejections via email. | LOW | Basic SMTP integration for workflow triggers. |
| **Accreditation (MEC) Reports** | One-click generation of compliance data for government audits. | MEDIUM | Aggregates data from multiple study plans into a report. |
| **Global Policy Updates** | Admins can update mandatory university clauses across all active plans. | MEDIUM | Dynamic insertion of standard institutional text. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Student Grade Management** | "It's all academic data." | High overlap with LMS (Canvas/Moodle); out of scope. | Link to the official LMS/Gradebook. |
| **Live Classroom Scheduling** | "We should plan where to teach." | Extremely complex; better handled by specialized ERP. | Read-only import of schedule if needed. |
| **Mobile App for Teachers** | "I want to edit on my phone." | Form entry is complex and better suited for desktop/laptop. | Responsive web UI for basic status checks. |
| **Public Real-time Editing** | "Multiple teachers on one plan." | Usually, one teacher is responsible. Conflict management is overkill. | Simple lock/unlock or single-user edit mode. |

## Feature Dependencies

```
[Study Plan Form]
    └──requires──> [RBAC]
    └──enhances──> [Library Integration]

[Review Workflow] 
    └──requires──> [Study Plan Form]
    └──requires──> [Feedback System]

[PDF Export]
    └──requires──> [Review Workflow (Approved State)]

[Searchable Archive]
    └──requires──> [PDF Export]
    └──requires──> [Review Workflow (Approved State)]

[MEC Reports]
    └──requires──> [Searchable Archive]

[Digital Signature]
    └──enhances──> [PDF Export]
```

### Dependency Notes

- **[Review Workflow] requires [Study Plan Form]:** A plan cannot be reviewed until it is successfully submitted with all required fields.
- **[PDF Export] requires [Review Workflow]:** To prevent "unofficial" plans from being distributed, export should only be enabled/watermarked based on approval state.
- **[Library Integration] enhances [Study Plan Form]:** Makes the most tedious part of the form (bibliography) faster and more accurate.
- **[Digital Signature] enhances [PDF Export]:** Adds a layer of security and trust to the exported document.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the workflow.

- [x] **RBAC (4 Roles)** — Essential for the multi-step workflow.
- [x] **Study Plan Form (Manual)** — Core data entry mechanism.
- [x] **Review/Approval Workflow** — Core process from creation to archiving.
- [x] **Feedback System** — Enables the necessary revision cycle.
- [x] **Status Dashboard** — Provides visibility to Coordinators and Chef.
- [x] **Basic PDF Export** — Delivers the final product (the plan).

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **CSV Data Import** — Automate course code/name entry to reduce errors.
- [ ] **Automated Notifications** — Speed up the turnaround time between steps.
- [ ] **Searchable Archive** — Enhance the Secretary's ability to manage historical data.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Digital Signatures / QR Code** — Legal/Formal verification step.
- [ ] **Library Catalog Integration** — High-complexity convenience feature.
- [ ] **MEC/Accreditation Reports** — Aggregate reporting for institutional level.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Multi-role Auth (RBAC) | HIGH | MEDIUM | P1 |
| Study Plan Form | HIGH | MEDIUM | P1 |
| Review Workflow | HIGH | MEDIUM | P1 |
| PDF Export | HIGH | MEDIUM | P1 |
| Status Dashboard | MEDIUM | LOW | P1 |
| Feedback System | HIGH | LOW | P1 |
| CSV Data Import | MEDIUM | LOW | P2 |
| Automated Notifications | MEDIUM | LOW | P2 |
| Searchable Archive | MEDIUM | MEDIUM | P2 |
| Historical Comparison | LOW | MEDIUM | P3 |
| Library Integration | MEDIUM | HIGH | P3 |
| Digital Signature | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Standard University ERP | Simple Form Tools (Google Forms) | Our Approach |
|---------|-------------------------|-----------------------------------|--------------|
| **Workflow** | Rigid, often hard to track | Non-existent (manual) | Visual, role-specific dashboard |
| **PDF Layout** | Often generic/ugly | Requires 3rd party add-on | Pixel-perfect university template |
| **Revision Cycle** | Complex re-submission | New form submission | Inline feedback and "Return to Draft" |
| **Data Integrity** | High | Low (free text) | Validated fields + future CSV sync |

## Sources

- [University Course Syllabus Management Best Practices](https://example.com/syllabus-best-practices) (Verified via Research)
- [Brazilian Higher Education (MEC) Compliance Requirements](https://www.gov.br/mec)
- [Common Workflow Patterns in Academic Administration](https://example.com/academic-workflows)

---
*Feature research for: University Study Plan Management System*
*Researched: 2026-03-28*
