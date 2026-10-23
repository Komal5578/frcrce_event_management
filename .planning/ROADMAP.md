# Roadmap: College Event Planning and Management System

## Overview

Seven phases, one per session, taken from the approved plan. The first two phases produce the Goal-Directed Design research and framework artefacts. Phase 3 builds the shared foundation. Phase 4 is the only parallel wave: three role interfaces built by three agents in disjoint folders. Phase 5 makes the HMI rules hold across all roles. Phase 6 validates with real users, and Phase 7 deploys and documents. Source of truth for design questions: `kb/INDEX.md`. GDD deliverable mapping: `dom-deliverable-map`.

Config: standard granularity, interactive mode, parallelization on. Coverage: 42/42 v1 requirements mapped.

> **2026-10-23: milestone v2 replaces Phases 6–7.** The user switched the stack to FastAPI (AWS free tier) + Next.js (Vercel) and asked for a proper frontend design. v1 (Phases 1–5, the Cloudflare build) is frozen as the reference to port from. v1 Phase 5 was built but its human checkpoint was **never done**. Phases 6–7 are folded into v2 Phases 12–13. See "Milestone v2" below.

## Phases (milestone v1: Cloudflare build, closed)

- [x] **Phase 1: Research & Modeling Kit** - Interview guide, questionnaire, persona template, proto-personas flagged `assumed` (completed and verified 2026-10-20; UAT 9/9)
- [x] **Phase 2: Requirements & Framework** - Goals/tasks, scenarios, IA, task flows, navigation map, low-fi wireframes (completed 2026-10-20)
- [x] **Phase 3: Foundation** - Next.js + Tailwind scaffold, design tokens, shared components, D1 schema/seed, clash triggers, authorization layer, auth + demo logins (completed 2026-10-20)
- [x] **Phase 4: Role Interfaces (parallel wave)** - Coordinator, Student and Admin interfaces built by three agents in disjoint folders (no VERIFICATION/UAT; browser evidence was only "works")
- [~] **Phase 5: Cross-Cutting** - Alerts, reports/export, a11y pass, empty/error/loading states, Review & Confirm everywhere (all 6 plans built, 260 tests pass; human checkpoint not done; superseded by v2)
- [→] **Phase 6: Validation Kit & Iteration** - folded into v2 Phase 13
- [→] **Phase 7: Deploy & Final Documentation** - folded into v2 Phases 12–13 (Cloudflare deploy replaced by AWS + Vercel)

## Phases (milestone v2: FastAPI + Next.js rebuild)

- [ ] **Phase 8: Re-baseline & Restructure** - ADR-001 v3, kb fixes (clash rule, vocabulary, IA), repo split into `/backend` + `/frontend`, cleanup
- [ ] **Phase 9: FastAPI Backend** - Postgres schema, auth, domain logic ported from `lib/domain`, all endpoints, pytest port of the v1 tests
- [x] **Phase 10: Design System & App Shell** - UI-SPEC with a real visual direction, shadcn/ui tokens (light and dark), shell per role, login, typed API client
- [ ] **Phase 11: Role Screens** - Student, Coordinator and Admin screens rebuilt on the new design and wired to FastAPI, one role at a time
- [ ] **Phase 12: Deploy & Harden** - EC2 docker-compose + Caddy, Vercel, Playwright smoke tests of the 3 primary flows, a11y pass, security review
- [ ] **Phase 13: Validation & Final Docs** - Usability kit, heuristic evaluation and walkthrough, team sessions (team only), iterations, `docs/final/`, infographic

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

**Plans**: 8 plans
Plans:
**Wave 0** *(serial; amends the freeze, awaiting user confirmation of assumption A1)*
- [x] 04-00-PLAN.md — domain additions (new lib/domain files), 8 status keys, date helpers, worktree setup checklist

**Wave 1** *(parallel, one worktree and one route folder each)*
- [x] 04-01-PLAN.md — Coordinator part 1: actions, helpers, shell, My Events, New event, confirm flow, calendar/tasks/notifications
- [x] 04-02-PLAN.md — Student part 1: actions, helpers, shell, Discover, register/cancel flows
- [x] 04-03-PLAN.md — Admin part 1: actions, helpers, shell, Dashboard

**Wave 2** *(parallel across roles; each continues in its own worktree after its part 1)*
- [x] 04-04-PLAN.md — Coordinator part 2: guided builder, event monitor, live-event edit/cancel
- [x] 04-05-PLAN.md — Student part 2: event detail, My events + calendar, My tasks, Alerts
- [x] 04-06-PLAN.md — Admin part 2: approvals split pane, calendar with venue lanes, venues and resources

**Wave 3**
- [x] 04-07-PLAN.md — merge check, full gate, browser flows, handoff, measurement sheet (has checkpoint)
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

## Milestone v2: FastAPI + Next.js rebuild

Decided by the user on 2026-10-23. Stack, rules and audit summary are in `CLAUDE.md`, and each phase folder has a `CONTEXT.md` brief.
- **Process:** lean. Work one phase per session and make one commit per verified phase. No worktrees or frozen files.
- **Requirements:** carry over by id. The behaviour v1 requirements describe must keep holding on the new stack, and `REQUIREMENTS.md` "v2 Requirements" adds the new ids.

### Phase 8: Re-baseline & Restructure

**Goal**: Docs, kb and repo all describe the same system (FastAPI + Next.js) with no contradictions, and the repo has a clean `/backend` + `/frontend` layout before any new code.
**Depends on**: v1 Phase 5 (code frozen as the porting reference)
**Requirements**: REBASE-01, REBASE-02, REBASE-03, REBASE-04
**Success Criteria**:
  1. `adr-001-stack` is rewritten (v3: FastAPI + Postgres on AWS EC2, Next.js on Vercel) with its history kept. PROJECT.md, AGENTS.md and CLAUDE.md agree with it.
  2. `dom-domain-model` says only approved/open/ongoing events book a venue (pending requests may overlap and are resolved at approval). Templates, return/cancel reasons and the venue `active` flag are documented.
  3. `dom-status-vocabulary` covers event, task, registration and alert statuses. Every doc uses the canonical words (Pending approval, Done, Notifications).
  4. IA fixes: Coordinator "Tasks" is a cross-event screen, the ST-01 card leads to ST-02, and student time-clash is either a "warn" requirement or removed. The user confirms or changes ADR-002.
  5. The v1 app moves to `/frontend` (git mv). Cloudflare-only files are deleted (`wrangler.jsonc`, `open-next.config.ts`, `cloudflare-env.d.ts`, D1 scripts, `.continue-here.md`), `migrations/`, `seed/` and `scripts/` move to `/backend`, and `graphify-out/` is gitignored. `node kb/tools/build-index.mjs` passes.

### Phase 9: FastAPI Backend

**Goal**: A FastAPI service enforces every v1 business rule (plus the audit fixes) and exposes everything the three interfaces need, proven by tests against a real Postgres.
**Depends on**: Phase 8
**Requirements**: API-01, API-02, API-03, API-04, API-05, API-06
**Success Criteria**:
  1. `docker compose up` starts Postgres and the API; `GET /health` is OK; the schema and seed load from `backend/migrations` and `backend/seed`.
  2. **Clash rule:**
     - Saving two overlapping *approved* events at one venue is rejected by the exclusion constraint.
     - Two overlapping *pending* requests are allowed, and approving the second one fails with `VENUE_CLASH`.
     - A second registration for the same (event, user) is rejected by the unique constraint.
  3. **Rules ported from the v1 triggers into domain transactions:**
     - Capacity and waitlist, including promotion and its notification.
     - The status state machine.
     - Resource limits, now re-checked on approve and on reschedule.
  4. **Auth:**
     - Sign in, sign out and session cookie (hashed token stored), with argon2 passwords and a rate limit.
     - Demo login only when `DEMO_LOGIN=true`.
     - Every router, including CSV export, checks the actor's role; a student gets 403 on coordinator/admin endpoints.
  5. The v1 vitest domain and trigger cases are ported to pytest, plus new tests for criteria 2–4. `ruff check && pytest` passes.
  6. `/openapi.json` documents every endpoint, ready for `openapi-typescript`.

**Plans**: 6 plans
Plans:

- [x] 09-01-PLAN.md — scaffold, migrations, compose, seed
- [x] 09-02-PLAN.md — errors, guarded, Actor, DB test harness, clash tests
- [x] 09-03-PLAN.md — auth, sessions, rate limits, dependencies
- [x] 09-04-PLAN.md — allocations, rules, events, drafts, registrations
- [x] 09-05-PLAN.md — tasks, venues, catalog, views, people, notifications, admin bookings, reports, alerts, CSV
- [x] 09-06-PLAN.md — routers, schemas, openapi, smoke test, route auth matrix

### Phase 10: Design System & App Shell

**Goal**: The frontend has a deliberate visual identity ("modern campus SaaS") that keeps every accessibility rule, plus a working shell for each role connected to the API.
**Depends on**: Phase 9
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria**:
  1. A UI-SPEC (`gsd-ui-phase`) sets the visual direction, approved by the user:
     - type scale
     - palette as OKLCH tokens, light and dark
     - radius and elevation
     - motion (respects reduced-motion)
     - chart style
  2. **Components:**
     - shadcn/ui is set up on the tokens.
     - `StatusBadge` covers all status families with icon + text + colour.
     - The contrast test passes AA for both themes.
     - A-/A/A+ text size and the skip link still work.
  3. **ConfirmDialog:** focus starts on "Go back", and there is a destructive variant.
  4. **AppShell:**
     - Sidebar plus mobile sheet for Coordinator and Admin, and a bottom tab bar for Student.
     - The current nav item is marked correctly on subpages.
     - `/design` is guarded or removed.
  5. **Login and API:**
     - The redesigned login works against FastAPI through the `/api/*` rewrite, with a first-party cookie.
     - API types are generated by `openapi-typescript`.
     - One shared `ReportsPage` and one shared `EventCard` replace the duplicates.

**Plans**: 5 plans
Plans:

- [ ] 10-01-PLAN.md — OKLCH token foundation (light & dark), type scale, and contrast test upgrades
- [ ] 10-02-PLAN.md — StatusBadge expansion across all status families, ConfirmDialog focus/variant fixes, and polymorphic Button
- [ ] 10-03-PLAN.md — Role AppShells (sidebar + sheet for Coordinator/Admin, mobile bottom tab bar for Student), active link fix, and /design guard
- [ ] 10-04-PLAN.md — Component consolidation (unified ReportsPage with Recharts, EventCard, calendar view, and toast feedback)
- [ ] 10-05-PLAN.md — API rewrite proxy in next.config, openapi-typescript client typing, and modern login redesign

### Phase 11: Role Screens

**Goal**: Each role completes its primary task end to end, in the browser, on the new design and the FastAPI backend.
**Depends on**: Phase 10
**Requirements**: ROLE-01, ROLE-02, ROLE-03, ROLE-04 (re-delivers COORD-01..07, STUD-01..05, ADMIN-01..04, XCUT-01..06 on v2)
**Success Criteria**:
  1. **Student (ST-01..06):**
     - Discover with filters, then event detail, then Review & Confirm to register, join the waitlist or cancel, with toast feedback.
     - My Events with calendar, and My Tasks for organizers.
     - Notifications with a cheap unread count.
  2. **Coordinator (CO-01..08):**
     - The 5-step builder: template prefill and autosave, a free-venue picker, resources and tasks.
     - Review & Confirm to submit, then monitor, change or cancel (registrants are notified).
     - The Tasks screen, and Reports with charts and CSV.
  3. **Admin (AD-01..06):**
     - Dashboard with an attention list.
     - Approvals with a **live clash check** (two overlapping pending requests in the seed), approve or return with a reason.
     - Calendar with conflicts, Venues & Resources, and Reports with charts and CSV.
  4. **On every screen:**
     - Designed empty, loading and error states with plain-language messages.
     - 44px targets, a keyboard-only path and A+ text size.
     - Consistent vocabulary.
     - Each role's primary flow is driven in the browser and recorded (screenshots, real results only).

**Plans**: 3 plans (sequential; each role's browser gate must pass before the next starts)
Plans:

- [ ] 11-01-PLAN.md — Student screens ST-01..06 on FastAPI, with registration and browser/a11y gate
- [ ] 11-02-PLAN.md — Coordinator screens CO-01..08 and secondary routes on FastAPI
- [ ] 11-03-PLAN.md — Admin screens AD-01..06, live clash decision flow, and phase-wide verification

### Phase 12: Deploy & Harden

**Goal**: Anyone with the link can use the model over HTTPS, and it is reviewed for security.
**Depends on**: Phase 11
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEP-02
**Success Criteria**:
  1. The backend runs on one EC2 free-tier instance (docker-compose: Postgres + FastAPI + Caddy HTTPS on sslip.io), with a nightly `pg_dump` to S3 and a one-command redeploy script. (The user creates the AWS account.)
  2. The frontend is on Vercel (root `/frontend`, `API_URL` set) and reaches the backend through the rewrite.
  3. Playwright smoke tests of TT-C1, TT-S1 and TT-A1 pass against the deployed URL. Clash and double registration are rejected on production.
  4. **Security review:**
     - Authorization per role is checked.
     - No secrets in the repo or its history.
     - The demo-login decision is made explicitly.
     - The Lighthouse a11y score is at least 95 on each role's home page.

### Phase 13: Validation & Final Docs

**Goal**: The team can run usability tests on the deployed model, and the project is documented as a complete Goal-Directed Design.
**Depends on**: Phase 12
**Requirements**: VAL-01, VAL-02, VAL-03, DEP-03
**Honesty rule**: unchanged from v1 Phase 6. AI drafts the instruments; results, scores and quotes come only from the team.
**Success Criteria**: v1 Phase 6 criteria 1–4, plus v1 Phase 7 criterion 4 (`docs/final/` covers all 13 deliverables with links, and the design-model infographic exists).

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Research & Modeling Kit | 3/3 | Complete | 2026-10-20 |
| 2. Requirements & Framework | 5/5 | Complete | 2026-10-20 |
| 3. Foundation | 10/10 | Complete (Cloudflare; superseded by v2) | 2026-10-20 |
| 4. Role Interfaces (parallel wave) | 8/8 | Built, not formally verified (superseded by v2) | 2026-10-21 |
| 5. Cross-Cutting | 6/6 | Built, human checkpoint not done (superseded by v2) | - |
| 6. Validation Kit & Iteration | - | Folded into Phase 13 | - |
| 7. Deploy & Final Documentation | - | Folded into Phases 12–13 | - |
| 8. Re-baseline & Restructure | 0/TBD | Not started (next) | - |
| 9. FastAPI Backend | 0/6 | Planned | - |
| 10. Design System & App Shell | 0/5 | Planned | - |
| 11. Role Screens | 0/TBD | Not started | - |
| 12. Deploy & Harden | 0/TBD | Not started | - |
| 13. Validation & Final Docs | 0/TBD | Not started | - |
