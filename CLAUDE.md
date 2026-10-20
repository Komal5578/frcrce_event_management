# College Event Planning and Management System (HMI mini project)

Goal: a polished, deployed working model of a centralized event planning, registration, task-allocation and monitoring system, designed with **Goal-Directed Design (GDD)** and good HMI principles. Also produces the 13 GDD deliverables (`kb/domain/deliverable-map.md`).

## Read first (every session)
1. `kb/INDEX.md`: routes any design/UX/scope question to the right note. Open only the 1-3 notes you need.
2. `.planning/STATE.md` and the current phase folder (GSD). Work on **one phase per session**; do not start the next.
3. Cite kb ids (e.g. `dom-requirements`, `src-hmi-principles`) in plans, commits and PR text for any design decision.

The attendance PDF/md in `kb/source/attendance-reference/` is a **reference example of the method**, not the product. Never add attendance features.

## Design rules (non-negotiable; detail in kb)
- One interface per role (Coordinator, Student, Admin), shaped by that role's goal, not a feature list (`src-feature-vs-goal-directed`).
- Ask first: what does the system already know? Pre-fill it. Minimum interactions for frequent tasks.
- Status is always icon + text + colour, using one vocabulary (`dom-status-vocabulary`). Never colour alone.
- Irreversible actions (submit, register, cancel, approve) go through Review & Confirm with plain-language feedback after.
- Clashes and double-registration are impossible in the DB and prevented in the UI (`dom-domain-model`).
- WCAG 2.2 AA, 44px targets, full keyboard path, A-/A/A+ text size, human error messages (`src-accessibility-areas`).
- YAGNI scope cuts are in `adr-004-scope`: no email/SMS, payments, native apps, vector search.

## Honesty rules
- KB `confidence`: source / derived / assumed / evidence. Only real team research is `evidence`. **Never invent research or usability results**; draft instruments, leave results to the team.
- Report outcomes faithfully (failing tests, skipped steps).

## Stack and commands (set up in Phase 3)
**DECISION (user, 2026-10-20): everything runs on Cloudflare's free tier (superseding the earlier Supabase/Vercel plan).** Stack: Next.js (App Router, TS) + Tailwind on Workers via `@opennextjs/cloudflare`, D1 (SQLite) for data, app-side sessions on D1. D1 has no RLS or exclusion constraints: clashes and double-registration are blocked by D1 triggers/unique constraints in `migrations/`, and `lib/domain` is the authorization layer (see `adr-001-stack`, `dom-domain-model`). Stay within free-tier limits; no paid add-ons. Verify current APIs with the context7 MCP before coding.
- KB check: `node kb/tools/build-index.mjs` (must pass after any kb change)
- App commands: `npm run dev|build|lint|typecheck|test|preview|deploy|cf-typegen|db:migrate|db:seed|db:reset`. Full gate: `npm run lint && npm run typecheck && npm test && npm run build`. Fast DB check: `npx vitest run tests/db.test.ts`.
- Human steps (Cloudflare account): `npx wrangler login`, `npx wrangler d1 create college-events` (paste the `database_id` into `wrangler.jsonc`), then `npm run deploy`.
- Secrets in `.dev.vars` (Workers runtime) and `.env.local` (Next build-time) only; commit `.env.example` / `.dev.vars.example`; never commit keys.

## Session protocol
- Start: read INDEX + STATE. Plan with `gsd-plan-phase`, build with `gsd-execute-phase`, verify with `gsd-verify-work`.
- Parallel waves (Phase 4): each agent in its own git worktree and own folder per `AGENTS.md`. Don't touch frozen shared files.
- End: update STATE.md, run the KB check if kb changed, commit, then `/clear` before the next phase.
- Commit only when a whole phase is complete and verified: one commit per phase. Never commit per plan, per task, per file change, per doc tweak or per SUMMARY. Keep working changes uncommitted until then. Never commit unless the gate is green.
- Prefer the simplest thing that works (ponytail); leave one runnable check for non-trivial logic.

## Definition of done (per phase)
Acceptance criteria met and tied to a requirement id; role's primary flow driven end-to-end in the browser; a11y checklist items for touched screens pass; kb updated if a decision changed; STATE.md current.
