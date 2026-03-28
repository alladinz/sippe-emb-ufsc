---
phase: 1
slug: foundation-authentication
status: draft
nyquist_compliant: true
wave_0_complete: false
created: March 28, 2026
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit/integration) + Playwright (E2E) |
| **Config file** | vitest.config.ts / playwright.config.ts |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:all` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:all`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | SETUP | script | `ls package.json` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | DATA-02 | unit | `npx drizzle-kit check` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | AUTH-01 | unit | `npm run test:unit auth` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | AUTH-02 | unit | `npm run test:unit rbac` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 2 | AUTH-03 | e2e | `npx playwright test login` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` and `playwright` installation and configuration.
- [ ] `src/lib/db/__tests__/schema.test.ts` — stubs for DATA-02.
- [ ] `src/lib/auth/__tests__/rbac.test.ts` — stubs for AUTH-01 and AUTH-02.
- [ ] `tests/e2e/login.spec.ts` — Playwright test for session persistence (AUTH-03).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Multi-role UI display | AUTH-01 | Visual verification | Log in as each of the 4 roles and verify the role name/Portuguese localization appears correctly in the dashboard header. |
| Degree-scoping visual | AUTH-02 | Visual verification | Log in as a Coordinator and verify that the specific bachelor degree name (e.g., "Engenharia Aeroespacial") is visible on the dashboard. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-03-28
