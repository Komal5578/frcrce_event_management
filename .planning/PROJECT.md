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

- Greenfield; the repo currently holds only the knowledge base (`kb/`, 25 notes, `node kb/tools/build-index.mjs` must pass after any kb change), `CLAUDE.md`, `AGENTS.md`.
- Method: Goal-Directed Design. Three interfaces (Coordinator, Student, Admin), one per role, shaped by that role's goal, not a feature list (`src-feature-vs-goal-directed`, `adr-002-roles`). Student Organizer is a flag on a student account that adds My Tasks.
- Personas are proto-personas with confidence `assumed` (`dom-personas`). Only real team research may be recorded as `evidence`. AI drafts research and usability instruments and never invents results.
- Status vocabulary is fixed in `dom-status-vocabulary`; exact tokens are set in `kb/design-system` during Phase 3.
- Things only the team can do: create the Cloudflare account, log in and create the D1 database (secrets only in `.dev.vars` / `.env.local`, never committed), run real interviews and usability sessions.
- Demo mode: one-click role login with seeded test users so reviewers can explore all three interfaces.

## Constraints

- **Tech stack**: Next.js (App Router, TypeScript) + Tailwind on Cloudflare Workers (OpenNext) with D1 and app-side sessions, all on the free tier (`adr-001-stack`). Verify current APIs with context7 before coding.
- **Accessibility**: WCAG 2.2 AA, 44px targets, full keyboard path, A-/A/A+ text size, plain-language errors (`src-accessibility-areas`). Non-negotiable.
- **Data integrity**: venue clashes via D1 triggers; registrations unique per (event, user); authorization layer reviewed before deploy (`dom-domain-model`).
- **Process**: one GSD phase per session; Phase 4 runs three parallel agents in separate git worktrees and folders per `AGENTS.md`; shared files frozen after Phase 3.
- **Honesty**: kb `confidence` labels respected; no invented research or usability results.
- **Simplicity**: prefer the simplest thing that works; leave one runnable check for non-trivial logic.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Cloudflare Workers + D1 (`adr-001-stack`) | User decision 2026-10-20: free tier only; replaces the earlier Supabase/Vercel plan; triggers give clash prevention | User-confirmed |
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
*Last updated: 2026-10-20 after initialization*
