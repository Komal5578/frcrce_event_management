---
phase: 5
slug: cross-cutting
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-20
---

# Phase 5 - Validation Strategy

> Source: `05-RESEARCH.md` "Validation Architecture". Static guards in `tests/xcut/` plus a manual keyboard/text-size pass. Execution must not start until Phase 4 is verified and committed.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest, node env, `node:sqlite` D1 shim (`tests/helpers`) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/xcut` |
| **Full suite command** | `npm run lint && npm run typecheck && npm test && npm run build` |

## Sampling Rate

- **Per task:** `npx vitest run tests/xcut` (no per-task commits; one commit per phase)
- **Per wave:** full suite (05-05 may leave guards red by design; 05-06 turns them green)
- **Phase gate:** full suite green, then manual pass for all three roles at A- / A / A+

## Per-Task Verification Map

| Plan / Task | Wave | Req | Behavior | Automated command | Status |
|-------------|------|-----|----------|-------------------|--------|
| 05-01 T1 | 1 | XCUT-01 | `toCsv` quoting, injection guard, BOM, CRLF | `npx vitest run tests/xcut/csv.test.ts` | pending |
| 05-01 T2 | 1 | XCUT-01 | `buildReport` scope, counts only, CSV = rows; `listOverdueTasksForActor` scope | `npx vitest run tests/xcut/reports.test.ts tests/db-boundary.test.ts` | pending |
| 05-01 T3 | 1 | XCUT-02 | `computeAlerts` kinds/role/order; `splitAlerts` cap | `npx vitest run tests/xcut/alerts.test.ts` | pending |
| 05-02 T1 | 1 | XCUT-03 | PageError / EmptyState exist, no `error.message` | `npm run typecheck && npm run lint` | pending |
| 05-02 T2 | 1 | XCUT-03 | root not-found / error / global-error build | `npm run build` | pending |
| 05-02 T3 | 1 | XCUT-01 | print CSS appended, tokens untouched | `npx vitest run tests/contrast.test.ts tests/status.test.ts && npm run build` | pending |
| 05-03 T1 | 2 | XCUT-01 | Reports nav in admin + coordinator layouts | `npm run typecheck && npm run lint` | pending |
| 05-03 T2 | 2 | XCUT-01 | Reports pages + ReportView build | `npm run build` | pending |
| 05-03 T3 | 2 | XCUT-01 | export route auth (403s), headers, body = toCsv | `npx vitest run tests/xcut/export-route.test.ts` | pending |
| 05-04 T1 | 2 | XCUT-02 | AttentionList uses `splitAlerts` + `<details>` | `npm run typecheck && npm run lint` | pending |
| 05-04 T2 | 2 | XCUT-02 | alerts wired; every alert href is a real route | `npx vitest run tests/xcut/alert-links.test.ts tests/db-boundary.test.ts` | pending |
| 05-05 T1 | 3 | XCUT-03..06 | static guards: states, targets (AppShell, rem, focus-visible), consistency, confirm (+ success feedback) | `npx vitest run tests/xcut/states.test.ts tests/xcut/targets.test.ts tests/xcut/consistency.test.ts tests/xcut/confirm.test.ts` | pending |
| 05-05 T2 | 3 | XCUT-04 | checklist doc, blank results | `test -f docs/validation/a11y-keyboard-pass.md` | pending |
| 05-06 T1 | 4 | XCUT-03..06 | fixes until guards green | `npx vitest run tests/xcut && npm test && npm run build` | pending |
| 05-06 T2 | 4 | XCUT-01, 04, 06 | print preview, keyboard + text-size pass | manual (team) | pending |

## Wave 0 Requirements

- [ ] `lib/csv.ts`, `lib/domain/reports.ts`, `lib/domain/alerts.ts` with signatures (05-01)
- [ ] Confirm `route.ts` + D1 works under `npm run preview` (05-03 T3, A1)
- [ ] Re-verify Phase 4 export names and `_lib` view models (first task of each plan; notes in `05-REVERIFY-0X.md`)
- [ ] `docs/validation/a11y-keyboard-pass.md` with blank results column (05-05 T2)

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Instructions |
|----------|-------------|------------|--------------|
| Keyboard-only primary flow per role at A-/A/A+ | XCUT-04, XCUT-06 | no browser test runner in repo | Follow UI-SPEC key path; team records Yes/No |
| Print preview of report | XCUT-01 | visual | Ctrl+P on report page |
| Time to find problem | XCUT-02 | needs real testers | Team measures in Phase 6; AI records no figures |

## Sign-off

- [x] All tasks have an automated verify or an explicit manual instruction
- [x] `nyquist_compliant: true` set after plan revision

**Approval:** pending plan-checker re-run
