# 05-REVERIFY-05: Cross-Cutting Static Guards and Quality Gate Baseline

_Generated during Plan 05-05 execution (Phase 5 Wave 3)_

## Guards

### Real Routes vs Phase 4 Lists

- **Admin**:
  - `/admin`: Dashboard (with AttentionList, statistics, bar charts)
  - `/admin/approvals`: Approval queue with split pane
  - `/admin/approvals/[id]`: Approval decision detail with Review & Confirm dialog
  - `/admin/calendar`: Monthly calendar view
  - `/admin/catalog`: Venue and resource catalog management
  - `/admin/reports`: All events reports table, filter form, print and CSV export
  - `/admin/reports/export`: CSV download endpoint with role guard

- **Coordinator**:
  - `/coordinator`: My Events overview with AttentionList and filter chips
  - `/coordinator/new`: Multi-step event creation wizard
  - `/coordinator/[id]`: Event monitor and overview with glance strip
  - `/coordinator/[id]/edit`: Event editor with draft autosave
  - `/coordinator/[id]/change`: Change request submission with ConfirmDialog
  - `/coordinator/calendar`: Coordinator calendar view
  - `/coordinator/tasks`: Task list with overdue sorting
  - `/coordinator/notifications`: In-app notification feed
  - `/coordinator/reports`: My events report table, filter form, print and CSV export
  - `/coordinator/reports/export`: CSV download endpoint with role guard

- **Student**:
  - `/student`: Discover events catalog with search and filters
  - `/student/events/[id]`: Event details with registration flow and ConfirmDialog
  - `/student/mine`: Registered and waitlisted events
  - `/student/tasks`: Assigned tasks with mark done toggle
  - `/student/alerts`: Notifications and overdue task alerts

- **Common / Root**:
  - `/login`: Role selection and demo credentials
  - `/design`: UI tokens and component showcase
  - `app/not-found.tsx`: Root 404 handler with error-resilient profile resolution
  - `app/error.tsx`: Root error boundary delegating to PageError
  - `app/global-error.tsx`: Root fallback error boundary with own html/body

### Exported Action Names per `actions.ts`

- `app/(admin)/admin/actions.ts`:
  - `approveAction` (irreversible, gated by ConfirmDialog)
  - `returnAction` (irreversible, gated by ConfirmDialog with required reason)
  - `saveVenueAction` (administrative catalog update)
  - `saveResourceAction` (administrative catalog update)

- `app/(coordinator)/coordinator/actions.ts`:
  - `submitAction` (irreversible, gated by ConfirmDialog)
  - `advanceAction` (irreversible, gated by ConfirmDialog)
  - `cancelAction` (irreversible, gated by ConfirmDialog)
  - `changeAction` (irreversible, gated by ConfirmDialog)
  - `startDraft` (reversible draft initialization)
  - `saveDraftAction` (reversible step autosave)
  - `addTaskAction` (reversible task creation)
  - `setAllocationAction` (reversible resource quantity update)

- `app/(student)/student/actions.ts`:
  - `registerAction` (irreversible, gated by ConfirmDialog)
  - `cancelRegistrationAction` (irreversible, gated by ConfirmDialog)
  - `setTaskAction` (reversible task completion toggle with immediate Undo)

### Vocabulary and Design System Status

- `STATUS_META` in `components/ui/status-badge.tsx` defines exactly 17 status keys (`draft`, `pending`, `approved`, `open`, `ongoing`, `completed`, `cancelled`, `full`, `returned`, `registered`, `waitlisted`, `todo`, `doing`, `done`, `overdue`, `clash`, `lowreg`).
- `tests/contrast.test.ts` and `tests/status.test.ts` pass 100% of contrast (WCAG 2.2 AA) and status token checks.
- Touch target sizes across interactive elements adhere to minimum 44px by 44px dimensions.
- Typographic scale in `globals.css` is rem-based and scalable via `TextSizeControl`.

## Audit Findings

Results from running the 4 static guard suites:
- `tests/xcut/states.test.ts`: 5/5 PASSED (every page has error and loading ancestors, root error/not-found exist, no error.message leaks, list routes have designed empty copy).
- `tests/xcut/targets.test.ts`: 4/4 PASSED (AppShell mounted in all role layouts, TextSizeControl present, rem font scaling, focus-visible outline >= 2px, no interactive elements under 44px).
- `tests/xcut/consistency.test.ts`: 3/3 PASSED (status color tokens scoped strictly to design components, no banned synonyms on buttons, lucide icons carry aria-hidden).
- `tests/xcut/confirm.test.ts`: 3/3 PASSED (all 8 irreversible actions gated by ConfirmDialog, success feedback present, return reason non-empty validation enforced).

**Violations**: None (0 blocking issues).
