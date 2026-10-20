---
phase: 04-role-interfaces-parallel-wave
plan: 02
subsystem: student-ui
tags: [student, discover, registration, review-and-confirm]
requires: [04-00]
provides: [student actions, filter/view/mine helpers, student shell, Discover]
affects: [04-05]
requirements: [STUD-01, STUD-03]
key-files:
  created:
    - app/(student)/student/actions.ts
    - app/(student)/student/loading.tsx
    - app/(student)/student/error.tsx
    - app/(student)/student/_lib/{filter,view,mine}.ts
    - app/(student)/student/_components/{registration-strip,filter-chips,event-card,register-flow,cancel-flow,flash}.tsx
    - tests/student/{actions,filter,view,mine}.test.ts
  modified:
    - app/(student)/layout.tsx
    - app/(student)/student/page.tsx
completed: 2026-10-20
---

# Phase 4 Plan 02: Student part 1 Summary

Student shell and Discover: "Your next events" strip, GET search and filters, event cards, and Register / Join waitlist / Cancel registration through Review & Confirm. Server actions take the actor only from `requireRole("student")`. Nothing committed.

## What was built
- **actions.ts:** `registerAction`, `cancelRegistrationAction`, `setTaskAction` (the last for 04-05). Only ids and the three task labels come from the client; DomainError text or the generic sentence is returned; list, mine, tasks, alerts and the event detail are revalidated.
- **_lib (pure, tested):** `filter` (parseParams, applyFilters, echoText), `view` (cardModel, detailModel), `mine` (group, reminders, orderTasks, taskBadge; the last three are for 04-05).
- **Layout:** nav Discover / My events / My tasks (only when `myProfile.is_organizer`) / Alerts with the unread count in the label text.
- **Discover:** strip at the top (max 3, badge, Today/Tomorrow word, cancel control named "Cancel registration for {title}"), search plus chips plus selects and dates (More filters collapses below 768px), aria-live echo, two-column cards, only the first actionable card is primary, empty/loading/error states.

## Verification
- `npx vitest run`: 14 files, 134 tests pass (24 new in tests/student).
- `npm run lint`, `npm run typecheck`: clean. `npx eslint "app/(student)" tests/student` clean.
- Greps: no lib/db or getDb in app/(student); 3 `requireRole("student")` in actions.ts; no dangerouslySetInnerHTML. Frozen-file check prints nothing.
- NOT done: `npm run build` fails in this worktree with "Could not find the Next.js package" (Turbopack and the symlinked node_modules), an environment issue, not a code error. No browser pass was run (no keyboard, 360px or screen-reader checks); that is for 04-04.

## Deviations / choices
- **Flash provider (added file `_components/flash.tsx`, wired in layout):** success feedback needs to survive revalidation, because the card or strip item that caused it disappears. The Alert is `role="status"`, focused, with "View my events". Errors stay inline beside the button. Not in the plan's file list but inside `app/(student)/**`.
- **`f=1` marker param:** without it, an unticked "This week" cannot be told from first visit. First visit = this week on and department from profile; "Clear filters" goes to `/student?f=1` (everything off).
- **Completed events are hidden from Discover** unless the student is registered (not specified; finished events cannot be registered for). Ongoing events still show.
- **Coming up** uses the end time (an ongoing registered event is still coming up) rather than "start in the future".
- **Plan data error:** the full seed event is Open Mic Night (capacity 2), not the Keynote (capacity 400). Tests use Open Mic. See 04-02-PROPOSALS.md.
- `export const dynamic = "force-dynamic"` on the page for per-user data.

## Flagged for the Phase 3 owner (04-02-PROPOSALS.md)
- ConfirmDialog has no destructive variant, so "Confirm cancel registration" is accent, not red; "Go back" is not first in DOM so it does not get initial focus (UI-SPEC wants it).

## Known stubs
Card and strip titles link to `/student/events/{id}` and "See all my events" to `/student/mine`; those pages are 04-05 and 404 until it lands.

## Open questions
- Should the department filter default to the student's own department? Built per UI-SPEC; it hides other departments on first visit (the echo says so).

## kb ids consulted
dom-requirements (S1-S5), dom-status-vocabulary, dom-domain-model, src-hmi-principles, src-accessibility-areas, adr-004-scope.

## Self-Check: PASSED (files exist; vitest, lint, typecheck green; build and browser not run, see above)
