# Phase 4: Administrative Oversight - Research

**Researched:** March 30, 2026
**Domain:** Department Chef Oversight, Global Dashboard, Self-Approval Escalation
**Confidence:** HIGH

## Summary
Phase 4 focuses on providing the Department Chef with total visibility and "Super-Approver" capabilities. The core challenge is the "Self-Approval" problem (WORKFLOW-06), where a Coordinator who is also a Teacher cannot approve their own Study Plan. 

**Primary recommendation:** Implement **Explicit Escalation States** (e.g., `pending_chef_review`). When a Coordinator submits a plan for their own degree, the system automatically bypasses the standard review tier and sets the status to `pending_chef_review`, making it visible exclusively to the Department Chef.

<user_constraints>
## User Constraints (from REQUIREMENTS.md)

### Administrative Oversight
- **WORKFLOW-04**: Department Chef dashboard for oversight of all plans across all 8 degrees.
- **WORKFLOW-05**: Department Chef can override or delegate approval in case of coordinator absence (Super-Approver).
- **WORKFLOW-06**: Self-Approval detection: Plans submitted by a Teacher who is also a Coordinator for that degree are automatically escalated to the Department Chef.

### Traceability / Success Criteria (from ROADMAP.md)
1. Department Chef can see a summary of all study plans across all 8 degrees.
2. Department Chef can approve or reject any plan, overriding or filling in for a Coordinator.
3. Plans submitted by Coordinators for their own degrees are automatically routed to the Chef for approval.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WORKFLOW-04 | Global Dashboard | Single view querying `study_plans` without `organizationId` filtering (Chef role check). |
| WORKFLOW-05 | Super-Approver | Chef can perform `approve`/`reject` actions regardless of the `organizationId`. |
| WORKFLOW-06 | Escalation Logic | Submission logic checks `userId` vs `coordinatorId` for the target degree. |
</phase_requirements>

## Architecture Patterns

### Pattern 1: Escalation State Machine
Extend the state machine from Phase 3 to include the Chef tier:
- `submitted` -> `pending_review` (Standard)
- `submitted` -> `pending_chef_review` (Escalated via WORKFLOW-06)
- `pending_review` -> `pending_chef_review` (Manual escalation / WORKFLOW-05)

### Pattern 2: Global vs. Scoped Queries
- **Coordinator:** `db.select().from(studyPlans).where(eq(studyPlans.organizationId, userOrgId))`
- **Chef:** `db.select().from(studyPlans)` (No organization filter)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role-based Views | Separate sub-apps | Conditional Layouts | Roles share 90% of the UI (Table, Status Badges). |
| Escalation Alerts | Email system | Dashboard "High Priority" Section | Out-of-the-box visibility is better than external noise for 8 degrees. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| DB Schema | `study_plans` | Add `escalated` boolean or extend `status` enum. |
| Auth | `better-auth` | Verify "chefe" role is correctly mapped to RBAC. |

**Key insight:** The "Chef" role already exists in the auth configuration, so this phase is primarily about routing and state logic.

## Common Pitfalls

### Pitfall 1: Bypassing Validations
**What goes wrong:** Chef approves a plan that hasn't been fully filled out.
**How to avoid:** Shared validation logic (Zod) must be applied to BOTH Coordinator and Chef approval actions.

### Pitfall 2: Chef Fatigue
**What goes wrong:** Chef is overwhelmed by all 8 degrees.
**How to avoid:** Use a "Needs Attention" filter as the default view, showing only `submitted` and `pending_chef_review` plans.
