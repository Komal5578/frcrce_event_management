---
phase: 08-rebaseline-restructure
plan: 02
subsystem: docs
tags: [ia, wireframes, a11y, vocabulary]
requirements: [REBASE-03]
key-files:
  modified:
    - docs/ia/coordinator.md
    - docs/ia/student.md
    - docs/flows/organizer-mark-task-done.md
    - docs/wireframes/student.md
    - docs/wireframes/coordinator.md
    - docs/validation/a11y-keyboard-pass.md
    - kb/domain/requirements.md
metrics:
  completed: 2026-10-23
---

# Phase 8 Plan 02: IA, flow, wireframe and a11y consistency Summary

Docs now agree: Tasks is cross-event, ST-01 cards lead to ST-02, student time overlap is a warn-only requirement (S6), and the vocabulary is Done / Notifications.

## Changes
- `docs/ia/coordinator.md`: CO-05 Tasks redefined as a cross-event screen (all the coordinator's events, filter by event/status); wizard step reuses it scoped to one event.
- `docs/ia/student.md`: ST-01 cards link to ST-02 only; Register lives on ST-02 and opens ST-03.
- `docs/flows/organizer-mark-task-done.md`: "Completed" -> "Done".
- `kb/domain/requirements.md`: new S6 (warn-only overlap warning, never blocks; blocking only for venue clash and double registration). Marked `should`.
- `docs/wireframes/student.md`: "Alerts" -> "Notifications" (all tab bars); ST-01 cards show `View details` instead of `Register` / `Join waitlist`; clash note is now warn-only.
- `docs/wireframes/coordinator.md`: CO-05 shows "Tasks (all my events)" with event and status filters and an Event: Task column.
- `docs/ia/shared-vocabulary.md`: no change needed. It already specifies a bottom tab bar on phone, at most 5 items, and has no "Alerts" wording. Its "Completed" row is the event status, which is correct.

## a11y checklist labels changed (`docs/validation/a11y-keyboard-pass.md`)
- "Tab to first card action" -> `View details`; Register is on the detail screen.
- "Confirm register" -> `Confirm`
- "Confirm submit in dialog" -> `Confirm and submit`
- "Confirm approve" -> `Confirm` (approve)
- "Save and continue" -> `Next`
- "Review and submit" -> "Next to review"
- "Alerts" -> `Notifications`
- "Pending Approval alert" -> "Pending approval message"

## Verification
- Task greps pass (no "Completed" in the flow, "warn" in requirements, cross-event wording in coordinator IA, no "Alerts" in the student wireframe).
- `node kb/tools/build-index.mjs`: ok, 25 notes.
- Nothing committed. STATE.md and ROADMAP.md untouched.

## Deviations from Plan
None.

## Notes
- The a11y checklist still includes rows such as "Confirm Dialog -> Go back focused". Those already matched the wireframes.
- Step 3 of the checklist's Table 2 (code-path evidence like `tests/xcut/*`) points at v1 paths and is left for the Phase 10 and 13 port.

## Self-Check: PASSED
