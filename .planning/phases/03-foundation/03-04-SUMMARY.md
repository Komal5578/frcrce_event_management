---
phase: 03-foundation
plan: 04
subsystem: auth
tags: [supabase-ssr, proxy, getClaims, role-guard, demo-login]
requires: [03-01, 03-02, 03-03]
provides:
  - lib/supabase/{client,server,proxy}.ts and root proxy.ts (Next 16, getClaims session refresh)
  - lib/auth.ts (parseRole, homeFor, demoEmail, isDemoEnabled, getCurrentProfile, requireRole)
  - /login with one-click demo buttons, credentials form, signIn/demoLogin/signOut server actions
  - Guarded stub homes /coordinator, /student, /admin
affects: [03-05, phase-04]
tech-stack:
  added: []
  patterns: [server-side demo gate before DEMO_PASSWORD read, fixed-path redirects only, layout-level requireRole]
key-files:
  created: [lib/supabase/client.ts, lib/supabase/server.ts, lib/supabase/proxy.ts, proxy.ts, lib/auth.ts, app/login/actions.ts, app/login/page.tsx, app/login/login-form.tsx, "app/(coordinator)/layout.tsx", "app/(coordinator)/coordinator/page.tsx", "app/(student)/layout.tsx", "app/(student)/student/page.tsx", "app/(admin)/layout.tsx", "app/(admin)/admin/page.tsx", tests/auth.test.ts]
  modified: [app/page.tsx]
key-decisions:
  - "Redirect after login is homeFor(profile.role) only; no next param is read anywhere"
  - "Network failure detected via thrown error or AuthRetryableFetchError"
requirements-completed: [FOUND-06, FOUND-07]
duration: ~15min
completed: 2026-10-20
---

# Phase 3 Plan 04: Auth, login and guarded role homes Summary

Supabase SSR auth with a Next 16 `proxy.ts` (getClaims, cache headers via `setAll(cookiesToSet, headers)`, checked against the installed @supabase/ssr 0.12.7 types), a UI-SPEC-compliant login screen, and role-guarded stub homes (`adr-002-roles`, `adr-004-scope`, `src-hmi-principles`).

## Tasks
1. Clients, proxy, lib/auth.ts, tests/auth.test.ts: 14872b4
2. Login page, form, actions, root redirect: 665a919
3. Guarded role groups and stubs: ebe39ed

## Verification (run)
- `npm run lint`, `typecheck`, `npm test` (45 tests incl. 6 new auth tests), `npm run build` exit 0. Build lists /login, /coordinator, /student, /admin.
- No `middleware.ts`; no `getSession` or `ANON_KEY` in lib/proxy/app; DEMO_PASSWORD appears only in app/login/actions.ts; nothing matching DEMO_PASSWORD or the password literal in `.next/static`.
- Production server with placeholder env: GET /login 200 with the three "Continue as ..." buttons when NEXT_PUBLIC_DEMO_LOGIN=true and none when false; unauthenticated GET /, /coordinator, /student, /admin each 307 to /login.

## NOT verified (needs a real Supabase project)
- Any actual sign-in (demo or credentials), redirect to role home, wrong-role redirect, signed-in visit to /login, sign out, the profile lookup against real RLS, and error-message display/focus in a browser. No browser run was done at all (tab order, focus on Alert, 44px targets unchecked in a browser). This is for the 03-05 human checkpoint.
- The `DEMO_PASSWORD` unset message and demo-gate-off server refusal are coded but not executed.

## Deviations from Plan
- Stub pages also call `requireRole` (to obtain the user name) in addition to the layout guard. Layout guard remains.
- Demo buttons share one form using `name="role" value=...` on each submit button instead of three forms with hidden fields; same whitelist on the server.
- Error Alert title is "Sign in did not work" (UI-SPEC gives body copy only).
- tests/auth.test.ts mocks `next/navigation` and the server client so lib/auth.ts imports in node.

## Known Stubs
Role home pages are intentional stubs (info Alert "Your {role} screens are not built yet"); Phase 4 owners overwrite them, keeping the requireRole guard.

## Threat Flags
None beyond the plan's register.

## Self-Check: PASSED
