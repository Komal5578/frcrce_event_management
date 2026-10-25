# Phase 12: Deploy & Harden — Cloudflare Worker + D1

Requirements: DEPLOY-01..03, DEP-02. The target architecture is Cloudflare Worker API + D1 (`college-events-v2`, APAC) and Next.js on Vercel. This supersedes the AWS EC2/FastAPI/Postgres deployment assumptions in the original 12-01..12-03 plans. Do not provision AWS resources or deploy `/backend` as the active API.

## Current state (verified 2026-10-25)

- Worker API `https://college-events-api.varadaj47.workers.dev` is deployed and bound to D1 `college-events-v2` in APAC.
- Health and password login passed against the deployed Worker; demo login is disabled (`DEMO_LOGIN=false`).
- `worker/smoke.mjs https://college-events-api.varadaj47.workers.dev` passed all 20 production checks on 2026-10-25. D1 was cleared and reseeded with `worker/seed.sql` afterwards.
- `https://college-events-lake.vercel.app` is deployed with production `BACKEND_URL` set to the Worker. The full production browser suite passed 20/20 after fixing a coordinator venue-save race. Cookie/session, role guard, keyboard and responsive structure checks passed.
- The old `college-events` Worker was deleted after v2 smoke; the v1 hostname returned HTTP 404 and the v2 health endpoint returned HTTP 200 after deletion.
- GCP VM/project may be idle after cutover; the billing/data-owner review is still pending. Do not shut down or delete resources before that review.
- FastAPI `/backend` and root GCP/Compose deployment files are unused but retained until cutover verification and documentation are complete.

## Execution plan

1. Deployment, Vercel routing, cookie/session and demo-login disablement are complete and verified.
2. Production API smoke passed 20/20. The remote database was reset and reseeded after the run; a pre-test SQL export exists in `/tmp`.
3. Browser suite passed 20/20. The Admin 320px artifact error was trace collection only; rerun passed with tracing disabled. The coordinator venue-save race was fixed and verified in production.
4. Lighthouse passed (96/100/100); D1 export/restore is documented and verified on two disposable local D1 databases; the Admin clash/return browser journey passed against a local Worker and D1; Gitleaks full-history scan found no leaks.
5. Obtain the club billing owner's GCP cost and data/backup ownership review before any VM/project shutdown. Keep unused FastAPI/GCP files until recovery/rollback value is reviewed.
6. Record actual test, backup, accessibility, legacy-retirement and cost-review evidence; keep Phase 12 in progress until its remaining criteria pass.

## Verification

- The Worker is deployed with demo login disabled and password sign-in still works.
- Vercel serves the frontend with `BACKEND_URL` targeting the Worker; role flows work through the first-party rewrite and session cookie.
- Deployed smoke verifies wrong-role 403s, duplicate registration, waitlist promotion, `VENUE_CLASH`, and `RESOURCE_SHORT` without damaging live event data.
- Recovery/backup procedure for D1 is documented and restore is verified on a disposable target.
- Lighthouse accessibility score is at least 95 for Student, Coordinator and Admin home pages.
- Old v1 public demo login is unavailable; GCP resources are retained or retired based on billing-owner review. This review remains open.

KB ids: `adr-001-stack`, `dom-domain-model`, `dom-requirements`, `dom-scenarios`, `src-accessibility-areas`, `adr-004-scope`.
