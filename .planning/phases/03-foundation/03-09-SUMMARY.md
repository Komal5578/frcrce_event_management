---
phase: 03-foundation
plan: 09
subsystem: auth
tags: [d1, sessions, pbkdf2, webcrypto, demo-login]
requires: [03-07]
provides:
  - lib/password.ts (hashPassword, verifyPassword)
  - lib/session.ts (createSession, readSession, deleteSession, hashToken, SESSION_COOKIE_OPTIONS)
  - lib/auth.ts on D1 sessions (findLoginUser added; all earlier exports kept)
  - app/login/actions.ts on D1 (signIn, demoLogin, signOut)
affects: [03-10]
key-files:
  created: [lib/password.ts, lib/session.ts]
  modified: [lib/auth.ts, lib/db.ts, app/login/actions.ts, tests/auth.test.ts, .env.example, package.json, package-lock.json]
  deleted: [lib/supabase/client.ts, lib/supabase/proxy.ts, lib/supabase/server.ts]
key-decisions:
  - "Sessions: 256-bit token in an httpOnly SameSite=Lax cookie (Secure in production, 7 days); DB keeps only the SHA-256 (base64url)."
  - "PBKDF2-SHA256 at 100000 iterations (below OWASP 600000) because of the Workers Free 10 ms CPU limit; iterations are read from the stored string. Demo login hashes nothing."
  - "verifyPassword requires a 32-byte hash: PBKDF2 output is prefix-consistent, so a truncated stored hash would otherwise verify."
requirements-completed: [FOUND-06, FOUND-07]
completed: 2026-10-20
---

# Phase 3 Plan 09: D1 auth, Supabase removed Summary

Sign-in and one-click demo now create D1-backed sessions with WebCrypto PBKDF2; all Supabase code and packages are gone. Unit-tested only; live proof is the 03-10 checkpoint.

## Verification
- RED recorded: the new tests/auth.test.ts failed to load before lib/password.ts and lib/session.ts existed.
- Full gate green: `npm run lint`, `npm run typecheck`, `npm test` (8 files, 73 tests, including 03-08's), `npm run build`.
- `grep -rli supabase app lib components tests package.json` lists only tests/auth.test.ts (the absence assertion). `grep -rn NEXT_PUBLIC_DEMO app components lib` is empty. Layouts, login-form.tsx and login/page.tsx are unmodified.

## Deviations from Plan
- **[Rule 1 - Bug]** A truncated stored hash verified as true (PBKDF2 prefix property). Fixed by requiring exactly 32 bytes; the malformed-hash test caught it.
- **[Rule 3 - Blocking]** 03-08's tests/db-boundary.test.ts allows `getDb` only in lib/db.ts, lib/domain, session.ts and auth.ts, and `getCloudflareContext` only in lib/db.ts. I added `getEnv()` to lib/db.ts (a file outside this plan's list) and moved the login profile lookup (`findLoginUser`) into lib/auth.ts so app/ never touches the binding.
- login/page.tsx needed no change: `isDemoEnabled()` now defaults to the runtime env.
- Commit granularity: one plan-level commit (CLAUDE.md rule).

## Issues
- The npm output warns that workerd's postinstall script is not approved. The build and tests were unaffected, but check `wrangler dev` in 03-10.
- No rate limiting on password sign-in (T-03-09-07 accepted). PBKDF2 CPU on Workers Free (A4) and remote D1 behaviour are unmeasured until 03-10.

## Self-Check: PASSED
