# 05-03 SUMMARY: Reports View, Role Nav Integration, and CSV Export Routes

**Phase**: 05-cross-cutting
**Plan**: 03
**Status**: Completed
**Requirements covered**: XCUT-01 (Admin and Coordinator Reports page, CSV download, and print view)

## Key Deliverables

1. **Role Layout Integration (`app/(admin)/layout.tsx`, `app/(coordinator)/layout.tsx`)**:
   - Added `Reports` (`FileBarChart` icon) as the 5th nav item in both Admin and Coordinator layouts (within the 7-item limit).
   - Preserved `requireRole` guards.

2. **Shared Report View & Print Components (`components/ui/report-view.tsx`, `components/ui/print-button.tsx`)**:
   - `ReportView`: Server component displaying table with `<caption>`, accessible table headers (`scope="col"` and `scope="row"`), self-describing metadata banner (generation timestamp, generator role and name, active filters), and formatted totals.
   - Status labels in the table map back to `StatusBadge` through `STATUS_META` reverse lookup (rendering icon + text + colour).
   - `PrintButton`: Client component triggering `window.print()` annotated with `data-no-print`.
   - Download CSV button annotated with `data-no-print` and `download="events-report.csv"`.
   - Empty state fallback using `EmptyState`.

3. **Reports Pages & Skeletons**:
   - `app/(admin)/admin/reports/page.tsx`: "All events report" with GET filter form (status, from date, to date) and query parameter synchronization for CSV export.
   - `app/(coordinator)/coordinator/reports/page.tsx`: "My events report" scoped strictly to the coordinator's events with GET filter form.
   - `loading.tsx` skeletons for both admin and coordinator report routes.

4. **CSV Export Route Handlers & Auth Protection**:
   - `app/(admin)/admin/reports/export/route.ts`: Admin CSV download endpoint with independent `getCurrentProfile()` verification and exact role check (403 for unauthorized requests, no redirects).
   - `app/(coordinator)/coordinator/reports/export/route.ts`: Coordinator CSV download endpoint with independent role check.
   - `tests/xcut/export-route.test.ts`: 5 unit tests validating authorization (no session, student session, wrong role, correct role) and byte-level matching with UTF-8 BOM (`0xef, 0xbb, 0xbf`), `Cache-Control: no-store`, and RFC 4180 serialization.

## Verification

- `npx vitest run tests/xcut` -> 52 tests passed
- `npx vitest run tests/db-boundary.test.ts` -> 4 tests passed
- `npx opennextjs-cloudflare build` -> Success (Cloudflare worker bundle compiled cleanly)
- `npm run lint` -> Passed
- `npm run typecheck` -> Passed
