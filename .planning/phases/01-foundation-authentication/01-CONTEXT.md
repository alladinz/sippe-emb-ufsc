# Phase 1: Foundation & Authentication - Context

**Gathered:** March 28, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the project foundation and role-based access control system. This includes project scaffolding, database setup, and a complete authentication flow for four distinct roles (Teacher, Coordinator, Department Chef, Secretary) across 8 specific bachelor degrees.

</domain>

<decisions>
## Implementation Decisions

### Localization & Branding
- **Language:** Interface must be 100% in Portuguese (Brazil).
- **Naming:** Use the official Portuguese names for the 8 bachelor degrees.
- **Theme:** Professional university administrative look (clean, high contrast).

### Authentication
- **Method:** Email and Password (standard `better-auth` flow).
- **SSO:** Deferred (university SSO integration is identified but out of scope for v1).
- **Session:** Persistent sessions across refreshes and tab closures.

### Role-Based Access Control (RBAC)
- **Roles:** Teacher (Professor), Coordinator (Coordenador), Department Chef (Chefe de Departamento), Secretary (Secretário(a) do Departamento).
- **Scoping:** Coordinators are strictly scoped to their assigned Bachelor Degree.
- **Degrees:**
  1. Bacharelado em Ciência e Tecnologia
  2. Engenharia Aeroespacial
  3. Engenharia Automotiva
  4. Engenharia Naval
  5. Engenharia de Transportes e Logística
  6. Engenharia Ferroviária e Metroviária
  7. Engenharia Mecatrônica
  8. Engenharia Civil de Infraestrutura

### Tech Stack (Locked)
- **Framework:** Next.js 15.1 (App Router).
- **Database:** PostgreSQL + Drizzle ORM.
- **Auth:** Better Auth (with Organization/Access Control plugins).
- **Validation:** Zod.
- **UI:** Tailwind CSS + shadcn/ui.

### Claude's Discretion
- Exact database schema field names (following project conventions).
- Layout of the login and landing pages.
- Choice of icons (Lucide React recommended).
- Specific shadcn/ui components to use for the initial dashboard shell.

</decisions>

<specifics>
## Specific Ideas

- "I want to be able to log in and immediately see my role and (if I'm a coordinator) which degree I'm responsible for."
- Seed data should include one test user for each role to facilitate immediate verification.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Core
- `.planning/PROJECT.md` — Overall project goals and requirements.
- `.planning/REQUIREMENTS.md` — Specific v1 requirements (AUTH-01, AUTH-02, AUTH-03, DATA-02).
- `.planning/ROADMAP.md` — Phase 1 goals and success criteria.

### Technical Research
- `.planning/research/SUMMARY.md` — Synthesized research on stack and architecture.
- `.planning/research/STACK.md` — Specific library versions and rationale.
- `.planning/research/ARCHITECTURE.md` — Component boundaries and data flow.
- `.planning/research/PITFALLS.md` — Authentication and permission pitfalls to avoid.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (Greenfield project).

### Established Patterns
- Use Next.js 15 Server Actions for all auth-related forms and state transitions.
- Use Drizzle Kit for all database migrations.

### Integration Points
- This phase is the root integration point for all future phases.

</code_context>

<deferred>
## Deferred Ideas

- University SSO/OAuth integration (Google/CAS).
- Teacher Study Plan Form (Phase 2).
- Review/Approval Workflow logic (Phase 3).
- PDF Export (Phase 5).

</deferred>

---

*Phase: 01-foundation-authentication*
*Context gathered: March 28, 2026*
