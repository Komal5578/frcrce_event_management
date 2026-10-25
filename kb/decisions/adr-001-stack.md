---
id: adr-001-stack
type: decision
title: ADR-001 Stack: Cloudflare Worker + D1, Next.js on Vercel (v4)
tags: [stack,architecture]
confidence: derived
sources: [user-chat]
summary: Current deployed architecture is a Cloudflare Worker API with D1 and a Next.js frontend on Vercel; user-reported deployment state 2026-10-24.
updated: 2026-10-25
---

# ADR-001 Stack (version 4)
**Decision reflected by verified deployment (2026-10-25):** Cloudflare Worker + D1 API, with the Next.js frontend hosted on Vercel. The API Worker is deployed as `college-events-api.varadaj47.workers.dev`; D1 database `college-events-v2` is in APAC. Vercel production points to the Worker through `BACKEND_URL`.

- **API `/worker`:** TypeScript Worker with D1 binding `DB`, SQL migrations/seed, route/auth plumbing in `src/index.ts` and shared domain rules in `src/domain.ts`. This ports the FastAPI endpoint paths and response shapes.
- **Frontend `/frontend`:** Next.js App Router on Vercel. `next.config.ts` proxies `/api/*` to `BACKEND_URL`, preserving first-party cookie behavior through the frontend origin.
- **Integrity:** SQLite/D1 constraints and triggers enforce unique registration, valid transitions, capacity, venue clash and resource limits. Only approved/open/ongoing events reserve venues/resources; pending requests may overlap until approval. Deployed Worker smoke passed 20/20 on 2026-10-25; concurrency behavior remains unverified.
- **Authorization:** Worker derives the actor from the session and checks permissions in its domain layer. Browser route guards are not a security boundary.
- **Authentication:** PBKDF2-SHA256 password verification; random session token in a Secure, HttpOnly, SameSite=Lax cookie; SHA-256 token hash stored in D1; login rate limiting. Production health, password login, cookie forwarding and role guards were verified on 2026-10-25. `DEMO_LOGIN=false` is deployed.
- **Backups/recovery:** A pre-test D1 SQL export was created and the canonical seed was reapplied after production tests. A documented restore procedure and restore drill are still outstanding.
- **Hosting:** Worker/D1 on Cloudflare; frontend on Vercel with root `/frontend`. AWS/GCP-specific services are no longer the target architecture.
- **Secrets:** provider environment settings only; never commit keys.

**Why:** The Worker port and Vercel frontend are live, production Worker smoke passed 20/20, and browser verification confirmed login/session behavior. This keeps API paths and response shapes while running the API on the selected Cloudflare platform.

**Ceiling:** retain existing cuts in `adr-004-scope` (no email/SMS, payments, native apps, vector search, etc.).

## History
- Supabase + Vercel (initial plan): replaced in an earlier planning iteration.
- Cloudflare Workers + D1 (2026-10-20): initially superseded by the 2026-10-23 AWS/FastAPI plan.
- AWS EC2 FastAPI + Postgres, Next.js on Vercel (2026-10-23): superseded by the current Cloudflare Worker + D1 deployment (2026-10-24).
