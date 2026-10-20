---
phase: 03-foundation
plan: 02
subsystem: database
tags: [postgres, rls, pglite, supabase, exclusion-constraint]
requires: [03-01]
provides:
  - supabase/migrations/0001_schema.sql (9 tables, bookings view, events_no_venue_clash, registrations_one_per_user)
  - supabase/migrations/0002_rls_functions.sql (RLS, grants, events_guard, Phase 4 integrity functions)
  - supabase/seed.sql (7 demo users, venues, resources, templates, events in every stored status)
  - tests/helpers/pg.ts (PGlite + auth shim, asUser, mkUser) and 30 passing DB tests
affects: [03-03, 03-04, 03-05, phase-04]
tech-stack:
  added: []
  patterns: [definer helpers in policies (no recursion), half-open tstzrange exclusion, role-switched RLS tests]
key-files:
  created: [supabase/migrations/0001_schema.sql, supabase/migrations/0002_rls_functions.sql, supabase/seed.sql, supabase/config.toml, tests/helpers/pg.ts, tests/db.test.ts, tests/seed.test.ts]
key-decisions:
  - "Exclusion constraint lives on events; bookings is a security_invoker view over active events (adr/assumption A1)"
  - "free_venues and resource_available are SECURITY DEFINER, not invoker as the plan said"
  - "Demo password literal in seed.sql: demo-password-2026 (DEMO_PASSWORD must equal it)"
requirements-completed: [FOUND-03, FOUND-04, FOUND-05]
duration: ~35min
completed: 2026-10-20
---

# Phase 3 Plan 02: Database, RLS, functions and seed Summary

Complete frozen database for Phases 3-4, proven in PGlite with no Docker (`dom-domain-model`, `dom-hmi-problems` #2, `dom-requirements` X5, C1-C7, S1-S5, A1-A5).

## Tasks
1. Schema + clash and double-registration constraints + PGlite helper: e18724f
2. Helpers, RLS, guard triggers, integrity functions: 6c7456b
3. Seed, config.toml, seed test (+ strict waitlist ordering fix): b8b5562

## Verification
`npx vitest run tests/db.test.ts tests/seed.test.ts`: 30/30 pass (run 3 times, stable). `npm run lint` and `npm run typecheck` clean. Acceptance greps: 9 `enable row level security`, 14 non-comment `security definer`, 18 `set search_path`, 0 `insert into` in 0001, 7 `demo.college.test` in seed, 0 `service_role` in seed. All RLS assertions run as role `authenticated` via `asUser`.

Not done here (by design): applying to a real Supabase project, local `supabase db reset`, and a real demo login. That is plan 03-05 and needs the human. Seed login rows are format-checked in PGlite only (hash verifies with `crypt`, token columns are `''`, identity row exists); Pitfall 9 stays unproven against GoTrue until a human logs in.

## Deviations from Plan

**1. [Rule 1 - Bug] free_venues and resource_available are SECURITY DEFINER** (plan: invoker for free_venues, unspecified for resource_available). Under invoker, RLS hides other coordinators' pending/approved events, so a taken venue or resource would look free. They return venues / one integer only. Commit 6c7456b.

**2. [Rule 1 - Bug] Waitlist order uses `clock_timestamp()`** for registration `created_at`. `now()` is the transaction start and PGlite's clock produced ties that made promotion order flaky. Commit b8b5562.

**3. [Rule 3] Test fixtures** use explicit `+00` times and an `auth.uid()` that tolerates an empty claim string (nullif), because a TZ-dependent date literal and an empty `request.jwt.claims` broke early runs. Test-only.

**4. Plan said "every one of the nine event statuses".** The table has 8 stored statuses; the ninth vocabulary word (Full) is derived from registration counts. The seed test checks the 8 stored statuses and the full event (capacity 2, 2 confirmed, 1 waitlisted) separately.

## Notes for later plans
- `submit_event` is invoker (relies on events update policy plus guard trigger); all other Phase 4 functions are definer with `set search_path = public`.
- pgcrypto loads in PGlite, so the seed uses `crypt(..., gen_salt('bf'))` (A4 resolved).
- Hosted Supabase: seed.sql is only auto-run by the local CLI; paste it once in the SQL editor. `supabase/config.toml` was hand-written (project_id, db major 17, seed path).
- `bookings` for the Admin calendar is a view; a coordinator sees only events RLS lets them see, admin sees all.
- No Realtime, email or storage (`adr-004-scope`).

## Known Stubs
None.

## Threat Flags
None beyond the plan's threat model (T-03-04..T-03-10 mitigated and tested; T-03-05 accepted).

## Self-Check: PASSED
Files and commits e18724f, 6c7456b, b8b5562 exist.
