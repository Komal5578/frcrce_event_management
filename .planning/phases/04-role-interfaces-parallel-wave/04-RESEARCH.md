# Phase 4: Role Interfaces (parallel wave) - Research

**Researched:** 2026-10-20
**Domain:** Next.js 16 App Router + OpenNext/Cloudflare Workers + D1; three role UIs over an actor-explicit domain layer
**Confidence:** HIGH on repo facts (read from code), MEDIUM on Next/Workers behaviour (training knowledge, not re-verified with Context7 this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase. Binding constraints come from CLAUDE.md, AGENTS.md and ROADMAP (treated as locked):

### Locked Decisions
- Three agents, three worktrees, each owns exactly one route folder: 4a `app/(coordinator)/**`, 4b `app/(student)/**`, 4c `app/(admin)/**`, plus own tests under `tests/<role>/**`.
- Frozen after Phase 3: `migrations/`, `seed/`, `scripts/hash-password.mjs`, `wrangler.jsonc`, `open-next.config.ts`, `cloudflare-env.d.ts`, `components/ui/**`, `lib/**`, `app/globals.css`, `app/layout.tsx`, `app/login/**`, `app/design/**`, listed `tests/*.test.ts` and `tests/helpers/**`, `package.json` dependencies, `vitest.config.ts`.
- Route code may import only `lib/domain` and `lib/auth` (never `@/lib/db`/`getDb`; `tests/db-boundary.test.ts` enforces).
- No new npm dependencies. Stay on Cloudflare free tier. Layout guards must keep calling `requireRole`.
- Design rules: one interface per role; icon+text+colour status from one vocabulary; Review & Confirm for submit/register/cancel/approve/return; WCAG 2.2 AA, 44px targets, A-/A/A+; human error messages; no email/SMS, payments, native apps, vector search (`adr-004-scope`).
- One commit per verified phase, never per plan/task. No invented research or usability numbers.

### Claude's Discretion
Screen composition, server-action vs route-handler choice, test layout inside `tests/<role>/`, how to resolve the domain-layer gap (see Summary).

### Deferred Ideas (OUT OF SCOPE)
Alerts/notification polish, reports/CSV export (A5), a11y pass, empty/error/loading polish, Review & Confirm sweep (all Phase 5); real usability sessions (Phase 6); deploy docs (Phase 7); v2: I18N-01, EXPT-01, CHKN-01.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COORD-01 | Create from template, draft autosaves | Needs NEW domain fns (templates list, createDraft, saveDraft); only schema supports it |
| COORD-02 | Venue picker shows free venues + capacity | `freeVenues` exists; need `listVenues` for "not available, with reason" |
| COORD-03 | Request resources, see availability | `resourceAvailable` exists; need listResources + set/remove allocation fns |
| COORD-04 | Allocate tasks with due dates, see status | `setTaskStatus` only; need createTask, listTasks, list students |
| COORD-05 | Submit via Review & Confirm, see state | `submitEvent`, `manageableEvent`, `ConfirmDialog`, `StatusBadge` exist |
| COORD-06 | Monitor registrations vs capacity, overdue tasks, status | `listVisibleEvents`, `seatCounts` exist; need listTasks (overdue computed app-side) |
| COORD-07 | Edit/cancel with confirmation, notify | `cancelEvent` exists (notifies atomically); edit of a submitted event needs NEW `updateEvent` |
| STUD-01 | Search + filters | `listVisibleEvents` exists; filter app-side; need venue names + dept list (listVenues) |
| STUD-02 | Event detail at a glance | `listVisibleEvents`+`seatCounts`; venue name needs listVenues |
| STUD-03 | Register via R&C, waitlist, cancel | `registerForEvent`, `cancelRegistration`, `seatCounts` exist |
| STUD-04 | My Registrations, calendar, reminders | `listNotifications` exists; need `listMyRegistrations` (and markRead if desired) |
| STUD-05 | Organizer My Tasks, mark done | `setTaskStatus` exists; need `listMyTasks` + organizer flag (is_organizer not exposed by `getCurrentProfile`) |
| ADMIN-01 | Approvals queue w/ clash check + resources; approve/return | `reviewEvent`, `listVisibleEvents`, `freeVenues`, `resourceAvailable` exist; need event allocations list |
| ADMIN-02 | Calendar of all events/venues, conflicts highlighted | `bookings` view exists but no domain reader; need `listBookings` |
| ADMIN-03 | Manage venues and resources | No write fns exist; need NEW catalog fns |
| ADMIN-04 | Dashboard stats | App-side aggregates over `listVisibleEvents` possible; utilisation needs venues |
</phase_requirements>

## Summary

The Phase 3 domain layer is thinner than the handoff table implies. Reading `lib/domain/*.ts` shows 13 exported functions, all of them transitions or reads for an *existing* event. There is **no function that creates or edits an event/draft, lists venues, resources, templates, tasks, registrations or students, creates a task, writes a resource allocation, manages venues/resources, reads `bookings`, or marks a notification read**. Because route code may not touch `getDb` (boundary test) and `lib/**` is frozen, roughly half of the 16 requirements (COORD-01, 03, 04, 07-edit, ADMIN-02, 03, STUD-04, 05 list parts) cannot be built by wave agents as the freeze is written. `[VERIFIED: codebase read of lib/domain/*.ts, tests/db-boundary.test.ts]`

**Primary recommendation:** Insert a short serial **Wave 0 plan (04-00, "domain additions")** executed by the Phase 3 owner as an explicit phase task (AGENTS.md allows `lib/**` changes "with an explicit phase task"). It adds only NEW files under `lib/domain/` (no edits to existing frozen files, except a re-export-free approach), the status keys, and its own test file, then re-freezes. Then run 4a/4b/4c in parallel, each only in its route folder. This needs user confirmation (see Open Questions, A1) because it amends the freeze.

Stale references found: `03-HANDOFF.md` (b) says "Supabase clients in `lib/supabase/`" and (a) says "RLS-free" correctly but (b) is wrong. `lib/supabase/` does not exist; `eslint.config.mjs` still ignores `supabase/**` (harmless). Auth is D1 sessions (`lib/session.ts`, `lib/password.ts`). Ignore any Supabase wording. `[VERIFIED: ls lib, cat lib/auth.ts]`

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Role gating | Frontend Server (layout `requireRole`) | `lib/domain` actor checks | Layout redirects; domain re-checks role/ownership in SQL |
| Mutations (submit, register, review...) | Server Actions in the route folder | `lib/domain` -> D1 triggers | Actions build `Actor` from session, call domain, map `DomainError` |
| Clash / double-register / capacity | Database (triggers, UNIQUE) | UI pre-filtering (`freeVenues`) | `dom-domain-model`, X5: DB is the guarantee, UI only prevents |
| Review & Confirm | Browser (`ConfirmDialog`) | Server Action | Dialog is client; commit is the action |
| Draft autosave | Browser (debounced action call) | Server Action -> domain | Needs a `saveDraft` domain fn |
| Search/filter/calendar | Server Component + URL search params | Browser for calendar toggle | Event volume is small; filter in TS after `listVisibleEvents` |
| Dashboard aggregates | Server Component (TS reduce) | Domain read | Avoids new SQL; <100s of rows |

## Standard Stack

No new packages. Already installed and pinned in `package.json` `[VERIFIED: package.json]`:

| Library | Version | Purpose |
|---------|---------|---------|
| next | 16.4.2 | App Router, Server Actions, Server Components |
| react / react-dom | 19.3.1 | `useActionState`, `useTransition`, `useOptimistic` |
| @opennextjs/cloudflare | ^1.20.12 | Workers adapter; bindings via `getCloudflareContext` (only in `lib/db.ts`) |
| tailwindcss | 4.3.3 | Tokens in `app/globals.css` `@theme` |
| lucide-react | 1.60.0 | Icons (status and nav) |
| vitest | 5.0.5 | Node env; `node:sqlite` in-memory D1 shim |

**Package Legitimacy Audit:** No new external packages are installed in this phase; audit not applicable. Do not add any (AGENTS.md).

### Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Review & Confirm | custom modal | `components/ui/ConfirmDialog` (native `<dialog>`, focus managed) | a11y, consistency (X2, X4) |
| Status chips | ad-hoc coloured spans | `StatusBadge` + `STATUS_META` | X1 one vocabulary |
| Form fields/errors | raw inputs | `Field` + `Input/Select/Textarea`, `Alert` | labels, errors, 44px |
| Clash detection | app-side overlap check as the guarantee | DB triggers + `freeVenues` for UI | races |
| Seat decision | read-count-then-insert | `registerForEvent` (single statement) | last-seat race |
| Date/time handling | date library | `Date` + `<input type="datetime-local">`/`date`, store ISO `...fffZ` | schema GLOB requires `YYYY-MM-DDTHH:MM:SS.mmmZ` exactly (`toISOString()`) |
| Calendar | calendar lib | CSS grid month/agenda list in TS | no new deps; a list grouped by day is the accessible default |
| Error text | raw `e.message` | `DomainError.message` (already human) | never leak trigger names |

## Current Code State (evidence)

- `app/`: `(admin)/layout.tsx`, `(admin)/admin/page.tsx`, same for coordinator and student; `login/` (actions.ts, login-form.tsx, page.tsx), `design/`, `layout.tsx`, `page.tsx`, `globals.css`. Each role layout: `const profile = await requireRole('role')` then `<AppShell roleLabel userName navItems={[]} signOut={signOut}>`. Pages are stubs ("not built yet") that the Phase 4 owner overwrites. `signOut` is imported from `@/app/login/actions` (route code may import it; it is a server action). Role home paths are `/coordinator`, `/student`, `/admin` (`homeFor`), so each role's routes live under its own `app/(role)/<role>/...` segment and do not collide.
- `lib/auth.ts`: `requireRole(role)` returns `{id, name, role}` (redirects otherwise); `getCurrentProfile()`. It does **not** return `is_organizer` or department. Student My Tasks gating (D-02 hide tab for non-organizers) therefore needs a domain read (see gaps) or showing the tab to all students with an honest empty state.
- `lib/domain` exports (all `(actor, ...)`): `freeVenues`, `resourceAvailable`, `listVisibleEvents`, `manageableEvent`, `submitEvent`, `reviewEvent`, `cancelEvent`, `notifyRegistrants`, `listNotifications`, `registerForEvent`, `cancelRegistration`, `seatCounts`, `setTaskStatus`; `Actor`, `requireActorRole`, `EventRow`, `visibleWhere`. `Actor = { id, role }`, built from `requireRole` result (`{id: p.id, role: p.role}`).
- Visibility (SQL): students see open/ongoing/completed + any event they have a registration row on (so cancelled events they registered for appear); coordinators see own events; admin all. `listVisibleEvents` returns raw `EventRow` (venue_id, no venue name).
- `components/ui`: `AppShell` (client; `navItems: {href,label,icon}[]` where icon is a ReactNode, built by the layout - a server layout can pass lucide icons as elements), `Button` (primary/secondary/destructive/ghost, `loading`), `Card`, `Alert` (info/success/warning/error), `Field`+`Input/Select/Textarea`, `ConfirmDialog` (controlled: `open, verb, summary, consequence, onConfirm, onCancel, busy`; title defaults to "Review before you {verb}"), `StatusBadge` (9 keys: draft pending approved open ongoing completed cancelled full returned), `TextSizeControl`.
- `StatusBadge` has **no** keys for registration (confirmed/waitlisted), task (todo/doing/done/overdue) or clash. Wireframes call these "assumed until Phase 3 tokens". Reuse `full` for waitlisted/full; the rest need a one-line table + token change by the Phase 3 owner (AGENTS.md exception). Put in Wave 0.
- Tests: vitest `include: tests/**/*.test.ts`, node env, alias `@` -> repo root, JSX automatic. Pattern: `vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }))` with `freshDb({seed:true})` from `tests/helpers/sqlite.ts` (applies `migrations/*.sql` then `seed/seed.sql`). 73 tests, 8 files currently. New files under `tests/coordinator/`, etc. are picked up by the include glob; no config change needed.
- Seed: coordinators `...0001` (Priya) and `...0002`; admin `...0003`; students `...0004` (Asha, organizer, 1 overdue task), `...05`, `...06`, `...07`; 6 venues (one inactive), 6 resources, 3 templates, 9 events (one per status), the Tech Fest Keynote is full (cap 2, 2 confirmed, 1 cancelled), Open Mic has a waitlisted student, 4 tasks, 2 notifications. Dates are relative to load time. `[VERIFIED: seed/seed.sql]`

## Gaps: what is missing and who adds it

| Needed by | Missing capability | Notes |
|-----------|--------------------|-------|
| COORD-01 | `listTemplates(actor)`; `createDraft(actor, {title, templateId?, ...})`; `saveDraft(actor, eventId, partial)` | Drafts may have NULL venue/time/capacity (CHECK allows for draft/cancelled/returned). Update must be `WHERE id=? AND coordinator_id=? AND status IN ('draft','returned')`. Validate ISO format and `ends_at > starts_at` -> INVALID_INPUT. |
| COORD-02, STUD-01/02, ADMIN-02/03/04 | `listVenues(actor)` (all roles; students need names, admins need inactive too) | `freeVenues` returns only free active venues; the wireframe also lists unavailable venues with reason, so a full list is needed |
| COORD-03 | `listResources(actor)`, `listAllocations(actor, eventId)`, `setAllocation(actor, eventId, resourceId, qty)` (qty 0 = remove) | `alloc_guard_*` trigger raises RESOURCE_SHORT. Only on own event, status in draft/returned/(pending?) - decide |
| COORD-04, 06 | `listEventTasks(actor, eventId)`, `createTask(actor, eventId, {title, assigneeId, dueAt})`, `listStudents(actor)` (assignee picker) | Overdue = `due_at < now AND status <> 'done'`, compute in TS. Insert a `task_assigned` notification (seed shows the kind) |
| COORD-06 | Per-event registrant listing (`listRegistrants`) optional; `seatCounts` already gives confirmed/waitlisted | Admin can call `seatCounts` too (visibleWhere admin) |
| COORD-07 | `updateEvent(actor, eventId, partial)` for submitted events (+ notify registrants via existing `notifyRegistrants`) | State rules: decide if editing a pending/approved/open event is allowed; trigger blocks venue/time changes that clash |
| STUD-04 | `listMyRegistrations(actor)` joined to event; notification `markRead` | `listNotifications` exists; "reminders" can be derived in TS from registrations starting within N days |
| STUD-05 | `listMyTasks(actor)` + `isOrganizer(actor)` (or include it in a `myProfile` read) | |
| ADMIN-01 | event allocations list (same `listAllocations`, admin allowed); clash check display | Since pending events already hold the venue and the trigger blocks overlaps, a pending event cannot clash with another active one. The "clash check" is therefore a passing result (green) plus resource shortfall via `resourceAvailable`. Treat "clash highlighted" in ADMIN-02 as: overlapping *non-active* (draft/returned) bookings or capacity/resource shortfalls. This is an interpretation `[ASSUMED]`; confirm. |
| ADMIN-02 | `listBookings(actor)` over `bookings` view (columns: event_id, venue_id, starts_at, ends_at, status; no title) | Handoff flagged this: the view lacks title/department, so a domain fn should join `events` and `venues` rather than change the view (migrations frozen) |
| ADMIN-03 | `saveVenue`, `saveResource` (insert/update, `active` flag; retire not delete) | admin only; reducing `quantity` below allocated is not trigger-guarded - add a check or accept |
| ADMIN-04 | none strictly: events/pending/department from `listVisibleEvents`; utilisation = booked hours / available hours per venue computed in TS from events + venues | |

Everything above must be new files in `lib/domain/` (suggested: `drafts.ts`, `catalog.ts`, `allocations.ts`, `people.ts`, `admin.ts`) with actor-first signatures, role check via `requireActorRole`, owner/role in WHERE, `guard()` wrapper, constant SQL (no interpolation; `tests/db-boundary.test.ts` forbids template-literal SQL in `lib/`), plus a `tests/domain-phase4.test.ts` that mirrors `tests/domain.test.ts` (calls `code()` helper pattern). Wave 0 must also add status keys + tokens in `globals.css` (contrast test `tests/contrast.test.ts` parses it; new pairs must pass AA).

Alternative if the user rejects Wave 0: each wave agent owns a new `lib/domain/<role>.ts` file. That makes three agents edit `lib/**` (disjoint new files, no conflicts), but contradicts the freeze text and gives three parallel authors for the authorization layer. Not recommended; present as option.

## Architecture Patterns

### Recommended per-role folder
```
app/(coordinator)/
  layout.tsx            # keep requireRole('coordinator'); add navItems (lucide icons)
  coordinator/
    page.tsx            # My Events (CO-01) monitor: status, seats, overdue
    new/page.tsx        # template picker + stepper form
    [id]/page.tsx       # event workspace: details, venue, resources, tasks, submit
    [id]/actions.ts     # "use server" actions for this event
    actions.ts
    _components/        # client components (private folder, not routed)
tests/coordinator/*.test.ts
```
Same shape for `(student)/student/...` and `(admin)/admin/...`. Use `_components` (underscore prefix = not routable). Shared bits between roles (e.g. calendar) are NOT shared: duplicate small helpers inside each folder rather than touching `components/ui` or creating a cross-folder module; any genuinely shared piece goes to a Wave 0 proposal.

### Pattern 1: Server action -> domain (the only write path)
Each role's `actions.ts` begins with `"use server"`, rebuilds the actor from the session (never from form input), calls one domain function, maps `DomainError`, then `revalidatePath`.
```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { submitEvent } from "@/lib/domain/events";

export type ActionState = { ok?: true; error?: string };
export async function submit(eventId: string): Promise<ActionState> {
  const p = await requireRole("coordinator");           // redirects if wrong role/session
  try { await submitEvent({ id: p.id, role: p.role }, eventId); }
  catch (e) { return { error: e instanceof DomainError ? e.message : "Something went wrong on our side. Please try again in a moment." }; }
  revalidatePath("/coordinator"); revalidatePath(`/coordinator/${eventId}`);
  return { ok: true };
}
```
Rules: do NOT wrap `redirect()` in try/catch (it throws). Server actions are public POST endpoints: always re-run `requireRole` and let the domain re-check ownership; validate/parse `FormData` yourself (trim, length, ISO format, ints) and return field errors. `[CITED: nextjs.org/docs/app/guides/data-security]` (training knowledge, not re-fetched this session: `[ASSUMED]` on exact doc URL).

### Pattern 2: Review & Confirm wiring
`ConfirmDialog` is controlled and client-only; the summary is built from data the server page passes in. Client component holds `open` and `useTransition`; `onConfirm` calls the server action, on `{error}` keep dialog closed and show `Alert variant="error"` with `role="alert"`, on `{ok}` show `Alert variant="success"` with plain-language feedback ("Submitted. Dr. Rao will review it; status is now Pending approval."). Use `verb`: submit, register, cancel registration, cancel event, approve, return. `consequence` must state what happens and whether it can be undone. For "return with reason", put a required `Textarea` inside `summary` (children allowed) and pass its value to the action; `reviewEvent` throws INVALID_INPUT if blank, surface that message.

### Pattern 3: Reads in Server Components
Pages are async Server Components, call `requireRole` then domain reads (a handful of queries each; free-tier budget is 50 D1 queries/invocation, domain fns use 2-3; avoid N+1: do not call `seatCounts` per event in a list of dozens - add a `listEventsWithSeats` style join in Wave 0 or call it only on detail pages and compute list counts from one query). Filters for STUD-01 via `searchParams` (async in Next 16: `const sp = await searchParams`), applied in TS on the already role-scoped list; a plain GET `<form>` keeps it working without JS and by keyboard.

### Pattern 4: Draft autosave (COORD-01)
Minimum that works: create a draft row on "Start from template" (server action: `createDraft` prefilled from template + coordinator department), redirect to `/coordinator/[id]`. Each field group saves on blur/Next via `saveDraft` action (debounced client call, show "Saved" text with icon, `aria-live="polite"`). "Closed tab keeps the draft" then holds by construction (draft is in D1). Do not use localStorage. Record clicks/time for `dom-hmi-problems` #1 as a drafted measurement note only; do not fabricate figures.

### Anti-Patterns
- Importing `@/lib/db` or `getCloudflareContext` in any route file (fails boundary test).
- Calling `registerForEvent` etc. from a Client Component via fetch with a client-supplied user id. Actor comes only from session.
- Colour-only states; "Full" without icon+text (use `StatusBadge status="full"`).
- Editing `layout.tsx` guards away or `app/globals.css`/`components/ui` to "just fix" styling.
- Cross-importing between role folders.

## Parallel build mechanics

- Branch/worktree: `git worktree add ../hmi-4a -b phase4-4a`, one per agent; each commits nothing per CLAUDE.md "one commit per phase": agents leave changes uncommitted or on worktree branches, merge once at the end; the single phase commit happens after the gate is green on the merged tree. (Reconcile: worktree branches need some commit to merge. Recommendation: allow temporary worktree-branch commits that are squashed into the one phase commit; flag to user, Open Question 2.)
- Disjoint files: each agent writes only its `app/(role)/**` and `tests/<role>/**`. Both `.next` and `.open-next` build output are per-worktree; run `npm install` (or symlink node_modules) in each worktree; local D1 state `.wrangler/state` is per-worktree so each runs `npm run db:reset`.
- Merge conflicts should be nil; verify by `git diff --name-only main...` per branch containing only owned paths (add this as a verification task; a tiny script, no dependency).
- Wave order: Wave 0 (domain additions + status keys, serial, Phase 3 owner) -> Wave 1 (4a, 4b, 4c parallel) -> Wave 2 (merge, full gate, browser pass of three flows).
- Each agent's handoff note goes to the phase folder per AGENTS.md format.

## Common Pitfalls

1. **Frozen domain layer lacks writes** (see Gaps). Without Wave 0 the agents will either stall or edit `lib/` and break the freeze. Resolve before planning waves.
2. **Timestamp format.** Schema CHECK requires `YYYY-MM-DDTHH:MM:SS.mmmZ`. `datetime-local` gives local time without zone/ms: convert with `new Date(value).toISOString()` (interprets as server local time; on Workers that is UTC, so the user's local time is wrong). Convert on the client or take an explicit offset; show times in a fixed display zone consistently. Decide one rule (assumed: the college's local zone; use `Intl.DateTimeFormat(..., {timeZone})` constant) `[ASSUMED]`.
3. **Workers runtime.** No `fs`, no Node-only APIs in route code; `cookies()` is async; `getCloudflareContext()` works only inside request scope (so no module-level `getDb()`; mirror `lib/db.ts`). Cannot unit-test pages in node without mocking `next/headers` and `@/lib/auth`.
4. **D1 limits:** 50 queries/invocation (free), 10 ms CPU per request: avoid N+1 (`seatCounts` in a loop, `resourceAvailable` per resource per event in a queue). Batch via a single join in Wave 0 functions. PBKDF2 login is the CPU hot spot, not these.
5. **No transactions across awaits.** Only `db.batch` is atomic. Domain fns that need multi-step atomicity (createTask + notification) must use `batch`.
6. **`next build` static optimisation.** Pages that read the session/D1 are dynamic because they call `cookies()`; verify `npm run build` marks them `ƒ`. Never `export const dynamic = "force-static"`.
7. **Server action closures and `revalidatePath`.** After a mutation, revalidate list and detail paths; otherwise the stale "Register" button remains (a double-registration the DB would reject, but the UI should not offer, X5).
8. **`ConfirmDialog` uses `showModal()` in `useEffect`.** Controlled `open` must be set false on both cancel and success, else focus return breaks; jsdom lacks `showModal` (see tests).
9. **Student visibility quirks.** A cancelled event appears to a student only if they have a registration row; "My Registrations" must show cancelled events with `StatusBadge cancelled` and the plain notice, and registration `cancelled` rows should be hidden from "registered" lists but re-registration is allowed by the upsert.
10. **Seat counts exposure.** `seatCounts` counts only; students must not see other registrants' identities.
11. **A1 "clash check" semantics** (see Gaps); do not build a fake red clash for approved data that the DB makes impossible.
12. **Inactive venue** (`active=0`, "Old Gymkhana Hall") must not be pickable; `freeVenues` already excludes it. Events already on it stay visible.
13. **Tailwind v4 classes must be written in full** (dynamic class strings are not detected).
14. **Wireframe scope tripwire:** `docs/wireframes/student.md` has a known scope warning; do not implement anything there outside `adr-004-scope`.

## Code Examples

### Student register with Review & Confirm (client piece)
```tsx
"use client";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { register } from "../actions";

export function RegisterButton({ eventId, title, when, where, full }: { eventId: string; title: string; when: string; where: string; full: boolean }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();
  return (
    <>
      <Button onClick={() => setOpen(true)}>{full ? "Join waitlist" : "Register"}</Button>
      <ConfirmDialog open={open} verb={full ? "join the waitlist" : "register"}
        summary={<p>{title}, {when}, {where}</p>}
        consequence={full ? "You will be added to the waitlist and told if a seat opens. You can leave any time." : "You will get a seat. You can cancel later."}
        busy={pending} onCancel={() => setOpen(false)}
        onConfirm={() => start(async () => { const r = await register(eventId); setOpen(false);
          setMsg(r.error ? { error: r.error } : { ok: r.status === "waitlisted" ? "You are on the waitlist." : "You are registered." }); })} />
      <div aria-live="polite">{msg.ok && <Alert variant="success" title={msg.ok}>You can see it under My Events.</Alert>}
        {msg.error && <Alert variant="error" title="Could not register">{msg.error}</Alert>}</div>
    </>
  );
}
```
(`register` action returns `{status}|{error}`; pattern from `registerForEvent` signature `[VERIFIED: lib/domain/registrations.ts]`.)

### Domain test for a wave (works with existing setup)
```ts
// tests/student/register.test.ts
import { beforeEach, expect, it, vi } from "vitest";
import { d1Shim, freshDb } from "../helpers/sqlite";
let db: ReturnType<typeof freshDb>;
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));
vi.mock("@/lib/auth", async (orig) => ({ ...(await orig<object>()), requireRole: async () => ({ id: "a0000000-0000-0000-0000-000000000004", name: "Asha", role: "student" }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
beforeEach(() => { db = freshDb({ seed: true }); });
it("full event waitlists, second attempt gives plain error", async () => {
  const { register } = await import("@/app/(student)/student/actions");
  /* assert result.status / error text, never trigger names */
});
```
Mocking `next/headers` is unnecessary if `@/lib/auth` is mocked (the real `lib/auth` imports `next/navigation` and `lib/session`, which imports `next/headers`; the `orig` spread would import those: if import fails in node, drop the spread and mock the whole module). Importing `app/(student)/student/actions.ts` works via alias `@` because paths with parentheses are fine in strings.

## Test approach (no new deps)

| Layer | How | Where |
|-------|-----|-------|
| Domain additions (Wave 0) | node:sqlite + d1Shim, like `tests/domain.test.ts` | `tests/domain-phase4.test.ts` (Wave 0 owner) |
| Server actions per role | import `actions.ts`, mock `@/lib/db`, `@/lib/auth.requireRole`, `next/cache`; assert state + DB rows | `tests/<role>/actions.test.ts` |
| Pure helpers (filters, overdue calc, utilisation, calendar grouping, form parsing) | extract into `_lib/*.ts` pure functions in the route folder and unit-test | `tests/<role>/*.test.ts` |
| Components/pages | vitest env is `node`; no jsdom/testing-library installed. Do not test rendering in vitest. Cover with browser pass + `renderToStaticMarkup` from `react-dom/server` only for simple server-rendered pieces (no hooks, no async) `[ASSUMED feasible]` |
| Boundary / freeze | existing `tests/db-boundary.test.ts` walks `app/` so it checks the new routes automatically | existing |
| Disjointness | a one-off shell check `git diff --name-only <base>` per worktree restricted to owned paths | verification task |

## Browser verification (demo logins)

- `/login` has demo buttons per role; `demoLogin` server action is gated at runtime by `isDemoEnabled()` (env `DEMO_LOGIN === "true"`); `wrangler.jsonc` sets it `"true"`, so it is on locally and on the public URL. No password needed. Password sign-in works with `demo-password-2026` for the seeded emails (`coordinator@`, `student@`, `admin@demo.college.test`; also `coordinator2@`, `karan@`, `meera@`, `dev@`). `[VERIFIED: seed.sql, app/login/actions.ts, 03-HANDOFF]`
- Local run: `npm run db:reset` then `npm run dev` (initOpenNextCloudflareForDev supplies the D1 binding from `.wrangler/state`) or `npm run preview` for the real worker. Each worktree needs its own `db:reset`.
- Scripted browser checks (use the in-app browser / `ecc:e2e-runner`; Playwright is NOT installed, so checks are manual or via that agent): 
  1. Coordinator: new from "Workshop" template -> venue picker shows only free venues -> add Projector -> add a task for Karan with due date -> Submit R&C -> status Pending approval. Count clicks/seconds as observations only, not results.
  2. Admin (separate session): approvals queue shows it -> approve (or return with reason) -> coordinator sees Approved/Returned.
  3. Student: Discover -> filter -> Tech Fest Keynote (full) -> Join waitlist R&C -> My Events shows waitlisted; cancel; Asha (organizer) My Tasks mark done.
  4. Cancel event as coordinator -> student sees notification.
- Order matters: the "approved" event must be moved to `open` for students to register; there is no domain fn to move approved -> open -> ongoing -> completed (trigger allows, only `submitEvent`/`reviewEvent`/`cancelEvent` exist). Seed already has an open event, but the end-to-end story "Coordinator creates -> Admin approves -> Student registers" breaks at approved->open. Add `openEvent`/`advanceEvent(actor, eventId)` (coordinator own events) in Wave 0, or document that Open is set by seed. HANDOFF (c) says "coordinators drive only their own events (submit, cancel, open/start/complete)" but no such fn exists `[VERIFIED: grep exports]`. This is a significant gap for success criterion 5.

## Security Domain

| ASVS | Applies | Control |
|------|---------|---------|
| V2/V3 auth, session | yes (existing) | D1 sessions, httpOnly cookie, `requireRole` in every layout AND page/action |
| V4 access control | yes | domain SQL ownership/role clauses; server actions re-check; test cross-owner access (coord2 on coord1 event -> NOT_ALLOWED) |
| V5 input validation | yes | manual parsing in actions (no zod installed); bind params only; length caps; ISO format; integer bounds |
| V8 data protection | yes | students never see other users' PII; seat counts only |
| CSRF | Server Actions in Next enforce same-origin Origin/Host check `[CITED: nextjs.org/docs, training]` | do not add custom state-changing GET routes |

Threat patterns: IDOR on event/task ids (mitigated in domain WHERE), actor spoofing via form fields (never accept user id from client), XSS (React escapes; never `dangerouslySetInnerHTML`; `ConfirmDialog` takes children not HTML strings), mass assignment (whitelist fields in `saveDraft`/`updateEvent`; coordinator must not set `status`, `coordinator_id`, `return_reason`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.5, node env, `node:sqlite` D1 shim |
| Config file | `vitest.config.ts` (frozen; include `tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/<role>` (per wave agent); `npx vitest run tests/db.test.ts` for DB |
| Full suite command | `npm run lint && npm run typecheck && npm test && npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COORD-01 | createDraft prefilled from template; saveDraft partial keeps draft; non-owner rejected | unit (domain+action) | `npx vitest run tests/domain-phase4.test.ts tests/coordinator` | Wave 0 |
| COORD-02 | only free active venues selectable, capacity present | unit | `npx vitest run tests/coordinator/venues.test.ts` | Wave 0 gap |
| COORD-03 | setAllocation over limit -> RESOURCE_SHORT human msg | unit | `npx vitest run tests/coordinator/resources.test.ts` | Wave 0 gap |
| COORD-04 | createTask + overdue computation + status visible | unit | `npx vitest run tests/coordinator/tasks.test.ts` | Wave 0 gap |
| COORD-05 | submit action: draft->pending; second submit -> BAD_STATE message | unit | `npx vitest run tests/coordinator/submit.test.ts` | Wave 0 gap |
| COORD-06 | monitor view model: seats vs capacity, overdue list | unit (pure helper) | `npx vitest run tests/coordinator/monitor.test.ts` | Wave 0 gap |
| COORD-07 | cancel notifies registrants; edit rejects non-owner | unit | `npx vitest run tests/coordinator/cancel.test.ts` | Wave 0 gap |
| STUD-01 | filter helper (text/date/type/venue/dept) | unit (pure) | `npx vitest run tests/student/filter.test.ts` | Wave 0 gap |
| STUD-02 | detail view model: seats left, status key full vs open | unit | `npx vitest run tests/student/detail.test.ts` | Wave 0 gap |
| STUD-03 | register -> confirmed; full -> waitlisted; twice -> ALREADY_REGISTERED; cancel promotes waitlist | unit (action) | `npx vitest run tests/student/register.test.ts` | Wave 0 gap |
| STUD-04 | my registrations incl. waitlisted/cancelled; reminders derived | unit | `npx vitest run tests/student/mine.test.ts` | Wave 0 gap |
| STUD-05 | my tasks only own; mark done; non-assignee rejected | unit | `npx vitest run tests/student/tasks.test.ts` | Wave 0 gap |
| ADMIN-01 | review approve/return; blank reason rejected; queue = pending only, soonest first | unit | `npx vitest run tests/admin/review.test.ts` | Wave 0 gap |
| ADMIN-02 | listBookings flags overlaps among bookings | unit | `npx vitest run tests/admin/calendar.test.ts` | Wave 0 gap |
| ADMIN-03 | save/retire venue; student/coordinator rejected | unit | `npx vitest run tests/admin/catalog.test.ts` | Wave 0 gap |
| ADMIN-04 | dashboard aggregates (counts, utilisation, dept split) | unit (pure) | `npx vitest run tests/admin/dashboard.test.ts` | Wave 0 gap |
| All | primary flow end-to-end, keyboard path, 44px, A+/A- | manual browser (demo logins) | checklist in each role handoff | manual-only (no browser runner installed) |

### Sampling Rate
- Per task commit/step: `npx vitest run tests/<role>`
- Per wave merge: `npm run lint && npm run typecheck && npm test && npm run build`
- Phase gate: full gate green + `node kb/tools/build-index.mjs` if kb touched + `npx opennextjs-cloudflare build` + browser flows for 3 roles

### Wave 0 Gaps
- [ ] `lib/domain/{drafts,catalog,allocations,people,admin}.ts` (new files) and `openEvent/advance` fn
- [ ] `tests/domain-phase4.test.ts`
- [ ] StatusBadge keys + tokens (registration confirmed/waitlisted, task todo/doing/done/overdue, clash) with contrast test passing
- [ ] `tests/coordinator/`, `tests/student/`, `tests/admin/` folders (created by the wave agents)
- No framework install needed.

## Environment Availability

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| Node (node:sqlite) | tests | assumed yes (73 tests pass per handoff) | - |
| wrangler / local D1 | dev, browser pass | yes via devDependency | - |
| git worktrees | parallel wave | yes (git repo) | serial execution |
| Playwright / jsdom | UI tests | no, not installed, cannot add | manual + in-app browser |
| Cloudflare login | deploy only (Phase 7) | n/a for Phase 4 | - |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | User accepts a serial Wave 0 that adds NEW `lib/domain` files and status keys, amending the freeze | Summary / Gaps | If rejected, 8+ requirements are unbuildable; need alternative (per-role domain files) |
| A2 | "Clash highlighted" (ADMIN-02) means overlapping non-active bookings / resource shortage, since active clashes are DB-impossible | Gaps | Admin calendar may show nothing red in seed; may need seeded demonstration or reinterpretation |
| A3 | Display time zone is a single fixed college zone; Workers run UTC | Pitfalls | Wrong times shown to users |
| A4 | Next 16 Server Actions behave as in Next 15 (same-origin check, `searchParams` async, `revalidatePath`) | Patterns | Minor API drift; verify with Context7 at implementation |
| A5 | `renderToStaticMarkup` is enough for any component-level test | Test approach | Fall back to manual browser checks |
| A6 | Temporary worktree-branch commits are acceptable before the single phase commit | Parallel mechanics | Violates "commit once per phase" if read strictly |
| A7 | Hiding My Tasks for non-organizers requires a new domain read of `is_organizer` | Gaps | Could instead show the tab to all students |

## Open Questions (RESOLVED)

1. **Approve Wave 0 domain additions?** Known: freeze blocks required writes. Unclear: user stance. Recommend yes, new files only, serial, before the parallel wave. RESOLVED IN PLAN 04-00 (assumption A1, user approved 2026-10-20). The user has not yet approved amending the freeze; the plans are written so that 04-00 is the only plan that touches frozen areas.
   **User decision 2026-10-20:** Wave 0 approved; display zone Asia/Kolkata (Mumbai); assumptions A2 and COORD-07 edit semantics accepted.
2. **Worktree commits vs one-commit rule.** Recommend worktree branches with temporary commits, squashed (or merged then phase commit) after gate green. RESOLVED: no temporary commits. Plan 04-00 "worktree_setup" copies the uncommitted Wave 0 tree into each worktree; plan 04-07 copies owned paths back. One commit per verified phase is kept.
3. **Who moves events approved -> open -> ongoing -> completed?** No domain function; needed for the create-approve-register story. Recommend `advanceEvent` for coordinator (own event) in Wave 0. RESOLVED IN PLAN 04-00 (Task 3): `advanceEvent` for the owning coordinator; used by the monitor screen in 04-04.
4. **Edit rules for submitted events (COORD-07).** Which statuses may be edited and does editing a pending/approved event reset it to pending? Recommend: editing time/venue of approved/open events notifies registrants and re-runs through DB triggers; no re-approval (YAGNI) `[ASSUMED]`. RESOLVED IN PLAN 04-00 (Task 3) as an assumption: `updateEvent` on pending/approved/open, no re-approval, registrants notified; flagged assumed in the plans and handoff.
5. **Timezone display.** Pick one fixed zone constant. RESOLVED IN PLAN 04-00 (Task 2): `DISPLAY_TZ = "Asia/Kolkata"` in `lib/format.ts`, flagged assumed (A3).
6. **Notification mark-read** needed for "in-app reminders" (STUD-04); Phase 5 owns alerts, so keep Phase 4 to listing plus a simple count badge. RESOLVED: not built in Phase 4; plans 04-02/04-05 list notifications and show a count only (mark-read is Phase 5).

## Sources

### Primary (HIGH, read in this session)
- Repo: `lib/auth.ts`, `lib/errors.ts`, `lib/db.ts`, `lib/session.ts`, `lib/domain/*.ts`, `migrations/0001_schema.sql`, `0002_guards.sql`, `seed/seed.sql`, `components/ui/*`, `app/**` stubs, `app/login/actions.ts`, `tests/helpers/sqlite.ts`, `tests/db-boundary.test.ts`, `tests/domain.test.ts`, `tests/authz.test.ts`, `vitest.config.ts`, `package.json`, `wrangler.jsonc`
- `AGENTS.md`, `CLAUDE.md`, `.planning/ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md`, `03-HANDOFF.md`
- kb (confidence `derived`, not evidence): `dom-requirements`, `dom-flows`, `dom-domain-model`, `dom-status-vocabulary`, `dom-goals-tasks`; `docs/wireframes/{coordinator,student,admin}.md` (derived, AI-drafted, untested)

### Secondary / Tertiary
- Next.js Server Action, `searchParams`, `revalidatePath` behaviour and OpenNext-on-Workers constraints: training knowledge, not re-verified with Context7 this session (LOW-MEDIUM). Verify before coding.

## Metadata

**Confidence breakdown:**
- Current code state and gaps: HIGH (direct reads)
- Standard stack: HIGH (no change)
- Next/OpenNext pitfalls: MEDIUM (training knowledge)
- Test approach: MEDIUM (consistent with existing setup; component testing limited)

**Research date:** 2026-10-20
**Valid until:** 30 days or until Phase 3 freeze list changes
