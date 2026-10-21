# 05-04 SUMMARY: AttentionList Component and Cross-Role Alert Wiring

**Phase**: 05-cross-cutting
**Plan**: 04
**Status**: Completed
**Requirements covered**: XCUT-02 (Needs attention list and cross-role alerts)

## Key Deliverables

1. **`components/ui/attention-list.tsx`**:
   - Server component without client-side state or event listeners.
   - Uses `splitAlerts(items, limit = 5)` for capping.
   - Renders `StatusBadge` per item kind, plain sentence link to problem source (`min-h-11` hit area), and keyboard-accessible native `<details><summary>Show {k} more</summary>...</details>` for items exceeding the limit.
   - Shows calm empty state (`"Nothing needs attention."` with `CircleCheck` icon) when alert list is empty.

2. **`lib/alert-links.ts`**:
   - Pure mapping module: `alertHref(role, kind, eventId)`.
   - Maps admin alerts: clash -> `/admin/calendar`, lowreg/overdue -> `/admin/approvals/{eventId}`.
   - Maps coordinator alerts: -> `/coordinator/{eventId}` or `/coordinator/tasks`.
   - Maps student alerts: -> `/student/tasks`.

3. **`tests/xcut/alert-links.test.ts`**:
   - 9 automated unit tests verifying that all `alertHref` outputs resolve to actual `page.tsx` route files in the filesystem.

4. **Integration into Role Surfaces**:
   - `app/(admin)/admin/page.tsx`: Replaced custom section with `<AttentionList items={alerts} />`, aggregating bookings (clashes), overdue tasks via `listOverdueTasksForActor(actor, now)`, and low-registration events.
   - `app/(coordinator)/coordinator/page.tsx`: Added `<AttentionList items={alerts} />` scoped strictly to coordinator-owned events and overdue tasks.
   - `app/(student)/student/alerts/page.tsx`: Wired `listMyTasks` through `computeAlerts` for student overdue tasks, displaying them via `AttentionList` above notifications.

## Verification

- `npx vitest run tests/xcut` -> 61 tests passed
- `npx vitest run tests/db-boundary.test.ts` -> 4 tests passed
- `npm run lint` -> Passed (0 errors, 0 warnings)
- `npm run typecheck` -> Passed (0 errors)
- `npm run build` -> Passed (compiled 18/18 static pages and dynamic routes)
