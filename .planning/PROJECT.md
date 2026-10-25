# College Event Planning and Management System

## What This Is

A centralized web system for planning, registering for, allocating tasks in, and monitoring college events (fests, workshops, seminars). It replaces manual coordination across venues, faculty coordinators, student participants, schedules and resources, which causes communication gaps and scheduling conflicts. It is an HMI mini project (Sem 5): a deployed working model designed with Goal-Directed Design, plus the 13 GDD deliverables. Source of truth for every design and scope question: `kb/INDEX.md` (`dom-topic-brief`).

## Core Value

Each role completes its primary task fast, with few errors, and always knows the state of the system. Clashes are impossible, not just discouraged (`dom-topic-brief`, `dom-domain-model`).

## Requirements

### Validated

(None yet, ship to validate)

### Active

Full list with ids in `.planning/REQUIREMENTS.md`. Summary by role (`dom-requirements`):

- [ ] Coordinator: create event with pre-filled defaults and free-venue picker, request resources, allocate tasks, submit for approval, monitor, edit/cancel (C1-C7)
- [ ] Student: discover, event detail, register via Review & Confirm with waitlist, My Registrations and calendar, organizer My Tasks (S1-S5)
- [ ] Admin: approvals queue, conflict calendar, venue/resource management, utilisation dashboard, exportable reports (A1-A5)
- [ ] Cross-cutting HMI: status = icon + text + colour, Review & Confirm on irreversible actions, WCAG 2.2 AA with A-/A/A+ text size, consistent vocabulary, DB-enforced no double-booking or double-registration (X1-X5)
- [ ] The 13 GDD deliverables, mapped to phases in `dom-deliverable-map`

### Out of Scope

- Email/SMS notifications, in-app only (`adr-004-scope`): YAGNI, no provider or deliverability work
- Payments, ticketing (`adr-004-scope`): not in the allotted topic
- Native mobile apps, responsive web instead (`adr-004-scope`)
- QR check-in, calendar sync, multi-college tenancy, vector search (`adr-004-scope`, `dom-topic-brief`): no role's goal needs them yet
- Attendance features: the attendance PDF/md is a reference example of the method only (`dom-how-to-think`)
- i18n (Hindi/Marathi): stretch only, after Phase 6 (`adr-004-scope`)

## Context

- **Milestone v2 (current deployment re-baseline, 2026-10-24):**
  - The repo holds the KB (`node kb/tools/build-index.mjs` must pass after any KB change), the Next.js frontend in `/frontend`, the current Cloudflare Worker + D1 API in `/worker`, and a prior FastAPI + Postgres implementation in `/backend` that is retained but unused.
  - Current production target is Worker/D1 + Vercel. On 2026-10-25 the deployed Worker smoke and production browser suite passed 20/20, Lighthouse scored 96/100/100, disposable D1 restore counts matched, Gitleaks found no secrets in all 14 history commits, and the Admin clash/return browser journey passed against a local Worker/D1. The legacy GCP `ce-vm` and `ce-ip` were removed at the user's direction; its 30 GB disk remains. Phase 12 was marked complete at the user's direction with the billing-owner review recorded as a follow-up. See `adr-001-stack` v4 and Phase 12 context.
- Method: Goal-Directed Design. Three interfaces (Coordinator, Student, Admin), one per role, shaped by that role's goal, not a feature list (`src-feature-vs-goal-directed`, `adr-002-roles`). Student Organizer is a flag on a student account that adds My Tasks.
- Personas are proto-personas with confidence `assumed` (`dom-personas`). Only real team research may be recorded as `evidence`. AI drafts research and usability instruments and never invents results.
- Status vocabulary is fixed in `dom-status-vocabulary`; exact tokens are set in `kb/design-system` during Phase 3.
- Things only the team can do: approve account actions and billing/resource shutdowns, configure provider secrets (never committed), and run real interviews and usability sessions.
- Demo mode: one-click role login with seeded test users so reviewers can explore all three interfaces.

## Constraints

- **Tech stack (current)**: Cloudflare Worker + D1 (`college-events-v2`, APAC) and Next.js (App Router, TS) + Tailwind + shadcn/ui on Vercel. Vercel's `BACKEND_URL` is the Worker origin. The older AWS/FastAPI/Postgres target is superseded. Verify current APIs with context7 before coding. See `adr-001-stack` (v4).
- **Accessibility**: WCAG 2.2 AA, 44px targets, full keyboard path, A-/A/A+ text size, plain-language errors (`src-accessibility-areas`). Non-negotiable.
- **Data integrity**: D1/SQLite triggers enforce venue clashes for approved/open/ongoing events, unique registration, capacity, resource limits and state transitions; verify deployed behavior and concurrency before phase completion (`dom-domain-model`).
- **Process**: one GSD phase per session; lean v2 process (no worktrees, no frozen files); one commit per verified phase.
- **Honesty**: kb `confidence` labels respected; no invented research or usability results.
- **Simplicity**: prefer the simplest thing that works; leave one runnable check for non-trivial logic.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Cloudflare Workers + D1 (`adr-001-stack`) | Initial 2026-10-20 stack; later restored as the active deployed architecture on 2026-10-24 | Current deployment, user-reported |
| FastAPI on AWS (EC2) + Next.js on Vercel, Postgres (milestone v2) | User decision 2026-10-23; implementation remains in `/backend` | Superseded 2026-10-24 |
| Port, don't redesign: keep the GDD artefacts and v1 rules, redesign visuals ("modern campus SaaS") | User decision 2026-10-23 | User-confirmed |
| Only approved and later events book a venue | Makes the admin clash check (TT-A1) reachable; recorded in kb in Phase 8 | Assumed |
| Three interfaces, four roles (`adr-002-roles`) | Mirrors the reference's Faculty/Student/Admin split and covers task allocation via the Organizer flag | Assumed, not yet user-confirmed |
| Markdown + YAML KB, INDEX routing, no vector DB (`adr-003-kb-format`) | grep by id is enough at this size | Pending |
| Scope cuts per `adr-004-scope` | YAGNI | Pending |
| 7-phase roadmap from the approved plan (Research kit, Requirements, Foundation, Role interfaces, Cross-cutting, Validation, Deploy) | One phase per session; Phase 4 is the only parallel wave | Pending |
| Planning config: interactive mode, standard granularity, parallel on, research/plan-check/verifier on, balanced models | Matches `CLAUDE.md` session protocol; adjust with `/gsd-settings` | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check, still the right priority?
3. Audit Out of Scope, reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-23: milestone v2 (FastAPI + Next.js rebuild)*
