---
phase: 12-deploy-harden
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-24
---

# Phase 12 — Validation Strategy

## Execution Gate

Phase 11 is already verified. Phase 12 uses Cloudflare Worker + D1 and Vercel; the former AWS/EC2 validation steps are superseded. The live API and local smoke outcomes below are user-reported, not independently verified in this session.

## Automated and Live Checks

| Requirement | Method | Pass condition | Evidence |
|---|---|---|---|
| DEPLOY-01 | Check \`curl -fsS https://college-events-api.varadaj47.workers.dev/api/health\`; verify password login; inspect Wrangler binding/migrations; document D1 backup and restore/reseed on a disposable DB | Worker health/login work, D1 binding points to \`college-events-v2\` in APAC, and recovery can be executed without overwriting the live database | User-provided deployment details; \`12-VERIFICATION.md\`; \`D1-RECOVERY.md\`; local Wrangler export/import comparison |
| DEPLOY-02 | Configure Vercel production \`BACKEND_URL=https://college-events-api.varadaj47.workers.dev\`, deploy from \`/frontend\`, then browser login/API/logout | Vercel routes \`/api/*\` through the Worker; session is Secure, HttpOnly, SameSite=Lax and remains first-party | \`12-VERIFICATION.md\`, deployment and browser evidence |
| DEPLOY-03 | Run TT-S1, TT-C1 and TT-A1 in the browser; run smoke tests against isolated D1/Worker seeded from migrations | All three journeys pass; 20 smoke scenarios pass against deployed-equivalent code without mutating live user data | Playwright/Worker output, isolated test DB details, \`12-VERIFICATION.md\`; Admin clash browser flow uses local D1 fixture |
| DEP-02 | Review Worker route-to-domain authorization; query protected APIs as Student; scan tracked Git history for secrets | Student is denied coordinator/admin endpoints; no secrets in Git history; production demo login disabled | \`SECURITY-REVIEW.md\`, Gitleaks all-history scan (14 commits, 0 findings), and deployed checks |
| Integrity | In isolated D1, verify duplicate registration, waitlist promotion, approved venue clash and resource shortage; include concurrent competing writes where practical | Expected error markers/transition are observed, and test data is cleaned up | Deployed smoke output and test DB reset evidence |
| Accessibility | Run Lighthouse against Student, Coordinator and Admin home pages on Vercel | Each actual accessibility score is >=95 | \`lighthouse/{student,coordinator,admin}.json\`; scores/URLs/timestamps in \`12-VERIFICATION.md\` |
| Legacy v1 | After v2 passes, check \`college-events.varadaj47.workers.dev\` after the chosen disable/remove/redirect action | Old v1 demo-login app is unavailable or redirects to verified v2 | User-selected action and actual URL check in \`12-VERIFICATION.md\` |
| GCP retirement | Review current charges and data/backup ownership with the club billing owner before stopping or deleting resources | No unreviewed billing or data-retention impact; record retain/stop/delete decision | Billing-owner confirmation and observed resource state in \`12-VERIFICATION.md\` |

Do not run the mutating remote smoke against the live D1 without an isolated database or an explicitly approved backup/reseed plan. Do not claim a result from local D1 as a production result. Keep all credentials out of docs and test output.

## Coverage

- DEPLOY-01: Worker/D1 health, login, configuration and recoverability.
- DEPLOY-02: Vercel \`BACKEND_URL\` cutover and cookie forwarding.
- DEPLOY-03: deployed role journeys and isolated D1 integrity smoke.
- DEP-02: Worker authorization review, full-history secret scan and \`DEMO_LOGIN=false\`.
- Legacy retirement and GCP billing review: after v2 cutover passes.

Scope fence: no email/SMS, payments, native apps, QR check-in, calendar sync, multi-tenancy or vector search (\`adr-004-scope\`).

KB ids: \`adr-001-stack\`, \`adr-004-scope\`, \`dom-domain-model\`, \`dom-requirements\`, \`dom-scenarios\`, \`src-accessibility-areas\`.
