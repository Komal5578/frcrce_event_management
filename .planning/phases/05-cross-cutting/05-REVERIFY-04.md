# 05-REVERIFY-04: Attention Surfaces & Integration Strategy

_Generated during Plan 05-04 execution (Phase 5 Wave 2)_

## Attention

### Current State Analysis

1. **Admin Dashboard (`app/(admin)/admin/page.tsx`)**:
   - Current implementation: Computes `s = stats(...)` from `_lib/dashboard.ts`, which counts `lowReg` events and `overdueCount` tasks. Rendered as a custom `<section>` with an `<ul>` at the bottom of the dashboard.
   - Decision: **REPLACE**. Replace the custom `<section>` with `<AttentionList items={alerts} />`.
   - Data inputs: `listEventsWithSeats(actor)`, `listBookings(actor, from, to)` with `flagConflicts`, `listOverdueTasksForActor(actor, now)` from `lib/domain/reports`.
   - Heading: `"Needs attention: {n}"`.

2. **Coordinator My Events (`app/(coordinator)/coordinator/page.tsx`)**:
   - Current implementation: Filter chips include `"Needs attention"`, but there is no dedicated alert list summarizing clashes, overdue tasks, and low registration events in one place.
   - Decision: **WRAP/ADD**. Add `<AttentionList items={alerts} />` above or within the My Events overview.
   - Data inputs: `listEventsWithSeats(actor)`, `listOverdueTasksForActor(actor, now)` from `lib/domain/reports`.
   - Links: Scoped to the coordinator's own events via `/coordinator/{id}`.

3. **Student Alerts (`app/(student)/student/alerts/page.tsx`)**:
   - Current implementation: Shows notification records from `listNotifications(actor)`.
   - Decision: **WRAP**. Maintain existing event notifications list and add an overdue tasks attention section rendered via `<AttentionList items={overdueAlerts} heading="Overdue tasks" />`.
   - Data inputs: `listMyTasks(actor)` filtered to overdue tasks.
