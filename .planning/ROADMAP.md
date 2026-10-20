# Roadmap: College Event Planning and Management System

## Overview

Seven phases, one per session, taken from the approved plan. The first two phases produce the Goal-Directed Design research and framework artefacts. Phase 3 builds the shared foundation. Phase 4 is the only parallel wave: three role interfaces built by three agents in disjoint folders. Phase 5 makes the HMI rules hold across all roles. Phase 6 validates with real users, and Phase 7 deploys and documents. Source of truth for design questions: `kb/INDEX.md`. GDD deliverable mapping: `dom-deliverable-map`.

Config: standard granularity, interactive mode, parallelization on. Coverage: 42/42 v1 requirements mapped.

## Phases

- [x] **Phase 1: Research & Modeling Kit** - Interview guide, questionnaire, persona template, proto-personas flagged `assumed` (completed and verified 2026-10-20; UAT 9/9)
- [x] **Phase 2: Requirements & Framework** - Goals/tasks, scenarios, IA, task flows, navigation map, low-fi wireframes (completed 2026-10-20)
- [x] **Phase 3: Foundation** - Next.js + Tailwind scaffold, design tokens, shared components, D1 schema/seed, clash triggers, authorization layer, auth + demo logins (completed 2026-10-20)
- [ ] **Phase 4: Role Interfaces (parallel wave)** - Coordinator, Student and Admin interfaces built by three agents in disjoint folders
- [ ] **Phase 5: Cross-Cutting** - Alerts, reports/export, a11y pass, empty/error/loading states, Review & Confirm everywhere
- [ ] **Phase 6: Validation Kit & Iteration** - Test plan, task and metric sheets, heuristic evaluation, walkthrough, a11y checklist, team sessions, redesign
- [ ] **Phase 7: Deploy & Final Documentation** - Cloudflare deployment, authorization/secrets review, final docs, design-model infographic

## Phase Details

### Phase 1: Research & Modeling Kit

**Goal**: The team can run real user research with ready instruments, and the design has clearly labelled provisional personas to work from.
**GDD deliverables**: 1 User research (kit; results come from team sessions), 2 Personas (proto-personas, updated after research). Locations: `docs/research/`, `kb/domain/personas*.md`, `docs/personas/`.
**Depends on**: Nothing (first phase)
**Requirements**: RSCH-01, RSCH-02
**Success Criteria** (what must be TRUE):

  1. An interview guide and a questionnaire exist in `docs/research/`, with separate sections for Coordinators, Students and Admins, that the team can run without further drafting (`dom-topic-brief`, `dom-hmi-problems`).
  2. Every interview/questionnaire question traces to at least one of the ten HMI problems in `dom-hmi-problems`, so each answer feeds a known metric.
  3. A persona template and one proto-persona per role exist, and every proto-persona carries `confidence: assumed` in its frontmatter and a visible "assumed, pending research" label (`dom-personas`).
  4. Honesty rule holds: the instruments are AI-drafted, no response data, quotes or findings appear anywhere, and a placeholder states that only the team may record results as `evidence`. `node kb/tools/build-index.mjs` passes.

**Plans**: TBD

### Phase 2: Requirements & Framework

**Goal**: Each role's goals, scenarios, structure, flows and screens are designed on paper so Phase 3 and 4 build against an agreed design.
**GDD deliverables**: 3 Goals and task analysis (`kb/domain/goals-tasks.md`), 4 Scenarios (`kb/domain/scenarios.md`), 5 Requirements (`kb/domain/requirements.md`, already drafted, finalised here), 6 Information architecture (`docs/ia/`), 7 User/task flow (`kb/domain/flows.md`, `docs/flows/`), 8 Low-fi wireframes (`docs/wireframes/`).
**Depends on**: Phase 1
**Requirements**: FRAM-01, FRAM-02, FRAM-03, FRAM-04, FRAM-05
**Success Criteria** (what must be TRUE):

  1. For each of the three roles, a goal and task analysis links every task to a requirement id from `dom-requirements` (C1-C7, S1-S5, A1-A5, X1-X5), with no task or requirement left unlinked (`dom-goals-tasks`).
  2. Each role has at least one scenario and one test task written so Phase 6 can reuse it as a usability task sheet, mirroring the task-success tasks in `src-evaluation-methods` (`dom-scenarios`).
  3. Each interface has an IA and a navigation map showing one interface per role, with the Organizer "My Tasks" entry on the Student interface (`adr-002-roles`, `src-feature-vs-goal-directed`).
  4. Task flows for the Coordinator, Student and Admin primary journeys exist and show the Review & Confirm step before every irreversible action (`dom-flows`, `dom-status-vocabulary`).
  5. Low-fi wireframes exist for every primary screen of the three interfaces and show status as icon + text + colour; a person can walk through each primary flow screen by screen.

**Plans**: 10 plans
Plans:

- [x] 02-01-PLAN.md — check script (Wave 0), requirements finalised, goals-tasks, scenarios and test tasks
- [x] 02-02-PLAN.md — IA and nav per interface, shared vocabulary
- [x] 02-03-PLAN.md — task flows (Mermaid) with Review & Confirm
- [x] 02-04-PLAN.md — low-fi ASCII wireframes per role
- [x] 02-05-PLAN.md — deliverable links, full suite, walkthrough, state

**UI hint**: yes

### Phase 3: Foundation

**Goal**: A running, themed app skeleton with a database that makes clashes and double-registration impossible, where a reviewer can enter any role in one click.
**GDD deliverables**: 9 High-fi interactive prototype (start; completed across Phases 3-5, lives in `app/`). Fills `kb/design-system` tokens.
**Depends on**: Phase 2
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07
**Success Criteria** (what must be TRUE):

  1. `npm run dev`, build, lint and test commands run cleanly, and the real commands are recorded in the Stack block of `CLAUDE.md` (replacing "to be filled in Phase 3").
  2. A status-vocabulary component renders each state in `dom-status-vocabulary` (Draft, Pending, Approved, Open, Ongoing, Completed, Cancelled) as icon + text + colour, and token contrast ratios are checked and recorded to meet WCAG 2.2 AA (`src-accessibility-areas`).
  3. Attempting to save two overlapping bookings for the same venue is rejected by a database trigger, and attempting a second registration for the same (event, user) is rejected by the unique constraint, both proven by a runnable check (`dom-domain-model`, `dom-hmi-problems` #2: clash attempts that reach the DB are zero from the UI).
  4. Schema, seed data and an authorization layer (`lib/domain`) exist for profiles, events, venues, bookings, resources, registrations, tasks and notifications; each role can read and write only what its policies allow.
  5. From the login screen, a reviewer clicks one demo button per role (Coordinator, Student, Admin) and lands in that role's interface, and a normal sign-in does the same.
  6. Shared files (`components/ui`, schema, tokens) are listed as frozen in `AGENTS.md` ownership terms before Phase 4 starts; secrets live only in `.env.local` and `.env.example` is committed.

**Plans**: 10 plans
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — scaffold, Tailwind tokens, contrast test, CLAUDE.md commands

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — superseded Supabase schema/RLS/functions/seed (history)
- [x] 03-03-PLAN.md — StatusBadge and shared components/ui, /design gallery, ds-readme

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-04-PLAN.md — login with demo buttons, guarded role stubs (auth since replaced by D1 sessions in 03-09)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-05-PLAN.md — superseded by 03-10
- [x] 03-06-PLAN.md — Cloudflare/OpenNext/D1 scaffold
- [x] 03-07-PLAN.md — D1 schema, guard triggers, seed, sqlite tests
- [x] 03-08-PLAN.md — actor-explicit domain layer, error mapping, authz tests
- [x] 03-09-PLAN.md — D1 sessions, PBKDF2, runtime demo gate
- [x] 03-10-PLAN.md — docs, freeze list, handoff, gate, live check (done; password sign-in user-reported OK, CPU not measured)

**UI hint**: yes

### Phase 4: Role Interfaces (parallel wave)

**Goal**: Each role can complete its primary task end-to-end in an interface shaped by its goal.
**Execution**: One parallel wave of three agents, each in its own git worktree and owning one route folder per `AGENTS.md`: 4a Coordinator interface in `app/(coordinator)`, 4b Student interface in `app/(student)`, 4c Admin dashboard in `app/(admin)`. Shared files from Phase 3 are frozen; any needed change goes to the Phase 3 owner, not the wave agents. Each plan owns exactly one route folder.
**GDD deliverables**: 9 High-fi interactive prototype (role screens, in `app/`).
**Depends on**: Phase 3
**Requirements**: COORD-01, COORD-02, COORD-03, COORD-04, COORD-05, COORD-06, COORD-07, STUD-01, STUD-02, STUD-03, STUD-04, STUD-05, ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04
**Success Criteria** (what must be TRUE):

  1. Coordinator (4a): from a template with pre-filled defaults, a Coordinator creates an event (draft autosaves), picks only from venues free for the slot with capacity shown, requests resources, allocates tasks with due dates, and submits via Review & Confirm; the event then shows its approval state. Clicks and time to submit are recorded against `dom-hmi-problems` #1.
  2. Coordinator (4a): the Coordinator monitors registrations against capacity, overdue tasks and event status in one view, and can edit or cancel an event after confirmation, with registrants notified in-app.
  3. Student (4b): a Student finds an event with search and date/type/venue/department filters, sees what, when, where, seats left and status at a glance, registers via Review & Confirm (waitlisted when full), and can cancel; the Student answers "Am I registered?" from My Registrations or the calendar without reading a table (`dom-hmi-problems` #5). An Organizer also sees My Tasks and can mark a task done.
  4. Admin (4c): an Admin works an approvals queue that shows clash check and resources and can approve or return with a reason, sees a calendar of all events and venues with conflicts highlighted, manages venues and resources, and reads a dashboard of events, pending approvals, utilisation and department split.
  5. Each role's primary flow is driven end-to-end in the browser using the demo logins, with no edits to frozen shared files and no overlap between the three route folders.

**Plans**: TBD
**UI hint**: yes

### Phase 5: Cross-Cutting

**Goal**: The HMI rules hold on every screen of every role: problems are surfaced calmly, every state is designed, and every irreversible action is confirmed.
**GDD deliverables**: 9 High-fi interactive prototype (completed and polished, in `app/`).
**Depends on**: Phase 4
**Requirements**: XCUT-01, XCUT-02, XCUT-03, XCUT-04, XCUT-05, XCUT-06
**Success Criteria** (what must be TRUE):

  1. Admin and Coordinator can export a report as CSV or print it, and the file or print view matches what the dashboard shows.
  2. Clash, low-registration and overdue-task alerts appear in the right role's view without crowding the screen, and a tester can find the problem item quickly (`dom-hmi-problems` #6: time to find the problem).
  3. Every screen has a designed empty, loading and error state with a plain-language message that says what happened and what to do next (`dom-hmi-problems` #7).
  4. On every screen, text size A-/A/A+ works, targets are at least 44px and the full task can be done by keyboard alone; the accessibility checklist in `src-evaluation-methods` section D passes for all touched screens (`src-accessibility-areas`).
  5. Submit, register, cancel and approve all go through Review & Confirm and show plain-language feedback afterwards, and the same terms, status vocabulary and layouts appear across the three roles (`dom-status-vocabulary`, `dom-hmi-problems` #10).

**Plans**: TBD
**UI hint**: yes

### Phase 6: Validation Kit & Iteration

**Goal**: The team can test the working model with real users, and what they find drives a documented redesign.
**Honesty rule**: Instruments are drafted by AI. All session results, scores and findings come only from the team's real sessions and are never invented; if sessions have not been run, the findings and iteration documents say so plainly.
**GDD deliverables**: 10 Usability testing (`docs/validation/`), 11 Usability findings (`docs/validation/findings.md`), 12 Iterative improvements (`docs/validation/iterations.md`). Deliverable 1 research results (team sessions) can also be recorded here as `evidence`.
**Depends on**: Phase 5
**Requirements**: VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):

  1. A usability test plan, one task sheet per role (reusing the Phase 2 test tasks) and a metric sheet are ready for the team to run, covering completion rate, time, errors, clicks, understanding and satisfaction, and diverse-user groups (`src-evaluation-methods` sections B and E, `dom-hmi-problems` #8: success by user group).
  2. A heuristic evaluation, a cognitive walkthrough of each role's primary task and the Yes/No accessibility checklist are completed against the built app, each with an issue list tied to a screen (`src-evaluation-methods` sections A, C, D).
  3. The findings document contains only data the team recorded in real sessions, each result marked `evidence`, with no figures or quotes written by AI.
  4. Each finding the team accepts maps to a logged change in `docs/validation/iterations.md` (before, after, reason), and the changed screens are re-checked (`src-evaluation-methods` section F: use results to modify the interface).

**Plans**: TBD

### Phase 7: Deploy & Final Documentation

**Goal**: Anyone with a link can open the finished model, and the project is documented as a complete Goal-Directed Design.
**GDD deliverables**: 13 Final prototype (Workers URL + `docs/final/`).
**Depends on**: Phase 6
**Requirements**: DEP-01, DEP-02, DEP-03
**Success Criteria** (what must be TRUE):

  1. The app is live on Cloudflare Workers with D1, and a reviewer opens the shareable URL and enters all three role interfaces with the demo logins (the team creates the Cloudflare account and logs in).
  2. The authorization layer is reviewed (each role can read and write only what it should) and a search of the repository and git history finds no committed secrets; `.env.local` is ignored and `.env.example` is present.
  3. The deployed app passes the same smoke test as local: the venue clash is rejected and double registration is rejected.
  4. Final documentation in `docs/final/` covers all 13 deliverables with links, and a one-page design-model infographic exists in the style of `src-model-infographic`.

**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Research & Modeling Kit | 3/3 | Complete    | 2026-10-20 |
| 2. Requirements & Framework | 5/5 | Complete    | 2026-10-20 |
| 3. Foundation | 10/10 | Complete   | 2026-10-20 |
| 4. Role Interfaces (parallel wave) | 0/TBD | Not started | - |
| 5. Cross-Cutting | 0/TBD | Not started | - |
| 6. Validation Kit & Iteration | 0/TBD | Not started | - |
| 7. Deploy & Final Documentation | 0/TBD | Not started | - |
