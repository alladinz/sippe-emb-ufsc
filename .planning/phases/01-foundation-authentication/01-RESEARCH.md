# Phase 1: Foundation & Authentication - Research

**Researched:** March 28, 2026
**Domain:** Authentication, RBAC, Database Schema, Next.js 15
**Confidence:** HIGH

## Summary

This research establishes the foundational infrastructure for the StudyPlan Management System. Using Next.js 15, Drizzle ORM, and Better Auth, we implement a robust role-based access control (RBAC) system that handles four distinct university roles across eight specific bachelor degrees. The research focuses on leveraging the Better Auth `organization` plugin to map coordinators to their respective degrees and using Drizzle ORM for high-performance relational data management.

**Primary recommendation:** Use Better Auth with the `organization` and `access-control` plugins to handle role-based permissions, and define the 8 bachelor degrees as static Organizations during initialization.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Framework:** Next.js 15.1 (App Router).
- **Database:** PostgreSQL + Drizzle ORM.
- **Auth:** Better Auth (with Organization/Access Control plugins).
- **Validation:** Zod.
- **UI:** Tailwind CSS + shadcn/ui.
- **Language:** Interface must be 100% in Portuguese (Brazil).
- **Naming:** Use the official Portuguese names for the 8 bachelor degrees.
- **Theme:** Professional university administrative look (clean, high contrast).
- **Method:** Email and Password (standard `better-auth` flow).
- **SSO:** Deferred (university SSO integration is out of scope for v1).
- **Session:** Persistent sessions across refreshes and tab closures.
- **Roles:** Teacher (Professor), Coordinator (Coordenador), Department Chef (Chefe de Departamento), Secretary (Secretário(a) do Departamento).
- **Scoping:** Coordinators are strictly scoped to their assigned Bachelor Degree.

### the agent's Discretion
- Exact database schema field names (following project conventions).
- Layout of the login and landing pages.
- Choice of icons (Lucide React recommended).
- Specific shadcn/ui components to use for the initial dashboard shell.

### Deferred Ideas (OUT OF SCOPE)
- University SSO/OAuth integration (Google/CAS).
- Teacher Study Plan Form (Phase 2).
- Review/Approval Workflow logic (Phase 3).
- PDF Export (Phase 5).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can log in with RBAC (Teacher, Coordinator, Chef, Secretary). | Better Auth Access Control plugin provides standard RBAC mapping for 4 roles. |
| AUTH-02 | Organization-based scoping: Coordinators mapped to 8 degrees. | Better Auth Organizations plugin allows scoping memberships to specific degrees. |
| AUTH-03 | Secure session management (persistent). | `nextCookies` plugin in Better Auth ensures session persistence in Next.js 15. |
| DATA-02 | Relational DB storage using Drizzle ORM. | Drizzle ORM schema for study plans and academic relationships (Drizzle v0.45.2). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Next.js** | `15.1.0` | Full-stack Framework | Industry standard for App Router and React 19 support. |
| **Better Auth** | `1.5.6` | Auth & RBAC | Native organization and access-control plugins map perfectly to university roles. |
| **Drizzle ORM** | `0.45.2` | Database ORM | High-performance SQL-like interface with zero-overhead TypeScript inference. |
| **PostgreSQL** | `18.3` | Database | Relational database required for structured academic data and versioning. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zod** | `3.24.2` | Validation | All forms and database schema validation. |
| **shadcn/ui** | Latest | UI Components | Dashboard shell, login forms, and tables. |
| **Lucide React** | Latest | Icons | Professional administrative UI iconography. |
| **date-fns** | `4.1.0` | Date Utilities | Handling semester dates and cronograms. |

**Installation:**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint
npm install better-auth drizzle-orm zod date-fns lucide-react clsx tailwind-merge
npm install -D drizzle-kit vitest @testing-library/react @vitejs/plugin-react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/             # Login/Signup pages
│   ├── (dashboard)/        # Role-based dashboards
│   │   ├── professor/      # Teacher UI
│   │   ├── coordenador/    # Coordinator UI
│   │   ├── chefe/          # Chef UI
│   │   └── secretario/     # Secretary UI
│   └── api/auth/           # Better Auth endpoints
├── components/             # Shared UI components
├── db/                     # Drizzle schema and migrations
├── lib/
│   ├── auth/               # Better Auth config and client
│   └── validations/        # Zod schemas for Study Plans
```

### Pattern 1: Multi-Role Scoping
**What:** Define roles and organizations in a shared file for client/server consistency.
**When to use:** All permission checks throughout the application.
**Example:**
```typescript
// src/lib/auth/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

export const statements = {
  ...defaultStatements,
  study_plan: ["create", "update", "submit", "approve", "reject", "archive", "view_all"],
} as const;

export const ac = createAccessControl(statements);

export const professor = ac.newRole({
  study_plan: ["create", "update", "submit"],
});

export const coordenador = ac.newRole({
  study_plan: ["approve", "reject", "update"], // update for feedback
});

// Chef/Secretary roles are typically global and can be handled via access-control plugin
```

### Anti-Patterns to Avoid
- **Hardcoding Roles:** Don't check `user.role === 'admin'`. Use `auth.api.hasPermission` for specific actions.
- **Fragmented Metadata:** Don't store degree information in user metadata; use the `organization` table.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session Management | Custom cookies/JWT | Better Auth | Handles security edge cases, rotation, and persistence natively. |
| Role-based Scoping | Custom middleware | Better Auth Org Plugin | Native support for organizations (degrees) and role-based permissions. |
| Form State | Custom `useState` | `useActionState` | React 19 standard for server actions with validation and loading states. |

## Common Pitfalls

### Pitfall 1: Session Expiry Confusion
**What goes wrong:** User is logged out mid-form submission due to short sessions.
**How to avoid:** Configure `session.expiresIn` to a reasonable administrative duration (e.g., 7 days) and ensure `nextCookies` is enabled.

### Pitfall 2: Async `headers()` in Next.js 15
**What goes wrong:** Calling `headers()` synchronously in a Server Action or Component.
**How to avoid:** Always `await headers()` before passing to Better Auth API calls.

## Code Examples

### Better Auth Configuration
```typescript
// src/lib/auth/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, nextCookies } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    plugins: [
        nextCookies(),
        organization({
            // Organization configuration for 8 degrees
        })
    ],
    emailAndPassword: { enabled: true }
});
```

### Study Plan Schema (Drizzle)
```typescript
// src/db/schema.ts
import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";

export const studyPlans = pgTable("study_plans", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id").notNull(), // Bachelor Degree
    teacherId: text("teacher_id").notNull(),
    courseCode: text("course_code").notNull(),
    courseName: text("course_name").notNull(),
    status: text("status").notNull().default("draft"),
    content: jsonb("content").notNull(),
    version: text("version").notNull().default("1"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth v4 | Better Auth | 2024/2025 | native Next.js 15 support, superior RBAC/Org plugins. |
| Prisma | Drizzle ORM | 2024 | Lower latency, zero-overhead TypeScript inference. |
| hardcoded i18n | Typed Locales | 2025 | Ensures 100% Portuguese compliance with type safety. |

## Open Questions

1. **Initial Seed Strategy:**
   - What we know: We need 8 degrees and 4 test users.
   - What's unclear: Should we use `drizzle-seed` or a custom script in Phase 1?
   - Recommendation: Use a custom script (`seed.ts`) to ensure Better Auth hashes are correctly generated for test users.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 24.14.1 | — |
| npm | Package Manager | ✓ | 11.11.0 | — |
| PostgreSQL | Database | ✓ | 18.3 | Use Docker (not detected) |

**Missing dependencies with no fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User login with roles | integration | `npm test src/lib/auth` | ❌ Wave 0 |
| AUTH-02 | Scoped degree access | integration | `npm test src/lib/auth` | ❌ Wave 0 |
| DATA-02 | Drizzle schema integrity | unit | `npm test src/db` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Framework setup.
- [ ] `src/lib/auth/__tests__/auth.test.ts` — RBAC verification.
- [ ] `src/db/__tests__/schema.test.ts` — DB integrity checks.

## Sources

### Primary (HIGH confidence)
- [Better Auth Docs] - Organization & RBAC plugins.
- [Next.js 15 Release Notes] - App Router & Server Actions.
- [Drizzle ORM Docs] - Postgres Adapter & Schema definition.

### Secondary (MEDIUM confidence)
- [React 19 Docs] - `useActionState` and form handling.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified current stable versions.
- Architecture: HIGH - Matches Next.js 15 best practices.
- Pitfalls: HIGH - Addresses known Next.js 15 and university workflow risks.

**Research date:** March 28, 2026
**Valid until:** April 27, 2026
