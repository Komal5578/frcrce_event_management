---
phase: 04-role-interfaces-parallel-wave
plan: 01
subsystem: coordinator-ui
tags: [server-actions, review-and-confirm, my-events, calendar, tasks, notifications]
requires: [04-00]
provides: [coordinator actions, _lib helpers, shell, My Events, New event, ConfirmFlow, Calendar/Tasks/Notifications]
affects: [04-04]
requirements: [COORD-01, COORD-04, COORD-06]
key-files:
  created:
    - app/(coordinator)/coordinator/actions.ts
    - app/(coordinator)/coordinator/_lib/parse.ts
    - app/(coordinator)/coordinator/_lib/readiness.ts
    - app/(coordinator)/coordinator/_lib/monitor.ts
    - app/(coordinator)/coordinator/_lib/calendar.ts
    - app/(coordinator)/coordinator/_components/confirm-flow.tsx
    - app/(coordinator)/coordinator/_components/event-card.tsx
    - app/(coordinator)/coordinator/_components/start-form.tsx
    - app/(coordinator)/coordinator/_components/calendar.tsx
    - app/(coordinator)/coordinator/new/page.tsx
    - app/(coordinator)/coordinator/loading.tsx
    - app/(coordinator)/coordinator/error.tsx
    - app/(coordinator)/coordinator/calendar/page.tsx
    - app/(coordinator)/coordinator/tasks/page.tsx
    - app/(coordinator)/coordinator/notifications/page.tsx
    - tests/coordinator/actions.test.ts
    - tests/coordinator/helpers.test.ts
    - tests/coordinator/calendar.test.ts
  modified:
    - app/(coordinator)/layout.tsx
    - app/(coordinator)/coordinator/page.tsx
duration: single session
completed: 2026-10-20
---

# Phase 4 Plan 01: Coordinator part 1 Summary

Coordinator actions, pure helpers, shell, My Events, New event, the reusable Review & Confirm component and the Calendar, Tasks and Notifications screens, all built on lib/domain from Wave 0. Nothing committed; STATE.md and ROADMAP.md untouched.

## What was built
- **actions.ts** (8 actions, each calls `requireRole("coordinator")`, actor from the session, `DomainError` text or the generic sentence returned): `startDraft` (template id or "blank", also accepts the form; redirects to `/coordinator/{id}/edit?step=1`), `saveDraftAction(eventId, step 1|2, fields)`, `setAllocationAction`, `addTaskAction`, `submitAction`, `advanceAction`, `cancelAction` (returns registrant count), `changeAction` (returns notified count). Return shape `{ok?, error?, fieldErrors?, count?, status?}`.
- **_lib**: `parse.ts` (whitelisted details/schedule/task parsing, exact UI-SPEC error copy, due date = end of day local), `readiness.ts` (ready / missing keys with step numbers / disabled reason), `monitor.ts` (seat percent and "38 / 60", waitlist, lowreg, overdue, tasks done/total, next-step sentence, home filters), `calendar.ts` (month maths, Monday-first cells, grouping by display-zone day).
- **Shell and home**: nav per UI-SPEC with unread count in the Notifications label; My Events with returned-event Alert, GET-form checkbox chips (Needs attention, Drafts, Past; default hides past), event cards (StatusBadge, `<progress>` seat meter, overdue and lowreg badges, Continue/View). Overdue computed from one `listCoordinatorTasks` call.
- **New event**: radio group of the three seeded templates plus Blank, 56px rows, default seats and duration shown, Start via `useActionState` (`start-form.tsx`, a small extra client file inside the owned folder).
- **ConfirmFlow** (`confirm-flow.tsx`): trigger + `ConfirmDialog`; closes on cancel, success and failure; focuses the success Alert (`role="status"`) or error Alert (`role="alert"`); optional reason Textarea; `{n}` placeholder filled from the action's count; optional `disabledReason` keeps the trigger focusable with visible text.
- **Calendar** (agenda always, month grid at 768px+ behind a two-button GET toggle with `aria-pressed`, Previous/Next month links, cells >= 56px with `aria-label` "Fri 20 February, 2 events", today = 2px ink border + hidden "Today"), **Tasks** (Overdue group first, "Only overdue" chip, table with caption and `th scope`, cards below 640px), **Notifications** (kind icon + text + date, "New" within 7 days).
- loading.tsx (96px skeleton rows, hidden "Loading your events...") and error.tsx (UI-SPEC copy + "Try again").

## Verification (in worktree /home/varad/Documents/Sem 5/Hmi/hmi-4a)
- `npx vitest run`: 13 files, 132 tests pass (22 new in tests/coordinator).
- `npm run lint` and `npm run typecheck`: clean.
- Plan greps: no lib/db or getDb in app/(coordinator) (0); 8 `requireRole("coordinator")` in actions.ts; no status/user id read from forms (0); every page.tsx has requireRole and metadata; `<caption` and `aria-pressed` present; db-boundary test passes. Frozen-file check printed nothing.
- **NOT verified: `npm run build` fails in this worktree** with "Could not find the Next.js package (next/package.json)". Cause is the environment: node_modules is a symlink to a directory outside the worktree and Turbopack refuses to resolve outside its root. It is not a code error (tsc and eslint cover the same files), but the build and the browser flows have not been run for this plan. Please run the full gate in the main tree after merge.
- **NOT verified: browser pass** (keyboard path, 44px, A+/A-, 320px reflow). No browser was driven in this session. The a11y checklist is unticked.

## Deviations (flagged, per plan)
- Templates are Workshop, Guest Lecture, Cultural Night plus Blank (UI-SPEC names Seminar/Fest do not exist).
- No prefill of resources or tasks (schema has none); Steps 3 and 4 will start empty. The New page does not promise it.
- Monitor timeline can only show "Created" and "Last updated" (no status history stored); this is for 04-04.
- Added `_components/start-form.tsx` and `_lib/calendar.ts` plus `tests/coordinator/calendar.test.ts` (inside owned folders, not listed in files_modified) to keep the template form and calendar maths testable.
- Autosave/step-rail/live summary/builder pages, monitor (`/coordinator/{id}`) and edit pages are 04-04. Links already point to `/coordinator/{id}`, `/coordinator/{id}/edit` which 404 until then.

## Notes for 04-04
- `ConfirmFlow` holds the result Alert in its own state. If the trigger unmounts after the status changes (e.g. Approved -> Open swaps the button), the Alert goes with it. Give each state's flow a stable position/key or lift the Alert.
- `saveDraftAction` supports steps 1 and 2 only; step 3 uses `setAllocationAction`, step 4 `addTaskAction`. `changeAction` takes any of title/seats/description, date/start/end, venueId.
- `readiness(event, venueCapacity, allocations, tasks)` is ready for the Live Summary and the Submit disabled reason.
- Cancel of another coordinator's event says "You cannot see this event." (from getEventDetail) while other actions say "Only the event coordinator can do that."; both are human text, no leak.
- `searchParams` is async (Next 16); not confirmed via context7 this session, code typechecks against the installed Next 16.4.2 types.

## Known Stubs
None in this plan's screens. Dead links to the 04-04 routes noted above.

## Threat Flags
None beyond T-04-11..17 (all mitigated as planned: session actor, domain ownership clauses, field whitelist, human errors only, React escaping).

## kb ids consulted
dom-requirements, dom-status-vocabulary, src-hmi-principles, src-accessibility-areas, adr-004-scope (via plan and UI-SPEC).

## Self-Check: PASSED (with the two NOT verified items above)
All created files exist; vitest, lint, typecheck green; nothing committed.
