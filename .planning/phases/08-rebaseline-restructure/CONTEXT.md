# Phase 8: Re-baseline & Restructure (context brief)

Requirements: REBASE-01..04. No new app code in this phase: only docs, kb and file moves.

## Why
On 2026-10-23 the user switched the stack to FastAPI (AWS) + Next.js (Vercel). The repo search found no earlier FastAPI decision, so ADR-001, PROJECT and AGENTS still describe Cloudflare. Docs also contradict each other in several places (audit, 2026-10-23).

## Do
1. **`kb/decisions/adr-001-stack.md` v3:** FastAPI + Postgres (psycopg 3, plain SQL) on EC2 docker-compose + Caddy, and Next.js on Vercel with an `/api/*` rewrite. Keep the Supabase→Cloudflare→AWS history. Update AGENTS.md: drop the worktree, frozen-file and proposal rules.
2. **`kb/domain/domain-model.md`:**
   - Only approved, open and ongoing events book a venue. Pending requests may overlap, and approval fails on a clash (TT-A1 becomes reachable).
   - Resource limits are re-checked on approve and on reschedule (v1 gap: `alloc_guard` only fired on allocation writes).
   - Add the event templates, `return_reason`/`cancel_reason` and the venue `active` flag. Map "maintenance" in AD-05 to `active=false`.
3. **`kb/domain/status-vocabulary.md` + `kb/design-system`:** add tokens for task (To do, In progress, Done, Overdue), registration (Registered, Waitlisted, Cancelled) and alerts (Clash, Low registrations, Overdue). Fix the drift:
   - `scenarios.md:14` "Submitted" → "Pending approval"
   - `docs/flows/organizer-mark-task-done.md:16` "Completed" → "Done"
   - `docs/wireframes/student.md:33` "Alerts" → "Notifications"
   - Note that the DB values `confirmed`/`doing` display as Registered/In progress.
4. **IA:**
   - Coordinator "Tasks" becomes a cross-event screen (`docs/ia/coordinator.md:33`).
   - The ST-01 card leads to ST-02 (no direct Register button).
   - Student time-clash (`wireframes/student.md:88`): add it as a warn-only requirement, or remove it.
   - Mobile: the student interface gets a bottom tab bar (`shared-vocabulary.md:47`), and `design-system/README.md:86` is fixed to match.
   - Align the a11y checklist button labels with the wireframes.
5. **Ask the user** to confirm ADR-002 (Organizer is a Student flag).
6. **Repo:**
   - `git mv` the Next app (app, components, lib, tests, public, configs, package*.json) into `/frontend`.
   - Move `migrations/`, `seed/` and `scripts/hash-password.mjs` to `/backend` (reference for Phase 9).
   - Delete `wrangler.jsonc`, `open-next.config.ts`, `cloudflare-env.d.ts`, `.dev.vars.example`, `.continue-here.md`, the cf/D1 npm scripts and deps, and the local `.wrangler/`, `.open-next/` and `.next/` dirs.
   - Gitignore `graphify-out/`; delete the duplicate `.planning/graphs/`.
   - Fix the stale `03-HANDOFF.md` lib/supabase pointer (or add a note).
7. Run `node kb/tools/build-index.mjs` until it passes, and update CLAUDE.md if anything changed.

## Done when
The ROADMAP Phase 8 success criteria are met, and `grep -ri "cloudflare\|wrangler\|d1" CLAUDE.md AGENTS.md kb/decisions` shows only history.
