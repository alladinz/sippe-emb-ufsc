# Stack Research

**Domain:** University Study Plan Management System
**Researched:** March 2026
**Confidence:** HIGH

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

```bash
# Core
npx create-next-app@latest . --typescript --tailwind --eslint
npm install drizzle-orm better-auth zod react-hook-form @hookform/resolvers

# Supporting
npm install @react-pdf/renderer papaparse date-fns lucide-react clsx tailwind-merge

# Dev dependencies
npm install -D drizzle-kit
```

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

**For Multi-Role Workflow:**
- Use **Better Auth Organizations Plugin** to group Teachers and Coordinators by Bachelor Degree.
- Use **Drizzle Transactional Updates** for state transitions (e.g., from `REVIEW` to `APPROVED`) to ensure data integrity during the review cycle.

**For CSV Imports:**
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

---
*Stack research for: University Study Plan Management System*
*Researched: March 2026*
