---
phase: 04-role-interfaces-parallel-wave
plan: 00
subsystem: domain-layer
tags: [d1, lib-domain, status-vocabulary, date-format]
requires: [Phase 3 foundation]
provides: [drafts, catalog, allocations, people, views, admin domain modules; lib/format; 8 StatusBadge keys]
affects: [04-01, 04-02, 04-03]
key-files:
  created:
    - lib/format.ts
    - lib/domain/rules.ts
    - lib/domain/drafts.ts
    - lib/domain/catalog.ts
    - lib/domain/allocations.ts
    - lib/domain/people.ts
    - lib/domain/views.ts
    - lib/domain/admin.ts
    - tests/format.test.ts
    - tests/domain-phase4.test.ts
  modified:
    - components/ui/status-badge.tsx
    - app/globals.css
    - tests/status.test.ts
requirements: [COORD-01, COORD-02, COORD-03, COORD-04, COORD-07, STUD-01, STUD-02, STUD-04, STUD-05, ADMIN-02, ADMIN-03, ADMIN-04]
duration: single session
completed: 2026-10-20
---

# Phase 4 Plan 00: Wave 0 domain additions Summary

Wave 0 adds the domain functions, 8 status keys and the Asia/Kolkata date helpers that the three role UIs need. Wave agents can now build every Phase 4 screen from `lib/domain`, `lib/format` and `components/ui` only. Nothing was committed (project rule).

## What was built
- **Status vocabulary (dom-status-vocabulary):** 17 keys. New: registered, waitlisted, todo, doing, done, overdue, clash, lowreg. Each has icon + label + its own fg/bg token pair. Status and contrast tests pass.
- **lib/format.ts:** `DISPLAY_TZ`, formatDate/ShortDate/Time/DateTime/Range, dayKey, localToIso (zone-correct via Intl, returns the schema-GLOB string or null), isoToInputs, relativeDay. No date library.
- **lib/domain/rules.ts:** constants and pure `isOverdue`/`isLowReg`.
- **drafts.ts:** listTemplates, createDraft, saveDraft (7-column whitelist, null clears), updateEvent (live edit plus `event_changed` notifications in the same batch), advanceEvent. Exports `validIso`, reused by allocations.
- **catalog.ts:** listVenues, busyVenues, listResources, saveVenue, saveResource.
- **allocations.ts:** listAllocations, setAllocation, listEventTasks, listCoordinatorTasks, createTask (task plus notification in one batch).
- **people.ts / views.ts / admin.ts:** reads exactly as in the plan interface block, including `my_reg` and `my_waitlist_pos` on `EventView`.
- Every function is actor-first, role-checked, uses constant SQL with bound params and goes through `guard()`.

## Verification
- `npx vitest run`: 10 files, 110 tests pass (73 prior plus new).
- `npm run lint` and `npm run typecheck`: clean.
- Frozen-file check from the plan printed nothing; no changes under `app/(coordinator|student|admin)`.
- Nothing committed, staged, stashed or reset. STATE.md and ROADMAP.md not touched.

## Assumptions (all `assumed`, user accepted)
- **A3:** one fixed display zone, Asia/Kolkata; stored times are UTC ISO.
- **A2 (admin conflicts):** active-active overlaps are impossible (triggers), so `conflict` is set only for (a) an overlap on one venue where at least one side is draft/returned, or (b) a non-completed/cancelled event on a retired venue. Cancelled events are not listed. Overlaps with events outside the `[from,to)` window are not seen.
- **COORD-07:** editing a pending/approved/open event does not reset it to pending (no re-approval); registrants are notified in-app. A no-op patch writes and notifies nothing.
- Defaults: 12 bookable hours/day (constant exported; no utilisation function was in the plan, the UI computes it), low registrations under 25% within 7 days of start, reminder window 2 days.

## Ceilings and schema notes
- `reserved_peak` is the largest single future reservation (active-status events not yet ended), not the true overlapping sum (`ponytail:` comment in catalog.ts; sweep only if needed).
- Schema has no template tasks or template resources (`event_templates` has name, type, description, duration, capacity, department only). `createDraft` therefore cannot pre-fill tasks or resources; 04-01 must not promise it.

## Deviations from Plan
None of substance. Small choices the plan left open:
- `saveDraft`/`updateEvent` check the venue is active only when the venue id changes, so editing a live event already on a since-retired venue is not blocked.
- `updateEvent` also rejects a capacity below the confirmed count with the count in the message (as specified), checked before the DB write.
- Fixed one bug of my own during Task 2 (second offset pass in `localToIso` used the wrong base); test caught it.

## Known Stubs
None.

## Threat Flags
None beyond the plan's threat model (T-04-01..06 mitigated; authorization rejection tested per function, mass-assignment ignored keys tested, no interpolated SQL).

## Self-Check: PASSED
All 10 created and 3 modified files exist; full suite, lint and typecheck green.
