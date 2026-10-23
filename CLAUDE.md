# College Event Planning and Management System (HMI mini project)

Goal: a polished, deployed working model of a centralized event planning, registration, task-allocation and monitoring system, designed with **Goal-Directed Design (GDD)** and good HMI principles. Also produces the 13 GDD deliverables (`kb/domain/deliverable-map.md`).

## Read first (every session)
1. `kb/INDEX.md`: routes any design/UX/scope question to the right note. Open only the 1-3 notes you need.
2. `.planning/STATE.md` and the current phase folder (GSD), starting with its `CONTEXT.md`. Work on **one phase per session**; do not start the next.
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

## Stack (milestone v2, rebuild in progress)
**DECISION (user, 2026-10-23): FastAPI backend on the AWS free tier + Next.js frontend on Vercel.** This supersedes the 2026-10-20 Cloudflare Workers + D1 decision. The v1 Cloudflare code now lives in `/frontend` (Next.js app, `lib/domain/*`, tests) and `/backend/migrations` + `/backend/seed` (SQLite/D1 SQL), as the porting reference. Don't extend it. ADR-001 was rewritten in Phase 8.
- **Backend `/backend`:** FastAPI (Python 3.12), Postgres via psycopg 3 with plain SQL (no ORM) and plain `.sql` migrations, Pydantic schemas, pytest against a real Postgres, ruff.
  - **Clashes:** blocked by a Postgres `EXCLUDE USING gist` constraint on (venue, `tstzrange [start,end)`) for **approved/open/ongoing only**. Pending requests may overlap, and the admin resolves them at approval.
  - **Double registration:** blocked by `UNIQUE(event_id, user_id)`.
  - **Capacity/waitlist, resource limits and the state machine:** live in `app/domain` inside one transaction with `SELECT … FOR UPDATE`.
  - **Authorization:** `app/domain` is the authorization layer. Every function takes the `Actor` (from the session, never from request input) first.
  - **Auth:** a random token in an httpOnly cookie, only its SHA-256 stored in `sessions`, argon2 passwords, a sign-in rate limit.
- **Frontend `/frontend`:** Next.js (App Router, TS) + Tailwind + shadcn/ui + lucide + Recharts, light and dark themes.
  - `next.config` `rewrites` proxies `/api/*` to the backend, so the session cookie is first-party and no CORS is needed.
  - API types are generated with `openapi-typescript` from FastAPI's `/openapi.json`. Never hand-write the client types.
- **Hosting:** backend is one EC2 t3.micro running docker-compose (Postgres + FastAPI + Caddy for HTTPS on an `<ip>.sslip.io` host), with a nightly `pg_dump` to S3. Frontend is Vercel, with the project root `/frontend`. Free tiers only; no paid add-ons.
- Verify current APIs with the context7 MCP before coding.
- KB check: `node kb/tools/build-index.mjs` (must pass after any kb change).
- **Planned commands** (set up in Phases 9/10; not real yet):
  - Backend: `cd backend && ruff check && pytest`; `docker compose up`.
  - Frontend: `cd frontend && npm run lint && npm run typecheck && npm test && npm run build`; `npx playwright test`.
- **Secrets:** `backend/.env` and `frontend/.env.local` only. Commit the `.env.example` files; never commit keys.
- **Human steps:**
  - Create an AWS account (check the free-tier type), an EC2 key pair and an S3 bucket.
  - Create a Vercel account and import the repo with root `/frontend`.

## v2 rebuild context (audit 2026-10-23; plan in `.planning/ROADMAP.md` Phases 8–12)
**Port, don't redesign.** These stay the source of truth:
- the GDD artefacts (kb, personas, IA, flows, wireframes)
- the v1 business rules (`backend/migrations/0002_guards.sql`, `frontend/lib/domain/*`, `frontend/lib/errors.ts` messages)
- the 260 vitest cases (port them to pytest)

Error markers stay the same: `VENUE_CLASH`, `EVENT_FULL`, `RESOURCE_SHORT`, `BAD_STATE`, `NOT_ALLOWED`.

**Audit findings that v2 must fix** (details in each phase's `CONTEXT.md`):
- **The admin clash path is unreachable**: v1 counts `pending` as booked. The fix is to count approved and later only (`dom-domain-model`, TT-A1).
- **Resource check gap**: the v1 resource-allocation guard doesn't re-check on approve or reschedule.
- **Nav bug**: AppShell marks the home link current on every subpage.
- **ConfirmDialog**: first focus must be "Go back", and it needs a destructive variant.
- **Student mobile nav**: the student interface needs a mobile bottom tab bar (per the IA, not a "Menu" disclosure).
- **Status tokens missing** for task, registration and alert statuses.
- **Duplicated UI**: two reports pages, two export routes, two calendars, two event-card and two flash components.
- **Security**: `DEMO_LOGIN` is live in prod, `/design` is unguarded, and there is no sign-in rate limit.
- **Vocabulary drift**:
  - Pending approval, not "Submitted"
  - Done, not "Completed" (for tasks)
  - Notifications, not "Alerts"
- **The UI is visually plain.** v2 needs a real visual direction ("modern campus SaaS") through a UI-SPEC before screens are built.

## Session protocol
- Start: read INDEX + STATE. Plan with `gsd-plan-phase`, build with `gsd-execute-phase`, verify with `gsd-verify-work`.
- **Lean process (v2):**
  - No worktrees, no frozen files, no proposal/amendment machinery.
  - Each phase has one CONTEXT, PLAN(s), one SUMMARY and one VERIFICATION.
  - Role screens are built one after another.
- End: update STATE.md, run the KB check if kb changed, commit, then `/clear` before the next phase.
- Commit only when a whole phase is complete and verified: one commit per phase. Never commit per plan, per task, per file change, per doc tweak or per SUMMARY. Keep working changes uncommitted until then. Never commit unless the gate is green.
- Prefer the simplest thing that works (ponytail); leave one runnable check for non-trivial logic.

## Definition of done (per phase)
Acceptance criteria met and tied to a requirement id; role's primary flow driven end-to-end in the browser; a11y checklist items for touched screens pass; kb updated if a decision changed; STATE.md current.
