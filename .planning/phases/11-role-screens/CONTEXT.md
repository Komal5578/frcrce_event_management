# Phase 11: Role Screens (context brief)

Requirements: ROLE-01..04 (re-delivers STUD, COORD, ADMIN and XCUT on v2). Build the roles **one after another**, each with its own plan. A role's primary flow must work in the browser before the next role starts.

## Sources
- IA: `docs/ia/{student,coordinator,admin}.md`
- Flows: `docs/flows/*`
- Wireframes: `docs/wireframes/*`
- Test tasks: `kb/domain/scenarios.md` (TT-S1, TT-C1, TT-A1)
- v1 pages and `_lib` view helpers under `app/(role)/**` (logic to reuse; restyle)

## Order and screens
1. **Student:** ST-01 Discover (search + filters) → ST-02 Detail → ST-03 Review & Confirm (register/waitlist/cancel) → ST-04 My Events + calendar → ST-05 My Tasks (organizer) → ST-06 Notifications.
2. **Coordinator:** CO-01 My Events → CO-02..05 builder (template prefill + autosave, free-venue picker with capacity, resources, tasks) → CO-06 Review & Confirm → CO-07 Monitor → CO-08 Summary; edit/cancel; cross-event Tasks; Reports (charts + CSV).
3. **Admin:** AD-01 Dashboard + attention list → AD-02 queue → AD-03 detail with the live clash check (the seed has overlapping pending requests) → approve/return with a reason → AD-04 calendar with conflicts → AD-05 Venues & Resources → AD-06 Reports.

## Every screen
- Empty, loading (`loading.tsx`) and error states with plain-language copy.
- Status shown as icon + text + colour.
- Keyboard-only path, 44px targets, works at A+.
- Canonical vocabulary.
- Unread badge from `/notifications/unread-count`, not a full list load.

## Evidence
Real screenshots and a keyboard run per role go in the SUMMARY. Don't invent timings.
