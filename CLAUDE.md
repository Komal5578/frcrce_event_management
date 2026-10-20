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

## Stack and commands (set up in Phase 3; update this block then)
Next.js (App Router, TS) + Tailwind + Supabase (Postgres/Auth/RLS/Realtime), Vercel deploy. Verify current APIs with the context7 MCP before coding.
- KB check: `node kb/tools/build-index.mjs` (must pass after any kb change)
- App commands: _to be filled in Phase 3 (dev, build, lint, test)_
- Secrets in `.env.local` only; commit `.env.example`; never commit keys.

## Session protocol
- Start: read INDEX + STATE. Plan with `gsd-plan-phase`, build with `gsd-execute-phase`, verify with `gsd-verify-work`.
- Parallel waves (Phase 4): each agent in its own git worktree and own folder per `AGENTS.md`. Don't touch frozen shared files.
- End: update STATE.md, run the KB check if kb changed, commit, then `/clear` before the next phase.
- Prefer the simplest thing that works (ponytail); leave one runnable check for non-trivial logic.

## Definition of done (per phase)
Acceptance criteria met and tied to a requirement id; role's primary flow driven end-to-end in the browser; a11y checklist items for touched screens pass; kb updated if a decision changed; STATE.md current.
