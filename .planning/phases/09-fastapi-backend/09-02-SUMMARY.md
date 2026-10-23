# Phase 09 Plan 02 Summary: Error Layer, Actor, Test Harness & DB Constraints

**Executed:** Wave 2, Plan 09-02
**Requirements covered:** API-01, API-02
**KB notes consulted:** `dom-domain-model`, `adr-001-stack`

## What Changed

1. **Error Layer (`backend/app/errors.py`):**
   - Implemented `DomainError(code, message)` with verbatim v1 messages for `VENUE_CLASH`, `ALREADY_REGISTERED`, `NOT_ALLOWED`, `INVALID_INPUT`, `RESOURCE_SHORT`, `EVENT_FULL`, `BAD_STATE`, `UNAUTHENTICATED`, `RATE_LIMITED`, `INTERNAL`.
   - Defined `STATUS` code map (401, 403, 409, 422, 429, 500).
   - Implemented `translate(e: psycopg.Error)` mapping `ExclusionViolation`, `UniqueViolation`, `CheckViolation`, and foreign key violations based on constraint names rather than message text.
   - Implemented `guarded(conn)` context manager running inside `conn.transaction()` savepoints, translating DB exceptions and keeping the shared connection usable after a violation.

2. **Actor & Domain Rules (`backend/app/domain/actor.py`):**
   - Defined frozen dataclass `Actor(id, role, name, email)` and `require_actor_role(actor, *roles)`.
   - Defined role-specific constant SQL `VISIBLE` fragments and `visible_where(actor)` helper.

3. **Test Harness (`backend/tests/conftest.py`):**
   - Session-scoped database setup applying migrations to `app_test`.
   - Function-scoped `conn` fixture with automatic rollback per test.
   - Test data factories: `make_user`, `make_venue`, `make_resource`, `make_event`, and `actor_for`.
   - `seeded` fixture loading demo data into a transaction.

4. **DB & Constraint Tests:**
   - `backend/tests/test_migrate.py`: Tested migration idempotency and demo seed loading with Argon2 password verification.
   - `backend/tests/test_clash.py`: Verified `events_no_venue_clash` exclusion constraint:
     - Rejects overlapping approved/open/ongoing events at the same venue (Postgres code 23P01).
     - Allows adjacent `[)` intervals.
     - Allows overlapping pending events (per Decision A1).
     - Rejects updating a second pending event to approved, catching it with `guarded()` as `VENUE_CLASH` and leaving the connection usable.
     - Confirms cancelling an event frees the venue slot.
     - Confirms duplicate registrations violate UNIQUE constraint and translate to `ALREADY_REGISTERED`.
   - `backend/tests/test_db.py`: Verified schema CHECK constraints, foreign key cascades, and seeded database structure.

## Ported vs Dropped Test Cases

- **Ported from `db.test.ts` (7 core DB behaviors):**
  - Clash rejection on insert/update.
  - Back-to-back adjacent time intervals allowed.
  - Inactive/cancelled statuses do not block.
  - Time order CHECK (`ends_at > starts_at`).
  - Draft autosave CHECK (`events_complete_unless_draft`).
  - Duplicate registration rejection.
  - Cancelling frees venue.
- **Ported from `seed.test.ts` (5 seed behaviors):**
  - Role counts (1 admin, 2 coordinators, 4 students, 1 organizer).
  - Password verification (updated to Argon2).
  - Distinct statuses coverage.
  - Overlapping pending events present.
  - Zero clashes among approved/open/ongoing events.
- **Dropped (SQLite-specific / D1 AST checks):**
  - GLOB ISO timestamp checks dropped (Postgres enforces native `timestamptz`).
  - `db-boundary.test.ts` (4 tests checking Cloudflare Worker context and D1 AST imports in Next.js frontend).

## How to Verify

```bash
cd backend && uv run ruff check && uv run pytest -x -q tests/test_migrate.py tests/test_clash.py tests/test_db.py
```
All 12 tests pass.
