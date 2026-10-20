---
phase: 04-role-interfaces-parallel-wave
plan: 06
subsystem: admin-ui
tags: [admin, approvals, calendar, catalog]
requires: [04-03]
requirements: [ADMIN-01, ADMIN-02, ADMIN-03]
completed: 2026-10-20
---

# Phase 4 Plan 06: Admin part 2 Summary

Approvals split pane with clash check and Review & Confirm decisions, calendar with venue lanes and agenda, and venues/resources management. Nothing committed; STATE.md and ROADMAP.md untouched.

## Files (all under app/(admin)/admin/)
- approvals: `layout.tsx` (queue, soonest first), `page.tsx` (empty pane), `[id]/page.tsx`, `loading.tsx`
- calendar: `page.tsx`, `loading.tsx`; catalog: `page.tsx`, `loading.tsx`
- `_components/`: queue-list, pane-switch, clash-check, decision-card, venue-lanes, agenda, catalog-form
- No new tests: the pure logic (clash, lanes, parse, actions) was covered by 04-03's 21 tests in tests/admin; 04-06 is rendering only.

## Verification
- `npx vitest run`: 15 files, 131 tests pass. `npm run lint`, `npm run typecheck` clean.
- Acceptance greps: lib/db and dangerouslySetInnerHTML = 0; "Overlaps with" in venue-lanes = 0 (conflict text comes from `listBookings`); delete in catalog = 0; requireRole present in approvals layout and both pages. Frozen-file check prints nothing.
- NOT done: no browser walk. `next dev` in this worktree fails (Turbopack cannot resolve `next` through the symlinked node_modules), so every page was typechecked and linted only, as was the 04-03 dashboard. Please verify all four admin screens in 04-04 from the main tree.

## Decisions and deviations
- DecisionCard stays mounted after a decision (the page keeps it in a fixed slot and the page re-renders with a non-pending event), so the success Alert and "Next waiting event" survive the revalidation. It renders nothing when not pending and no result.
- "Return with reason" reveals the Textarea, then a "Review return" button opens the dialog (Enter in a textarea is a newline, so a button is needed).
- `Textarea` does not accept `ref` (frozen), so focus uses a wrapper ref plus querySelector.
- The `<caption>` for the catalog tables is in `_components/catalog-form.tsx`, not `catalog/page.tsx`, because the client section owns the tables. The plan's grep on page.tsx would count 0; the tables do have captions.
- Catalog form is controlled (onSubmit + transition, not a form action) so input is kept on error. It adds an optional Location field for venues, because `saveVenue` would otherwise null the existing location on edit.
- Resource domain error "N are already reserved..." is shown under the Total field; other errors in a summary Alert.
- Calendar: week selector and lanes table are md+; below 768 only the agenda. `?view=agenda` shows the agenda at all sizes. Default week is the week containing today. Legend shows statuses present in the month plus Clash.
- Approvals header `<h1>` "Approvals" lives in the queue pane (layout), so on a detail page the title is the event name, and below 1024 the detail page has the event h1 only.
- Running `next dev` auto-appended a Next.js block to AGENTS.md; I removed it again by hand and deleted `.next`.

## Known Stubs
None.

## Threat flags
None beyond the plan register (T-04-31..35): actions from 04-03 check requireRole and recompute the clash; pages re-check the role; reason echoed as text children.

## kb ids consulted
dom-requirements, dom-status-vocabulary, dom-domain-model, src-hmi-principles (via plan and UI-SPEC).

## Self-Check: PASSED
All files exist; vitest, lint and typecheck green.
