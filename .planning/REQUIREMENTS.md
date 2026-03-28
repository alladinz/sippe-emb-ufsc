# Requirements: StudyPlan Management System

**Defined:** March 28, 2026
**Core Value:** Streamlining the creation, review, and archiving of academic study plans to ensure consistency and compliance across the department.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Roles

- [ ] **AUTH-01**: User can log in with role-based access control (Teacher, Coordinator, Department Chef, Secretary).
- [ ] **AUTH-02**: Organization-based scoping: Each Coordinator is mapped to one of 8 bachelor degrees.
- [ ] **AUTH-03**: Secure session management that persists across browser refreshes.

### Study Plan Form

- [ ] **FORM-01**: Teacher can create, edit, and save drafts of a Study Plan.
- [ ] **FORM-02**: Form includes fields for: Course Code, Course Name, Methodology, Objectives, Cronogram (Schedule), Evaluation Methods, Dates, and Bibliography.
- [ ] **FORM-03**: Auto-save functionality for the Study Plan form to prevent data loss.
- [ ] **FORM-04**: Implementation of Zod validation for all form fields to ensure data integrity.

### Data Management & Import

- [ ] **DATA-01**: Support importing Course Code and Course Name from a CSV file to pre-populate form fields.
- [ ] **DATA-02**: Relational database storage using Drizzle ORM to maintain academic relationships and document history.

### Review & Approval Workflow

- [ ] **WORKFLOW-01**: Document lifecycle state machine: Draft -> Submitted -> Pending Review -> Approved/Rejected -> Archived.
- [ ] **WORKFLOW-02**: Coordinator can view a dashboard of plans for their assigned degree and approve or reject them.
- [ ] **WORKFLOW-03**: Rejection requires mandatory feedback, which is returned to the Teacher for revision.
- [ ] **WORKFLOW-04**: Department Chef dashboard for oversight of all plans across all 8 degrees.
- [ ] **WORKFLOW-05**: Department Chef can override or delegate approval in case of coordinator absence (Super-Approver).
- [ ] **WORKFLOW-06**: Self-Approval detection: Plans submitted by a Teacher who is also a Coordinator for that degree are automatically escalated to the Department Chef.

### Export & Archiving

- [ ] **EXPORT-01**: Server-side PDF generation of approved Study Plans using a standardized university template.
- [ ] **EXPORT-02**: Secretary can view and search an archive of all approved and archived Study Plans.
- [ ] **EXPORT-03**: Approved plans are marked as immutable and locked for further editing to ensure record integrity.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **v2-DIGITAL-SIG**: Integration of Digital Signatures or QR codes for formal verification.
- **v2-LIBRARY-INTEG**: Automated bibliography suggestions through university library API integration.
- **v2-ACCREDITATION**: Aggregated reports for MEC/Accreditation compliance.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile Application | Focus is on a desktop-optimized web experience for administrative tasks. |
| Full LMS Integration | No student enrollment, gradebooks, or learning management features. |
| Real-time Collaborative Editing | Not required for initial syllabus creation; asynchronous review is sufficient. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| FORM-01 | Phase 2 | Pending |
| FORM-02 | Phase 2 | Pending |
| FORM-03 | Phase 2 | Pending |
| FORM-04 | Phase 2 | Pending |
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 1 | Pending |
| WORKFLOW-01 | Phase 3 | Pending |
| WORKFLOW-02 | Phase 3 | Pending |
| WORKFLOW-03 | Phase 3 | Pending |
| WORKFLOW-04 | Phase 4 | Pending |
| WORKFLOW-05 | Phase 4 | Pending |
| WORKFLOW-06 | Phase 4 | Pending |
| EXPORT-01 | Phase 5 | Pending |
| EXPORT-02 | Phase 5 | Pending |
| EXPORT-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: March 28, 2026*
*Last updated: March 28, 2026 after roadmap creation*
