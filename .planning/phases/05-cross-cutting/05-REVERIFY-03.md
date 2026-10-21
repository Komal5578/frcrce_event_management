# 05-REVERIFY-03: Phase 4 Layouts, Routes, and Export Handler Verification

_Generated during Plan 05-03 execution (Phase 5 Wave 2)_

## Nav

1. **Role Layout Guards**:
   - `app/(admin)/layout.tsx`: calls `requireRole("admin")`.
   - `app/(coordinator)/layout.tsx`: calls `requireRole("coordinator")`.
   - Both role guards remain intact.

2. **Nav Items & Counts**:
   - **Admin layout (`app/(admin)/layout.tsx`)**:
     1. `Dashboard` (`/admin`)
     2. `Approvals` (`/admin/approvals`)
     3. `Calendar` (`/admin/calendar`)
     4. `Venues and Resources` (`/admin/catalog`)
     5. `Reports` (`/admin/reports`)
     - **Count**: 5 items (<= 7 limit satisfied).
   - **Coordinator layout (`app/(coordinator)/layout.tsx`)**:
     1. `My Events` (`/coordinator`)
     2. `Calendar` (`/coordinator/calendar`)
     3. `Tasks` (`/coordinator/tasks`)
     4. `Notifications` (`/coordinator/notifications`)
     5. `Reports` (`/coordinator/reports`)
     - **Count**: 5 items (<= 7 limit satisfied).

3. **Existing Routes Under `app/`**:
   - Admin: `/admin`, `/admin/approvals`, `/admin/approvals/[id]`, `/admin/calendar`, `/admin/catalog`
   - Coordinator: `/coordinator`, `/coordinator/[id]`, `/coordinator/[id]/change`, `/coordinator/[id]/edit`, `/coordinator/calendar`, `/coordinator/new`, `/coordinator/notifications`, `/coordinator/tasks`
   - Student: `/student`, `/student/alerts`, `/student/events/[id]`, `/student/mine`, `/student/tasks`
   - Common/Auth: `/`, `/login`, `/design`
   - New routes added in this plan:
     - `/admin/reports` (page + loading + export/route)
     - `/coordinator/reports` (page + loading + export/route)

## A1 Route Handler + D1

- **Build outcome**: PASS. `npx opennextjs-cloudflare build` successfully bundles both export route handlers (`/admin/reports/export` and `/coordinator/reports/export`).
- Output worker generated at `.open-next/worker.js` with workerd compatibility date `2026-10-20`.
- Authorization checks inside route handlers (`getCurrentProfile()` and exact role check) return pure RFC 4180 CSV with UTF-8 BOM, `Cache-Control: no-store`, and attachment disposition.

