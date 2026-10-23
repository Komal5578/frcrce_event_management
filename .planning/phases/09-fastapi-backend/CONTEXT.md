# Phase 9: FastAPI Backend (context brief)

Requirements: API-01..06. Port the v1 rules; don't invent new ones.

## Port map (v1 → backend/)
| v1 | v2 |
|---|---|
| `migrations/0001_schema.sql` | `migrations/0001_schema.sql`, Postgres dialect: uuid, timestamptz, boolean, no GLOB checks; `btree_gist` |
| `migrations/0002_guards.sql` | Clash triggers → `EXCLUDE USING gist (venue_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status IN ('approved','open','ongoing'))`. Capacity, promote, transition and alloc triggers → `app/domain` transactions (`SELECT … FOR UPDATE` on the event row) |
| `lib/domain/*.ts` (events, drafts, registrations, allocations, tasks, venues, catalog, views, people, notifications, admin, reports, alerts, rules) | `app/domain/*.py`, same names in snake_case, `Actor` first argument, `require_actor_role` |
| `lib/session.ts`, `auth.ts`, `password.ts` | `app/auth.py`: 32-byte token cookie (httpOnly, SameSite=Lax, 7 days), SHA-256 stored, argon2 (pwdlib), constant-time dummy check for unknown email, rate-limit table, expired-session cleanup |
| `lib/errors.ts` `humanize`/`guard` | One exception handler mapping VENUE_CLASH, EVENT_FULL, RESOURCE_SHORT, BAD_STATE and NOT_ALLOWED to the same human messages |
| `lib/csv.ts` | `app/csv.py`: BOM, RFC-4180, formula-injection guard |
| `tests/**` + `tests/helpers/sqlite.ts` | `tests/` pytest against a compose Postgres, one transaction per test with rollback |
| `seed/seed.sql` | `seed/seed.sql`, with dates relative to now() and **two overlapping pending requests** for the admin demo |

## Layout
`app/main.py`, `app/db.py`, `app/auth.py`, `app/schemas.py`, `app/domain/`, `app/routers/` (auth, events, registrations, tasks, venues, resources, approvals, reports, notifications incl. `unread-count`), `scripts/migrate.py`, `Dockerfile`, `docker-compose.yml` (root).

## New tests (beyond the port)
- Pending/pending overlap is allowed; approving the second one gives VENUE_CLASH.
- Approve re-checks resources and gives RESOURCE_SHORT.
- A student gets 403 on admin/coordinator routes, including CSV export.
- The rate limit kicks in after N failed sign-ins.

## Check context7 first
FastAPI, psycopg 3 pool, pwdlib/argon2.
