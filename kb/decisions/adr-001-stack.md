---
id: adr-001-stack
type: decision
title: ADR-001 Stack: FastAPI + Postgres on AWS EC2, Next.js on Vercel (v3)
tags: [stack,architecture]
confidence: derived
sources: [user-chat]
summary: Chosen stack and rationale (v3); user decision 2026-10-23, FastAPI + Postgres on one EC2 free-tier instance, Next.js on Vercel.
updated: 2026-10-23
---

# ADR-001 Stack (version 3)
**Decision (user, 2026-10-23):** FastAPI backend and Next.js frontend, hosted on free tiers.
- **Backend `/backend`:** FastAPI (Python 3.12), Postgres via psycopg 3 with plain SQL and plain `.sql` migrations, Pydantic schemas, pytest against a real Postgres, ruff. Runs on one EC2 t3.micro with docker-compose: Postgres, FastAPI, and Caddy for HTTPS on an `<ip>.sslip.io` host. Nightly `pg_dump` to S3.
- **Frontend `/frontend`:** Next.js (App Router, TS) + Tailwind + shadcn/ui on Vercel, project root `/frontend`. `next.config` `rewrites` proxies `/api/*` to the backend, so the session cookie is first-party and no CORS is needed. API types are generated with `openapi-typescript` from `/openapi.json`, never hand-written.

**Why:** FastAPI was the intended architecture; Postgres gives native clash prevention; real multi-user data makes the roles credible; no paid add-ons.

**Consequences:**
- Clashes: a Postgres `EXCLUDE USING gist` constraint on (venue, `tstzrange [start,end)`) for approved/open/ongoing only. Pending requests may overlap; the admin resolves them at approval (`dom-domain-model`).
- Double registration: `UNIQUE(event_id, user_id)`. Capacity, waitlist, resource limits and the state machine live in `app/domain` inside one transaction with `SELECT ... FOR UPDATE`.
- `app/domain` is the authorization layer; every function takes the `Actor` (from the session, never request input) first.
- Sessions: random token in an httpOnly cookie, only its SHA-256 stored in `sessions`. Passwords use argon2. Sign-in is rate limited. `DEMO_LOGIN` is off in production.
- Secrets: `backend/.env` and `frontend/.env.local` only; commit the `.env.example` files.
- Human steps: AWS account (check the free-tier type), EC2 key pair, S3 bucket, Vercel account.

**Ceiling:** no email/SMS, no payments (`adr-004-scope`). A single t3.micro has no failover.

## History
- Supabase + Vercel (initial plan): replaced because the user preferred free tier on a single account.
- Cloudflare Workers (OpenNext) + D1 (2026-10-20): replaced because D1 has no exclusion constraints (clash prevention needed triggers), 10 ms CPU limits forced weak password hashing, and FastAPI was the intended architecture.
- AWS EC2 FastAPI + Postgres, Next.js on Vercel (2026-10-23, user decision): current. The v1 Cloudflare code is a port reference only.
