---
phase: 3
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-20
---

# Phase 3 — Validation Strategy

> Derived from `03-RESEARCH.md` § Validation Architecture.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.0.5 + `node:sqlite` (in-memory, applies `migrations/` + `seed/`) |
| **Config file** | `vitest.config.ts` (Wave 0) |
| **Quick run command** | `npx vitest run tests/db.test.ts` |
| **Full suite command** | `npm run lint && npm run typecheck && npm test && npm run build` |
| **Estimated runtime** | ~60 seconds |

## Sampling Rate

- **After every task commit:** `npx vitest run <touched test file>`
- **After every plan wave:** full suite command
- **Before `/gsd:verify-work`:** full suite green + human Cloudflare live check recorded (or recorded as not done)

## Per-Task Verification Map

| Requirement | Behavior | Test Type | Automated Command | Status |
|-------------|----------|-----------|-------------------|--------|
| FOUND-01 | dev/build/lint/test run | smoke | `npm run lint && npm run build` | ⬜ pending |
| FOUND-02 | token contrast thresholds; StatusBadge icon+label for all statuses | unit | `npx vitest run tests/contrast.test.ts tests/status.test.ts` | ⬜ pending |
| FOUND-03 | migrations+seed load; role read/write matrix in the domain layer | integration | `npx vitest run tests/db.test.ts tests/seed.test.ts tests/authz.test.ts tests/domain.test.ts tests/db-boundary.test.ts` | ⬜ pending |
| FOUND-04 | overlap -> VENUE_CLASH trigger; adjacent ok; cancelled/draft ignored | integration | `npx vitest run tests/db.test.ts -t clash` | ⬜ pending |
| FOUND-05 | duplicate (event,user) -> unique violation (ALREADY_REGISTERED); re-register after cancel; waitlist + promote | integration | `npx vitest run tests/db.test.ts -t registration` | ⬜ pending |
| FOUND-06/07 | `homeFor(role)` and demo-gate logic; real login | unit + manual | `npx vitest run tests/auth.test.ts` | ⬜ pending |

## Wave 0 Requirements

- [x] `vitest.config.ts`, `tests/helpers/sqlite.ts` (loader), `migrations/`, `seed/`, `scripts/hash-password.mjs`
- [x] `tests/db.test.ts`, `tests/seed.test.ts`, `tests/authz.test.ts`, `tests/domain.test.ts`, `tests/db-boundary.test.ts`, `tests/auth.test.ts`, `tests/contrast.test.ts`, `tests/status.test.ts`

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3 demo logins + 1 normal sign-in land in correct role home on the deployed Worker; remote trigger check; CPU | FOUND-06, FOUND-07 | Needs the team's Cloudflare account | `wrangler login`, `d1 create`, `npm run deploy`, click each demo button, sign in with email/password, `wrangler tail` for CPU. Status: deployed; remote triggers verified; demo logins verified via tail; password sign-in user-reported OK, no CPU figure |

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Wave 0 covers all missing references
- [ ] `nyquist_compliant: true` set after plan check

**Approval:** pending
