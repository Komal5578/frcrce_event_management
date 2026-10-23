---
phase: 12-deploy-harden
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-23
---

# Phase 12 — Validation Strategy

## Execution Gate

Phase 11 must be verified before any Phase 12 task starts. The first task in `12-01-PLAN.md` blocks until `.planning/STATE.md` records Phase 11 complete and `.planning/phases/11-role-screens/11-VERIFICATION.md` confirms all three role browser gates. AWS account eligibility, region, S3 bucket, key path, retention, and provisioning approval are then confirmed before infrastructure work.

## Automated and Live Checks

| Requirement | Method | Pass condition | Evidence |
|---|---|---|---|
| DEPLOY-01 | Before security review: `cd backend && docker compose -f compose.yaml config --quiet`; `bash -n backend/scripts/deploy.sh && bash -n backend/scripts/backup.sh && bash -n backend/scripts/self-check-deploy.sh`; run `backend/scripts/self-check-deploy.sh`; provision and inspect EC2 host. After DEP-02 passes in Plan 02, deploy backend, check public `curl https://<host>/health`, inspect security group, run scheduled backup and restore to disposable DB | Compose and config self-checks pass; only 80/443 public and SSH limited to user's IP; after security review HTTPS health succeeds and nightly object arrives in S3 and restores | `12-01-SUMMARY.md`, `12-03-SUMMARY.md`, backup/restore command output (no secrets) |
| DEPLOY-02 | Vercel production deployment from `/frontend`; browser login, authenticated API call, sign-out | App loads and API rewrite succeeds through Vercel origin; session is Secure/HttpOnly and first-party | `12-03-SUMMARY.md`, browser/network evidence |
| DEPLOY-03 | `cd frontend && npx --no-install playwright test --config=playwright.config.ts --project=deployed` | TT-S1, TT-C1 and TT-A1 pass using isolated accounts and disposable data | `12-VERIFICATION.md`, Playwright report |
| DEP-02 | Approved scanner over all refs/history; review every router-to-domain authorization path; request protected APIs as a student | No unresolved committed secret exposure; student receives 403 on coordinator/admin routes | `SECURITY-REVIEW.md`, backend test output |
| Data integrity | Production smoke attempts at duplicate registration and overlapping approved booking, with isolated records | DB/API rejects both attempts and test records are cleaned up | `12-VERIFICATION.md` |
| Accessibility | For each role home run `cd frontend && npx --no-install lighthouse "$ROLE_URL" --only-categories=accessibility --output=json --output-path="../.planning/phases/12-deploy-harden/artifacts/lighthouse-$ROLE.json" --chrome-flags="--headless"` | All three actual accessibility scores are >=95 | JSON reports under `.planning/phases/12-deploy-harden/artifacts/` and scores/URLs/timestamps in `12-VERIFICATION.md` |
| Legacy v1 | `curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://college-events.varadaj47.workers.dev` after explicit remove/redirect choice | Old v1 demo-login app is unavailable or redirects to verified v2 URL | `12-VERIFICATION.md` |

No production smoke check may mutate real user records. Credentials come from the user's secret manager/environment and never from committed files or planning output. If any check is blocked or fails, record the actual result and do not mark the phase complete.

## Coverage

- `DEPLOY-01`: Plan 01, Compose/Caddy and EC2 preparation; Plan 03, reviewed backend deployment, scheduled S3 backup and restore.
- `DEPLOY-02`: Plan 03, Vercel deployment and authenticated rewrite; Plan 05 retires the old public v1 URL.
- `DEPLOY-03`: Plan 04, deployed Playwright TT-S1, TT-C1 and TT-A1.
- `DEP-02`: Plan 02, role authorization review and full-history secret scan.

## Plan Source Audit

| Source | In-scope items | Coverage |
|---|---|---|
| Roadmap goal | Shareable HTTPS deployment, security review | Plans 01–05 |
| Requirements | DEPLOY-01, DEPLOY-02, DEPLOY-03, DEP-02 | Plans 01–05 |
| Research | Compose readiness, Caddy HTTPS, instance profile, secret scan, authz review, Vercel rewrite/cookies, Playwright, Lighthouse, restore test | Plans 01–05 |
| Context decisions | EC2 t3.micro, sslip.io, SSH from user's IP, S3 nightly `pg_dump`, pinned deploy after security review, explicit `DEMO_LOGIN`, Vercel root `/frontend`, three flow tests, 95 Lighthouse scores, legacy v1 disposition | Plans 01–05 and blocking checkpoints |

Scope fence: no email/SMS, payments, native apps, QR check-in, calendar sync, multi-tenancy or vector search (`adr-004-scope`).

KB ids consulted: `adr-001-stack`, `adr-004-scope`, `dom-domain-model`, `dom-requirements`, `dom-scenarios`, `src-accessibility-areas`.
