# Phase 09 Plan 01 Summary: Backend Scaffold & Postgres Schema

**Executed:** Wave 1, Plan 09-01
**Requirements covered:** API-01, API-02
**KB notes consulted:** `dom-domain-model`, `adr-001-stack`, `adr-004-scope`

## What Changed

1. **Scaffold & Dependencies (`backend/`):**
   - Configured `backend/pyproject.toml` with Python `>=3.12,<3.13`, pinned dependencies (`fastapi`, `uvicorn[standard]`, `psycopg[binary]`, `psycopg-pool`, `pydantic`, `pwdlib[argon2]`, and dev packages `pytest`, `httpx`, `ruff`).
   - Pinned `.python-version` to `3.12`.
   - Created `backend/.env.example` documenting all environment keys without secrets.
   - Created `docker-compose.yml` defining `db` (`postgres:17-alpine` on port 5433 with healthcheck) and `api`.
   - Created `backend/Dockerfile` using `python:3.12-slim` and `uv sync`.

2. **Database & Config Wiring:**
   - `backend/app/config.py`: Plain `os.environ` configuration reader with fallback parsing for `backend/.env`.
   - `backend/app/db.py`: Managed `psycopg_pool.ConnectionPool` with `dict_row` and lifespan context manager.
   - `backend/scripts/migrate.py`: Migration runner with transactional file execution, `schema_migrations` tracking, and `--seed` support with live Argon2 password hashing via `pwdlib`.

3. **v1 SQLite Preservation & Postgres Port:**
   - Preserved v1 SQLite SQL under `backend/migrations/v1-sqlite/` (`0001_schema.sql`, `0002_guards.sql`) and `backend/seed/v1-sqlite/` (`seed.sql`).
   - Updated `frontend/tests/helpers/sqlite.ts` and `frontend/tests/auth.test.ts` to reference the preserved v1 paths. All 260 v1 vitest tests pass unchanged.
   - Created Postgres schema `backend/migrations/0001_schema.sql` with UUID PKs (`gen_random_uuid()`), `timestamptz`, status CHECKs, time ordering, and `login_attempts`/`sessions` tables.
   - Created `backend/migrations/0002_constraints.sql` with `btree_gist` extension and the venue clash exclusion constraint `events_no_venue_clash EXCLUDE USING gist (venue_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status IN ('approved','open','ongoing'))`. Pending requests do not hold a venue per decision A1.
   - Created `backend/seed/seed.sql` with dates relative to `now()`, including two overlapping pending events at Seminar Hall A (allowed) and non-overlapping approved/open/ongoing events.

## Library & Pool Verification Findings

- `psycopg_pool.ConnectionPool`: Live import succeeds as `psycopg_pool`. Connection factory with `kwargs={"row_factory": dict_row}` returns dictionary-accessible rows.
- `pwdlib`: `PasswordHash.recommended()` is verified to have `verify_and_update` (`has verify_and_update: True`), uses Argon2id (`$argon2id$v=19$m=65536,t=3,p=4`), and successfully hashes and verifies passwords.

## How to Verify

1. Start postgres database:
   ```bash
   docker compose up -d --wait db
   ```
2. Run migrations and seed:
   ```bash
   cd backend && uv run python scripts/migrate.py --seed
   ```
3. Run again to verify idempotency (prints skipping applied migrations and skipping demo seed):
   ```bash
   cd backend && uv run python scripts/migrate.py
   ```
4. Run v1 vitest test suite:
   ```bash
   cd frontend && npx vitest run
   ```
   All 260 tests pass.

## Open Questions

None. All criteria met and verified.
