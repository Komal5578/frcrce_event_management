---
phase: 03-foundation
plan: 08
subsystem: domain
tags: [d1, authorization, domain-layer, errors]
requires: [03-07]
provides:
  - lib/errors.ts (DomainError, ErrorCode, humanize, guard)
  - lib/domain/{actor,events,registrations,tasks,venues,notifications}.ts (actor-explicit rpc replacements)
  - tests/authz.test.ts, tests/domain.test.ts, tests/db-boundary.test.ts
affects: [03-09, 03-10, phase-4]
key-files:
  created: [lib/errors.ts, lib/domain/actor.ts, lib/domain/events.ts, lib/domain/registrations.ts, lib/domain/tasks.ts, lib/domain/venues.ts, lib/domain/notifications.ts, tests/authz.test.ts, tests/domain.test.ts, tests/db-boundary.test.ts]
key-decisions:
  - "Function map (rpc -> TS): free_venues->freeVenues, resource_available->resourceAvailable, submit_event->submitEvent, review_event->reviewEvent, cancel_event->cancelEvent, notify_registrants->notifyRegistrants, register_for_event->registerForEvent, cancel_registration->cancelRegistration, set_task_status->setTaskStatus, seat_counts->seatCounts. All take `actor` first (freeVenues/resourceAvailable too: coordinator/admin only). New: listVisibleEvents, listNotifications, manageableEvent, visibleWhere."
  - "setTaskStatus takes the UI labels (To do/Doing/Done) and stores todo/doing/done."
  - "Student visibility = open/ongoing/completed plus any event they hold a registration on (so cancelled events they joined stay visible)."
requirements-completed: [FOUND-03, FOUND-04, FOUND-05]
completed: 2026-10-20
---

# Phase 3 Plan 08: Domain layer Summary

One TypeScript layer replaces RLS and the rpc functions: role and ownership sit in each WHERE clause, multi-step work uses db.batch, seats are decided in one upsert, and D1 errors leave as DomainError with fixed plain-language text.

## Verification
- RED: authz + domain tests failed 7/7 before implementation; pass after (32 tests across the 3 files, 30 pass on first full run, domain/authz all green).
- `npx eslint` on my files and `npx tsc --noEmit`: clean.
- No interpolated SQL (`prepare(` with template `${`) in lib; enforced by a test.

## Deviations / Issues
- **db-boundary test currently FAILS on 03-09's in-flight files** (2 tests): `app/login/actions.ts` imports `getDb` directly, and `lib/auth.ts` uses `getCloudflareContext` (isDemoEnabled). The test works as intended (that is the proof it catches violations; the planned temporary app/page.tsx injection was not needed). 03-09 must move the login query into lib/session.ts (or lib/domain) and read env via a helper in lib/db.ts, or the boundary rule must be relaxed deliberately.
- freeVenues/resourceAvailable take `actor` first (plan behaviour text omitted it; must_haves require explicit actor).
- cancelEvent is read-then-batch (ponytail): a race can at worst send a spurious notice; the UPDATE is state-guarded.
- Commit granularity: one plan-level commit (CLAUDE.md).
- Not verified: behaviour on remote D1 (spike in 03-10); 50-queries-per-invocation limit respected (every function uses at most 2-3 queries, lists are single queries).

## Self-Check: PASSED (files present; boundary test failure is from 03-09 files, noted above)
