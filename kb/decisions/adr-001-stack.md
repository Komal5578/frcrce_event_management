---
id: adr-001-stack
type: decision
title: ADR-001 Stack: Next.js + Cloudflare Workers (OpenNext) + D1
tags: [stack,architecture]
confidence: derived
sources: [user-chat]
summary: Chosen stack and the rationale; user decision 2026-10-20, everything on Cloudflare free tier.
updated: 2026-10-20
---

# ADR-001 Stack
**Decision (user, 2026-10-20):** Next.js (App Router, TypeScript) + Tailwind on Cloudflare Workers via `@opennextjs/cloudflare`, data in D1 (SQLite), app-side sessions on D1. Everything on the Cloudflare free tier. This supersedes the earlier Next.js + Supabase + Vercel choice (history only).
**Why:** one account, no paid add-ons, a shareable `workers.dev` URL, and real multi-user data so the roles are credible.
**Consequences:**
- D1 has no exclusion constraints and no RLS. Venue clashes are rejected by BEFORE INSERT/UPDATE triggers (half-open `[)` ranges, active statuses only); the same pattern guards seats and resource over-allocation. Registrations stay unique per (event, user).
- No RLS, so `lib/domain` (actor-explicit functions) is the access layer; route code may call only `lib/domain` and `lib/auth` (a test enforces it).
- Sessions: random 256-bit token in an httpOnly cookie, only its SHA-256 stored in D1. Passwords use PBKDF2-SHA256 at 100000 iterations, below OWASP's 600000, because of the 10 ms CPU limit on Workers Free. Demo accounts and the `DEMO_LOGIN` flag must be removed or set false before any real use. No rate limiting on sign-in (accepted risk).
- Free-tier ceilings to stay under: 50 D1 queries per invocation, 100k requests/day, 5M rows read/day, 10 ms CPU per request.
- Secrets: `.dev.vars` (Workers runtime) and `.env.local` (Next build time), never committed. The D1 `database_id` is not a secret.
**Ceiling:** no email/SMS, no payments. If the CPU limit fails live, the options are the Paid plan or static-shell pages (user decision). CPU on the deployed Worker is not yet measured.
