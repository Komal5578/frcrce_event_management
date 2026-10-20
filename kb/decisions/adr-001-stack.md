---
id: adr-001-stack
type: decision
title: ADR-001 Stack: Next.js + Supabase + Vercel
tags: [stack,architecture]
confidence: derived
sources: [user-chat]
summary: Chosen stack and the rationale; user-confirmed.
updated: 2026-10-20
---

# ADR-001 Stack
**Decision (user-confirmed):** Next.js (App Router, TypeScript) + Tailwind + Supabase (Postgres, Auth, RLS, Realtime), deployed on Vercel.
**Why:** real multi-user data and login make the roles credible; Postgres exclusion constraints give true clash prevention; Vercel gives a shareable URL.
**Consequences:** user creates the Supabase project and keys (`.env.local`, never committed); verify current Next.js/Supabase APIs with context7 before coding; seed demo users for a one-click demo login (test accounts for our own app).
**Ceiling:** no email/SMS, no payments.
