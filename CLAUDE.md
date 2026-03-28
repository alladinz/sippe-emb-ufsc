<!-- GSD:project-start source:PROJECT.md -->
## Project

**StudyPlan Management System**

A web application for university teachers to create and manage semester Study Plans. It handles data entry for course details, methodology, and evaluation, and facilitates a review/approval workflow involving Department Coordinators, Department Chefs, and Secretaries.

**Core Value:** Streamlining the creation, review, and archiving of academic study plans to ensure consistency and compliance across the department.

### Constraints

- **Tech Stack**: [To be determined during research]
- **Timeline**: [To be determined]
- **Compatibility**: Must work in modern web browsers used by university staff.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | `^15.1.0` | Full-stack Framework | Industry standard for App Router, React 19 support, and Server Actions which simplify the review/approval workflow without boilerplate APIs. |
| **Drizzle ORM** | `^0.38.0` | Database ORM | Provides "zero-overhead" TypeScript inference and superior performance compared to Prisma. Essential for complex relational academic data. |
| **PostgreSQL** | `v16/17` | Relational Database | Necessary for structured academic data (prerequisites, course-to-plan mappings, version history). |
| **Better Auth** | `^1.3.0` | Auth & RBAC | Specifically chosen for its `organization` and `access-control` plugins which map perfectly to the University's Bachelor Degrees (8 organizations) and Roles (Teacher, Coordinator, Chef, Secretary). |
| **TypeScript** | `^5.7.0` | Language | Non-negotiable for managing the complex, nested types of a comprehensive Study Plan. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **React Hook Form** | `^7.54.0` | Form Management | Use for the comprehensive Teacher Form to handle complex validation states and nested fields (methodology, evaluation, cronogram). |
| **Zod** | `^3.24.0` | Schema Validation | Define the Study Plan schema once for database, API, and frontend form validation. |
| **@react-pdf/renderer** | `^4.2.0` | PDF Generation | Design the official Study Plan layout using React components; generates PDFs on the server for archiving or the client for previews. |
| **Tailwind CSS** | `^4.0.0` | Styling | High-performance CSS engine with CSS-first configuration, simplifying the UI development for administrative dashboards. |
| **shadcn/ui** | Latest | UI Components | Provides accessible, high-quality components like Data Tables for managing course lists and Dialogs for review actions. |
| **PapaParse** | `^5.4.1` | CSV Parsing | Handles the requirement for importing course codes and names from CSV files reliably on the client or server. |
| **date-fns** | `^4.1.0` | Date Utilities | Essential for calculating semester dates, evaluation deadlines, and cronogram timelines. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| **Turbopack** | Build Engine | Default dev engine in Next.js 15, providing near-instant HMR during complex UI development. |
| **Drizzle Kit** | Migration Tool | Handles database schema migrations and provides `drizzle-seed` for generating mock academic data. |
| **TanStack Query** | State Management | (Optional but recommended) for handling the caching of course lists and review queues if they grow large. |
## Installation
# Core
# Supporting
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Better Auth** | **Auth.js (v5)** | Use Auth.js if the university already has a complex custom OAuth2/OpenID provider that requires deep library customization. |
| **Drizzle ORM** | **Prisma** | Use Prisma if the team is not yet comfortable with SQL-like syntax and prefers a more abstracted DSL, at the cost of some performance. |
| **@react-pdf/renderer** | **Puppeteer** | Use Puppeteer if the PDF layout is extremely complex and requires features only available in a full headless browser (like complex CSS Grid or specific print media queries). |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **NextAuth v4** | Outdated for App Router, lacks native Server Action support, and has a more rigid RBAC model. | **Better Auth** or **Auth.js v5**. |
| **Redux** | Overkill for a workflow-based system where most state lives in the database. | **URL state** or **TanStack Query** for client-side data. |
| **React-PDF (the other one)** | `react-pdf` (the viewer) is often confused with `@react-pdf/renderer` (the generator). | **@react-pdf/renderer** for creating PDFs from scratch. |
## Stack Patterns by Variant
- Use **Better Auth Organizations Plugin** to group Teachers and Coordinators by Bachelor Degree.
- Use **Drizzle Transactional Updates** for state transitions (e.g., from `REVIEW` to `APPROVED`) to ensure data integrity during the review cycle.
- Use **PapaParse** on the client for immediate validation and feedback to the Teacher before submission.
## Version Compatibility
| Package | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@15.1.0` | `react@19.0.0` | Full support for new React features like `useActionState`. |
| `better-auth@1.3.0` | `drizzle-orm@0.38.0` | Native adapter support for Drizzle. |
| `@react-pdf/renderer@4.2.0` | `react@19.0.0` | Patched for React 19's context changes. |
## Sources
- [Google Search] — Verified 2025/2026 stable versions and industry trends for Next.js and Drizzle.
- [Better Auth Docs] — Verified organization plugin capabilities for RBAC (HIGH confidence).
- [Drizzle ORM Docs] — Verified performance benefits and serverless compatibility (HIGH confidence).
- [Next.js Blog] — Verified Next.js 15 features and React 19 stability (HIGH confidence).
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
