# Phase 3: Foundation - Research (RE-PLAN for Cloudflare free tier)

**Researched:** 2026-10-20
**Domain:** Migrating the Phase 3 foundation from Supabase/Vercel to Next.js on Cloudflare Workers (OpenNext adapter) + D1 (SQLite), with app-side auth.
**Confidence:** MEDIUM-HIGH (adapter/D1 facts cited from official docs and verified locally with wrangler 4.151.3; two real risks, the 10 ms free CPU limit and remote-D1 trigger behaviour, can only be closed by a deployed spike).

**Supersedes:** the Supabase-based research that was here (see git history, commit e704a2d). Plans 03-01..03-05 stay as history. New plans (03-06+) replace only the Supabase-specific parts listed under "Reuse vs replace".

## User Constraints (from CLAUDE.md; no CONTEXT.md exists for this phase)

### Locked Decisions
- DECISION (user, 2026-10-20): everything runs on Cloudflare's free tier. No Supabase, no Vercel. Target: Next.js (App Router, TS) + Tailwind on Workers (OpenNext / `@opennextjs/cloudflare`) or Pages; D1 (SQLite) for data; app-side auth/sessions on D1 (no Supabase Auth). Stay within free-tier limits; no paid add-ons.
- D1 has no RLS or exclusion constraints, so clash and double-registration prevention must be rebuilt as D1 constraints/triggers plus server-side checks in one transaction (`dom-domain-model`). `adr-001-stack` must be updated via the kb rule.
- Verify current APIs before coding. Secrets in `.env.local` / `.dev.vars` only; commit `.env.example`.
- Design rules unchanged: one interface per role, clashes impossible in DB and prevented in UI, status icon+text+colour, WCAG 2.2 AA, no email/SMS/payments/native apps/vector search (`adr-004-scope`).
- Commit only at real milestones with the full gate green. Prefer the simplest thing that works; leave one runnable check for non-trivial logic.

### Claude's Discretion
Workers vs Pages (recommend Workers), test strategy, migration layout, hashing parameters, data-access layout.

### Deferred Ideas (OUT OF SCOPE)
Email/SMS, payments, native apps, vector search, realtime (all `adr-004-scope`).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Next.js + Tailwind app builds/runs locally, commands in CLAUDE.md | OpenNext scripts (`dev`, `build`, `preview`, `deploy`, `cf-typegen`); Stack block in CLAUDE.md must be rewritten |
| FOUND-02 | Tokens, status components, shared UI, contrast checked | Reusable unchanged (no Supabase dependency); tests/contrast, status stay |
| FOUND-03 | Schema, seed, access rules implement domain model | D1 migrations + seed.sql + TS authorization layer replacing RLS |
| FOUND-04 | Venue/time clash cannot be saved (DB rejects) | BEFORE INSERT/UPDATE trigger with `RAISE(ABORT)` on `events` (verified on local D1) |
| FOUND-05 | Second registration for same (event,user) rejected by DB | `UNIQUE(event_id, user_id)` unchanged (SQLite error `SQLITE_CONSTRAINT_UNIQUE`) |
| FOUND-06 | Sign in, land in role interface | App-side sessions table + cookie + `requireRole` in layouts |
| FOUND-07 | One-click demo login with seeded users | Server action creates a session for the seeded demo user, gated by server-only flag (no password verify needed) |
</phase_requirements>

## Summary

The Next.js app, Tailwind tokens, `components/ui`, status vocabulary and role route groups do not depend on Supabase and carry over untouched. What changes is the bottom layer: Postgres schema/RLS/functions become D1 migrations plus triggers plus a typed TypeScript domain layer, Supabase Auth becomes a `sessions` table with a cookie and WebCrypto password hashing, `proxy.ts` is deleted, and PGlite tests become `node:sqlite` tests (Node 24 stdlib, zero new dependencies; verified working inside vitest 5).

D1 is a single-writer SQLite. Each statement is atomic, triggers run inside the statement that fired them, and `db.batch([...])` is an all-or-nothing transaction. So the clash check lives in a `BEFORE INSERT/UPDATE` trigger that `RAISE(ABORT)`s (one statement, race-free), and multi-step operations (register, cancel with promotion, review, cancel event) are either a single statement or a `batch`. I verified locally with `wrangler d1 migrations apply --local` that a multi-line trigger with `RAISE(ABORT, 'VENUE_CLASH')` applies and that the error surfaces as `VENUE_CLASH: SQLITE_CONSTRAINT (extended: SQLITE_CONSTRAINT_TRIGGER)`.

Two things need an early spike, not more research: (1) Workers Free allows 10 ms CPU per request, which Next SSR plus PBKDF2 can exceed (Error 1102); (2) triggers are confirmed on local workerd D1 but only indirectly documented for remote D1. Both are closed by one deploy checkpoint that needs the team's Cloudflare account.

**Primary recommendation:** Deploy as a Worker via `@opennextjs/cloudflare`; put invariants (clash, uniqueness, capacity, over-allocation, status transitions) in SQLite triggers/constraints; put actor rules (who may do what, what each role sees) in one frozen `lib/` TypeScript layer that every route must call; delete `proxy.ts`; test SQL with `node:sqlite` in vitest; do one early real deploy to measure CPU.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Clash / double-registration / capacity / over-allocation | Database (D1 triggers, UNIQUE, CHECK) | API (maps error to human text) | Must hold even if UI or app code is bypassed (X5) |
| Who may act (replaces RLS) | API / Backend (`lib/domain`, server actions) | Database (ownership predicates in WHERE) | D1 has no session user, so the actor is an explicit argument |
| Visibility per role (replaces RLS select) | API / Backend (query fragments in `lib/`) | — | Student sees open/ongoing/completed + own; coordinator own; admin all |
| Authentication, sessions | API / Backend (server actions + `sessions` table) | Browser (httpOnly cookie) | No Supabase Auth |
| Route protection | Frontend server (layout `requireRole`) | — | Layout guards already exist; `proxy.ts` not needed |
| Password hashing | API / Backend (WebCrypto PBKDF2) | — | No native bcrypt on Workers |
| Demo login gate | API / Backend (runtime env flag) | Browser (buttons hidden) | Hiding buttons is not enough (T-03-19) |
| Tokens, status badges, shared UI | Browser / Client | — | Unchanged |
| Static assets | CDN / Static (Workers assets binding) | — | Provided by OpenNext output |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opennextjs/cloudflare` | 1.20.12 (npm, modified 2026-10-15) | Next.js adapter for Workers; peer `next >=15.5.28 <16 \|\| >=16.4.1`, `wrangler ^4.148.0` | Official Cloudflare-recommended path; repo's `next` 16.4.2 satisfies the peer range `[VERIFIED: npm view]` |
| `wrangler` (dev) | 4.151.3 (modified 2026-10-20) | Local D1, migrations, deploy, type generation | Official CLI `[VERIFIED: npm view]` |
| `next` | 16.4.2 (already installed) | App | unchanged |
| `node:sqlite` | Node 24.21 built-in (SQLite 3.53.4) | Unit-test SQL against the real migrations | Stdlib; no native build; works in vitest 5 `[VERIFIED: ran it]` |

### Remove
`@supabase/ssr`, `@supabase/supabase-js`, `supabase` (CLI), `@electric-sql/pglite`, `supabase/` folder, `lib/supabase/`, `proxy.ts`, `tests/helpers/pg.ts`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `node:sqlite` tests | `better-sqlite3` 13.0.3 / `@libsql/client` 0.18 | Native build/extra dep for no gain |
| `node:sqlite` tests | `@cloudflare/vitest-pool-workers` 0.23.0 (real workerd D1) | Heavier config, slower, second vitest project; use `wrangler ... --local` as the real-D1 smoke instead |
| Workers | Pages | OpenNext docs target Workers (`--platform=workers`); Pages Functions add nothing |
| Hand-rolled SQL | Drizzle/Kysely | New dependency + generator; YAGNI for ~10 tables (ponytail) |
| Custom sessions | Auth.js / Better Auth / Lucia | Extra dependency, adapter surface; ~60 lines of own code is enough for 3 roles |

**Installation:**
```bash
npm i @opennextjs/cloudflare@1.20.12
npm i -D wrangler@4.151.3
npm rm @supabase/ssr @supabase/supabase-js supabase @electric-sql/pglite
```

## Package Legitimacy Audit

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-------------|-----------|-------------|
| `@opennextjs/cloudflare` | npm | created 2024-09 (about 2 yrs) | github.com/opennextjs/opennextjs-cloudflare | [OK] | Approved; named in official OpenNext docs and in CLAUDE.md |
| `wrangler` | npm | since 2012 | github.com/cloudflare/workers-sdk | [OK] | Approved; official Cloudflare CLI |

No `postinstall` script on either (`npm view scripts.postinstall` empty). Packages removed due to [SLOP]: none. Flagged [SUS]: none. No other new packages are proposed.

## Architecture Patterns

### System Architecture Diagram

```
Browser --(cookie: session token)--> Cloudflare Worker (OpenNext output)
   |                                   |
   | Server Component / Server Action  v
   |                      lib/auth.ts: getSession()  --> D1 sessions JOIN profiles (token hash)
   |                                   |  requireRole(role) in each (group)/layout.tsx
   |                                   v
   |                      lib/domain/*  (actor passed explicitly; role + ownership checks;
   |                                   |  visibility fragments; DomainError mapping)
   |                                   v
   |                      getDb() = getCloudflareContext().env.DB
   |                                   |  single statement  OR  db.batch([...]) (atomic)
   |                                   v
   |                      D1 (SQLite): CHECKs, UNIQUE, FK, TRIGGERS --> RAISE(ABORT,'VENUE_CLASH')
   |                                   |
   +<-- human message <-- humanize(err) <-- D1 error text contains the RAISE marker
```

### Recommended Project Structure
```
migrations/                 # wrangler d1 default dir (replaces supabase/migrations)
  0001_schema.sql           # tables, CHECKs, UNIQUEs, indexes
  0002_guards.sql           # triggers (clash, capacity, allocation, status transition, promotion)
seed/seed.sql               # demo data; NOT in migrations (run by `d1 execute --file`)
lib/db.ts                   # getDb() (only place that touches the binding)
lib/auth.ts                 # keep exports; swap internals (see below)
lib/session.ts              # create/read/delete session, cookie options, hashToken
lib/password.ts             # PBKDF2 hash/verify, iterations encoded in the hash string
lib/errors.ts               # DomainError + humanize() (replaces SQLSTATE table in HANDOFF (d))
lib/domain/{events,registrations,tasks,venues,notifications}.ts  # TS port of the rpc functions
wrangler.jsonc, open-next.config.ts, cloudflare-env.d.ts, .dev.vars.example
scripts/hash-password.mjs   # prints a PBKDF2 string to paste into seed.sql
```

### Pattern 1: Clash trigger (FOUND-04)
Half-open overlap on same-format UTC ISO text (`YYYY-MM-DDTHH:MM:SS.sssZ`, lexicographic order equals time order). One trigger body per event (INSERT and UPDATE need two triggers, SQLite has no `INSERT OR UPDATE`). Use uppercase `BEGIN`/`END` `[CITED: community reports lowercase fails remotely, ASSUMED real]`.
```sql
CREATE TRIGGER events_no_clash_ins BEFORE INSERT ON events
FOR EACH ROW WHEN NEW.status IN ('pending','approved','open','ongoing')
BEGIN
  SELECT RAISE(ABORT, 'VENUE_CLASH') WHERE EXISTS (
    SELECT 1 FROM events x
    WHERE x.venue_id = NEW.venue_id AND x.id <> NEW.id
      AND x.status IN ('pending','approved','open','ongoing')
      AND x.starts_at < NEW.ends_at AND NEW.starts_at < x.ends_at);
END;
-- events_no_clash_upd: BEFORE UPDATE OF status, venue_id, starts_at, ends_at ON events, same body
```
Why race-free: D1 serialises writes per database and the trigger runs inside the firing statement's transaction `[ASSUMED from SQLite semantics; D1 docs confirm each statement commits atomically]`.

### Pattern 2: Registration as one statement (FOUND-05, seat race)
`UNIQUE(event_id, user_id)` stays. Seat decision is made inside the INSERT so two people cannot both take the last seat:
```sql
INSERT INTO registrations (id, event_id, user_id, status, created_at)
SELECT ?1, e.id, ?2,
  CASE WHEN (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status='confirmed') < e.capacity
       THEN 'confirmed' ELSE 'waitlisted' END, strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM events e WHERE e.id = ?3 AND e.status = 'open'
ON CONFLICT(event_id, user_id) DO UPDATE SET status = excluded.status, created_at = excluded.created_at
  WHERE registrations.status = 'cancelled';
```
`meta.changes === 0` means "not open" or "already registered": run one follow-up read to choose the human message. Add a `BEFORE INSERT/UPDATE` capacity trigger as a backstop (`RAISE(ABORT,'EVENT_FULL')` when confirmed >= capacity). Waitlist promotion lives in an `AFTER UPDATE OF status ON registrations WHEN OLD.status='confirmed' AND NEW.status='cancelled'` trigger that promotes the oldest waitlisted row and inserts the `waitlist_promoted` notification, so cancel is one statement.

### Pattern 3: Actor-explicit domain layer (replaces RLS)
```ts
// lib/domain/events.ts  (frozen after Phase 3; route folders may only call these)
export async function submitEvent(actor: Actor, eventId: string) {
  requireActorRole(actor, "coordinator");
  const r = await db().prepare(
    `UPDATE events SET status='pending' WHERE id=?1 AND coordinator_id=?2 AND status IN ('draft','returned')`
  ).bind(eventId, actor.id).run();               // clash trigger fires here -> VENUE_CLASH
  if (r.meta.changes === 0) throw new DomainError("NOT_ALLOWED_OR_SUBMITTED");
}
```
Ownership goes in the WHERE clause (no read-then-write gap). Multi-table steps use `db.batch([...])`, which rolls back on any failure `[CITED: developers.cloudflare.com/d1/worker-api/d1-database]`. Enforce "only `lib/` touches the DB" with a one-line vitest grep (`getDb` / `env.DB` imported only under `lib/`), the replacement for "RLS is on for every table".

### Pattern 4: Sessions
Cookie holds 32 random bytes (base64url); DB stores SHA-256 of it (`crypto.subtle.digest`, cheap on CPU). Cookie flags: `httpOnly`, `sameSite=lax`, `secure` in production, `path=/`, 7-day expiry. `getCurrentProfile()` becomes one query: `sessions JOIN profiles WHERE token_hash=? AND expires_at > now`. `requireRole` and `homeFor`/`parseRole`/`ROLE_LABEL` are unchanged. `signOut` deletes the row and the cookie. Redirect targets stay fixed (T-03-17).

### Pattern 5: Demo login without hashing
`demoLogin(role)`: check server-side flag (see Pitfall 2), whitelist role, look up the seeded demo user by `DEMO_EMAILS[role]`, create a session. No password is compared, so it costs almost no CPU and `DEMO_PASSWORD` disappears. Normal sign-in uses PBKDF2 verify.

### Anti-Patterns to Avoid
- Calling `getCloudflareContext()` at module top level; call it inside functions (bindings exist per request).
- `BEGIN TRANSACTION` in migrations or via `exec`; use `batch()` `[CITED]`.
- Read-check-then-write in two statements for clash/capacity (race); use the trigger/single statement.
- Keeping `proxy.ts`: OpenNext bundles Node middleware, but open issues report ~4.6 MB bundle for a no-op and bundling failures `[CITED: github.com/opennextjs/opennextjs-cloudflare/issues/1373, #1400]`. There is nothing left for it to do.
- Storing dates as local-time strings or mixed formats (breaks string comparison).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interval overlap | App-side loop over events | The trigger above | Only the DB is race-free |
| Password KDF | Custom hash | WebCrypto `PBKDF2` SHA-256, random 16-byte salt, constant-time compare | No bcrypt on Workers |
| Session ids | `Math.random` | `crypto.getRandomValues` (32 bytes) | Guessable otherwise |
| Migration runner | Own script | `wrangler d1 migrations apply` | Tracks `d1_migrations`, transactional |
| Local D1 | Mock | `wrangler ... --local` (workerd SQLite) + `node:sqlite` for unit tests | Same SQL dialect |
| Cloudflare types | Hand-typed `D1Database` | `npm run cf-typegen` (wrangler types) | Stays in sync with wrangler.jsonc |

## Runtime State Inventory (migration phase)

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None. No Supabase project was ever created (HANDOFF (f): no `.env.local`, live check not done) | None; seed is rewritten as SQLite SQL |
| Live service config | None (no Supabase/Vercel project exists) | None; a Cloudflare account, D1 database and Worker must be created by the team |
| OS-registered state | None found | None |
| Secrets/env vars | `.env.example` lists `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DEMO_PASSWORD`; no `.env.local` in repo | Rewrite `.env.example`; add `.dev.vars.example`; code edit only |
| Build artifacts | `.next/`, `tsconfig.tsbuildinfo` ignored; `package-lock.json` pins Supabase and PGlite; `node_modules` has them | `npm rm` + reinstall; add `.open-next/`, `.wrangler/`, `.dev.vars` to `.gitignore` (`.vercel/` can go) |

Code/text still saying Supabase or Vercel (grep): `.planning/{PROJECT,REQUIREMENTS,ROADMAP}.md`, `kb/decisions/adr-001-stack.md`, `kb/domain/domain-model.md` (exclusion constraint, RLS lines), `kb/domain/deliverable-map.md`, `AGENTS.md` (frozen list, escalation), `CLAUDE.md` stack block, `03-HANDOFF.md`, `tests/auth.test.ts`, `app/login/actions.ts`, `lib/auth.ts`.

## Reuse vs Replace (from plans 03-01..03-05)

| Keep unchanged | Notes |
|----------------|-------|
| `app/globals.css`, tokens, `app/design/`, `components/ui/**` (AppShell, Button, Card, Alert, Field, ConfirmDialog, StatusBadge, TextSizeControl) | FOUND-02 stays complete |
| `tests/contrast.test.ts`, `tests/status.test.ts` | No DB dependency |
| `lib/auth.ts` exports `ROLES, Role, ROLE_LABEL, parseRole, homeFor, DEMO_EMAILS, demoEmail, isDemoEnabled, requireRole` | Keep names so Phase 4 layouts and login-form keep compiling |
| `app/login/page.tsx`, `login-form.tsx` (UI) and the `LoginState`, copy strings in `actions.ts` | Only the `attempt()` internals change |
| `app/(admin|coordinator|student)/layout.tsx` guards and stub pages | Unchanged |
| `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs` | Add `cloudflare-env.d.ts` to tsconfig include if needed |
| `AGENTS.md` ownership model | Edit the frozen list: `migrations/`, `seed/`, `lib/**`, `wrangler.jsonc`, `open-next.config.ts` instead of `supabase/`, `proxy.ts` |

| Replace | With |
|---------|------|
| `supabase/migrations/0001_schema.sql`, `0002_rls_functions.sql`, `config.toml`, `seed.sql` | `migrations/0001..0002`, `seed/seed.sql` (port below) |
| `lib/supabase/*`, `proxy.ts` | `lib/db.ts`, `lib/session.ts`, `lib/password.ts`; delete proxy |
| `getCurrentProfile`, `app/login/actions.ts` internals | Session-based |
| `tests/helpers/pg.ts`, `tests/db.test.ts`, `tests/seed.test.ts`, `tests/auth.test.ts` | `tests/helpers/sqlite.ts` + ports |
| 03-HANDOFF.md sections (a), (c), (d), (f) | Rewrite for TS API, error codes, new verification record |

### SQL porting map (Postgres to SQLite)
| Postgres | D1/SQLite |
|----------|-----------|
| `uuid` + `gen_random_uuid()` | `TEXT PRIMARY KEY` set in app by `crypto.randomUUID()` (seed keeps its fixed ids) |
| `timestamptz`, `now()` | `TEXT` UTC ISO with `strftime('%Y-%m-%dT%H:%M:%fZ','now')`; seed uses `strftime(..., 'now', '+10 days')` (relative to seed time, same as before) |
| `boolean` | `INTEGER CHECK (x IN (0,1))` |
| exclusion constraint (gist) | clash triggers (Pattern 1); active set unchanged: pending, approved, open, ongoing |
| `tstzrange(...) &&` in `free_venues`, `resource_available` | `a.starts_at < ?end AND ?start < a.ends_at` in TS-owned SQL |
| `check` constraints | Same; `events_complete_unless_draft`, `events_time_order` port as is (error: `SQLITE_CONSTRAINT_CHECK`, no constraint name guaranteed in message, so use triggers with markers where a human message is needed) |
| `auth.users` + `profiles` | single `profiles` (+ `email UNIQUE`, `password_hash`) + `sessions(token_hash PK, user_id FK, expires_at)` |
| RLS policies, SECURITY DEFINER helpers | `lib/domain` role checks and visibility SQL |
| `events_guard` (actor-aware transitions) | DB: trigger rejecting impossible transitions for everyone (e.g. completed to open) and bumping `updated_at`; app: which actor may perform which allowed transition (HANDOFF (c) table) |
| `alloc_guard` | trigger `RAISE(ABORT,'RESOURCE_SHORT')` using the same overlap sum |
| `register_for_event`, `cancel_registration`, `submit_event`, `review_event`, `cancel_event`, `notify_registrants`, `set_task_status`, `seat_counts`, `free_venues`, `resource_available` | Same names in `lib/domain` (camelCase) so HANDOFF mapping C1..A5 survives |
| `bookings` view | Plain `CREATE VIEW bookings AS SELECT id event_id, venue_id, starts_at, ends_at, status ...`; no range type, return start/end columns (open question from HANDOFF (e) stays for 4c) |
| SQLSTATE codes (23P01, 23505, 42501, 23514, P0001) | `DomainError.code`: `VENUE_CLASH`, `ALREADY_REGISTERED`, `NOT_ALLOWED`, `INVALID_INPUT`/`RESOURCE_SHORT`/`EVENT_FULL`, `BAD_STATE`; D1 errors map by substring of the RAISE marker or `UNIQUE constraint failed: registrations.event_id, registrations.user_id` |

## Common Pitfalls

### Pitfall 1: 10 ms CPU on Workers Free (Error 1102)
**What goes wrong:** Next SSR plus a PBKDF2 verify exceeds 10 ms CPU and the request is killed. Waiting on D1 does not count, CPU does `[CITED: developers.cloudflare.com/workers/platform/limits]`.
**How to avoid:** Early deploy spike (Plan 03-10 checkpoint) hitting `/login`, a demo login and a password login; keep pages dynamic and small; demo login does no hashing; password iterations stored inside the hash string so they can be lowered without a schema change; if still failing, lower iterations for the synthetic demo accounts only and record the trade-off in the ADR (synthetic data, threat T-03-05 already accepted). OWASP guidance is 600k PBKDF2-SHA256 iterations, unreachable on Free; say so honestly rather than hiding it `[CITED: flaviocopes.com article, MEDIUM]`. Whether Cloudflare caps PBKDF2 iterations at 100,000 is `[ASSUMED]`; not found in the docs I could read.
**Warning signs:** Error 1102 / "exceeded CPU" in `wrangler tail`.

### Pitfall 2: `NEXT_PUBLIC_*` is inlined at build time, secrets are runtime
The demo gate must not depend on a build-time inline for security. Read a server-only `DEMO_LOGIN` var (`wrangler.jsonc` `vars`, or `.dev.vars` locally) via `getCloudflareContext().env` inside the server action and the login page (server component). Keep the pure `isDemoEnabled(env)` for the unit test. `process.env` is available with `nodejs_compat` but prefer the explicit binding.

### Pitfall 3: 50 D1 queries per invocation on Free
`[CITED: developers.cloudflare.com/d1/platform/limits]`. A dashboard that loops per event will hit it. Write list queries as joins/aggregates (seat counts via one grouped query). Free tier also has 5M rows read and 100,000 rows written per day; unindexed scans count every scanned row `[CITED: d1 pricing]`. Add indexes (`events(status, starts_at)`, `events(venue_id, starts_at)`, `registrations(event_id, status)`, `tasks(assignee_id)`, `notifications(user_id)`); each index costs one extra row written per write, still negligible.

### Pitfall 4: Trigger syntax and statement splitting
Use uppercase `BEGIN`/`END` and one trigger per statement per file section; `wrangler d1 migrations apply --local` ran multi-line triggers fine here (5 commands executed). Do not put `BEGIN TRANSACTION` in migration files.

### Pitfall 5: Foreign keys and seed order
D1 enforces FKs (`PRAGMA foreign_keys` supported; `defer_foreign_keys` available `[CITED: d1 sql-statements]`). `node:sqlite` also enables FKs by default (verified), so tests match. Seed order: profiles, venues, resources, templates, events, then children. Use `PRAGMA defer_foreign_keys = true` only if a reorder is impossible.

### Pitfall 6: Local dev needs the init call, and next.config must keep it last
`initOpenNextCloudflareForDev()` in `next.config.ts` makes bindings available under `next dev` `[CITED: opennext.js.org/cloudflare/get-started]`. Without it `getCloudflareContext()` throws in dev. Remote bindings are off by default (local simulation), good for free-tier hygiene.

### Pitfall 7: Time zones and SQLite string compare
All stored times UTC ISO with the same millisecond precision; add `CHECK (starts_at GLOB '????-??-??T??:??:??.???Z')`. Convert to local only at render. A mixed format silently breaks the clash trigger.

### Pitfall 8: `.dev.vars` vs `.env.local`
OpenNext reads `.dev.vars` for runtime vars/secrets and `NEXTJS_ENV` selects the Next `.env` set `[CITED]`. CLAUDE.md says `.env.local`; update to "`.dev.vars` (Workers runtime) and `.env.local` (Next build-time)". Both are ignored by git (`.gitignore` has `.env*`; add `.dev.vars`).

### Pitfall 9: Next 16 `proxy.ts` on OpenNext
Supported via Node-middleware bundling in the adapter source (`bundle-node-middleware`), but with open bugs/size issues (above). Deleting `proxy.ts` sidesteps this entirely; layouts already guard routes and session lookup happens per request.

## Code Examples

### wrangler.jsonc
```jsonc
// Source: opennext.js.org/cloudflare/get-started + d1 migrations docs
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "college-events",
  "compatibility_date": "2026-10-01",            // any date >= 2024-09-23 per docs; pick current at implementation
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "college-events" }],
  "d1_databases": [{
    "binding": "DB", "database_name": "college-events",
    "database_id": "<created by: npx wrangler d1 create college-events>",
    "migrations_dir": "migrations"
  }],
  "vars": { "DEMO_LOGIN": "true" }
}
```
`images` binding and R2 incremental cache are optional; skip both (no paid add-ons; `open-next.config.ts` can be omitted, defaults apply).

### package.json scripts (FOUND-01)
```json
"dev": "next dev", "build": "next build",
"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
"db:migrate": "wrangler d1 migrations apply DB --local",
"db:seed": "wrangler d1 execute DB --local --file=seed/seed.sql",
"db:reset": "rm -rf .wrangler/state && npm run db:migrate && npm run db:seed"
```
Keep `npm run build` = `next build` (adapter requirement). Remote equivalents add `--remote`.

### db access
```ts
// lib/db.ts  Source: opennext.js.org/cloudflare/bindings
import { getCloudflareContext } from "@opennextjs/cloudflare";
export const getDb = () => getCloudflareContext().env.DB;   // sync form; SSG would need { async: true }
```

### PBKDF2 string format
`pbkdf2-sha256$<iterations>$<saltB64>$<hashB64>`; verify parses iterations from the string, derives with `crypto.subtle.importKey/deriveBits`, compares in constant time (XOR-accumulate). `scripts/hash-password.mjs` produces the seed value.

### node:sqlite test helper (replaces tests/helpers/pg.ts)
```ts
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
export function freshDb({ seed = false } = {}) {
  const db = new DatabaseSync(":memory:");               // foreign_keys on by default
  for (const f of readdirSync("migrations").filter(f => f.endsWith(".sql")).sort())
    db.exec(readFileSync(`migrations/${f}`, "utf8"));
  if (seed) db.exec(readFileSync("seed/seed.sql", "utf8"));
  return db;
}
export const codeOf = (fn: () => unknown) => { try { fn(); return null; } catch (e) { return (e as Error).message; } };
```
Errors expose `message` = the RAISE marker (verified: `VENUE_CLASH`) or `UNIQUE constraint failed: ...`.
To test the TS domain layer without Workers, give it a tiny adapter: `db()` returns a D1-shaped object (`prepare().bind().run()/first()/all()`, `batch()`) in tests (about 30 lines over `node:sqlite`); `lib/db.ts` is the only swap point. Ponytail ceiling: if the domain layer stays thin, test SQL directly and skip the adapter.

## Test port map (45 existing tests)

| Existing | Becomes |
|----------|---------|
| `db.test.ts` clash (5), registration (3) | Same cases on `node:sqlite`; assert `VENUE_CLASH`, UNIQUE message, check-constraint message |
| `db.test.ts` rls (9) | Domain-layer authorization tests: student cannot read drafts/pending, cannot write; coordinator own events only; no self-promotion to admin; coordinator cannot self-approve or edit `return_reason`; plus the "only lib/ imports getDb" grep |
| `db.test.ts` functions (6) | `lib/domain` tests: freeVenues, resourceAvailable + RESOURCE_SHORT, seatCounts, submit/review, cancelEvent notifies, setTaskStatus |
| `seed.test.ts` | Same assertions; replace the `crypt()` check with `verifyPassword("demo-password-2026"? , profiles.password_hash)` for the three demo users; `bookings` overlap query on start/end columns |
| `auth.test.ts` | Keep helper tests; seed path becomes `seed/seed.sql`; secret hygiene: no `NEXT_PUBLIC_DEMO_PASSWORD`; drop the supabase client test; add session token hash and cookie option tests |
| `contrast`, `status` | unchanged |

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| `@cloudflare/next-on-pages`, Edge runtime | `@opennextjs/cloudflare` on Workers, Node runtime, `nodejs_compat` | Do not use `export const runtime = "edge"` (not supported) `[CITED]` |
| `wrangler.toml` | `wrangler.jsonc` | Use jsonc |
| Free Workers 3 MiB compressed limit (older docs) | Docs now state 64 MiB uncompressed, no compressed limit | Bundle size is not the free-tier blocker; CPU time is `[CITED: workers/platform/limits, re-fetched twice]` |
| `getRequestContext` | `getCloudflareContext()` (sync) | `{ async: true }` only in SSG |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Remote D1 executes `CREATE TRIGGER ... RAISE(ABORT)` the same as local workerd (verified local only) | Summary, Pattern 1 | FOUND-04 would need app-level check in a `batch`; caught by deploy spike |
| A2 | Trigger bodies need uppercase BEGIN/END remotely (community report) | Pattern 1 | Harmless if wrong (uppercase works everywhere) |
| A3 | Writes are serialised per D1 database so trigger + insert cannot interleave | Pattern 1 | Clash race possible; mitigate with `batch` and the post-insert re-check |
| A4 | PBKDF2 at ~100k iterations may exceed 10 ms CPU on Free; Workers may cap iterations at 100,000 | Pitfall 1 | Login fails (1102) or needs fewer iterations; measure in spike |
| A5 | Each statement inside a `batch` counts toward the 50-queries-per-invocation limit | Pitfall 3 | Different budget; low impact |
| A6 | OpenNext+Next 16 SSR stays under 10 ms CPU for simple dynamic pages | Pitfall 1 | Would force static-heavy pages or user decision on Paid plan |
| A7 | `NEXTJS_ENV` / `.dev.vars` handling works with Next 16.4.2 as documented for older versions | Pitfall 8 | Minor config tweak |

## Open Questions (RESOLVED)

1. **(RESOLVED, deferred to plan 03-10 Task 5 live CPU check) Does the free CPU limit hold for this app?** Known: limit is 10 ms, Next SSR is heavy. Unknown: actual figure. Recommendation: the deploy spike in the last plan is a blocking human checkpoint (needs `wrangler login`); if it fails, escalate to the user (Paid plan is outside the stated constraint; fallback is to make most pages static shells with client fetch, a scope-affecting decision).
2. **(RESOLVED: Workers) Pages instead of Workers?** Recommend Workers; no research reason to prefer Pages.
3. **(RESOLVED, deferred to Phase 4 agent 4c) `bookings` view columns for A2 clash highlighting** (still open from HANDOFF (e)); Phase 4 agent 4c checks.
4. **(RESOLVED, deferred to plan 03-10 Tasks 3/4) Cloudflare account/D1 creation** is a human step: `npx wrangler login`, `npx wrangler d1 create college-events`, paste `database_id` into `wrangler.jsonc` (an id, not a secret, but confirm the team is happy committing it).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build, tests, `node:sqlite` | yes | 24.21.0 | — |
| npm registry | installs | yes | — | — |
| wrangler (local D1, workerd) | `db:*`, preview | yes (ran 4.151.3 in scratch dir; workerd started offline-capable) | 4.151.3 | — |
| Cloudflare account + `wrangler login` | deploy, remote D1 | unknown (human) | — | Everything except deploy/live check runs locally |
| Context7 MCP | docs | not available in this agent; official docs fetched instead | — | — |
| Cloudflare skills in `~/.claude/skills` | — | none found (only aws-*) | — | — |

**Blocking for phase completion (not for coding):** Cloudflare account and login for the live checkpoint.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.5 (existing), `node:sqlite` for SQL |
| Config file | `vitest.config.ts` (existing; unchanged, `include: tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/db.test.ts` (target under 2 s; same file name as the CLAUDE.md fast check) |
| Full suite command | `npm run lint && npm run typecheck && npm test && npm run build` |
| Real-D1 smoke | `npm run db:reset` (applies migrations + seed on local workerd D1), then `npx wrangler d1 execute DB --local --command="select count(*) from events"` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | build/lint/typecheck/test/preview run | gate | full suite; `npm run preview` manual smoke | partially (rewrite scripts) |
| FOUND-02 | tokens contrast, status badges | unit | `npx vitest run tests/contrast.test.ts tests/status.test.ts` | yes |
| FOUND-03 | schema + seed shape, no direct DB access outside lib | unit | `npx vitest run tests/seed.test.ts tests/db.test.ts` | rewrite (Wave 0) |
| FOUND-04 | overlapping active bookings rejected, back-to-back OK, reopen into taken slot rejected | unit | `npx vitest run tests/db.test.ts -t clash` | rewrite |
| FOUND-05 | duplicate (event,user) rejected; last-seat/waitlist/promotion | unit | `npx vitest run tests/db.test.ts -t registration` | rewrite |
| FOUND-06 | session create/read/expire, requireRole redirects, hash verify | unit | `npx vitest run tests/auth.test.ts` | rewrite |
| FOUND-07 | demo login gate off by default/flag; server refuses when off; seeded users exist | unit + manual | `npx vitest run tests/auth.test.ts` + browser (3 buttons, wrong-role redirect, A+ size, keyboard) | rewrite; browser step is human |

### Sampling Rate
- Per task commit: `npx vitest run tests/db.test.ts` (or the file touched)
- Per wave merge: full suite
- Phase gate: full suite green, `node kb/tools/build-index.mjs` pass, `npm run db:reset` pass, and the live checkpoint recorded honestly (if not done, say "UNVERIFIED LIVE" like 03-HANDOFF (f))

### Wave 0 Gaps
- [ ] `tests/helpers/sqlite.ts` (freshDb, mkUser, codeOf)
- [ ] `migrations/0001_schema.sql`, `0002_guards.sql`, `seed/seed.sql` (tests depend on them)
- [ ] Remove `@electric-sql/pglite` import paths so the suite compiles
- [ ] `scripts/hash-password.mjs` for the seed hash

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | PBKDF2-SHA256 (WebCrypto), generic failure message (existing WRONG copy), demo login server-gated |
| V3 Session Management | yes | 256-bit random token, SHA-256 at rest, httpOnly+Secure+SameSite=Lax, server-side expiry and delete on sign-out |
| V4 Access Control | yes | `lib/domain` actor checks + ownership in WHERE; grep test that only `lib/` touches D1; layout `requireRole` |
| V5 Input Validation | yes | Parameter binding only (`?1`), role whitelist `parseRole`, fixed redirect targets, length/format validation in actions (no zod needed yet) |
| V6 Cryptography | yes | WebCrypto only; never hand-roll primitives; salts from `getRandomValues` |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | `prepare().bind()` always; never string-build SQL with user input |
| Privilege escalation via missing RLS | Elevation | Single data layer, role checks, test that `role` cannot be self-updated |
| CSRF on server actions | Spoofing | Next server actions check Origin; SameSite=Lax cookie |
| Demo login left on | Elevation | Runtime flag defaults false in production `vars`; documented in Phase 7 review |
| Session theft | Spoofing | httpOnly, hashed at rest, expiry |
| Brute force on password login | Spoofing | Not mitigated beyond KDF cost (no rate limiter in free scope); record as accepted risk for synthetic data |

## kb and doc updates required (item 8)
Via the kb rule (frontmatter, `updated`, then `node kb/tools/build-index.mjs` must pass):
- `kb/decisions/adr-001-stack.md`: retitle to "Next.js + Cloudflare Workers + D1", decision/why/consequences/ceiling (free-tier limits above, clash via triggers not exclusion constraints, app-side auth). Keep id `adr-001-stack`; INDEX row text "Tech stack" stays valid. Confidence `derived`, source `user-chat`.
- `kb/domain/domain-model.md`: lines on exclusion constraint (line 17) and RLS (line 23) become trigger + authorization-layer wording; keep the half-open `[)` rule and active status set.
- `kb/domain/deliverable-map.md`: Supabase/Vercel mentions.
- `.planning/PROJECT.md`, `REQUIREMENTS.md` (FOUND-03/04 wording: "D1 schema, seed and access rules", "trigger"), `ROADMAP.md` (Phase 3 line and success criteria 3-4, Phase 7 "Vercel deployment" to "Cloudflare deployment", RLS review to authorization review).
- `AGENTS.md` frozen list and escalation text; `CLAUDE.md` Stack block (real commands, `.dev.vars`).
- `03-HANDOFF.md`: rewritten catalog (TS function signatures, error code table, verification record).

## Suggested plan breakdown (for the planner)

| Plan | Wave | Content | Reqs |
|------|------|---------|------|
| 03-06 | 1 | Swap deps, `wrangler.jsonc`, `next.config.ts` init call, scripts, delete `proxy.ts` and `lib/supabase`, `.gitignore`, `.env.example`/`.dev.vars.example`, `cf-typegen`; `npm run build` and `npm run preview` smoke | FOUND-01 |
| 03-07 | 2 | `migrations/` + `seed/seed.sql` + hash script + `tests/helpers/sqlite.ts` + ported clash/registration/seed tests | FOUND-03, 04, 05 |
| 03-08 | 3 | `lib/db.ts`, `lib/errors.ts`, `lib/domain/*` (port of rpc functions), authorization/visibility tests, grep test | FOUND-03 |
| 03-09 | 3 (parallel with 03-08; both depend on 03-07) | `lib/session.ts`, `lib/password.ts`, `lib/auth.ts`, login actions, `tests/auth.test.ts` | FOUND-06, 07 |
| 03-10 | 4 | kb/docs/AGENTS/CLAUDE/HANDOFF updates, full gate, **human checkpoint**: wrangler login, `d1 create`, remote migrate+seed, deploy, run the 7-step live check from HANDOFF (f), measure CPU | all |

## Sources

### Primary (HIGH)
- https://opennext.js.org/cloudflare/get-started : packages, wrangler.jsonc, scripts, dev init, `.dev.vars`, edge runtime unsupported
- https://opennext.js.org/cloudflare/bindings : `getCloudflareContext().env`, sync/async, types, local vs remote bindings
- https://developers.cloudflare.com/d1/worker-api/d1-database/ : `batch()` is transactional with rollback; `exec()` caveats
- https://developers.cloudflare.com/d1/platform/limits/ : Free: 50 queries/invocation, 500 MB/db, 100 bound params
- https://developers.cloudflare.com/d1/platform/pricing/ : Free 5M rows read/day, 100k written/day, 5 GB
- https://developers.cloudflare.com/workers/platform/limits/ : Free 100k requests/day, 10 ms CPU, 50 subrequests, 64 MiB uncompressed, network wait not CPU
- https://developers.cloudflare.com/d1/reference/migrations/ : `migrations/`, `d1_migrations`, `migrations_dir`
- https://developers.cloudflare.com/d1/sql-api/sql-statements/ : `PRAGMA foreign_keys`, `defer_foreign_keys`, FTS5, JSON
- npm registry: `@opennextjs/cloudflare` 1.20.12 peers; `wrangler` 4.151.3; package source inspected (`bundle-node-middleware`)
- Local verification: `node:sqlite` trigger + FK behaviour and vitest 5 run; `wrangler d1 migrations apply --local` with multi-line trigger; `d1 execute --local` returned `VENUE_CLASH`

### Secondary (MEDIUM)
- github.com/opennextjs/opennextjs-cloudflare issues #1373, #1400, #1401, #969 (proxy.ts bundling problems, via GitHub search API)
- https://flaviocopes.com/native-email-password-authentication-cloudflare-workers/ (PBKDF2 iteration vs CPU discussion)
- pbkdf2-lite npm page (suggests 20k-80k iterations on Free)

### Tertiary (LOW)
- Community skill pages on D1 (uppercase BEGIN/END, no BEGIN TRANSACTION in migrations)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (versions from registry, peers match repo)
- Architecture (triggers, batch, sessions): MEDIUM-HIGH (local-verified; remote D1 unverified)
- Free-tier CPU feasibility: LOW-MEDIUM (needs spike)
- Pitfalls: MEDIUM

**Research date:** 2026-10-20
**Valid until:** 2026-11-03 (adapter ships frequently; re-check `npm view @opennextjs/cloudflare version`)
