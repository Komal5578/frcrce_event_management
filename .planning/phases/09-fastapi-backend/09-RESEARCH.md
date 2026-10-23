# Phase 9: FastAPI Backend - Research

**Researched:** 2026-10-23
**Domain:** FastAPI + Postgres (psycopg 3, plain SQL) port of the v1 TypeScript/D1 domain layer
**Confidence:** HIGH on stack and the clash constraint (tested live); MEDIUM on a few policy choices flagged in the Assumptions Log

<user_constraints>
## User Constraints (from CONTEXT.md and CLAUDE.md)

CONTEXT.md has no Decisions/Discretion/Deferred headings. It is a brief with a locked port map. Treat the following as locked:

### Locked Decisions
- Requirements: API-01..06. "Port the v1 rules; don't invent new ones."
- Port map: `0001_schema.sql` to Postgres (uuid, timestamptz, boolean, no GLOB checks, `btree_gist`). `0002_guards.sql` clash triggers become `EXCLUDE USING gist (venue_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status IN ('approved','open','ongoing'))`. Capacity, promote, transition and alloc triggers become `app/domain` transactions (`SELECT ... FOR UPDATE` on the event row).
- `lib/domain/*.ts` becomes `app/domain/*.py`, same names in snake_case, `Actor` first argument, `require_actor_role`.
- Auth `app/auth.py`: 32-byte token cookie (httpOnly, SameSite=Lax, 7 days), SHA-256 stored, argon2 via pwdlib, constant-time dummy check for unknown email, rate-limit table, expired-session cleanup.
- One exception handler maps VENUE_CLASH, EVENT_FULL, RESOURCE_SHORT, BAD_STATE, NOT_ALLOWED to the v1 human messages.
- `app/csv.py`: BOM, RFC-4180, formula-injection guard.
- Tests: pytest against a compose Postgres, one transaction per test with rollback.
- Seed: dates relative to now(), with **two overlapping pending requests** for the admin demo.
- Layout: `app/main.py`, `db.py`, `auth.py`, `schemas.py`, `domain/`, `routers/` (auth, events, registrations, tasks, venues, resources, approvals, reports, notifications incl. `unread-count`), `scripts/migrate.py`, `Dockerfile`, root `docker-compose.yml`.
- New tests: pending/pending overlap allowed and approving the second gives VENUE_CLASH; approve re-checks resources (RESOURCE_SHORT); student gets 403 on admin/coordinator routes incl. CSV; rate limit after N failed sign-ins.
- CLAUDE.md: Python 3.12, psycopg 3 plain SQL (no ORM), plain `.sql` migrations, Pydantic schemas, ruff, real Postgres in tests; Actor from session never from request input; error markers unchanged; no email/SMS/payments; secrets only in `backend/.env`; never add attendance features; one commit per verified phase.

### Claude's Discretion
- Sync vs async psycopg, router/schema detail, migration runner design, rate-limit parameters, HTTP status mapping, test fixture mechanics.

### Deferred Ideas (OUT OF SCOPE)
- Frontend work (Phases 10-11), AWS/Caddy/S3 backup (Phase 12), CORS (proxy makes it unnecessary), email/SMS, payments.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-01 | `docker compose up` runs FastAPI + Postgres; schema/seed from plain SQL | Compose + migrate runner (Architecture, Code Examples) |
| API-02 | Exclusion constraint on approved/open/ongoing; pending overlaps allowed; approve of clashing fails | Constraint tested live on PG17 (see Code Examples); SQLSTATE 23P01 mapped to VENUE_CLASH |
| API-03 | Capacity/waitlist/promotion, state machine, resource limits re-checked on approve and reschedule in domain txns | Domain-transaction pattern with `FOR UPDATE` |
| API-04 | Hashed-token session cookie, argon2, rate limit, env-gated demo login | pwdlib[argon2], `login_attempts` table, `DEMO_LOGIN` flag |
| API-05 | Every endpoint checks role; cross-role 403 incl. CSV | Router-level role dependency plus domain check plus a route-matrix test |
| API-06 | v1 domain/trigger tests ported to pytest; OpenAPI documents every endpoint | Port list, OpenAPI completeness test |
</phase_requirements>

## Summary

This is a port, not a design. The v1 rules are small (about 1200 lines of TS domain plus 97 lines of triggers). The work is: translate SQLite SQL to Postgres, move trigger logic into explicit transactions, put FastAPI routers on top, and port the tests. The one rule change is the clash fix: only approved/open/ongoing events hold a venue, so pending requests can overlap and the clash surfaces at approval (the v1 admin clash path was unreachable). I verified this exact constraint on Postgres 17: pending overlapping an approved row inserts fine, an adjacent `[)` slot is fine, and flipping the pending row to approved raises `conflicting key value violates exclusion constraint`.

Use a **sync** psycopg `ConnectionPool` with plain `def` endpoints (FastAPI runs them in a threadpool). It makes `with pool.connection() as conn:` one-transaction-per-request trivial, makes `SELECT ... FOR UPDATE` straightforward, and lets tests hand the same `conn` to domain functions. Async buys nothing at demo scale.

Seed gotcha: the v1 seed carries PBKDF2 hashes. v2 uses argon2, so the seed loader must hash `demo-password-2026` at load time (Python), not hardcode hashes.

**Primary recommendation:** Domain functions are `fn(actor, conn, ...)`. The router opens one pooled transaction per request, builds the Actor from the session cookie, and calls domain. A single `DomainError(code, message)` exception handler produces the HTTP response. Tests pass a rolled-back `conn` straight to domain functions and use `TestClient` with dependency overrides for HTTP tests.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Venue clash prevention | Database (EXCLUDE) | API maps 23P01 to VENUE_CLASH | Impossible in DB regardless of app (dom-domain-model) |
| Double registration | Database (UNIQUE) | API maps to ALREADY_REGISTERED | Same |
| Capacity/waitlist/promotion | API domain txn | DB row lock | Needs event row `FOR UPDATE` |
| State machine, resource limits | API domain txn | DB CHECKs for shape | Actor-dependent, multi-table |
| Authorization (role + ownership) | API domain (`require_actor_role`) | Router dependency | Domain is the authorization layer |
| Session/auth/rate limit | API | DB (`sessions`, `login_attempts`) | Cookie set by API, proxied first-party by Next |
| CSV export | API | Frontend triggers download | Role check must be server-side |
| Cookie/session transport | Frontend rewrite proxy | API | No CORS needed |

## Standard Stack

Versions checked against PyPI on 2026-10-23 [VERIFIED: pypi.org JSON API].

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fastapi | 0.161.1 | HTTP, OpenAPI, DI | Locked by CLAUDE.md |
| uvicorn[standard] | 0.54.0 | ASGI server | Standard FastAPI runner |
| psycopg[binary] | 3.3.6 | Postgres driver | Locked; plain SQL |
| psycopg-pool | 3.3.3 | Connection pool | Official psycopg pool [CITED: psycopg.org/psycopg3/docs/advanced/pool.html] |
| pydantic | 2.14.1 | Schemas | FastAPI native |
| pwdlib[argon2] | 0.3.1 | Argon2 hashing | Locked; `PasswordHash.recommended()` [CITED: frankie567.github.io/pwdlib] |
| pydantic-settings | check at install | Env config | Optional; plain `os.environ` is acceptable (ponytail) |

### Supporting (dev)
| Library | Version | Purpose |
|---------|---------|---------|
| pytest | 9.1.1 | Tests |
| httpx | check at install | Required by FastAPI `TestClient` |
| ruff | 0.17.2 | Lint (locked) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sync pool + `def` endpoints | AsyncConnectionPool | Async adds `await` everywhere and complicates rollback-per-test; no gain at this scale |
| hand SQL migration runner | alembic/yoyo | CLAUDE.md says plain `.sql`; a 30-line runner with a `schema_migrations` table is enough |
| `python-multipart`/OAuth2 forms | JSON login body | Cookie auth with JSON body is simpler; no form dependency |

**Installation (use uv, available locally):**
```bash
cd backend && uv init --no-workspace  # or hand-write pyproject.toml, requires-python ">=3.12"
uv add fastapi "uvicorn[standard]" "psycopg[binary]" psycopg-pool "pwdlib[argon2]"
uv add --dev pytest httpx ruff
```

## Package Legitimacy Audit

slopcheck was not run (not installed; best-effort per protocol). The packages are all high-profile, long-lived, named in CLAUDE.md or official FastAPI/psycopg docs, and versions were read from the PyPI JSON API. Per protocol, because slopcheck did not run, the planner should still add one `checkpoint:human-verify` before the first `uv add`, or accept the risk since all names come from CLAUDE.md and official docs.

| Package | Registry | Source | slopcheck | Disposition |
|---------|----------|--------|-----------|-------------|
| fastapi, uvicorn, pydantic, pytest, ruff, httpx | PyPI | official docs | not run | Approved (well-known) [ASSUMED legitimacy] |
| psycopg, psycopg-pool | PyPI | psycopg.org docs | not run | Approved |
| pwdlib | PyPI | frankie567.github.io/pwdlib (docs checked) | not run | Approved; smaller project, pin the version |

**Removed [SLOP]:** none. **Flagged [SUS]:** none (unchecked).

## Architecture Patterns

### Request flow
```
Browser -> Next /api/* rewrite -> FastAPI (uvicorn)
   -> router fn (def)
        -> Depends(get_conn): pool.connection()  [one txn; commit on exit, rollback on exception]
        -> Depends(current_actor): cookie -> sha256 -> sessions join profiles (not expired) -> Actor
        -> domain.fn(actor, conn, ...)       [require_actor_role, ownership, FOR UPDATE, state checks]
             -> SQL; psycopg errors -> DomainError via translate()
   -> Pydantic response_model -> JSON
DomainError -> one exception_handler -> {"code","message"} + HTTP status
```
Per-connection state: dependency yield-based `get_conn` shares one connection per request across `current_actor` and the handler (FastAPI caches dependencies per request), so the session read and the domain work are in the same transaction.

### Recommended structure
```
backend/
  app/{main.py, db.py, auth.py, errors.py, csv.py, schemas.py, config.py}
  app/domain/{actor,events,drafts,registrations,allocations,tasks,venues,catalog,views,people,notifications,admin,reports,alerts,rules}.py
  app/routers/{auth,events,registrations,tasks,venues,resources,approvals,reports,notifications}.py
  migrations/{0001_schema.sql,0002_guards.sql (now only the EXCLUDE + helper indexes)}
  seed/seed.sql          (no password hashes; loader inserts them)
  scripts/migrate.py     (apply migrations + optional --seed; hashes demo password with pwdlib)
  tests/{conftest.py,...}
  Dockerfile, pyproject.toml, .env.example
docker-compose.yml       (repo root: db + api; Caddy is Phase 12)
```
Rename the migration file for guards to something honest (for example `0002_constraints.sql`) since triggers are gone. Keep numbering.

### Pattern 1: Domain function with locked transaction
```python
# app/domain/registrations.py
def register_for_event(actor: Actor, conn, event_id: UUID) -> str:
    require_actor_role(actor, "student")
    ev = conn.execute(
        "SELECT id, capacity FROM events WHERE id = %s AND status = 'open' FOR UPDATE",
        (event_id,)).fetchone()
    if not ev:
        raise DomainError("BAD_STATE", "Registration for this event is not open.")
    confirmed = conn.execute(
        "SELECT count(*) FROM registrations WHERE event_id=%s AND status='confirmed'", (event_id,)).fetchone()[0]
    status = "confirmed" if confirmed < ev["capacity"] else "waitlisted"
    # re-register after cancel: upsert only over a cancelled row (v1 behaviour)
    row = conn.execute(
        """INSERT INTO registrations (event_id, user_id, status) VALUES (%s,%s,%s)
           ON CONFLICT (event_id, user_id) DO UPDATE
             SET status = EXCLUDED.status, created_at = now()
             WHERE registrations.status = 'cancelled'
           RETURNING status""", (event_id, actor.id, status)).fetchone()
    if row is None:
        raise DomainError("ALREADY_REGISTERED", "You are already registered for this event.")
    return row["status"]
```
`FOR UPDATE` on the event row serialises concurrent registrations and cancellations for that event (last-seat race, promotion).

### Pattern 2: Cancel plus promotion (replaces the `registrations_promote` trigger)
In `cancel_registration`: lock event row, set status cancelled where status in (confirmed, waitlisted) (BAD_STATE "You are not registered for this event." if 0 rows), and only if the old status was `confirmed`, pick `ORDER BY created_at, id LIMIT 1` waitlisted row, set confirmed, insert notification `waitlist_promoted` with the v1 text `A seat opened up and you are now confirmed for "<title>".`. Also promote when an event's capacity is raised (v1 had no such trigger; do NOT add, port only; note as a known gap).

### Pattern 3: State machine in one table
```python
NEXT = {("draft","pending"),("returned","pending"),("pending","approved"),("pending","returned"),
        ("approved","open"),("open","ongoing"),("ongoing","completed")}
CANCELLABLE = {"draft","pending","returned","approved","open","ongoing"}
def assert_transition(old, new):
    if not ((old,new) in NEXT or (new == "cancelled" and old in CANCELLABLE)):
        raise DomainError("BAD_STATE", MSG["BAD_STATE"])
```
Call it in every status UPDATE after `SELECT ... FOR UPDATE`. Keep a DB `CHECK (status IN (...))` and `events_complete_unless_draft` and `events_time_order` CHECKs.

### Pattern 4: Resource check as one shared function
`check_resources(conn, event_id)` locks the `resources` rows involved (`FOR UPDATE`), and for each allocation of the event sums overlapping allocations of **other events holding the venue/resources**, raising RESOURCE_SHORT. Call it from: `set_allocation`, `review_event(approve=True)`, and `update_event` when the time changes on an approved/open event (the reschedule re-check). Also run venue clash implicitly via the EXCLUDE on the UPDATE.

### Pattern 5: Error translation
```python
def translate(e: psycopg.Error) -> DomainError:
    if isinstance(e, errors.ExclusionViolation): return DomainError("VENUE_CLASH", MSG["VENUE_CLASH"])
    if isinstance(e, errors.UniqueViolation) and "registrations" in (e.diag.constraint_name or ""): return DomainError("ALREADY_REGISTERED", ...)
    if isinstance(e, errors.CheckViolation): # events_complete_unless_draft / events_time_order messages from v1
        ...
    if isinstance(e, (errors.NotNullViolation, errors.ForeignKeyViolation)): return DomainError("INVALID_INPUT", ...)
    return DomainError("INTERNAL", ...)
```
Use `e.diag.constraint_name`, not message text. Register an exception handler for `psycopg.Error` calling `translate`, and one for `DomainError`.

HTTP status map (discretion): NOT_ALLOWED 403, UNAUTHENTICATED 401, INVALID_INPUT 422, RATE_LIMITED 429, VENUE_CLASH/EVENT_FULL/RESOURCE_SHORT/BAD_STATE/ALREADY_REGISTERED 409, INTERNAL 500. Body `{"code":..., "message":...}`; messages are the v1 `MSG` strings verbatim (copy from `frontend/lib/errors.ts`).

### Pattern 6: Auth
- Login: lowercase email; check rate limit; fetch profile; **always** run `verify` (against a module-level dummy hash if no user) so timing is constant; on failure insert `login_attempts`; on success delete attempts for that email, create session.
- Token: `secrets.token_urlsafe(32)`; store `hashlib.sha256(token.encode()).hexdigest()`; cookie `httponly=True, samesite="lax", max_age=604800, path="/", secure=settings.cookie_secure` (env flag, false on http dev).
- Expired-session cleanup: `DELETE FROM sessions WHERE expires_at < now()` on each login (cheap, no scheduler).
- Rate limit key: **email only**, not IP (all requests arrive from the Vercel proxy, so IP is useless). Starting parameters: 5 failures within 15 minutes returns 429 RATE_LIMITED with human text. Make N and window settings so the test can lower them. [ASSUMED values]
- Demo login: `POST /api/auth/demo-login {role}` returns 404 unless `DEMO_LOGIN=true`. Default false in `.env.example`; compose dev sets it true.
- pwdlib: `PasswordHash.recommended()` hashes with Argon2id [CITED: pwdlib docs]. Dummy-hash for unknown email: compute `DUMMY = ph.hash("x")` at import. `verify_and_update` exists in pwdlib for rehash but was not documented on the page I could read; not needed, skip.

### Pattern 7: Role enforcement at two layers
`def require_roles(*roles)` returns a dependency that raises `DomainError("NOT_ALLOWED")` (403). Put it as `dependencies=[Depends(require_roles("admin"))]` on each router or route, plus `require_actor_role` inside domain. Export routes get it explicitly.

### Pattern 8: Migrations
`scripts/migrate.py`: ensure `schema_migrations(name text primary key, applied_at timestamptz)`, apply `migrations/*.sql` in sorted order, each in its own transaction, skip applied. `--seed` runs `seed/seed.sql` then updates `profiles.password_hash` using pwdlib (or the seed uses a `%(demo_hash)s` placeholder; simplest is: loader hashes once, then `UPDATE profiles SET password_hash=%s WHERE email LIKE '%@demo.college.test'`). Compose api `command` runs migrate then uvicorn; seed behind an env flag (`SEED_DEMO=true`) so it never runs in prod accidentally.

### Anti-Patterns to Avoid
- Concatenating user input into SQL (v1 used constant strings plus bind; keep `%s` params and constant `VISIBLE` fragments).
- Taking `actor`/`user_id` from request bodies.
- Letting `PATCH` bodies write status/owner (keep v1 `DraftPatch` whitelist; use Pydantic `extra="forbid"`).
- Catching `Exception` around SQL and swallowing; always translate.
- Running the seed in tests that assume empty tables.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Venue overlap detection | Python/trigger overlap query | `EXCLUDE USING gist` | Race-free; tested |
| Password hashing | custom PBKDF2 | pwdlib Argon2 | Parameters, salts, encoding |
| Random token | `random` | `secrets.token_urlsafe(32)` | CSPRNG |
| Constant-time compare | `==` on hashes | hash lookup by SHA-256 (DB equality on a hash is fine) plus `hmac.compare_digest` if comparing secrets | |
| Connection pooling | own pool | `psycopg_pool.ConnectionPool` | |
| CSV | `csv` module alternatives | stdlib `csv` writer with QUOTE_ALL + BOM + injection prefix helper | Port `toCsv` semantics: every cell quoted, CRLF, leading `'` for `= + - @ \t \r` strings, numbers not guarded |
| OpenAPI/TS types | handwritten | FastAPI `/openapi.json` | CLAUDE.md |

## Runtime State Inventory

Not a rename phase; this is a port. One migration-like trap: **v1 password hashes are PBKDF2 and the v1 sessions are in D1.** Nothing is carried over; the v2 DB starts empty and the seed re-hashes with argon2. No other runtime state to migrate (v1 Cloudflare deployment is frozen and independent).

## Common Pitfalls

### Pitfall 1: NULL range bounds in the constraint
`tstzrange(NULL, x)` is unbounded below, which would overlap everything. Drafts have NULL times, but the partial `WHERE status IN (...)` excludes them and `events_complete_unless_draft` forces non-null times for every other active status. Keep that CHECK; add a test that inserting an `approved` event with NULL venue/time fails.
### Pitfall 2: v1 counted `pending` as booking (the audit bug)
Do not copy the old trigger WHERE lists. Venue: approved/open/ongoing only. Update the `bookings` view the admin calendar relied on: it should list pending too (for the admin queue) but flag a clash only between pending and held rows. Port `flag_conflicts` logic (`admin.ts`) so overlapping pending pairs and pending vs approved are flagged as potential clashes.
### Pitfall 3: Approval clash error leaves the txn aborted
After `ExclusionViolation` the Postgres transaction is aborted. Inside a domain function, either let it propagate (request txn rolls back, handler returns 409) or wrap the risky UPDATE in `with conn.transaction():` (savepoint) when you need to continue. Notification inserts must happen only after the status UPDATE succeeds.
### Pitfall 4: Sign-in rate limit rows inside the failing request's txn
If the login handler raises on failure, `get_conn` rolls back and the failed-attempt insert is lost. Write the attempt, **commit**, then raise (use a separate short `pool.connection()` block or return a result instead of raising before commit). Test this explicitly.
### Pitfall 5: Rollback-per-test vs real concurrency
Rollback-only tests cannot prove the last-seat race. Add 1-2 tests marked `concurrency` that use two real committed connections and threads with cleanup (`TRUNCATE ... CASCADE` after). Everything else uses the rolled-back conn.
### Pitfall 6: Timestamps and ISO strings
v1 enforced `YYYY-MM-DDTHH:MM:SS.mmmZ`. Use `timestamptz` and Pydantic `AwareDatetime` (reject naive). Return ISO with offset; tell the frontend phase that the format changed from the v1 `...Z` ms string if the typegen consumer cares.
### Pitfall 7: Seed overlaps and the constraint
Seed must insert the two overlapping *pending* requests (allowed) and all approved/open/ongoing events non-overlapping per venue, else the seed itself fails.
### Pitfall 8: Cancelled/returned rows and the constraint
Moving an event to `cancelled` or `returned` leaves the partial index, which frees the venue automatically; no extra code.
### Pitfall 9: Docker healthcheck ordering
`api` must wait for `db` (`depends_on: condition: service_healthy` with `pg_isready`), or migration fails on first `up`.
### Pitfall 10: Cookie `Secure` over plain http dev
`Secure` cookies are dropped on http://localhost by some clients; gate on an env flag. Production behind Caddy HTTPS (Phase 12) sets it true.

## Code Examples

### Constraint (verified on postgres:17-alpine, 2026-10-23)
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE events ADD CONSTRAINT events_no_venue_clash EXCLUDE USING gist
  (venue_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status IN ('approved','open','ongoing'));
-- Result observed: approved 10-12 + pending 11-13 inserts OK; open 12-13 OK (adjacent);
-- UPDATE pending -> approved raises "conflicting key value violates exclusion constraint" (23P01).
```
uuid columns work with `btree_gist` equality (tested). [VERIFIED: ran against postgres:17-alpine]

### Pool + lifespan + request transaction
```python
# app/db.py   Source: psycopg pool docs, FastAPI lifespan docs
from contextlib import asynccontextmanager
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5, open=False, kwargs={"row_factory": dict_row})

@asynccontextmanager
async def lifespan(app):
    pool.open(wait=True)
    yield
    pool.close()

def get_conn():
    with pool.connection() as conn:   # commit on clean exit, rollback on exception
        yield conn
```
Caveat: `pool.connection()` commits on exit only if no exception; with a yield dependency, exceptions raised in the handler propagate into the generator in current FastAPI, so rollback works. Add one test that proves a raised DomainError leaves no partial write. `dict_row` via `kwargs` is the documented way to pass connection args; row_factory page was not fetched (MEDIUM) so verify in the first task. Sizing: t3.micro, `max_size=5` is plenty.

### Handler
```python
@app.exception_handler(DomainError)
async def domain_error(_, e: DomainError):
    return JSONResponse({"code": e.code, "message": e.message}, status_code=STATUS[e.code])
```

### Route-matrix authorization test (API-05)
```python
PUBLIC = {("POST","/api/auth/login"), ("POST","/api/auth/demo-login"), ("GET","/api/health")}
def test_every_route_rejects_anonymous_and_wrong_role(client_for):
    for r in app.routes:   # APIRoute only
        ...  # anonymous -> 401; each role not in route's declared roles -> 403
```
Store allowed roles in route `openapi_extra={"x-roles": [...]}` or a dict next to the router so the test can read them. This catches any forgotten endpoint.

### OpenAPI completeness (API-06)
Assert `/openapi.json` has an operation for every `APIRoute`, each with `summary`/`tags` and a `response_model` (use `generate_unique_id_function=lambda r: f"{r.tags[0]}_{r.name}"` so openapi-typescript yields clean names in Phase 10). Declare 401/403/409 `responses` once via a shared dict.

## Port list for pytest (API-06)
v1 has 260 vitest cases; many are pure frontend (contrast, format, status badge, lane/parse/filter UI helpers) and are **not** ported here (they belong to Phases 10-11 or die). Port: `db.test`, `db-boundary`, `domain`, `domain-phase4`, `authz`, `auth`, `seed`, coordinator `actions`/`venues`, student `actions`/`mine`/`view`(data parts), admin `actions`/`clash`/`dashboard`, xcut `csv`/`reports`/`alerts`/`consistency`/`export-route`/`states`. `tests/helpers/sqlite.ts` is replaced by `conftest.py`. State the ported/dropped counts in SUMMARY honestly.

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| psycopg2 | psycopg 3 + psycopg_pool | Use `psycopg_pool`, not the removed `psycopg.pool` module [ASSUMED from memory; docs page uses `psycopg_pool`] |
| FastAPI `@app.on_event` | `lifespan` context manager | on_event ignored once lifespan is set [CITED: fastapi.tiangolo.com/advanced/events] |
| passlib | pwdlib | passlib is unmaintained; pwdlib is what current FastAPI docs recommend [ASSUMED] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Resources are "held" only by approved/open/ongoing events (pending excluded), mirroring the venue rule; this is what makes "approve re-checks resources, RESOURCE_SHORT" reachable | Pattern 4 | If user wants pending to count (v1), the approve-time test scenario cannot be reached; confirm with user |
| A2 | Resource overlap check sums all time-overlapping holders (v1 semantics, conservative), not peak concurrency | Pattern 4 | Slightly over-strict; matches v1 |
| A3 | Rate limit 5 failures per 15 min keyed on email | Pattern 6 | Tunable via settings |
| A4 | Status mapping 403/401/409/422/429 | Pattern 5 | Frontend (Phase 10) must follow `code`, not status; low risk |
| A5 | Sync psycopg + `def` endpoints | Summary | Low; reversible |
| A6 | psycopg_pool package/module naming and `kwargs={"row_factory": dict_row}` | Code Examples | Verify in first task |
| A7 | All PyPI package names legitimate (slopcheck not run) | Package Audit | Low; names come from CLAUDE.md/official docs |
| A8 | No auto-promotion when capacity is raised (port v1 as-is) | Pattern 2 | Waitlist may stay stuck after raising capacity; flag for later |

## Open Questions (RESOLVED)

1. **Does `pending` hold resources?** Recommendation: no (A1). Planner should add a one-line confirm to the user or proceed with A1 and record it in SUMMARY and `dom-domain-model`.
   RESOLVED: A1 adopted; pending holds neither venue nor resources. Approve and reschedule re-run `check_resources` (plan 09-04).
2. **Where does `reschedule` live?** v1 `update_event` (C7) edits live events (pending/approved/open) without re-approval; re-run `check_resources` and rely on EXCLUDE for the venue. Clash on reschedule returns VENUE_CLASH.
   RESOLVED: reschedule lives in `update_event`, re-runs `check_resources` and relies on EXCLUDE for the venue (plan 09-04).
3. **Alerts/reports endpoints:** `alerts.ts` (`computeAlerts`) and `reports.ts` are pure plus SQL; port as `GET /api/reports/...`, `/api/reports/export.csv`, `/api/alerts` (or fold into dashboards). CONTEXT router list has no alerts router; place under `reports` or `approvals`. Planner decides; vocabulary says "Notifications", not "Alerts", for user-facing names.
   RESOLVED: alerts are served under the notifications router (user-facing "Notifications"); reports and CSV export under reports (plans 09-05, 09-06).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker + Compose | API-01, tests | yes | 29.9.2 / v5.6.1 | none needed |
| postgres:17-alpine image | db service | yes (pulled during research) | 17 | pin `postgres:16-alpine` if desired |
| uv | python env | yes | `~/.local/bin/uv` | pip/venv |
| Python | dev | 3.14.4 local; target 3.12 | | Dockerfile `python:3.12-slim`; `uv` can fetch 3.12 locally |
| psql client | debugging | yes | 18.6 | |
| Local Postgres server | | no (not running) | | use the compose `db`, expose 5432 (or 5433 to avoid clash) |
| ctx7 CLI | docs | no | | WebFetch of official docs used |

Pin local Python to 3.12 via `.python-version` / `requires-python = ">=3.12,<3.13"` so tests match the Docker image.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.1.1 + FastAPI TestClient (httpx) |
| Config file | `backend/pyproject.toml` (`[tool.pytest.ini_options]`, markers `concurrency`) - Wave 0 |
| Quick run | `cd backend && pytest -x -q -m "not concurrency"` |
| Full suite | `cd backend && ruff check && pytest` (needs `docker compose up -d db`) |

### conftest design
- Session fixture: create a throwaway DB `events_test` (or use the compose DB with a `TEST_DATABASE_URL`), run `migrate.py` once.
- Function fixture `conn`: `pool.connection()` with `conn.execute("BEGIN")`/rollback at teardown; nested `with conn.transaction()` in domain code becomes a savepoint.
- Fixture `seeded`: loads `seed.sql` once at session start into a **template**; for simplicity load seed inside the session setup and rely on per-test rollback.
- HTTP tests: override `get_conn` to yield the test `conn` so TestClient requests share the rolled-back transaction.
- Concurrency tests: separate committed connections, `TRUNCATE`/reseed afterwards.

### Phase Requirements to Test Map
| Req | Behavior | Type | Command | File |
|-----|----------|------|---------|------|
| API-01 | migrations apply to empty DB, seed loads, idempotent re-run | integration | `pytest tests/test_migrate.py` | Wave 0 |
| API-02 | approved overlap rejected; pending/pending allowed; adjacent allowed; approving second pending -> VENUE_CLASH; cancel frees venue; NULL-time active row rejected | unit/db | `pytest tests/test_clash.py` | Wave 0 |
| API-03 | capacity/waitlist, promotion + notification, last-seat race, state machine all edges, RESOURCE_SHORT on set/approve/reschedule | domain | `pytest tests/domain` | Wave 0 |
| API-04 | login ok/bad/unknown email, dummy-hash path, token stored hashed, expiry, logout, rate limit after N, rate limit persists after failure, demo login 404 when flag off | unit/http | `pytest tests/test_auth.py` | Wave 0 |
| API-05 | route-matrix: anonymous 401, wrong role 403 for every non-public route; student 403 on CSV | http | `pytest tests/test_authz.py` | Wave 0 |
| API-06 | ported suites green; `/openapi.json` covers every route | meta | `pytest tests/test_openapi.py` | Wave 0 |
| CSV | BOM, CRLF, quoting, injection guard | unit | `pytest tests/test_csv.py` | Wave 0 |

### Sampling Rate
- Per task: quick run for the touched module. Per wave: full suite. Phase gate: `ruff check && pytest` green plus `docker compose up` smoke (`curl /api/health`, demo login, list events) before the single phase commit.

### Wave 0 Gaps
- [ ] `backend/pyproject.toml`, `.python-version`, `.env.example`, `docker-compose.yml`, `Dockerfile`
- [ ] `tests/conftest.py` (migrate once, rollback `conn`, `client_for(role)`)
- [ ] All test files above (none exist for the backend)

## Security Domain

### Applicable ASVS Categories
| Category | Applies | Control |
|----------|---------|---------|
| V2 Authentication | yes | argon2 via pwdlib, constant-time unknown-email path, DB rate limit |
| V3 Session Management | yes | 256-bit random token, SHA-256 at rest, httpOnly, SameSite=Lax, 7-day expiry, delete on logout, cleanup |
| V4 Access Control | yes | Router role dependency + domain `require_actor_role` + ownership checks; route-matrix test; same 403 for missing and foreign resources (no existence leak, as v1 `manageable_event`) |
| V5 Input Validation | yes | Pydantic `extra="forbid"`, length limits (title 120), parameterized SQL only |
| V6 Cryptography | yes | `secrets`, `hashlib.sha256`, pwdlib; no hand-rolled crypto |
| V13 API | yes | OpenAPI complete; no CORS needed (first-party proxy) |

### Known Threats
| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| SQL injection | Tampering | `%s` params; constant SQL fragments for role filters |
| Credential stuffing / brute force | Spoofing | email-keyed rate limit, argon2 cost |
| User enumeration via timing | Info disclosure | dummy hash verify; identical error text |
| CSRF on cookie auth | Tampering | SameSite=Lax + JSON/non-GET mutations only; no state change on GET |
| CSV formula injection | Tampering | leading `'` guard (ported) |
| IDOR on events/tasks | Elevation | ownership checks in domain; 403 identical for missing |
| Demo login in prod | Elevation | `DEMO_LOGIN` default false, 404 when off |
| `/docs` exposure | Info disclosure | acceptable for demo; Phase 12 may disable via env |
| Double registration / overbooking | Integrity | UNIQUE + row lock |

## Sources

### Primary (HIGH)
- PyPI JSON API: versions for fastapi, psycopg, psycopg-pool, pwdlib, pytest, ruff, pydantic, uvicorn (2026-10-23)
- https://www.psycopg.org/psycopg3/docs/advanced/pool.html: pool args, `open=False`, commit/rollback on `connection()` exit
- https://fastapi.tiangolo.com/advanced/events/: lifespan pattern
- https://frankie567.github.io/pwdlib/: `PasswordHash.recommended()`, `hash`, `verify`, `pwdlib[argon2]`
- Live test: exclusion constraint on postgres:17-alpine (this session)
- Repo: `backend/migrations/*.sql`, `frontend/lib/domain/*.ts`, `frontend/lib/errors.ts`, `frontend/lib/csv.ts`, `backend/seed/seed.sql`

### Tertiary (LOW)
- Context7 CLI/MCP was unavailable in this environment (ctx7 not installed); official docs were fetched with WebFetch instead. `row_factory`/`dict_row` via pool kwargs and `verify_and_update` were not confirmed on the pages read.

## Metadata

**Confidence:** Standard stack HIGH (versions verified); architecture HIGH (direct port + tested constraint); pitfalls MEDIUM-HIGH; policy items (A1, A3) MEDIUM.
**Research date:** 2026-10-23. **Valid until:** about 30 days.
