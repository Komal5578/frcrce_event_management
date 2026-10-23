---
phase: 11-role-screens
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-23
---

# Phase 11 — Validation Strategy

## Execution Gate

Phase 10 is complete per `.planning/STATE.md` and `.planning/phases/10-design-system-shell/10-SUMMARY.md`; its shared UI shell, API rewrite, generated OpenAPI types, and `frontend/lib/api.ts` are available. Execute the Phase 11 plans strictly in order: Student → Coordinator → Admin. Each role's browser gate must pass before starting the next plan.

## Automated Checks

| Scope | Command | Pass condition |
|---|---|---|
| After each role implementation task | `cd frontend && npm run lint && npm run typecheck && npm test` | All commands exit successfully. |
| End of each role plan | `cd frontend && npm run lint && npm run typecheck && npm test && npm run build` | Full frontend checks and production build pass. |
| Backend behavior regression | `cd backend && ruff check && pytest` | Existing API/domain tests pass; no new domain rules are introduced by this phase. |

## Browser and Accessibility Checks

| Requirement | Method | Evidence |
|---|---|---|
| ROLE-01 / TT-S1 | Student discovers, filters, opens detail, registers or waitlists, then sees My Events | Actual outcome and screenshots in `11-SUMMARY.md`; no invented timings. |
| ROLE-02 / TT-C1 | Coordinator creates from template, selects free venue, requests resource, submits, and sees Pending approval | Actual outcome and screenshots in `11-SUMMARY.md`; no invented timings. |
| ROLE-03 / TT-A1 | Admin identifies seeded pending clash, approves valid request, and returns clashing request with reason | Actual outcome and screenshots in `11-SUMMARY.md`. |
| ROLE-04 | For each role, keyboard-only path, focus visibility, 44px controls, A+ layout, status icon+text+colour, empty/loading/error states, plain-language copy | Per-role checklist and keyboard run notes in `11-SUMMARY.md`; final results in `11-VERIFICATION.md`. |

Browser runs use local seeded accounts and existing tooling; do not add a browser dependency just for this phase. If no local browser automation is available, report the manual browser run honestly and retain the project's test commands.

## Coverage

- `ROLE-01`: Plan 01, Student screens ST-01..06.
- `ROLE-02`: Plan 02, Coordinator screens CO-01..08 and secondary routes.
- `ROLE-03`: Plan 03, Admin screens AD-01..06, including live seeded clash.
- `ROLE-04`: checked within each role plan and recorded phase-wide in `11-VERIFICATION.md`.

## Plan Source Audit

| Source | In-scope items | Coverage |
|---|---|---|
| Roadmap goal | Three roles complete their primary task end to end in browser on the new design and FastAPI | All plans; ordered Student → Coordinator → Admin gates. |
| Requirements | ROLE-01..04 and carried STUD-01..05, COORD-01..07, ADMIN-01..04, XCUT-01..06 | Plan 01 covers student requirements, Plan 02 coordinator, Plan 03 admin; ROLE-04 checked in each. |
| Research | Typed API only; reuse current role/helpers; API owns business rules; seeded pending clash remains reachable; no duplicate report/export logic; Phase 10 prerequisite | Execution gate and role tasks in Plans 01–03. |
| Context decisions | Role order, every screen states, canonical statuses, keyboard path, 44px targets, A+, unread-count endpoint, real evidence only | Specific tasks and checks in Plans 01–03. |
| Scope fence | `adr-004-scope` exclusions and Phase 12/13 responsibilities | Explicitly excluded in each plan context; no deployment or real-user study tasks. |

KB ids consulted: `dom-requirements`, `dom-domain-model`, `dom-flows`, `dom-scenarios`, `dom-status-vocabulary`, `src-accessibility-areas`, `adr-004-scope`.
