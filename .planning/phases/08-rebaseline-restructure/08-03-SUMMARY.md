---
phase: 08-rebaseline-restructure
plan: 03
requirements: [REBASE-04]
---

# Phase 8 Plan 03: frontend/backend split Summary

Repo split with `git mv` into `/frontend` (Next app, configs, tests, cloudflare-env.d.ts, .env.example) and `/backend` (migrations, seed, scripts/hash-password.mjs). Nothing committed.

## Results
- `frontend`: `npx tsc --noEmit` clean; `npx vitest run` 33 files, 260/260 pass; `npx eslint .` 0 errors, 3 pre-existing unused-var warnings in tests.
- node_modules moved (not reinstalled) to `frontend/`; also moved untracked `next-env.d.ts`.
- Test paths: `frontend/tests/helpers/sqlite.ts` and `frontend/tests/auth.test.ts` now resolve `../backend` via `import.meta.url`.
- @opennextjs/cloudflare, next.config.ts, lib/db.ts and cloudflare-env.d.ts kept intentionally until Phase 10/11.

## Deviations
- **eslint.config.mjs not edited:** the plan asked to drop stale `supabase/`, `.open-next/`, `.wrangler/` from globalIgnores, but the config-protection hook blocked the edit. I did not bypass it. The stale ignores are harmless; remove manually or in 08-04 if wanted.
- No public/ dir existed (untracked/absent), skipped.

## Left at repo root for 08-04 (not in this plan)
`open-next.config.ts`, `wrangler.jsonc`, `.dev.vars.example`, `.next`, `.open-next`, `.wrangler`, `tsconfig.tsbuildinfo` (root copies). Note `frontend/tsconfig.json` no longer sees root `open-next.config.ts`; fine.

## Self-Check: PASSED
Layout verified by ls; tsc/vitest run as above.
