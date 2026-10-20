# Phase 5: Cross-Cutting - Research

**Researched:** 2026-10-20
**Domain:** Next.js 16.4.2 App Router on Cloudflare Workers (D1): CSV/print reports, alert surfacing, state coverage, a11y audit, Review & Confirm audit
**Confidence:** MEDIUM-HIGH (Phase 3 code and Next docs verified locally; Phase 4 screens do NOT exist yet, so everything about them is from plans/UI-SPEC and must be re-verified)

## User Constraints

No `05-CONTEXT.md` exists (discuss-phase was not run). Binding constraints come from `CLAUDE.md`, `AGENTS.md`, `adr-004-scope`:
- One interface per role; status = icon + text + colour, one vocabulary (`dom-status-vocabulary`); never colour alone.
- Irreversible actions (submit, register, cancel, approve) go through Review & Confirm + plain-language feedback.
- WCAG 2.2 AA, 44px targets, full keyboard path, A-/A/A+, human error messages.
- Free tier only, no new paid deps, no email/SMS, payments, native apps, vector search (`adr-004-scope`).
- Never invent usability results; draft only. One commit per verified phase; gate = `npm run lint && npm run typecheck && npm test && npm run build`.
- Frozen-after-Phase-3 paths (`lib/**`, `components/ui/**`, `app/globals.css`, `app/layout.tsx`, `tests/*` frozen list) were frozen for the Phase 4 wave only. Phase 5 is a single-owner phase, so editing them is allowed, but each edit should be an explicit plan task (AGENTS.md: "changes need an explicit phase task").

## Summary

Phase 4 already specifies, per role, most of what Phase 5's criteria ask for: `loading.tsx`/`error.tsx` per role, empty-state copy, Review & Confirm via the frozen `ConfirmDialog` with a verb/summary/consequence/success table (UI-SPEC "Review & Confirm"), the `lowreg`/`overdue`/`clash` status keys, `isOverdue`/`isLowReg` in `lib/domain/rules.ts`, an Admin dashboard "Attention" list, a Student Alerts page and a Coordinator glance strip. So Phase 5 is mostly (a) the two things Phase 4 explicitly deferred or omitted (reports/export, a unified alert surface), (b) closing gaps no role plan covers (root `not-found`, `global-error`, `app/error.tsx`, login states, direct-URL 404s), and (c) an audit-and-fix pass with runnable guards (static tests that walk `app/`), so the HMI rules hold on every screen rather than only where a Phase 4 agent remembered them.

The three biggest technical traps: (1) Route Handlers (`route.ts`) are not wrapped by the `(role)/layout.tsx` guard, so the CSV handler must call `getCurrentProfile()` and enforce role itself; (2) CSV must be built from the same view-model function the report page renders, otherwise "file matches dashboard" (success criterion 1) silently drifts; (3) `error.tsx` does not catch errors from the layout in the same segment, and `global-error.tsx` renders its own `<html>` without app styles unless it imports `globals.css`.

**Primary recommendation:** Build one pure read model `lib/domain/reports.ts` (rows from existing domain reads, via `listVisibleEvents`/`listEventsWithSeats`) + a pure `toCsv()`; render it on `/admin/reports` and `/coordinator/reports` (table + native `window.print()` button + CSV link) and serve CSV from a `route.ts` next to each page. Add one pure `computeAlerts()` in `lib/domain/alerts.ts` feeding one shared `AttentionList` component. Add root `not-found.tsx`, `error.tsx`, `global-error.tsx`. Enforce the rest with a filesystem-walking vitest guard (`tests/xcut/*.test.ts`) plus a documented keyboard/browser pass.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Report data (rows, totals) | API / Backend (`lib/domain/reports.ts`, server) | Database (existing reads) | Authorization is `lib/domain`; same rows feed page and CSV |
| CSV generation and download | API / Backend (Route Handler) | — | Needs session check + `Content-Disposition`; pure `toCsv` unit-testable |
| Print view | Browser (CSS `@media print` + `window.print()`) | Frontend Server (renders the table) | Native, zero deps |
| Alert computation (clash/lowreg/overdue) | API / Backend (pure fn over domain reads) | Frontend Server (renders) | Rules already pure in `lib/domain/rules.ts`; compute at request time, no new tables |
| Alert surfacing | Frontend Server (shared component) | Browser (disclosure only) | Keep zero client JS where possible (`<details>`) |
| Empty/loading/error states | Frontend Server (`loading.tsx`, `not-found.tsx`) | Browser (`error.tsx`, `global-error.tsx` must be client components) | Next conventions |
| Text size, targets, keyboard | Browser (CSS tokens, existing `TextSizeControl`) | — | Already built in Phase 3; Phase 5 audits |
| Review & Confirm | Browser (`ConfirmDialog`, native `<dialog>`) | API (server action re-validates, `humanize`) | Dialog is UX only; DB/domain remain the real guard |
| Consistency (terms, layouts) | Shared components + static tests | — | Enforced by test, not by memory |

## Standard Stack

No new packages. Everything is already installed. [VERIFIED: package.json]

### Core
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| next | 16.4.2 | `route.ts` CSV handler, `loading/error/not-found/global-error` conventions | Installed; docs read locally in `node_modules/next/dist/docs` [VERIFIED] |
| @opennextjs/cloudflare | ^1.20.12 | Workers runtime | `Response`/`Headers`/`TextEncoder` are all available; no Node-only API needed for CSV [ASSUMED: standard Workers Web APIs] |
| tailwindcss | 4.3.3 | `print:` variant and `@media print` | Native variant, no plugin [ASSUMED: Tailwind v4 ships `print:` variant; confirm with a build] |
| lucide-react | 1.60.0 | Icons (`Download`, `Printer`, `Inbox`, `SearchX`) | Already used; Wave 0 must run the export check as Phase 4 did |
| vitest | 5.0.5 | Static guards + pure unit tests | Existing runner; node env only [VERIFIED: vitest.config.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written `toCsv` (about 10 lines) | `papaparse`, `csv-stringify` | New dep for 10 lines. Skip (YAGNI) |
| `window.print()` + print CSS | PDF library / server PDF | Needs deps, Workers limits. Skip |
| Custom static + node scripts for a11y | `@axe-core/playwright`, Playwright | Free but new devDeps and browser download. See A11y section; optional |
| Notification table rows for alerts | Computed alerts | Computed = no migration, always current. Use computed |

**Installation:** none.

## Package Legitimacy Audit

No external packages are recommended. `axe-core` 4.14.0 exists in `node_modules` as a transitive dependency [VERIFIED: package-lock.json]; it is optional and is not added to `package.json`.

**Packages removed:** none. **Flagged [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
Browser (Coordinator / Admin)
  |  GET /admin/reports                     GET /admin/reports/export  (CSV link, same filters in query)
  v                                          v
(admin)/layout.tsx  requireRole('admin')     route.ts  --> getCurrentProfile() + role check  (layout does NOT wrap route.ts)
  v                                          |
page.tsx (server component)                  |
  |                                          |
  +--------> lib/domain/reports.ts  <--------+     buildReport(actor, filters, now) -> { columns, rows, totals }
                 | uses listVisibleEvents / listEventsWithSeats / listTasks (actor-scoped, role in WHERE)
                 v
               D1 (read only)
  |                                          |
  v                                          v
<ReportTable rows/>  + Print button          toCsv(columns, rows) -> Response(text/csv, attachment, no-store)
  + @media print rules (hide shell, show title/date/who)

Alerts:  page.tsx --> lib/domain/alerts.ts computeAlerts(events, tasks, bookings, now) --> <AttentionList items/>
         (kind = clash | lowreg | overdue; rules from lib/domain/rules.ts; role scoping from the reads)
```

### Recommended Project Structure
```
lib/domain/reports.ts            # buildReport(actor, filters, now): pure shaping over existing reads; toCsv() lives in lib/csv.ts
lib/csv.ts                       # toCsv(columns, rows): RFC 4180 quoting, formula-injection guard, CRLF, BOM
lib/domain/alerts.ts             # computeAlerts(): pure; returns [{kind, key, text, href}] sorted by severity
components/ui/attention-list.tsx # shared: count heading + first 5 + <details> for the rest
components/ui/empty-state.tsx    # shared: heading + sentence + one action (if Phase 4 did not already extract one; check)
components/ui/page-error.tsx     # shared body for every error.tsx (retry button + plain message)
app/not-found.tsx  app/error.tsx  app/global-error.tsx
app/(admin)/admin/reports/{page.tsx,export/route.ts,loading.tsx}
app/(coordinator)/coordinator/reports/{page.tsx,export/route.ts}
tests/xcut/{csv.test.ts,reports.test.ts,alerts.test.ts,states.test.ts,confirm.test.ts,consistency.test.ts}
docs/validation/a11y-keyboard-pass.md   # manual checklist (results left blank for the team)
```

### Pattern 1: CSV Route Handler with its own auth check
**What:** GET handler returns a `Response` with CSV; role enforced in the handler; same `buildReport` as the page.
**Why:** Layouts do not wrap `route.ts`, so the `requireRole` layout guard does not run. [CITED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md - handler gets only the request; cookies read via `cookies()`/`request.cookies`]
```ts
// app/(admin)/admin/reports/export/route.ts
import { getCurrentProfile } from "@/lib/auth";
import { buildReport } from "@/lib/domain/reports";
import { toCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") return new Response("Not allowed", { status: 403 }); // do not redirect a download
  const { columns, rows } = await buildReport({ id: me.id, role: me.role }, Object.fromEntries(new URL(req.url).searchParams), new Date());
  return new Response(toCsv(columns, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="events-report.csv"',
      "Cache-Control": "no-store",
    },
  });
}
```
Route handlers that read cookies are dynamic; `Cache-Control: no-store` is belt and braces. Whether `getDb()` works inside a route handler under OpenNext is the same binding mechanism as server actions/components [ASSUMED]; Wave 0 must verify by `npm run preview` once.

### Pattern 2: Single read model, two renderers
`buildReport` returns `{ columns: {key,label}[], rows: Record<string,string|number>[], totals }` with values already formatted via `lib/format.ts` (dates in `Asia/Kolkata`) and status as the `STATUS_META` label (not the DB key). The page renders `rows` as a `<table>` with `<caption>`, `<th scope>`; `toCsv` renders the same rows. Test: parse `toCsv` output and assert equal to `rows` for the seed (success criterion 1).

### Pattern 3: Computed alerts, one component
```ts
// lib/domain/alerts.ts (pure)
export type AlertItem = { kind: "clash" | "lowreg" | "overdue"; key: string; text: string; href: string };
// text uses the sentence style Phase 4 UI-SPEC set: "Photo Walk has low registrations", "2 tasks are overdue"
// Group overdue per event ("2 tasks are overdue on Quiz Night"), not per task, to keep the list short.
```
Surface rule (`dom-hmi-problems` #6): header line "Needs attention: 3" (text + icon + `StatusBadge` kind), the top 5 shown, the rest in `<details>`; empty state "Nothing needs attention." Role scoping comes from the input arrays (already actor-scoped reads), never from a client flag. Clash source: Admin `flagConflicts` (assumed semantics A2 from Phase 4); coordinators only see clashes for their own events; students get `overdue` for their own tasks and reminders (Phase 4 `REMINDER_DAYS`), never `clash`/`lowreg`.

### Pattern 4: Page-level state files
- Every route segment under a role inherits the role-root `loading.tsx` and `error.tsx` (error boundary wraps nested pages; loading wraps via Suspense) [CITED: error.md, not-found.md hierarchy notes]. So per-route files are only needed where the skeleton shape differs.
- `error.tsx` in this Next version receives `retry` (and the older `reset`); `unstable_retry` was added in 16.2 and the 16.4 docs show `retry`. [CITED: node_modules/next/dist/docs/.../error.md lines 115-160]. Use `retry()`, and re-verify what Phase 4's `error.tsx` files destructure (Phase 4 text says only "Try again").
- Never render `error.message` (production serializes a generic message; dev leaks). Fixed copy only: "We could not load this page" / "Your work is safe. Check your connection and try again." (UI-SPEC wording).
- `app/error.tsx` (root) catches failures in `(role)/layout.tsx` (e.g. D1 down during `requireRole`) because it wraps nested layouts below the root layout. `app/global-error.tsx` must include `<html lang="en"><body>` and `import "./globals.css"` itself, and cannot export `metadata` (use React `<title>`) [CITED: error.md lines 163-167].
- `app/not-found.tsx` for unknown URLs plus `notFound()` from `[id]` pages when the actor cannot see the row. Use not-found, not "Not allowed", so existence is not leaked (also correct UX: "We can't find that page" + link to the role home). Needs a server component that can still show a "Go to my home" link: use `getCurrentProfile()` + `homeFor`, fall back to `/login`.

### Pattern 5: Print stylesheet
Add to `app/globals.css` (task must be explicit, file was frozen):
```css
@media print {
  .skip-link, header, nav, [data-no-print] { display: none !important; }
  main { max-width: none; padding: 0; }
  body { background: #fff; color: #000; }
  table { break-inside: auto; } tr { break-inside: avoid; } thead { display: table-header-group; }
  a[href]::after { content: none; }
}
```
The print page must show title, generated date/time, who generated it (role label + name), and the active filters as text, so a printout is self-describing. Status stays icon + word (colour backgrounds may not print; the word and icon survive). [ASSUMED: header/nav are the AppShell `<header>`/`<nav>` elements, confirmed in `components/ui/app-shell.tsx`; prefer adding `print:hidden` Tailwind classes in the shell if edited.]

### Anti-Patterns to Avoid
- **Reimplementing the dashboard numbers in SQL for reports.** Drift. Reuse the Phase 4 view-model functions (`_lib` of admin dashboard) or move the pure aggregation into `lib/domain/reports.ts` and have the dashboard import it. Re-verify what Phase 4 put in `app/(admin)/admin/_lib/`.
- **`redirect()` inside the CSV handler.** A download link that redirects to `/login` saves an HTML file named `.csv`. Return 401/403 text.
- **Alert as modal/toast/banner stack.** Violates "without overwhelming". One list, counts, collapse.
- **Silently disabled buttons.** Use `aria-disabled` plus a visible reason (UI-SPEC rule).
- **Per-role copies of the same component.** Phase 4 built `calendar.tsx` and `event-card.tsx` in both coordinator and student folders (see plan file lists). Candidate consolidation for XCUT-05, but only where behaviour is identical; otherwise align copy and markup by test, not by refactor.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal confirm | custom overlay/focus trap | frozen `ConfirmDialog` (native `<dialog>.showModal`) | Focus trap, Esc, return focus come free |
| Status chips | ad-hoc coloured text | `StatusBadge` + `STATUS_META` (17 keys after Phase 4 Wave 0) | Vocabulary consistency, contrast tested |
| Inline alerts | new banner variants | `Alert` (`role=alert` for error, `status` otherwise, `tabIndex=-1` for focus) | Exists |
| Date display | `toLocaleString` scattered | `lib/format.ts` | One TZ; CSV must use it too |
| Error text | raw `error.message` | `humanize()`/`DomainError.message` (`lib/errors.ts`) | No trigger names/SQL |
| Print layout | PDF generation | `@media print` + `window.print()` | Free, native |
| Text size | new control | `TextSizeControl` already in shell | Done in Phase 3 |
| Live regions | ad-hoc announcers | `Alert` roles and one `aria-live="polite"` region per view (UI-SPEC) | Avoid chatter |

## Common Pitfalls

### Pitfall 1: CSV formula injection and Excel quirks
**What goes wrong:** Event titles or reasons beginning `= + - @` (or tab/CR) execute as formulas when opened in Excel/Sheets. Quotes/commas/newlines in titles break columns. Excel mis-reads UTF-8 without a BOM.
**How to avoid:** `toCsv` doubles `"`, wraps every cell in quotes, prefixes a single `'` when the cell starts with `= + - @ \t \r`, joins with `\r\n`, and prepends `\uFEFF`. Unit-test all four. [CITED: RFC 4180 for quoting; OWASP CSV injection guidance, ASSUMED recalled from training, verify in plan]
**Warning signs:** A seed title with a comma in a test row fails the round-trip test.

### Pitfall 2: Route handler bypasses the layout guard
See Pattern 1. Also students must get 403 on both report routes; test with the `authz.test.ts` style by calling the exported `GET` with a faked session or, simpler, test `buildReport` throws `NOT_ALLOWED` for a student actor and have the handler map that to 403.

### Pitfall 3: Report scope leaks
Coordinator report must be scoped by `visibleWhere(actor)` / owner in WHERE, not filtered in the component. Test: coordinator B's report contains none of coordinator A's events.

### Pitfall 4: Dashboard and report drift
Seeds use dates relative to load time (04-RESEARCH). Tests must pass an explicit `now` (as `rules.ts` already does) and never read the real clock.

### Pitfall 5: Error boundary gaps
Layout errors not caught by same-segment `error.tsx`; root error and global-error missing; `loading.tsx` missing on report routes (heavy reads). A static test walks `app/` to prove every `page.tsx` has a role-level or root `error.tsx` and, for non-login pages, a `loading.tsx` ancestor.

### Pitfall 6: Text-size and target-size
Spacing is px (`--spacing: 4px`, `min-h-11` = 44px at every text size) and only text scales (`globals.css` comment, `button.tsx`). Phase 4 role-local controls (chips, step-rail items, calendar cells, row title links) must keep `min-h-11 min-w-11` and avoid rem/`em` heights or `h-8/h-9/h-10`. Static test greps role folders for small fixed heights on interactive elements; the browser pass checks A+ (20px) for overflow/clipping (long titles in the calendar cell, queue pane, table headers) and A- for reflow.

### Pitfall 7: Direct URL to a hidden record
`/student/events/{id}` for a draft or someone else's event, `/coordinator/{id}` for another coordinator's event: must be `notFound()`, not a stack trace and not an empty shell. Check each `[id]` page after Phase 4.

### Pitfall 8: Review & Confirm bypassed by an unlisted action
UI-SPEC lists 11 actions. Phase 5 audit: grep for every domain function that mutates state irreversibly (`submitEvent`, `reviewEvent` approve/return, `cancelEvent`, register, cancel registration, open registration, start/complete, save changes to live event, plus `setTaskStatus`/draft save which are explicitly reversible and exempt) and assert each is only reachable from a client flow that renders `ConfirmDialog`. Also "Return with reason": check it is not skipped when the reason textarea exists.

## Code Examples

### toCsv (lib/csv.ts)
```ts
const DANGEROUS = /^[=+\-@\t\r]/;
const cell = (v: string | number | null | undefined) => {
  let s = v == null ? "" : String(v);
  if (typeof v === "string" && DANGEROUS.test(s)) s = "'" + s; // numbers (e.g. -1) are left alone
  return `"${s.replace(/"/g, '""')}"`;
};
export function toCsv(cols: { key: string; label: string }[], rows: Record<string, string | number | null>[]): string {
  const lines = [cols.map((c) => cell(c.label)), ...rows.map((r) => cols.map((c) => cell(r[c.key])))];
  return "\uFEFF" + lines.map((l) => l.join(",")).join("\r\n") + "\r\n";
}
```

### Static guard: every page has error + loading ancestors (tests/xcut/states.test.ts)
```ts
import { readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { test, expect } from "vitest";
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const hasAncestor = (file: string, name: string) => { let d = dirname(file); for (;;) { if (["tsx","ts"].some((x) => existsSync(join(d, `${name}.${x}`)))) return true; if (d === "app") return false; d = dirname(d); } };
test("every page has an error boundary and (except login/design) a loading file above it", () => {
  const pages = walk("app").filter((p) => /page\.tsx$/.test(p));
  for (const p of pages) {
    expect(hasAncestor(p, "error"), p).toBe(true);
    if (!/app\/(login|design)\//.test(p) && p !== "app/page.tsx") expect(hasAncestor(p, "loading"), p).toBe(true);
  }
});
```
(This test intentionally fails until Phase 4 lands; run it after merge.)

### Static guard: irreversible actions are confirmed (tests/xcut/confirm.test.ts)
Read every `app/**/_components/*.tsx` that imports an action from `../actions` (or `@/.../actions`) and calls one of `IRREVERSIBLE = [submit, approve, return, cancel, register, joinWaitlist, openRegistration, start, complete, saveChanges]` (exact exported names to be taken from the Phase 4 `actions.ts` files after merge); assert the same file imports `ConfirmDialog`. Keep the list in the test file with one comment per entry mapping to the UI-SPEC row.

### Alerts unit test
Use fixed `now`, seed-like objects: one open event 3 days out with 1/40 confirmed (lowreg), 2 overdue tasks on one event (one grouped item), a student actor receives no `clash`/`lowreg`.

## Runtime State Inventory

Not a rename/refactor phase: skipped.

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| `error.tsx` prop `reset` | `retry` (re-fetches); `unstable_retry` appeared in 16.2; `reset` still exists | Use `retry()`; re-check Phase 4's files [CITED: error.md] |
| `global-not-found.js` | experimental in 16.x | Do not use; plain `app/not-found.tsx` suffices |
| axe via Playwright | optional | See A11y plan |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getDb()` (Cloudflare context) works inside `route.ts` under OpenNext the same as in server components/actions | Pattern 1 | CSV route fails on Workers; fallback: serve CSV from a server action returning a Blob, or from the page via a form POST. Verify with `npm run preview` in Wave 0 |
| A2 | Tailwind v4 provides the `print:` variant | Standard Stack | Fall back to the `@media print` block in globals.css (already planned) |
| A3 | Report columns (title, status, date/time, venue, department, registered/capacity, overdue task count; Admin adds utilisation and department split) are what the team wants | Pattern 2 | Cosmetic; confirm with the user in plan check. Report content is not specified anywhere beyond "[A5] Reports export as CSV or print" |
| A4 | CSV formula-injection prefix convention (`'`) | Pitfall 1 | Low |
| A5 | The Admin dashboard and the Coordinator monitor are built from reusable pure view-model functions in `_lib/` | Anti-patterns | If inline in components, Phase 5 must extract them; this is a re-verify item |
| A6 | Phase 4 attention lists exist in the shapes UI-SPEC describes (Admin "Attention list", Coordinator glance strip, Student Alerts page) | Pattern 3 | Re-verify; Phase 5 task is "replace with shared `AttentionList`" only if shapes match, else align copy |
| A7 | Top-5 + `<details>` collapse threshold | Pattern 3 | Tuning only; this is a design assumption and has no evidence, mark `assumed` in kb if recorded |
| A8 | `eslint-plugin-jsx-a11y` is active via `eslint-config-next` | A11y | Not found at node_modules top-level; check `npm run lint` config before relying on it |

## Open Questions (RESOLVED)

1. **Report content and per-role scope.**
   - Known: A5 only says "export as CSV or print"; success criterion says "matches what the dashboard shows".
   - Unclear: whether Coordinator's report should include per-event registrant names (privacy: names/emails in a CSV).
   - Recommendation: no personal data in v1 reports (counts only). Registrant lists are out of scope unless the user asks.
   - RESOLVED: counts only; report columns fixed per the orchestrator's locked decision (title, status, date/time, venue, department, registered/capacity, overdue tasks).
2. **Where do reports live in the nav?** UI-SPEC says Admin nav deliberately excludes Reports ("Phase 5 / no requirement; no dead links"). Phase 5 must add a "Reports" nav item for Admin and Coordinator (AppShell nav is data, so this is a one-line change in each role layout, which Phase 5 now owns). Keep each nav at 7 items or fewer.
   - RESOLVED: Reports is the last nav item for Admin and Coordinator (plan 05-03).
3. **Alert for clash to Coordinators.** Active-active clashes are impossible in the DB; a "clash" alert only exists under the A2 definition (booking overlapping a non-active event or a retired venue). Decide whether Coordinators see it on their own event (recommended: yes, for events they own, with the fix link) or Admin only.
   - RESOLVED: clash alert shown for events the coordinator owns, plus Admin (plan 05-01 computeAlerts).
4. **Dismiss/mark-read for alerts.** Not required by XCUT-02, adds state (YAGNI). Recommend none. Student Alerts has "no mark-read" in UI-SPEC already.
   - RESOLVED: no dismiss/mark-read; top 5 shown, the rest in a native <details> (plan 05-04).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | tests, build | yes | 24.21.0 | — |
| google-chrome | print-to-PDF smoke, optional axe run | yes | /usr/bin/google-chrome (version not probed) | in-app browser pane / manual pass |
| axe-core | optional a11y script | yes (transitive) | 4.14.0 | manual checklist |
| Playwright/Puppeteer | automated browser tests | no | — | do not add; use manual pass + static guards (optional zero-dep CDP script, see A11y) |
| wrangler / D1 local | `npm run preview`, db tests | yes (devDep) | ^4.151.3 | node:sqlite shim in tests |
| context7 `ctx7` CLI | docs | no | — | Next docs read from `node_modules/next/dist/docs` |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.5, node environment, `tests/**/*.test.ts` |
| Config file | `vitest.config.ts` (alias `@`) |
| Quick run | `npx vitest run tests/xcut` |
| Full suite | `npm run lint && npm run typecheck && npm test && npm run build` |

No jsdom/testing-library present, so component rendering is not unit-tested; structure is verified by pure functions plus filesystem/source scans, and rendering by the browser pass.

### Phase Requirements to Test Map
| Req | Behavior | Type | Command | Exists? |
|-----|----------|------|---------|---------|
| XCUT-01 | `toCsv` quoting, injection guard, BOM, CRLF | unit | `npx vitest run tests/xcut/csv.test.ts` | Wave 0 |
| XCUT-01 | CSV rows equal page rows for seed + fixed `now`; student gets NOT_ALLOWED; coordinator scope excludes others' events | unit (d1 shim from `tests/helpers`) | `npx vitest run tests/xcut/reports.test.ts` | Wave 0 |
| XCUT-01 | Print view shows title/date/who; shell hidden | manual (browser print preview) | checklist item | manual |
| XCUT-02 | `computeAlerts` kinds, grouping, role filtering, ordering, cap | unit | `npx vitest run tests/xcut/alerts.test.ts` | Wave 0 |
| XCUT-02 | Time-to-find problem | manual, team measures (`dom-hmi-problems` #6), do not invent numbers | checklist | manual |
| XCUT-03 | every page has error + loading ancestors; root not-found/global-error exist | static | `npx vitest run tests/xcut/states.test.ts` | Wave 0 (needs Phase 4 merged) |
| XCUT-03 | empty-state copy present for each list view | static scan for the UI-SPEC headings per route | same file | Wave 0 |
| XCUT-04 | no small fixed interactive heights in `app/` and `components/`; tokens unchanged; contrast | static + existing `tests/contrast.test.ts` | `npx vitest run tests/xcut/targets.test.ts tests/contrast.test.ts` | Wave 0 / exists |
| XCUT-04 | keyboard path + A-/A/A+ | manual keyboard pass (UI-SPEC paths per role) | checklist | manual |
| XCUT-05 | banned-synonym list absent from `app/` and `components/` (e.g. "Confirmed" shown for registrations instead of "Registered", "Booked" for status, "Delete" where UI-SPEC says "Cancel"); every status rendered through `StatusBadge` (no inline status-colour classes outside it) | static | `npx vitest run tests/xcut/consistency.test.ts` | Wave 0 |
| XCUT-06 | each irreversible action reachable only from a file using `ConfirmDialog` | static | `npx vitest run tests/xcut/confirm.test.ts` | Wave 0 |
| XCUT-06 | success `Alert` focused after confirm | manual keyboard pass | checklist | manual |

### Sampling Rate
- Per task commit: not applicable (one commit per phase); per task run `npx vitest run tests/xcut`.
- Per wave: full suite.
- Phase gate: full suite green, then the manual pass for all three roles at A- / A / A+.

### Wave 0 Gaps
- [ ] `tests/xcut/*` files above
- [ ] `lib/csv.ts`, `lib/domain/reports.ts`, `lib/domain/alerts.ts` stubs with signatures
- [ ] Confirm `route.ts` + D1 works under `npm run preview` (A1)
- [ ] Confirm exact Phase 4 export names and `_lib` view models (after Phase 4 merge)
- [ ] `docs/validation/a11y-keyboard-pass.md` checklist with blank results column

### A11y audit method (XCUT-04, ROADMAP criterion 4)
The `src-evaluation-methods` section D checklist is Yes/No on: contrast; info not by colour alone; text enlargeable; keyboard navigation; target size; clear error messages; consistent navigation; alt text for important icons; accessible forms; clear labels. Map each to evidence:
- contrast: `tests/contrast.test.ts` (exists)
- colour alone: `consistency.test.ts` + visual check
- text enlargement and keyboard: manual pass at A-/A/A+ per role (UI-SPEC lists the primary-flow keyboard path per role)
- target size: static test + DevTools measurement; axe `target-size` covers only the 24px WCAG 2.2 floor, so 44px needs a custom check
- errors/forms/labels: UI-SPEC rules; static check for `aria-invalid`/`aria-describedby` pairing is optional
- decorative icons: `aria-hidden="true"` (existing components do this); grep that lucide icons in `app/` have `aria-hidden` or an accessible name
Optional, zero new deps: a Node script that launches `google-chrome --headless` with remote debugging and injects `node_modules/axe-core/axe.min.js` via CDP (Node 24 has a global `WebSocket`). Feasibility is [ASSUMED]; the cost is a day-ish of fiddling, so default to the manual pass and mark the script as a stretch task. Do not record results as `evidence` unless a team member ran them; AI-run audit output is an issue list, not usability evidence.

## Security Domain

### Applicable ASVS Categories
| Category | Applies | Control |
|----------|---------|---------|
| V2/V3 Authentication, Session | yes (route handler) | `getCurrentProfile()` inside handler (existing session lib) |
| V4 Access Control | yes | Role check + owner/role in WHERE in `reports.ts`; students blocked; `notFound()` for hidden records |
| V5 Input Validation | yes | Report filters from query string: whitelist values (status keys, ISO date), ignore unknown; no interpolated SQL (`tests/db-boundary.test.ts` forbids template-literal SQL in `lib/`) |
| V6 Cryptography | no | — |
| V7 Error handling | yes | Fixed error copy, never `error.message`/digest to users |

### Known Threat Patterns
| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| CSV/formula injection | Tampering | Prefix guard in `toCsv` |
| Report endpoint without auth | Information disclosure | Auth inside `route.ts`; test |
| Cross-coordinator data in report | Information disclosure | Actor-scoped reads |
| Verbose error leaking SQL/trigger names | Information disclosure | `humanize()`; error.tsx fixed copy |
| Cached CSV served to another user | Information disclosure | `Cache-Control: no-store`, cookie-reading handler is dynamic |
| Personal data in exports | Information disclosure | Counts only in v1 |

## Re-verify after Phase 4 lands (checklist for the planner's Wave 0)
1. Real routes under `app/` vs the plan lists (admin: dashboard, approvals/[id], calendar, catalog; coordinator: root, new, [id], [id]/edit, [id]/change, calendar, tasks, notifications; student: root, events/[id], mine, tasks, alerts).
2. `loading.tsx`/`error.tsx` presence per route, which props `error.tsx` destructures (`retry` vs `reset`), and that none prints `error.message`.
3. Empty-state strings match UI-SPEC and use a shared component or are duplicated (extract only if 3+ duplicates).
4. Exported action names in each `actions.ts`; each irreversible one behind `ConfirmDialog`; focus moves to the success `Alert`.
5. Where dashboard/glance/attention numbers are computed (A5/A6) and `lib/domain/admin.ts` (`flagConflicts`) / `views.ts` signatures.
6. Role layouts: nav item arrays (add Reports), `AppShell` untouched, `requireRole` still called.
7. Duplicated components across roles (calendar, event-card) and any terminology drift for XCUT-05.
8. `STATUS_META` has 17 keys, `npm test` including `contrast.test.ts` green.
9. Working tree: `git status` showed Phase 3-uncommitted files (`lib/domain/rules.ts`, `lib/format.ts`, `catalog.ts`, `allocations.ts`, `drafts.ts`) as untracked; Phase 5 must start from a verified, committed Phase 4.

## Sources

### Primary (HIGH confidence)
- Local Next 16.4.2 docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/{error,not-found,route,loading}.md` (error boundary hierarchy, `global-error` rules, `retry`/`reset`, route handler signature)
- Repo code: `components/ui/{alert,confirm-dialog,text-size-control,app-shell,button,field}.tsx`, `lib/{errors,format,auth}.ts`, `lib/domain/{rules,notifications,actor}.ts`, `app/globals.css`, `vitest.config.ts`, `package.json`
- Planning docs: ROADMAP Phase 5, REQUIREMENTS XCUT-01..06, `04-UI-SPEC.md`, `04-00-PLAN.md`, `04-RESEARCH.md`, `AGENTS.md`, `kb/domain/{hmi-problems,status-vocabulary}.md`, `kb/source/attendance-reference` evaluation methods section D

### Secondary / LOW (training knowledge, flagged ASSUMED)
- Workers Web API availability, Tailwind `print:` variant, CSV injection convention, CDP+axe feasibility

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (nothing new)
- Architecture (reports, alerts, states): MEDIUM, depends on Phase 4 outcomes and A1
- Pitfalls: MEDIUM-HIGH
- Phase 4 specifics: LOW until re-verified

**Research date:** 2026-10-20
**Valid until:** 2026-11-03 or until Phase 4 merges, whichever is first
