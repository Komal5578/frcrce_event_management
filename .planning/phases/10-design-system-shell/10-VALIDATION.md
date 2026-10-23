---
phase: 10
slug: design-system-shell
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-23
---

# Phase 10 — Validation Strategy

> Source: `10-RESEARCH.md` & `10-UI-SPEC.md`.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 5.0.5 + Testing Library (React) + Playwright / browser smoke |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && npm test tests/contrast.test.ts tests/status.test.ts` |
| **Full suite command** | `cd frontend && npm run lint && npm run typecheck && npm test` |

## Sampling Rate

- **After every task:** quick run of the touched component / test suite
- **After every wave:** full frontend test suite (`npm test`) and typecheck (`npm run typecheck`)
- **Before verify-work:** all tests pass, contrast passes AA in both light & dark themes, role shells render cleanly in browser

## Per-Task Verification Map

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| UI-01 | UI-SPEC complete & approved; OKLCH tokens defined for light and dark in `globals.css` | visual/spec | `test -f .planning/phases/10-design-system-shell/10-UI-SPEC.md` | ✅ Yes |
| UI-02 | Contrast test passes WCAG 2.2 AA in both light and dark modes (>= 4.5:1 text/status, >= 3:1 borders) | unit | `cd frontend && npx vitest run tests/contrast.test.ts` | ✅ (to update) |
| UI-02 | StatusBadge renders all status families (event, task, registration, alert) with icon + label + color | unit | `cd frontend && npx vitest run tests/status.test.ts` | ✅ (to update) |
| UI-03 | ConfirmDialog auto-focuses "Go back" on open and supports destructive variant | unit/ui | `cd frontend && npx vitest run tests/confirm-dialog.test.ts` | ❌ W0 |
| UI-04 | AppShell exact match for role home paths, sidebar+sheet on Admin/Coord, bottom nav on Student | unit/ui | `cd frontend && npx vitest run tests/app-shell.test.ts` | ❌ W0 |
| UI-05 | API client types generated with openapi-typescript, next.config rewrites configured, login demo toggle works | integration | `cd frontend && npm run typecheck` | ❌ W0 |

## Wave 0 Requirements

- [ ] New vitest test suites: `tests/confirm-dialog.test.ts` and `tests/app-shell.test.ts`.
- [ ] Updated `tests/contrast.test.ts` supporting OKLCH / light & dark contrast testing.
- [ ] Dependencies added: `@radix-ui/react-dialog`, `@radix-ui/react-slot`, `recharts`, `sonner`, `openapi-typescript`.

## Manual-Only Verifications

- Visual verification of "modern campus SaaS" aesthetic in browser.
- Verification that `prefers-reduced-motion` suppresses all transitions and animations.
- Touch target size check (44px min-height/width on touch devices).

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] No 3 consecutive tasks without automated verify
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
