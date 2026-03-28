# Roadmap: StudyPlan Management System

## Phases

- [ ] **Phase 1: Foundation & Authentication** - Establish core infrastructure and role-based access control.
- [ ] **Phase 2: Teacher Data Entry** - Build the comprehensive Study Plan form with auto-save and CSV import.
- [ ] **Phase 3: Review & Revision Cycle** - Implement the state machine and coordinator review workflow.
- [ ] **Phase 4: Administrative Oversight** - Provide department-wide visibility and super-approver capabilities for the Chef.
- [ ] **Phase 5: Export & Archiving** - Finalize with PDF generation and immutable document storage.

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Establish the project foundation and role-based access control system.
**Depends on**: Nothing
**Requirements**: AUTH-01, AUTH-02, AUTH-03, DATA-02
**Success Criteria** (what must be TRUE):
  1. User can log in with a designated role (Teacher, Coordinator, Chef, Secretary).
  2. Coordinator is restricted to their specific bachelor degree scope upon login.
  3. User session persists across browser refreshes and tab closures.

**Plans:** 3 plans
- [ ] 01-foundation-authentication-01.md — Project scaffolding, testing framework, and Drizzle ORM setup.
- [ ] 01-foundation-authentication-02.md — Better Auth configuration with RBAC and Organization plugins.
- [ ] 01-foundation-authentication-03.md — Localized Login UI, dashboard shell, and database seeding.

**UI hint**: yes

### Phase 2: Teacher Data Entry
**Goal**: Enable Teachers to efficiently create and manage study plan data.
**Depends on**: Phase 1
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, DATA-01
**Success Criteria** (what must be TRUE):
  1. Teacher can start a new Study Plan and see it saved as a "Draft".
  2. Teacher can import course data from a CSV file to pre-fill course codes and names.
  3. Form fields are validated in real-time using Zod, preventing invalid submissions.
  4. Changes are saved automatically in the background without manual intervention.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Review & Revision Cycle
**Goal**: Implement the core approval workflow and feedback loop between Teachers and Coordinators.
**Depends on**: Phase 2
**Requirements**: WORKFLOW-01, WORKFLOW-02, WORKFLOW-03
**Success Criteria** (what must be TRUE):
  1. Coordinator can view a dashboard of plans specifically for their assigned degree.
  2. Rejecting a plan requires mandatory feedback that is visible to the Teacher.
  3. Teacher can edit a rejected plan and re-submit it for another review cycle.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Administrative Oversight
**Goal**: Provide the Department Chef with oversight and override capabilities to ensure process continuity.
**Depends on**: Phase 3
**Requirements**: WORKFLOW-04, WORKFLOW-05, WORKFLOW-06
**Success Criteria** (what must be TRUE):
  1. Department Chef can see a summary of all study plans across all 8 degrees.
  2. Department Chef can approve or reject any plan, overriding or filling in for a Coordinator.
  3. Plans submitted by Coordinators for their own degrees are automatically routed to the Chef for approval.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Export & Archiving
**Goal**: Generate official artifacts and secure long-term record keeping.
**Depends on**: Phase 4
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03
**Success Criteria** (what must be TRUE):
  1. Approved Study Plans can be downloaded as PDF files matching the university template.
  2. Department Secretary can search and access a read-only archive of all approved plans.
  3. Approved plans are locked for editing, ensuring the integrity of the archived record.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 0/3 | Not started | - |
| 2. Teacher Data Entry | 0/1 | Not started | - |
| 3. Review & Revision Cycle | 0/1 | Not started | - |
| 4. Administrative Oversight | 0/1 | Not started | - |
| 5. Export & Archiving | 0/1 | Not started | - |
