---
phase: 03-foundation
plan: 07
subsystem: database
tags: [d1, sqlite, triggers, pbkdf2, node-sqlite]
requires: [03-06]
provides:
  - migrations/0001_schema.sql and 0002_guards.sql (D1 schema, clash/capacity/allocation/transition/promotion triggers)
  - seed/seed.sql (7 demo users with PBKDF2 hashes, same demo events)
  - scripts/hash-password.mjs
  - tests/helpers/sqlite.ts (freshDb, codeOf, mkUser, d1Shim)
affects: [03-08, 03-09, 03-10]
key-files:
  created: [migrations/0001_schema.sql, migrations/0002_guards.sql, seed/seed.sql, scripts/hash-password.mjs, tests/helpers/sqlite.ts]
  modified: [tests/db.test.ts, tests/seed.test.ts, tests/auth.test.ts]
  deleted: [supabase/ (all), tests/helpers/pg.ts]
key-decisions:
  - "Transition graph in DB is the union of coordinator and admin moves: draft/returned->pending, pending->approved/returned, approved->open, open->ongoing, ongoing->completed, any non-terminal->cancelled. Actor rules stay in lib/domain (03-08)."
  - "notifications.id has a randomblob default so the promotion trigger can insert a row; all other ids are app-supplied."
requirements-completed: [FOUND-03, FOUND-04, FOUND-05]
completed: 2026-10-20
---

# Phase 3 Plan 07: D1 schema, guards and seed Summary

Database layer ported to D1/SQLite: clashes, double registration, overbooking, over-allocation and impossible status moves are refused by the database itself, proven by node:sqlite tests and a real local-D1 (workerd) smoke.

## Verification
- RED recorded: `tests/db.test.ts` failed 11/11 before the migrations existed (no tables); after, 11/11 pass in about 130 ms.
- `npx vitest run tests/db.test.ts tests/seed.test.ts`: 16 pass. Full `npm run lint`, `npm run typecheck`, `npm test` (31 tests): pass. `npm run build` was not re-run (no app code changed).
- `npm run db:reset` exits 0 on local workerd D1. `select count(*) from events` returns 9. A clash INSERT via `wrangler d1 execute --local` fails with `VENUE_CLASH` (SQLITE_CONSTRAINT_TRIGGER). Local only; remote D1 trigger behaviour (A1) stays for the 03-10 spike.
- Acceptance greps: `VENUE_CLASH` appears 3 times in 0002_guards.sql (2 triggers plus a comment); `begin transaction` count 0; 7 `pbkdf2-sha256$` hashes in the seed; `supabase/` and `tests/helpers/pg.ts` removed; no `pglite` reference in tests.

## Deviations from Plan
- Commit granularity: one plan-level commit (CLAUDE.md rule), not per task.
- The cancelled-to-open "reopen into a taken slot" test accepts `VENUE_CLASH` or `BAD_STATE`, because the transition trigger now refuses cancelled->open first. The clash trigger independently covers that UPDATE path (also tested via time and venue moves).
- Seed was generated with a throwaway script (not committed); the committed artifact is seed/seed.sql with 7 distinct salts.
- `@electric-sql/pglite` package left installed per plan (03-09 removes it).

## Issues
- Remote D1 behaviour of triggers (A1), write serialisation (A3) and the PBKDF2 10 ms CPU question (A4) are not verified here.
- d1Shim is test-only and minimal (prepare/bind/run/first/all/batch).

## Self-Check: PASSED
