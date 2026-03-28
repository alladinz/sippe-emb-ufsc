# Project Research Summary

**Project:** StudyPlan Management System
**Domain:** Academic Workflow / Document Management
**Researched:** March 2026
**Confidence:** HIGH

## Executive Summary

The StudyPlan Management System is a specialized academic workflow application designed to modernize the creation, review, and archival of university study plans. Experts build such systems using a structured, role-based workflow driven by a finite state machine to ensure data integrity and compliance with institutional standards. The recommended approach utilizes Next.js 15 for its robust full-stack capabilities, paired with Drizzle ORM and Better Auth to manage complex academic relationships and permissions across eight bachelor degrees.

The research highlights critical architectural patterns, specifically the importance of state-based immutability to prevent unauthorized edits post-approval and the need for a "Super-Approver" role (Department Chef) to resolve potential deadlocks. By prioritizing a "Teacher-First" data entry experience with auto-save and persistent drafts, the system mitigates common pitfalls like form fatigue and data loss, ensuring a reliable transition from initial draft to official PDF archive.

Key risks identified include the "Vanishing Approver" deadlock, where a plan becomes stuck if a coordinator is unavailable, and the "Late Edit" leak, where a plan is modified after approval. These are mitigated through a hierarchical RBAC model (Department Chef override) and state-locked form permissions.

## Key Findings

### Recommended Stack

The stack is optimized for Next.js 15 and React 19, focusing on type safety and performance. Drizzle ORM provides a lightweight, high-performance interface for complex relational academic data, while Better Auth's organization plugin perfectly maps to the university's degree structure.

**Core technologies:**
- **Next.js (v15.1.0)**: Full-stack framework — Industry standard for App Router and Server Actions.
- **Drizzle ORM (v0.38.0)**: Database ORM — Zero-overhead TypeScript inference for relational data.
- **PostgreSQL (v16/17)**: Relational Database — Necessary for structured academic versioning.
- **Better Auth (v1.3.0)**: Auth & RBAC — Native organization/access-control plugins for university roles.
- **@react-pdf/renderer (v4.2.0)**: PDF Generation — Generates official university-standard layouts.

### Expected Features

The system must satisfy four distinct roles (Teacher, Coordinator, Chef, Secretary) across a multi-step lifecycle.

**Must have (table stakes):**
- **Multi-role Authentication (RBAC)** — Essential for separate responsibilities.
- **Comprehensive Study Plan Form** — Manual entry of syllabus, methodology, and evaluation.
- **Review & Approval Workflow** — State management (Draft, Pending, Approved, Rejected).
- **Standardized PDF Export** — Delivers the final official document.
- **Revision Feedback System** — Enables inline communication between roles.

**Should have (competitive):**
- **CSV Data Import** — Reduces data entry errors for course codes/names.
- **Status Dashboard** — Provides visibility into process bottlenecks for the Chef.
- **Searchable Archive** — Efficient retrieval of past plans by the Secretary.

**Defer (v2+):**
- **Digital Signature / QR Code** — Formal verification (high complexity).
- **Library Catalog Integration** — Automated bibliography suggestions.
- **MEC/Accreditation Reports** — Aggregated institutional compliance data.

### Architecture Approach

A Three-Tier Web Architecture with an explicit Finite State Machine for workflow management. The system prioritizes data integrity over flexibility to ensure that archived plans are legally and academically sound.

**Major components:**
1. **Workflow Engine** — Manages state transitions (Draft -> Approved) and transition rules.
2. **Syllabus Manager** — Handles complex CRUD for nested academic data.
3. **Document Generator** — Converts approved data into standardized PDFs.
4. **Auth & RBAC Service** — Enforces role-based access across degrees.

### Critical Pitfalls

1. **"Vanishing Approver" Deadlock** — Avoided by implementing a "Department Chef" super-approver role for overrides.
2. **"Late Edit" Permission Leak** — Avoided by locking the form (Read-Only) once submitted or approved.
3. **Self-Approval Conflict** — Avoided by forwarding plans to the Department Chef if the submitter is also the coordinator.
4. **Version Confusion** — Avoided by maintaining immutable snapshots of each submission.
5. **PDF Formatting Issues** — Avoided by using server-side rendering and Unicode-compliant fonts.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Data Entry
**Rationale:** Establishes the relational schema and the primary data source (Teacher Form) before implementing the workflow.
**Delivers:** Core database, RBAC initialization, Teacher Form with auto-save, and CSV import utility.
**Addresses:** Study Plan Form, RBAC, CSV Data Import.
**Avoids:** Form Fatigue & Data Loss, CSV Mapping Errors.

### Phase 2: Workflow & Review Loop
**Rationale:** Implements the core business logic and state transitions required for the approval process.
**Delivers:** State Machine, Coordinator/Chef dashboards, and the Feedback/Revision system.
**Uses:** Better Auth Organizations plugin, Drizzle Transactional Updates.
**Implements:** Workflow Engine, Auth & RBAC Service.

### Phase 3: Output & Archiving
**Rationale:** Finalizes the process by delivering the official artifact (PDF) and long-term storage capabilities.
**Delivers:** PDF generation engine, standardized university templates, and the Searchable Archive.
**Addresses:** Standardized PDF Export, Searchable Archive.
**Avoids:** Version Confusion, PDF Formatting "Explosion".

### Phase Ordering Rationale

- **Data-First Dependency:** The workflow and output cannot exist without the structured data from the Teacher Form.
- **Role-Based Isolation:** Grouping by role (Teacher first, then Reviewers, then Secretary) allows for iterative validation.
- **Pitfall Mitigation:** The hierarchical review logic is built into Phase 2 to immediately solve the "Vanishing Approver" risk.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (PDF Export):** Complex layout requirements and cross-platform font rendering may require specific library configuration research.
- **Phase 1 (CSV Import):** University CSV formats can be inconsistent; needs validation of sample data.

Phases with standard patterns (skip research-phase):
- **Phase 1 (RBAC & Form):** Well-documented Next.js and Better Auth patterns.
- **Phase 2 (Workflow):** Standard finite state machine implementation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on official Next.js 15, Drizzle, and Better Auth docs. |
| Features | HIGH | Aligns with standard academic administration patterns. |
| Architecture | HIGH | Proven state machine pattern for document workflows. |
| Pitfalls | HIGH | Specific university domain risks well-documented in case studies. |

**Overall confidence:** HIGH

### Gaps to Address

- **Library Integration**: Deferred to v2+; needs university API documentation if prioritized.
- **MEC Compliance**: The exact fields for Brazilian accreditation (MEC) should be validated with the department before Phase 1 is finalized.

## Sources

### Primary (HIGH confidence)
- Next.js 15 / Better Auth Docs — Verified RBAC and framework capabilities.
- Drizzle ORM Docs — Verified relational performance and type safety.
- MEC (Brazil) Higher Education Requirements — Informs table stakes for accreditation.

### Secondary (MEDIUM confidence)
- Academic Workflow Case Studies — Verified "Vanishing Approver" and "Late Edit" risks.
- PDF Rendering Benchmarks — Informs choice of server-side @react-pdf/renderer.

---
*Research completed: March 2026*
*Ready for roadmap: yes*
