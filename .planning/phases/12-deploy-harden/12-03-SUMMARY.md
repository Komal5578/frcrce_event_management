# Phase 12 Plan 03 Summary: Worker to Vercel Cutover

## What changed

- Deployed the Worker with `DEMO_LOGIN=false`; `/api/auth/demo-login` returns 404 while password login works.
- Set Vercel production `BACKEND_URL` to the Worker and deployed the frontend. Current production alias: `https://college-events-lake.vercel.app`.
- Fixed the coordinator venue-selection race by disabling Next while the venue save and SWR refresh are pending.
- Verified Worker and Vercel health, role sign-in/sign-out, first-party session cookie flags, and cross-role route denial.

## Requirements covered

- DEPLOY-01: production Vercel application routes API calls to Cloudflare Worker/D1.
- DEPLOY-02: public demo role login is disabled and role authorization remains enforced.

## Verification

- Worker health: HTTP 200; demo login: HTTP 404.
- Vercel `/api/health`: HTTP 200.
- Deployed `worker/smoke.mjs`: 20/20 passed.
- Deployed Playwright suite: 20/20 passed after the coordinator wizard fix.
- `frontend` lint and typecheck passed. Vercel production build reached READY.
- Production D1 was reseeded from `worker/seed.sql` after mutating checks.

## Open questions

- Lighthouse reports and D1 restore drill remain part of Phase 12 and block phase completion.
- Full browser Admin approval/clash journey remains to be run; API integrity smoke covers the clash response.
- GCP project disposition requires the club billing owner's cost/data review.

KB ids consulted: `adr-001-stack`, `dom-domain-model`, `dom-requirements`, `dom-scenarios`, `src-accessibility-areas`.
