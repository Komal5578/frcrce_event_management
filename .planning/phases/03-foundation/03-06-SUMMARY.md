---
phase: 03-foundation
plan: 06
subsystem: infra
tags: [cloudflare, opennext, wrangler, d1]
requires: []
provides:
  - Cloudflare Workers build path (OpenNext adapter, wrangler.jsonc, D1 binding DB)
  - lib/db.ts getDb() single binding accessor
affects: [03-07, 03-08, 03-09, 03-10]
tech-stack:
  added: ["@opennextjs/cloudflare 1.20.12", "wrangler 4.151.3"]
  patterns: [binding read only in lib/db.ts, route guards only in layouts]
key-files:
  created: [wrangler.jsonc, open-next.config.ts, cloudflare-env.d.ts, lib/db.ts, .dev.vars.example]
  modified: [package.json, package-lock.json, next.config.ts, .gitignore, eslint.config.mjs, CLAUDE.md]
  deleted: [proxy.ts]
key-decisions:
  - "Single commit for the plan (CLAUDE.md: no per-task commits), including the Cloudflare-decision docs"
requirements-completed: [FOUND-01]
duration: 10min
completed: 2026-10-20
---

# Phase 3 Plan 06: Cloudflare Workers scaffold Summary

OpenNext + wrangler scaffold with typed D1 binding `DB`, `getDb()` accessor, scripts (preview, deploy, cf-typegen, db:*), and `proxy.ts` removed.

## Verification
- lint, typecheck, 45 tests: pass.
- `npm run build`: pass, routes /, /login, /admin, /coordinator, /student, /design listed.
- `npx opennextjs-cloudflare build`: pass, `.open-next/worker.js` produced.
- Supabase packages and lib/supabase left in place (03-09 removes them).

## Deviations from Plan
- Commit granularity: one plan-level commit instead of one per task (project rule in CLAUDE.md). Cloudflare-decision docs (CLAUDE.md, 03-RESEARCH.md, 03-06..10 PLAN.md, config.json) included.
- npm reported install scripts (esbuild, workerd, unrs-resolver postinstall) not run; builds worked regardless. `wrangler dev`/`preview` may need `npm install-scripts approve workerd` (untested here).

## Issues
- Not verified: Free-tier 10 ms CPU limit (T-03-06-03, measured in 03-10). `database_id` is a placeholder until 03-10.

## Self-Check: PASSED
