# Phase 3 → Phase 4 handoff

Requirement ids: FOUND-01..07 (design ids C1-C7, S1-S5, A1-A5 from `dom-requirements`). kb consulted: `dom-requirements`, `dom-domain-model`, `dom-status-vocabulary`, `adr-001-stack`, `adr-004-scope`, `src-accessibility-areas`.

Frozen files and ownership rules: see "Frozen after Phase 3" in `AGENTS.md`. Do not change them; propose in `.planning/`.

## (a) DB catalog (`migrations/0001_schema.sql`, `0002_guards.sql`) and domain layer (`lib/domain`)

Tables: `profiles`, `sessions`, `venues`, `resources`, `event_templates`, `events`, `resource_allocations`, `registrations`, `tasks`, `notifications`; view `bookings`.
Triggers (0002): `events_no_clash_ins`, `events_no_clash_upd` (VENUE_CLASH), `events_transition` (BAD_STATE), `events_touch`, `registrations_capacity_ins/upd` (EVENT_FULL), `registrations_promote` (waitlist promotion), `alloc_guard_ins/upd` (RESOURCE_SHORT).
There is no RLS: every function takes `actor: Actor` (`{ id, role }`, from `lib/domain/actor.ts`) first and puts role/ownership in its WHERE clause. Route code imports only `lib/domain` and `lib/auth`. Errors leave as `DomainError`.

| Function (`lib/domain/*`) | Signature | Serves |
|---|---|---|
| freeVenues (venues) | `(actor, start, end, excludeEventId?)` venues with no active overlap; coordinator/admin | C2 |
| resourceAvailable (venues) | `(actor, resourceId, start, end, excludeEventId?) => Promise<number>` | C3 |
| listVisibleEvents (events) | `(actor) => Promise<EventRow[]>` role-scoped list | S1, S2, C6, A4 |
| manageableEvent (events) | `(actor, eventId)` the event if actor may manage it | C1, C4 |
| submitEvent (events) | `(actor, eventId) => Promise<void>` draft/returned to pending; needs venue, date, capacity | C5 |
| reviewEvent (events) | `(actor, eventId, approve: boolean, reason?) => Promise<void>` admin only; reason required to return | A1 |
| cancelEvent (events) | `(actor, eventId, reason?) => Promise<void>` owner or admin | C7 |
| notifyRegistrants (notifications) | `(actor, eventId, kind, body) => Promise<number>` rows created | C7, S4 |
| listNotifications (notifications) | `(actor)` own notices | S4 |
| registerForEvent (registrations) | `(actor, eventId) => Promise<"confirmed" \| "waitlisted">` | S3 |
| cancelRegistration (registrations) | `(actor, eventId) => Promise<void>` | S3 |
| seatCounts (registrations) | `(actor, eventId) => Promise<{ confirmed; waitlisted }>` seats left, Full badge, waitlist offer | S2, S3, C6 |
| setTaskStatus (tasks) | `(actor, taskId, label) => Promise<void>` labels To do / Doing / Done (stored todo/doing/done) | S5, C4 |

Requirement support not in the table: C1 `event_templates` plus nullable draft columns on `events`; C4 `tasks`; A2 `bookings` view; A3 `venues`/`resources` `active` flags; A4 aggregates and A5 CSV are app-side.

## (b) Components (`components/ui`)

- `AppShell({ productName?, roleLabel, userName, navItems: {href,label,icon}[], signOut, children })`
- `Button({ variant: primary|secondary|destructive|ghost, size, loading, ...button props })`
- `Card(div props)`; `Alert({ variant: info|success|warning|error, title, children, ref? })`
- `Field({ label, helper?, error?, required?, children })` wrapping `Input` / `Select` / `Textarea`
- `ConfirmDialog({ open, title?, verb, summary, consequence, onConfirm, onCancel, busy? })` for every irreversible action
- `StatusBadge({ status })`; `STATUS_META` keys: draft, pending, approved, open, ongoing, completed, cancelled, full, returned
- `TextSizeControl()` (A-/A/A+)
- Helpers in `lib/auth.ts`: `requireRole(role)`, `getCurrentProfile()`, `homeFor`, `ROLE_LABEL`, `isDemoEnabled`. Supabase clients in `lib/supabase/`.

## (c) Status transitions

DB graph (trigger `events_transition`, applies to everyone): draft/returned to pending; pending to approved/returned; approved to open; open to ongoing; ongoing to completed; any of draft, pending, returned, approved, open, ongoing to cancelled. Anything else aborts with BAD_STATE. Inserts must be `draft`.
Actor rules (TypeScript, `lib/domain/events.ts`): coordinators drive only their own events (submit, cancel, open/start/complete); only admins approve or return; coordinators cannot change `coordinator_id` or `return_reason`.

## (d) DomainError codes (`lib/errors.ts`)

Message style: what happened, why, what to do; never trigger names or SQL.

| Code | Meaning | Message |
|---|---|---|
| VENUE_CLASH | venue already booked for part of the time | "That venue is already booked for part of this time. Pick another venue or time." |
| ALREADY_REGISTERED | duplicate (event, user) | "You are already registered for this event." |
| NOT_ALLOWED | actor lacks permission | "You do not have permission to do that." |
| INVALID_INPUT | missing or invalid fields, CHECK/FK failures | "Some details are missing or not valid. Check the form and try again." |
| RESOURCE_SHORT | allocation exceeds what is free | "Not enough of that resource is free for this time. ..." |
| EVENT_FULL | no seats left | "This event is full. You can join the waitlist instead." |
| BAD_STATE | invalid status transition | "This can't be done at the event's current stage. Refresh ..." |
| INTERNAL | anything else | "Something went wrong on our side. Please try again in a moment." |

Wrap D1 calls in `guard(fn)` or `humanize(err)`.

## (e) Known gaps

- Realtime is not enabled.
- Drafts do not hold venues (only pending/approved/open/ongoing do).
- Task, registration and alert status keys beyond the nine above are not in `STATUS_META`; Phase 4/5 request them via the Phase 3 owner.
- No requirement C1-C7, S1-S5, A1-A5 is left without DB support. A4 and A5 are app-side by design.
- Open question: the `bookings` view column set was not re-checked against A2's clash-highlighting need; Phase 4 agent 4c should check and propose changes.

- Free tier: at most 50 D1 queries per invocation (domain functions use 2-3; lists are single queries); 100k requests/day; 5M rows read/day; 10 ms CPU per request.
- Demo accounts and `DEMO_LOGIN` must be removed or set false before any real use. Password sign-in has no rate limiting (accepted risk). PBKDF2 uses 100000 iterations (below OWASP 600000) because of the CPU limit.
- `npm install` warned that workerd's postinstall script is not approved; build and tests were unaffected.

## (f) Verification record

Full gate on 2026-10-20, real results of this run:
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test`: pass (8 files, 73 tests; node:sqlite level)
- `npm run build`: pass
- `npx opennextjs-cloudflare build`: pass (worker saved to `.open-next/worker.js`)
- `npm run db:reset`: pass (local D1 migrated and seeded)
- `node kb/tools/build-index.mjs`: pass (25 notes)
- `node docs/check-framework.mjs`: pass (one scope-tripwire warning in docs/wireframes/student.md, pre-existing, not in this plan's scope)

### Live Cloudflare check

Deployed 2026-10-20 to https://college-events.varadaj47.workers.dev (version f04cbaa6, Worker startup 18 ms).

- VERIFIED by Claude: remote D1 migrated and seeded; a deliberate overlapping INSERT on remote D1 was rejected with `VENUE_CLASH` and left no row (A1); `/login` 200, `/` and `/coordinator` redirect to `/login` when signed out.
- VERIFIED from user's `wrangler tail` (2026-10-20 20:41): 3 demo-button logins (coordinator, student, admin) each returned Ok and landed on their role page, then signed out; no exceeded-CPU or error entries.
- USER-REPORTED "success": email+password sign-in (coordinator@demo.college.test, PBKDF2 at 100000 iterations) on the deployed Worker under `wrangler tail`. Claude did not see the tail output, so no CPU figure is recorded; the report is that it signed in with no error.
- Remaining caveat: no numeric CPU time. Workers Free limits may still bite under load or on cold start; revisit if sign-in errors appear.
- `DEMO_LOGIN` is `"true"` on the public URL: passwordless sign-in as any demo role. Set false or remove demo users before real use.
