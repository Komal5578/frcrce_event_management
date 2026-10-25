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

## Current stack (2026-10-24)
**Current deployment:** Cloudflare Worker API + Cloudflare D1 (`college-events-v2`, APAC) and Next.js frontend on Vercel. This supersedes the 2026-10-23 AWS FastAPI/Postgres target. The original Worker/D1 source in `/worker` is the active v2 API implementation.
- **API `/worker`:** TypeScript Cloudflare Worker, D1 binding `DB`, SQL migrations and seed data. `worker/src/index.ts` handles `/api/*`; `worker/src/domain.ts` contains domain operations and authorization; `worker/src/core.ts` handles sessions, PBKDF2, rate limiting and D1 errors.
- **Frontend `/frontend`:** Next.js App Router on Vercel. `next.config.ts` proxies `/api/*` to `BACKEND_URL`, keeping the browser-facing session cookie first-party.
- **Integrity:** D1/SQLite constraints and triggers protect unique registration, event transitions, venue clashes, capacity and resource allocation. Only approved/open/ongoing events hold venues/resources; pending requests may overlap until approval. Deployed Worker smoke passed 20/20 on 2026-10-25; remote D1 was reseeded afterwards.
- **Authentication:** session token is httpOnly, Secure, SameSite=Lax; only its SHA-256 is stored. Password verification uses PBKDF2-SHA256. Production `DEMO_LOGIN=false`; the demo-login endpoint returns 404.
- **Live state (verified 2026-10-25):** API is `college-events-api.varadaj47.workers.dev`; Vercel production `BACKEND_URL` points to it and the production deployment is live. Deployed Worker smoke and the full production browser suite passed 20/20. The old `college-events` Worker was deleted and its hostname returned HTTP 404; v2 health returned HTTP 200 after deletion.
- **Phase 12:** marked complete at the user's direction after Lighthouse, disposable D1 restore, full-history secret scan, and Admin approval/clash browser checks passed. The GCP `ce-vm` and `ce-ip` are removed; its 30 GB disk is retained pending a billing-owner cost/data review. Do not delete the disk/project until that follow-up is complete.
- **Unused legacy code:** `/backend` FastAPI/Postgres and root GCP/Compose files are retained as reference; do not deploy them as the active backend or remove them until recovery/rollback value is reviewed.
- **Secrets:** use provider environment settings; never commit credentials. KB check: `node kb/tools/build-index.mjs` after KB edits.
- The GDD artefacts, role goals and requirements remain the product source of truth. Scope cuts remain in `adr-004-scope`.

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
