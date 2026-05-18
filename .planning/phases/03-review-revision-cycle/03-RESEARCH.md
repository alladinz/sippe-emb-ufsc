# Phase 3: Review & Revision Cycle - Research

**Researched:** March 29, 2026
**Domain:** Workflow State Machine, Coordinator Dashboards, Feedback Loop
**Confidence:** HIGH

## Summary
Phase 3 focuses on the core document lifecycle of a Study Plan. While basic "submitted" and "rejection" states have been partially implemented, this phase formalizes the state machine, ensures document immutability during review/approval, and provides the necessary dashboard logic for Coordinators.

**Primary recommendation:** Implement a robust state transition system using Server Actions that explicitly check permissions and valid previous states. Use the native HTML `<fieldset disabled>` attribute to lock form fields based on the Study Plan's status, ensuring that Teachers cannot modify a plan while it is in review or after it has been approved.

<user_constraints>
## User Constraints (from REQUIREMENTS.md)

### Review & Approval Workflow
- **WORKFLOW-01**: Document lifecycle state machine: Draft -> Submitted -> Pending Review -> Approved/Rejected -> Archived.
- **WORKFLOW-02**: Coordinator can view a dashboard of plans for their assigned degree and approve or reject them.
- **WORKFLOW-03**: Rejection requires mandatory feedback, which is returned to the Teacher for revision.

### Traceability / Success Criteria (from ROADMAP.md)
1. Coordinator can view a dashboard of plans specifically for their assigned degree.
2. Rejecting a plan requires mandatory feedback that is visible to the Teacher.
3. Teacher can edit a rejected plan and re-submit it for another review cycle.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WORKFLOW-01 | State machine (Draft->Submitted->Pending Review->Approved/Rejected->Archived) | DB `status` enum expansion and transition logic in Server Actions. |
| WORKFLOW-02 | Coordinator Dashboard | Filtering `study_plans` by `organizationId` and `status` in Next.js 15 Server Components. |
| WORKFLOW-03 | Rejection Feedback Loop | `feedback` text field in `study_plans` table; mandatory Zod validation in rejection dialog. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.1.0 | Framework | App Router and Server Actions for workflow logic. |
| Drizzle ORM | 0.45.2 | DB Operations | Type-safe state transitions and filtering. |
| Shadcn/UI | Latest | UI Components | Dialog for feedback, Badge for status, Table for dashboard. |
| Lucide React | 1.7.0 | Icons | Status indicators (Clock, CheckCircle, XCircle). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| react-hook-form | 7.72.0 | Form Control | Handling feedback text input with validation. |
| zod | 4.3.6 | Validation | Enforcing mandatory feedback length (e.g., > 5 chars). |

**Installation:**
No new packages required; already present in `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── dashboard/
│       └── coordinator/
│           ├── page.tsx       # Coordinator Dashboard (WORKFLOW-02)
│           └── actions.ts     # Approve/Reject Actions (WORKFLOW-03)
├── components/
│   └── forms/
│       └── study-plan-form/
│           └── index.tsx      # Multi-tab form with Locking Logic
└── lib/
    └── schemas/
        └── study-plan.ts      # Updated Zod Enum for State Machine
```

### Pattern 1: Form Locking (Immutability)
To prevent edits during review or after approval, wrap form sections in a `<fieldset disabled={isReadOnly}>`.
- `isReadOnly` is true if `status` is `submitted`, `pending_review`, or `approved`.
- `isReadOnly` is false if `status` is `draft` or `rejected`.

### Pattern 2: Explicit State Transitions
Instead of a generic `update` action, use specific actions for state changes to enforce business rules:
- `submitStudyPlanAction`: Transitions `draft` | `rejected` -> `submitted`.
- `startReviewAction`: Transitions `submitted` -> `pending_review`.
- `approveStudyPlanAction`: Transitions `pending_review` -> `approved`.
- `rejectStudyPlanAction`: Transitions `pending_review` -> `rejected` (requires feedback).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State management | Custom state machine lib | Drizzle string enum + Server Actions | Simple workflow doesn't need XState complexity. |
| Feedback Modal | Custom Portal | Shadcn/UI Dialog | Consistent styling and accessibility out of the box. |
| Input disabling | Prop-drilling `disabled` | `<fieldset disabled={...}>` | Native HTML feature; less error-prone and cleaner code. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `study_plans.status` | Existing `submitted` records can stay; no migration needed. |
| Live service config | None | Verified (Internal workflow). |
| OS-registered state | None | Verified. |
| Secrets/env vars | None | Verified. |
| Build artifacts | None | Verified. |

**Key insight:** The `status` field in Drizzle is `text`, not a native PG enum, so extending it is zero-cost in terms of migrations.

## Common Pitfalls

### Pitfall 1: Double Approval / Concurrent Reviews
**What goes wrong:** Two coordinators (if allowed) or accidental double-click leads to inconsistent state.
**How to avoid:** Use a "Start Review" step to claim the document and check `status === 'submitted'` before transitioning to `pending_review`.

### Pitfall 2: Feedback Visibility
**What goes wrong:** Teachers edit a rejected plan but don't see WHY it was rejected.
**How to avoid:** Ensure the feedback is rendered prominently at the top of the `StudyPlanForm` when `status === 'rejected'`.

### Pitfall 3: Submitting Empty Plans
**What goes wrong:** Teachers submit a blank plan as soon as it's created.
**How to avoid:** Ensure `isValid` from React Hook Form is checked before allowing the "Submit" action (WORKFLOW-01/FORM-04 integration).

## Code Examples

### Form Locking in Next.js 15
```tsx
// src/components/forms/study-plan-form/index.tsx
const isReadOnly = initialData.status !== "draft" && initialData.status !== "rejected";

return (
  <form ...>
    <fieldset disabled={isReadOnly}>
       {/* All inputs here are automatically disabled if read-only */}
       <TabsContent value="geral">...</TabsContent>
       <TabsContent value="pedagogia">...</TabsContent>
    </fieldset>
  </form>
);
```

### Secured State Transition
```typescript
// src/app/dashboard/coordinator/actions.ts
export async function approveStudyPlanAction(id: string) {
  const { plan } = await verifyCoordinator(id);
  
  if (plan.status !== 'pending_review' && plan.status !== 'submitted') {
    throw new Error("O plano deve estar em revisão para ser aprovado.");
  }

  await db.update(studyPlans)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(studyPlans.id, id));
  
  revalidatePath("/dashboard/coordinator");
}
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data layer | ✓ | 15.4 | — |
| Node.js | Runtime | ✓ | 20.x | — |
| npm | Package management| ✓ | 10.x | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:all` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORKFLOW-01 | Status transitions (D->S->PR->A/R) | unit | `vitest tests/workflow.test.ts` | ❌ Wave 0 |
| WORKFLOW-02 | Coordinator dashboard filters | e2e | `npx playwright test tests/e2e/coordinator.spec.ts` | ❌ Wave 0 |
| WORKFLOW-03 | Rejection requires feedback | e2e | `npx playwright test tests/e2e/review-loop.spec.ts` | ❌ Wave 0 |

## Sources

### Primary (HIGH confidence)
- `src/db/schema.ts` - Verified current state of the database.
- `src/app/dashboard/coordinator/page.tsx` - Verified existing coordinator dashboard.
- `src/app/dashboard/study-plans/[id]/preview/review-actions.tsx` - Verified existing review logic.

### Secondary (MEDIUM confidence)
- Next.js 15 / React 19 official docs for `useActionState` and Server Actions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core libraries already established and functional.
- Architecture: HIGH - State machine pattern is standard for this domain.
- Pitfalls: HIGH - Common multi-user workflow issues identified.

**Research date:** March 29, 2026
**Valid until:** April 29, 2026
