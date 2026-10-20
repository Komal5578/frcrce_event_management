---
phase: 4
slug: role-interfaces-parallel-wave
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-20
---

# Phase 4 — Validation Strategy

> Per-phase validation contract. Source: `04-RESEARCH.md` "Validation Architecture".

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest, node env, `node:sqlite` D1 shim |
| **Config file** | `vitest.config.ts` (frozen; includes `tests/**/*.test.ts`) |
| **Quick run command** | `npx vitest run tests/<role>` |
| **Full suite command** | `npm run lint && npm run typecheck && npm test && npm run build` |
| **Estimated runtime** | ~60 seconds |

## Sampling Rate

- **After every task:** `npx vitest run tests/<role>` (role under work)
- **After every wave:** full suite command
- **Before `/gsd:verify-work`:** full suite green, plus `npx opennextjs-cloudflare build`
- **Max feedback latency:** 90 seconds

## Per-Task Verification Map

Filled by the plans (each task carries an `<automated>` command). Requirement → test map:

| Requirement | Wave | Test Type | Automated Command |
|-------------|------|-----------|-------------------|
| COORD-01..07 | 0 (domain), 1 (4a) | unit | `npx vitest run tests/domain-phase4.test.ts tests/coordinator` |
| STUD-01..05 | 0 (domain), 1 (4b) | unit | `npx vitest run tests/domain-phase4.test.ts tests/student` |
| ADMIN-01..04 | 0 (domain), 1 (4c) | unit | `npx vitest run tests/domain-phase4.test.ts tests/admin` |

## Wave 0 Requirements

- [ ] `lib/domain` additions (new files only) and `advanceEvent`
- [ ] `tests/domain-phase4.test.ts`
- [ ] StatusBadge keys + tokens (registration, task, clash) with `tests/contrast.test.ts` passing
- No test framework install needed.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Each role's primary flow end-to-end, keyboard path, 44px targets, A-/A/A+ | all | No Playwright/jsdom installed; none can be added | `npm run db:reset && npm run dev`, use the `/login` demo buttons per role, follow the checklist in each role handoff |

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or a Wave 0 dependency
- [ ] No 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter after plan check

**Approval:** plan-checker passed 2026-10-20 (wave_0_complete stays false until 04-00 runs)
