---
phase: 04-role-interfaces-parallel-wave
plan: 03
subsystem: admin-ui
tags: [admin, dashboard, server-actions, clash-check]
requires: [04-00]
provides: [admin shell, dashboard, approve/return/venue/resource actions, _lib helpers]
affects: [04-06]
requirements: [ADMIN-04]
completed: 2026-10-20
---

# Phase 4 Plan 03: Admin part 1 Summary

Admin shell (4 nav items, pending count in the Approvals label), Dashboard (ADMIN-04), four server actions and the pure helpers that 04-06 will reuse. Nothing committed; STATE.md and ROADMAP.md untouched.

## Files (all under owned paths)
- `app/(admin)/layout.tsx` (nav filled, guard kept), `app/(admin)/admin/page.tsx`, `loading.tsx`, `error.tsx`, `actions.ts`
- `_lib/clash.ts` (pure clashCheck), `_lib/load.ts` (async loader through lib/domain: getEventDetail, freeVenues, listAllocations, resourceAvailable; shared by the approvals page and approveAction), `_lib/dashboard.ts`, `_lib/lanes.ts`, `_lib/parse.ts`
- `_components/bar-list.tsx`
- `tests/admin/{actions,clash,dashboard,lanes,parse}.test.ts` (21 tests)

## Verification
- `npx vitest run`: 15 files, 131 tests pass. `npm run lint` and `npx tsc --noEmit` clean.
- Acceptance greps: lib/db imports 0; `requireRole("admin")` in actions.ts = 4; Reports/Export/CSV = 0; dangerouslySetInnerHTML = 0; empty navItems = 0. Frozen-file check printed nothing.
- Verbatim messages asserted: blank reason, "2 are already reserved for events. Choose 2 or more.", "Not enough Projector are free for this time: 1 free, 2 requested." No error contains sqlite|constraint|trigger|select.
- NOT done: browser walk of the dashboard (no dev server run). The pages are typechecked and linted only; please verify visually in 04-04.

## Decisions and deviations
- Added `_lib/load.ts` (not listed in the plan, but inside `_lib/*.ts`) so the clash inputs are loaded once and the server recompute in approveAction is the same code the approvals page will show.
- `clashCheck` also has a venue-not-available sentence for a venue that freeVenues does not return (retired venue). It cannot fire for a free active venue.
- In a pending-event clash test the resource shortfall is "1 free" because the event's own allocation is excluded via excludeEventId (correct); the shortfall was forced by lowering the resource total directly in the test DB.
- "Events by department" counts non-cancelled events starting this month (plan did not say month vs all; chosen to match the other month-based numbers). Overall "Venue use" divides by active venues only; retired venues appear as bars only if they had hours.
- Resource form field is `total` (spec copy says Total); the domain `quantity` is mapped in parse.ts and requires >= 1 (domain rule).
- The dashboard "Review approvals" is a styled `<Link>` (Button is a `<button>`); classes mirror the primary variant, 44px min.
- Layout runs one extra query (listEventsWithSeats) for the nav pending count.

## Known Stubs
None. Nav links to /admin/approvals, /admin/calendar, /admin/catalog 404 until 04-06 builds them (expected by the plan split).

## Threat flags
None beyond the plan's register; T-04-31..35 mitigated (requireRole in each action, server clash recompute, parse + domain validation, generic error text, no raw HTML).

## kb ids consulted
dom-requirements, dom-status-vocabulary, dom-domain-model, src-hmi-principles (via plan and UI-SPEC).

## Self-Check: PASSED
All files above exist; vitest, lint and typecheck green.
