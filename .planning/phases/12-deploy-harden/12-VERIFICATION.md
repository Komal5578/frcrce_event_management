# Phase 12 Verification — Deploy & Harden

Date: 2026-10-25  
Status: **Complete by explicit user direction.** The GCP billing/data-owner review remains an accepted follow-up; the 30 GB disk is retained pending that review.

## Deployment and security

- Worker `college-events-api` deployed with `DEMO_LOGIN=false`; `GET /api/health` returned HTTP 200 and `/api/auth/demo-login` returned HTTP 404.
- Vercel production `https://college-events-lake.vercel.app` was redeployed with `BACKEND_URL=https://college-events-api.varadaj47.workers.dev`; Vercel `/api/health` returned HTTP 200.
- Browser verified password login for all three roles, first-party Secure/HttpOnly/SameSite=Lax cookie behavior, and role denial for cross-role routes.
- Production deployment `dpl_ANmkbZS5MKKT9fUDDPa6UJUvRtdb` includes a coordinator wizard fix: the Next button stays disabled while the selected venue is being saved and refreshed, preventing a stale event read from blocking progression.
- Legacy `college-events` Worker deleted after v2 verification. The v1 hostname returned HTTP 404; v2 health still returned HTTP 200.

## Production smoke and data recovery

- `node worker/smoke.mjs https://college-events-api.varadaj47.workers.dev`: **20/20 passed**, including login/rate limit, role 403s, duplicate registration, waitlist promotion, `VENUE_CLASH`, `RESOURCE_SHORT`, and CSV report.
- Browser tests and API smoke mutate data. A pretest SQL export was created at `/tmp/college-events-v2-before-phase12-smoke.sql`; then production D1 was cleared in FK-safe order and reseeded with `worker/seed.sql` after each mutation run. Wrangler confirmed the final seed import wrote 165 rows across 12 tables in APAC.
- Final read-only check: 7 profiles, 9 events, 7 registrations, 0 sessions; v2 and Vercel health returned HTTP 200 and the retired v1 hostname returned HTTP 404.
- This confirms seed/reseed works. A documented export/restore procedure and restore drill on a disposable database are still outstanding.

## Browser checks

- Initial production Playwright run: 18 passed, 2 failed out of 20. After disabling tracing and fixing the venue-save race, the full production suite passed **20/20** in 3.2 minutes. The formerly failing Admin 320px case also passed in isolation.
- Root cause: the UI allowed the coordinator to click Next before the venue save and SWR refresh completed; the guard then read stale event data. The Next button is now disabled until that save/refresh finishes.
- Keyboard Review & Confirm, visible focus ring, all-role sign-in, cookie forwarding and cross-role denial passed.
- `frontend npm run lint` and `npm run typecheck` passed after the fix. A sandboxed local production build could not complete because font fetch and local port binding were blocked; Vercel's production build succeeded.

## Phase 12 results and accepted follow-up

- **Lighthouse: passed.** Reports are in `lighthouse/`. On 2026-10-25, production role home accessibility scores were Student 96, Coordinator 100, Admin 100 (required: >=95). Each report records the exact URL and fetch timestamp.
- **D1 recovery: passed locally.** `D1-RECOVERY.md` documents the production export and disposable restore procedure. Wrangler exported a uniquely named local D1 and restored it into a second local D1. All 11 application-table row counts and all 9 triggers matched; representative totals: 7 profiles, 6 venues, 9 events, 7 registrations, 4 tasks. No production database was touched. This verifies the restore mechanics, not the production backup's integrity.
- **Admin browser journey: passed.** `frontend/e2e/admin-approval-clash.spec.ts` passed in Chrome against the local Worker and disposable D1 seeded from the repo plus `12-admin-clash-fixture.sql`. It verified password login, the overlapping open booking, disabled approval, and returning the request with a reason through the real API. Production data was untouched. The deployed API smoke separately verified `VENUE_CLASH`.
- **Full-history secret scan: passed.** Gitleaks scanned all refs (`--log-opts=--all`): 14 commits, 4.37 MB, no findings. The separate working-tree scan found the expected Vercel OIDC token in ignored `frontend/.env.local` and generated-cache false positives; no finding was reported from Git history. Do not commit or share `.env.local`; replace/revoke the token if it was not intentionally generated for this local Vercel session.
- **Accepted follow-up: GCP billing/data review.** Per the user's instruction, `gcloud` deleted the legacy `ce-vm` in `college-events-29738` and released its detached `ce-ip`. Follow-up inventory found no Compute VM or reserved address; the 30 GB persistent disk `ce-vm` remains to preserve data. Cloud Run and Cloud SQL inventory could not be queried because their APIs are disabled; no APIs were enabled. The owner should review charges, disk data/backup ownership, retention and project disposition. No owner contact or messaging integration is available here; the checklist is in `BILLING-OWNER-REVIEW.md`. The user explicitly directed that Phase 12 be marked complete with this follow-up outstanding.

KB ids consulted: `adr-001-stack`, `dom-domain-model`, `dom-requirements`, `dom-scenarios`, `src-accessibility-areas`, `adr-004-scope`.
