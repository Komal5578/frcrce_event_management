---
phase: 04-role-interfaces-parallel-wave
plan: 04
subsystem: coordinator-ui
tags: [builder, autosave, venue-picker, monitor, review-and-confirm]
requires: [04-00, 04-01]
requirements: [COORD-01, COORD-02, COORD-03, COORD-04, COORD-05, COORD-06, COORD-07]
completed: 2026-10-20
---

# Phase 4 Plan 04: Coordinator part 2 Summary

Guided builder (4 steps, autosave, Live Summary, submit via Review & Confirm), event monitor and live-event change screen. Nothing committed; STATE.md and ROADMAP.md untouched.

## Files created (all under app/(coordinator)/coordinator/ unless noted)
- `[id]/edit/page.tsx`, `[id]/edit/loading.tsx`, `[id]/page.tsx`, `[id]/loading.tsx`, `[id]/change/page.tsx`
- `_components/`: step-rail (also `StepNav` footer for steps 3-4), live-summary, autosave-status (`AutosaveForm` = debounced autosave + shared footer), details-step, venue-step (also `VenueGroups`), resources-step, tasks-step, task-table, glance-strip, change-form, flash (new, not in the plan list: success Alert that takes focus after the redirect from the builder)
- `_lib/venues.ts` (pure venue grouping and Live Summary venue state), `ago()` added to `_lib/monitor.ts`
- `tests/coordinator/venues.test.ts` (venue grouping with reasons, venue state, ago, monitor model)
- Modified 04-01 file `_components/confirm-flow.tsx`: result Alert now freezes title/body/badge at confirm time and there is a `hideTrigger` prop, so the outcome survives a status change that swaps or removes the trigger (the note from 04-01). Monitor uses stable keys (`advance`, `cancel`).

## Requirement coverage
COORD-01 template draft + autosave on blur/change (800 ms); COORD-02 venue step with free and "Not available" groups and reasons, unavailable venues are not selectable (no radio); COORD-03 resources with availability as text, RESOURCE_SHORT message under the row; COORD-04 tasks with student and due date, overdue badge; COORD-05 submit via Review & Confirm then Pending approval Alert (monitor, focused); COORD-06 monitor glance strip (seats vs capacity with `<progress>` + text, waitlist count only, overdue, status); COORD-07 one lifecycle button per state, Edit (Before/After confirm) and Cancel (destructive confirm, count of registrants told).

## Verification (worktree)
- `npx vitest run`: 14 files, 137 tests pass. `npm run lint` and `npm run typecheck` clean.
- Plan greps: no localStorage/sessionStorage and no registrant identifiers in app/(coordinator) (0); `aria-current` in step-rail, `aria-live` in autosave-status and live-summary; `freeVenues`/`busyVenues` in edit/page.tsx; ConfirmFlow wired for submit, advance, cancel, change. Frozen-file check prints nothing.
- **NOT verified: `npm run build` and any browser pass.** The dev server also fails in this worktree (`.next/dev/server/pages/_app/build-manifest.json` ENOENT, symlinked node_modules). The Manual flow (New event -> Workshop -> ... -> Pending approval) and the a11y checklist (keyboard, 44px, A+/A-, 320px reflow, focus after Alert) have NOT been run. Please run the full gate and the flow in the main tree after merge.
- The new screens' UI components are not covered by automated tests (only the pure logic and the 04-01 action tests are).

## Deviations (flagged)
- Template names, empty resources/tasks prefill and timeline (Created / Last updated only) as per the plan.
- Venue step has no separate "Show free venues" GET button: the saved slot is autosaved on blur/change and `router.refresh()` recomputes the lists from the draft. Venue list therefore always reflects the saved slot.
- Live Summary `<details>` is open at every width (UI-SPEC wants it closed below 640px with a one-line summary; the one-line text is present but only visible when closed). On narrow screens the summary sits above the form.
- Submit success: because the status change makes the builder redirect to the monitor, the success Alert is shown there (`?done=submitted`, focused) rather than inside the builder.
- Change form: the venue list is for the saved slot; if the time is edited the list is stale and the domain checks on save give the clash message. Review & Confirm opens before field validation; field errors then show inline plus a generic error Alert.
- Step state words: "Needs attention" only when the chosen venue is unavailable for the saved slot; step 3 and 4 show Done once at least one resource/task exists.
- Wizard step 4 shows the missing-steps links above the footer when readiness fails.

## Open questions
- Should the Live Summary collapse at <640px via a client component (needs viewport logic) or stay open? Left open for simplicity.
- Whether the Review & Confirm in the change flow should validate before opening (needs a validate action; not added).

## Known Stubs
None.

## Threat Flags
None beyond T-04-11..17: all actions use the 04-01 session-derived actor; pages catch DomainError and show only its message or the generic sentence; no registrant names are read; React escaping only.

## kb ids consulted
dom-requirements (C1-C7), dom-status-vocabulary, src-hmi-principles, src-accessibility-areas, adr-004-scope, dom-hmi-problems (via plan and UI-SPEC).

## Self-Check: PASSED (with the NOT verified items above)
