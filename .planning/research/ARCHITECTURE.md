# Architecture Patterns: StudyPlan Management System

**Domain:** Academic Workflow / Document Management
**Researched:** March 28, 2026
**Overall confidence:** HIGH

## Recommended Architecture

A **Three-Tier Web Architecture** is recommended for this greenfield project to ensure clear separation of concerns, ease of maintenance, and future scalability.

### Overview Diagram

```
[ Frontend: React/Next.js ] 
       |
       v
[ Backend: Node.js/Express or Python/FastAPI ]
       |
       +--- [ Workflow Engine (State Machine) ]
       +--- [ Auth & RBAC Service ]
       +--- [ Document Generator (PDF) ]
       +--- [ Notification Service ]
       |
       v
[ Database: PostgreSQL ]
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Syllabus Manager** | Handles CRUD for study plan data (course details, methodology, evaluation). | Database, Workflow Engine |
| **Workflow Engine** | Manages state transitions (Draft, Submitted, Approved, Rejected, Archived) and enforces transition rules. | Syllabus Manager, Auth Service, Notification Service |
| **Auth & RBAC Service** | Manages user identity and permissions (Teacher, Coordinator, Chef, Secretary). | All Backend Components |
| **Notification Service** | Sends alerts (email/in-app) when a plan changes state or requires attention. | Workflow Engine |
| **Document Generator** | Converts approved study plan data into standardized PDF format for archiving. | Syllabus Manager, Database |
| **Data Importer** | Processes CSV files to pre-populate course codes and names. | Syllabus Manager, Database |

### Data Flow

1.  **Creation**: Teacher fills form -> Data stored as `Draft` status in DB.
2.  **Submission**: Teacher triggers "Submit" -> Workflow Engine validates role and current state -> Updates status to `Pending Review` -> Notification Service alerts the relevant **Coordinator** for that degree.
3.  **Review**: Coordinator reviews -> Triggers "Approve" or "Reject" -> Workflow Engine updates status -> Notification Service alerts the **Teacher**.
    - If `Rejected`: Status becomes `Revision Required`. Teacher can edit and re-submit.
    - If `Approved`: Status becomes `Approved`.
4.  **Archiving**: Secretary views list of `Approved` plans -> Triggers "Archive" -> Workflow Engine updates status to `Archived` -> Document Generator creates PDF version and stores reference.
5.  **Oversight**: Department Chef accesses a dashboard that queries the Database for all plans across all statuses to monitor progress.

## Patterns to Follow

### Pattern 1: State Machine (Workflow Management)
**What:** Use an explicit finite state machine to manage the study plan lifecycle.
**When:** To prevent "illegal" transitions (e.g., archiving a draft) and simplify status logic.
**Example:**
```typescript
const syllabusStates = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  REVISION_REQUIRED: 'revision_required',
  APPROVED: 'approved',
  ARCHIVED: 'archived'
};

const transitions = {
  [syllabusStates.DRAFT]: ['submit'],
  [syllabusStates.PENDING_REVIEW]: ['approve', 'reject'],
  [syllabusStates.REVISION_REQUIRED]: ['submit'],
  [syllabusStates.APPROVED]: ['archive'],
};
```

### Pattern 2: Guard Conditions
**What:** Logic that checks if a user has the specific role and context (e.g., Coordinator of Degree X) before allowing a transition.
**Instead of:** Simple `isAdmin` checks.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded Roles
**What:** Scattering `if (user.role === 'teacher')` throughout the codebase.
**Why bad:** Makes the system brittle to role changes or additional degree-specific rules.
**Instead:** Use an RBAC middleware or a policy-based access control (PBAC) layer.

### Anti-Pattern 2: Blob Storage Only
**What:** Storing the entire study plan as a JSON blob or a PDF only.
**Why bad:** Prevents analytics, oversight reporting (Chef), and easy updates to specific sections.
**Instead:** Store structured data in relational tables with clear fields for search and reporting.

## Build Order Implications

1.  **Phase 1: Foundation (RBAC & Schema)**: Establish the users, roles, and the relational schema for course plans.
2.  **Phase 2: Data Entry (Teacher Form)**: Build the complex form for Teachers first, as this is the primary data source.
3.  **Phase 3: The Engine (Workflow)**: Implement the state transitions and basic logic for moving a plan from Draft to Submitted.
4.  **Phase 4: Reviewer Loop (Coordinator/Chef)**: Build the dashboards for review and oversight.
5.  **Phase 5: Output (PDF & Archive)**: Add the PDF generation and final archival step.

## Sources

- [State Machine Pattern for Workflows](https://medium.com/@koresar/state-machine-design-pattern-3574d30623a6)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
- [University Syllabus Management Case Studies](https://fullfabric.com/articles/syllabus-management-challenges)
- [Project PROJECT.md](/.planning/PROJECT.md)
