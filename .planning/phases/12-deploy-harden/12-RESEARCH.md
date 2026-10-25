# Phase 12: Deploy & Harden — Research

> **Superseded deployment target (2026-10-24):** The AWS EC2/FastAPI/Postgres recommendations below were researched for the previous stack and must not be executed. The active user-reported target is Cloudflare Worker + D1 and Vercel. Use `CONTEXT.md` and `12-VALIDATION.md` for the current cutover plan; D1 backup/recovery and deployed smoke evidence remain open.

**Researched:** 2026-10-23  
**Domain:** AWS EC2/Postgres deployment, Vercel Next.js hosting, production security and smoke verification  
**Confidence:** MEDIUM

## User Constraints

### Locked Decisions

- One EC2 t3.micro (Ubuntu) running Docker and docker-compose: Postgres (volume) + api + Caddy.
- Caddy gets automatic HTTPS on `<public-ip>.sslip.io`. Security group allows 22 (your IP only), 80 and 443.
- Nightly cron runs `pg_dump` and uploads to S3 through an instance role.
- `scripts/deploy.sh`: ssh, git pull, `docker compose up -d --build`, migrate.
- Production `.env`: `DEMO_LOGIN` set by an explicit decision (viva demo vs real use).
- Root directory `/frontend`; env `API_URL=https://<ip>.sslip.io`.
- Check the cookie stays first-party through the rewrite.
- Playwright TT-S1, TT-C1 and TT-A1 against the prod URL.
- Clash and double registration are rejected in prod.
- A student is refused admin/coordinator APIs (403).
- Lighthouse a11y score of at least 95 on each role home.
- Secret scan of the repo and its history.
- Take down or redirect the old v1 Cloudflare deployment (it has `DEMO_LOGIN=true`).

### Prerequisites

- The context says the user must have AWS (and must check the free-tier type) and Vercel accounts before starting. `.planning/STATE.md` still lists these as user todos; no account or deployment access was verified in this research.
- The project rules say account/key creation is a human step. Plan the deployment to stop at a checkpoint for AWS/Vercel credentials and user confirmation of `DEMO_LOGIN`.
- Current state says Phase 11 is next; this deployment depends on its completed role flows. Plan execution must wait for Phase 11 verification.

## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| DEPLOY-01 | Backend live on AWS EC2 free tier over HTTPS, nightly DB backup to S3 | EC2/Caddy, Docker Compose, IAM instance role and backup guidance below |
| DEPLOY-02 | Frontend live on Vercel and reaches backend through rewrite | Vercel monorepo root/env and Next.js rewrite guidance below |
| DEPLOY-03 | Playwright smoke tests of three primary flows pass against deployed URLs | Existing frontend test stack should be inspected after Phase 11; prod test should verify cookie, role authorization and DB rules |
| DEP-02 | Authorization reviewed and no secrets committed before deploy | Existing app/domain authorization boundary, secret-history audit and production auth decisions |

## Summary

Use the selected architecture as recorded in `adr-001-stack`: Docker Compose on one EC2 instance for Postgres, FastAPI and Caddy; Vercel builds the app from `/frontend`, with the existing Next.js rewrite targeting the HTTPS API origin. Caddy can automate public certificates when the host resolves to the server and inbound ports 80/443 are reachable. The current AWS free offer depends on account plan and creation date, so do not assume that “t3.micro free tier” means zero cost; confirm eligibility and credits in the user's account before launching resources. [AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html), [EC2 Free Tier](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html), [Caddy HTTPS](https://caddyserver.com/docs/quick-starts/https)

The repository already has the Next.js rewrite in `frontend/next.config.ts`, backend auth/domain boundaries, Docker support, and AWS CLI on the research machine. No Compose manifest or production deploy/backup scripts were found at the repo root/backend, and no Vercel CLI or Playwright package was found by the initial environment check. Keep production secrets out of git, give the EC2 instance a narrowly scoped role for its single backup bucket, and verify a backup by restoring it to a disposable database. [EC2 IAM roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html), [Docker Compose readiness](https://docs.docker.com/compose/how-tos/startup-order/)

**Primary recommendation:** prepare the EC2 environment first; complete the full authorization and secret-history review before deploying the application or enabling scheduled production backups. Gate all work on AWS eligibility and Phase 11 verification.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| HTTPS and public API routing | EC2/Caddy edge | AWS security group | Caddy terminates TLS and proxies to API; only 80/443 public |
| API auth and role permissions | FastAPI `app/domain` | Frontend route flow | Domain layer is declared authorization boundary (`dom-domain-model`); frontend is not a security boundary |
| Persistent event data | Postgres on EC2 volume | S3 backups | Postgres owns live records; S3 stores database dumps for recovery |
| Backup access | EC2 IAM instance profile | S3 bucket policy | Temporary role credentials avoid long-lived access keys on the host |
| Frontend deployment and API proxy | Vercel / Next.js server | Browser | Existing Next rewrite maps `/api/*` to the backend origin while preserving the visible URL |
| Production secret handling | AWS host env + Vercel project env | CI/deploy process | Runtime credentials must remain outside repository history |
| End-to-end smoke validation | Playwright against deployment | Lighthouse/manual review | Only deployed URLs prove the production cookies, routing and role path work together |

## Standard Stack

No new application package is needed for deployment. Reuse the existing Docker/Compose, Postgres, FastAPI, Caddy, Next.js and Vercel stack (`adr-001-stack`). The Vercel CLI is optional because dashboard configuration supports selecting a monorepo root; do not add it solely for deployment.

| Existing tool/service | Purpose | Source |
|---|---|---|
| Docker Compose | Run Postgres, API and Caddy; use database health checks before API startup | [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/) |
| Caddy | TLS termination and reverse proxy on the chosen public hostname | [Caddy HTTPS quick-start](https://caddyserver.com/docs/quick-starts/https) |
| EC2 instance profile | Provide temporary credentials for narrowly scoped S3 backup writes | [EC2 IAM roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html) |
| Vercel project settings | Set root directory to `frontend` and production `API_URL` | [Vercel monorepo docs](https://vercel.com/docs/monorepos), [environment variables](https://vercel.com/docs/environment-variables) |
| Next.js rewrites | Proxy `/api/*` to external API origin without exposing that destination in the browser URL | [Next.js rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites) |

## Architecture Patterns

### Request path

```text
Browser
  ├─ page request ─> Vercel Next.js app (`/frontend`)
  └─ `/api/*` ─> Next.js external rewrite ─> Caddy HTTPS on EC2
                                              └─> FastAPI ─> Postgres volume
EC2 scheduled backup ─> pg_dump ─> S3 via EC2 instance profile
```

### Recommended deployment shape

- Publish only Caddy's 80/443 ports; keep PostgreSQL and FastAPI reachable only on the Compose network. Open SSH 22 to the user's current public IP, not all sources. AWS's security group reference explicitly uses the user's computer IP as the SSH source. [AWS security groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html)
- Configure database readiness with Compose `healthcheck` + `depends_on: condition: service_healthy`; `depends_on` alone waits for a container to start, not for Postgres to be ready. [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- Use a host name whose DNS A record points at the instance. Caddy's automatic public TLS needs externally reachable 80/443 and correct public DNS. The repository's sslip.io choice depends on the public IP remaining aligned with the hostname; verify after launch and after any IP change. [Caddy HTTPS troubleshooting](https://caddyserver.com/docs/troubleshooting)
- Assign an EC2 role with only required S3 bucket/object write/list permissions. AWS recommends IAM roles and temporary credentials for workloads on EC2; do not place AWS access keys in `.env` or the image. [AWS EC2 IAM roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- Treat `/api/*` rewrite as a server-side proxy and verify both directions of session cookie handling: sign-in response must set the cookie on the Vercel host, and subsequent API requests must forward it. A masked URL alone is insufficient proof of cookie behavior. [Next.js rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| TLS certificate lifecycle | Custom certificate issuance/renewal cron | Caddy Automatic HTTPS | Caddy already automates issuance, renewal and HTTP-to-HTTPS redirects for valid public hostnames |
| AWS runtime credentials | Long-lived access keys stored on EC2 | IAM instance profile | EC2 role supplies renewable temporary credentials |
| Container readiness | Shell sleep loops in deploy scripts | Compose health checks and dependency conditions | Compose directly supports readiness dependencies |
| Browser's API origin selection | A second frontend API client/proxy | Existing `next.config.ts` rewrite and `API_URL` | It already preserves `/api/*` routing shape |

## Common Pitfalls

1. **Free-tier assumptions** — EC2 eligibility differs for accounts created before/after 2025-07-15, and account plan/credits affect what is free. Confirm account plan, region, instance type, storage and remaining credits before provisioning; use AWS cost alerts where available. [AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html), [EC2 Free Tier](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html)
2. **Caddy cannot issue TLS** — wrong/stale DNS, blocked ports, or another process bound to 80/443 prevents ACME validation. Validate the public DNS and security group before debugging Caddy. [Caddy troubleshooting](https://caddyserver.com/docs/troubleshooting)
3. **Database volume mistaken for a backup** — a host volume does not protect against host/account loss. Verify the scheduled dump reaches S3 and test restore; constrain retention and bucket access in line with the project's needs.
4. **Unsafe deployment side effects** — `git pull` can deploy an unexpected branch and migration can be irreversible. Pin the production branch/commit, make deployment fail on migration errors, and take a verified backup before migrations that can destroy or transform data.
5. **Demo mode left enabled** — production `DEMO_LOGIN` needs an explicit user decision, and production API checks must prove demo routes are disabled when the decision is “real use.” The stack ADR sets production demo login off.
6. **Proxy cookie false confidence** — test the actual browser's `Set-Cookie`, secure attributes, sign-in, and authenticated API calls on the Vercel origin; do not infer from the rewrite config alone.
7. **Old v1 deployment removal** — taking down Cloudflare is external and potentially irreversible. Confirm the exact old deployment/account and agree on redirect or removal before executing that task.

## Security Domain

| Area | Required check |
|---|---|
| Authentication/session | Production `DEMO_LOGIN` choice; HTTPS-only session cookie behavior through rewrite; verify auth endpoints and sign-out |
| Authorization | Review every router path through `app/domain`; production request as student to coordinator/admin APIs must return 403 (`DEP-02`, `dom-domain-model`) |
| Network | SSH source restricted to user's IP; public 80/443 only; no exposed DB/API ports |
| Secrets | Inspect tracked files and full Git history for secrets before deploy; rotate any exposed credential rather than only deleting it |
| Backup | Instance profile uses least privilege for one bucket; test dump and restore; do not put S3 keys on disk |
| Data integrity | In deployed DB, overlapping approved venue booking and duplicate registration are rejected (`dom-domain-model`) |

No established secret scanner or Playwright dependency was found in the inspected package files. Select an existing team-approved scanner or ask the planner to make tool installation a human-verified choice; do not add packages silently. Playwright smoke tests should follow the existing frontend dependency conventions and use the deployed environment only after Phase 11 is verified.

## Environment Availability

| Dependency | Required By | Available | Version / evidence | Fallback |
|---|---|---|---|---|
| Docker | Local Compose config validation | Yes | 29.9.2 | — |
| AWS CLI | AWS verification/deploy tasks | Yes | 2.37.7 | AWS Console |
| Node/npm | Frontend validation and Vercel tooling | Yes | Node 24.21.0, npm 11.19.0 | — |
| Vercel CLI | Optional direct deploy | No command found | — | Vercel dashboard (preferred by current project instructions) |
| Playwright CLI/package | Deployed smoke tests | No command/package observed in initial check | — | Install only if needed after checking existing Phase 11 changes |
| AWS account, EC2 key, S3 bucket | Live deployment | Not verified; account setup is a user task | — | Must be supplied by user |
| Vercel project/account | Live frontend deploy | Not verified; account setup is a user task | — | Must be supplied by user |

**Missing dependencies with no fallback:** AWS and Vercel account/project access blocks actual deployment; user must provide access or perform account-side steps. Phase 11 completion blocks this phase's live smoke evidence.

## Validation Architecture

| Requirement | Verification | Pass condition |
|---|---|---|
| DEPLOY-01 | Public HTTPS health endpoint; database and API container health; S3 backup object created; restore dump into disposable DB | Health is OK, TLS is valid, and restore succeeds |
| DEPLOY-02 | Vercel production deployment at `/frontend`; browser Network panel / Playwright login then authenticated API call | Same-site session cookie is set and forwarded; API calls succeed over Vercel origin |
| DEPLOY-03 | TT-S1, TT-C1, TT-A1 smoke flows against deployed app | Each flow completes and result is recorded honestly |
| DEP-02 | Review router/domain authorization and secret scan across tracked history | Student is denied admin/coordinator API; no secrets found or any exposure rotated and history risk handled |
| Domain constraints | Production API attempts for venue clash, duplicate registration | Both are rejected with expected behavior/error marker |
| Accessibility | Lighthouse each of the three role home URLs | Score >= 95, as Phase 12 context requires |

No new automated test framework is needed for Compose, cloud settings or secrets. Phase 11's browser gate is the predecessor for the deployed three-flow smoke checks. Keep live tests isolated to seeded demo accounts and test data; avoid modifying real project data during destructive constraint probes.

## Sources

- AWS Billing — [Explore AWS services with AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html)
- AWS EC2 — [Track Free Tier usage](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html)
- AWS EC2 — [Security group rules](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html)
- AWS EC2 — [IAM roles for EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- Docker — [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- Caddy — [HTTPS quick-start](https://caddyserver.com/docs/quick-starts/https), [troubleshooting](https://caddyserver.com/docs/troubleshooting)
- Vercel — [Monorepos](https://vercel.com/docs/monorepos), [environment variables](https://vercel.com/docs/environment-variables)
- Next.js — [Rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)
- KB notes consulted: `adr-001-stack`, `adr-004-scope`, `dom-domain-model`, `dom-requirements`.

## Open Questions (RESOLVED)

No research questions are left without an owner. The following are intentionally user-controlled gates in the plan set:

| Question | Resolution / gate |
|---|---|
| Does the AWS account permit t3.micro/EBS in the intended region and what is the account plan? | `12-01-PLAN.md`, Task 1 blocks all phase work until the user confirms account plan, region eligibility and expected cost/credits. |
| Which backup retention period should be used? | `12-01-PLAN.md`, Task 1 proposes seven days and requires confirmation before provisioning; user may select another duration. |
| What is the production `DEMO_LOGIN` mode? | `12-02-PLAN.md`, Task 3 requires explicit `real-use` or `viva-demo` decision before any app deployment. |
| Remove or redirect the old Cloudflare v1 URL, and who has access? | `12-05-PLAN.md`, Tasks 1–2 require a decision and account access before action. |
| Has Phase 11 passed its role-flow gates? | `12-01-PLAN.md`, Task 1 blocks all phase tasks until STATE and Phase 11 VERIFICATION confirm completion. |
| Which whole-history secret scanner is approved? | `12-02-PLAN.md`, Task 1 blocks the security audit/deployment until an installed scanner is verified or the user approves a named tool. |
| Are Playwright and Lighthouse approved for this repo? | `12-04-PLAN.md`, Task 1 verifies official package identity and blocks install until the user approves both. |

## Assumptions Log

| # | Claim | Risk if Wrong |
|---|---|---|
| A1 | The selected AWS account and region permit the desired EC2/EBS resources under the intended Free Tier plan. | Unexpected cost or inability to launch; verify account eligibility first. |
| A2 | The current Next.js rewrite forwards session cookies correctly between Vercel and the backend. | Users could fail to sign in or cookies could be mishandled; verify in a real browser before acceptance. |
| A3 | A `pg_dump` uploaded to S3 is an acceptable backup for the project's data and recovery objectives. | Recovery could be incomplete or too slow; confirm with a restore exercise. |

**Research date:** 2026-10-23  
**Valid until:** 2026-11-22 (re-check cloud pricing/free-tier and hosting docs immediately before provisioning)
