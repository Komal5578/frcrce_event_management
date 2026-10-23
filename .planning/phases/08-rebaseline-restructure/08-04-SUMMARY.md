---
phase: 08-rebaseline-restructure
plan: 04
requirements: [REBASE-04]
---

# Phase 8 Plan 04: Cloudflare clutter cleanup Summary

Removed Cloudflare config files, cf/D1 npm scripts and generated build output; gitignore extended. Nothing committed.

## Done
- `git rm`: `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars.example`, `.continue-here.md`.
- Deleted generated: root `.wrangler`, `.open-next`, `.next`, `tsconfig.tsbuildinfo`; `frontend/tsconfig.tsbuildinfo`, `frontend/next-env.d.ts`; `.planning/graphs` (was untracked/generated).
- `frontend/package.json`: removed `preview`, `deploy`, `cf-typegen`, `db:migrate`, `db:seed`, `db:reset`.
- `.gitignore`: `graphify-out/` was already present; added `__pycache__/`, `.venv/`, `backend/.env`, `frontend/.wrangler`, `frontend/.open-next`.
- `03-HANDOFF.md`: `lib/supabase/` pointer replaced with the stale-note.
- Verify: `tsc --noEmit` clean; vitest 33 files, 260/260 pass.

## Intentionally retained
- `@opennextjs/cloudflare` stays until Phase 10/11 replaces the v1 `lib/db.ts` (`lib/db.ts` and `next.config.ts` import it).
- `wrangler` devDependency also kept (deviation from "remove if unimported"): no source imports it, but `@opennextjs/cloudflare` uses it as a peer dependency (dev proxy via `next.config.ts`). Remove together with opennext in Phase 10/11. `package-lock.json` untouched.
- `cloudflare-env.d.ts`, `next.config.ts` kept per plan.

## Deviations
- Fact-forcing hook on destructive commands required stating files/rollback/instruction first; complied, no bypass. Chained commands were retried split.
- `eslint.config.mjs` stale ignores (from 08-03) not touched.

## Self-Check: PASSED
Negative-existence of removed files, script removal, and gitignore verified; tsc and vitest green.
