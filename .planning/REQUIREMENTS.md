# Requirements: College Event Planning and Management System

**Defined:** 2026-10-20
**Core Value:** Each role completes its primary task fast, with few errors, and always knows the state of the system; clashes are impossible, not just discouraged.

Source: `kb/domain/requirements.md` (`dom-requirements`, ids in brackets are the stable KB ids), `dom-deliverable-map`, `dom-hmi-problems`, `adr-004-scope`. Cite both the REQ-ID and the KB id in plans and commits.

## v1 Requirements

### Research and Modeling (GDD deliverables 1-2)

- [x] **RSCH-01**: Team has an interview guide and questionnaire for coordinators, students and admins, ready to run (instruments only, no invented results)
- [x] **RSCH-02**: Persona template and proto-personas exist, each labelled `assumed` until real research replaces them (`dom-personas`)

### Requirements and Framework (GDD deliverables 3-8)

- [x] **FRAM-01**: Goals and task analysis per role is written and linked to requirement ids (`dom-goals-tasks`)
- [x] **FRAM-02**: Scenarios and test tasks are written per role (`dom-scenarios`)
- [x] **FRAM-03**: Information architecture and navigation map exist for each of the three interfaces
- [x] **FRAM-04**: Task flows exist for the Coordinator, Student and Admin primary journeys (`dom-flows`)
- [x] **FRAM-05**: Low-fi wireframes cover every primary screen of the three interfaces

### Foundation

- [x] **FOUND-01**: Next.js + Tailwind app builds and runs locally, with dev/build/lint/test commands recorded in `CLAUDE.md`
- [x] **FOUND-02**: Design tokens, status vocabulary components (icon + text + colour) and shared UI components exist, with contrast ratios checked (`dom-status-vocabulary`, X1)
- [x] **FOUND-03**: D1 schema, seed data and access rules (authorization layer) implement the domain model (`dom-domain-model`)
- [x] **FOUND-04**: A venue/time clash cannot be saved: the database rejects it via a trigger (X5)
- [x] **FOUND-05**: A user cannot register for the same event twice: the database rejects it via unique constraint (X5)
- [x] **FOUND-06**: User can sign in and land in the interface for their role
- [x] **FOUND-07**: Reviewer can enter any of the three interfaces from a one-click demo login with seeded test users

### Coordinator interface

- [x] **COORD-01**: Coordinator can create an event from a template with pre-filled defaults, and the draft autosaves [C1]
- [x] **COORD-02**: Venue picker lists only venues free for the chosen slot, with capacity shown [C2]
- [x] **COORD-03**: Coordinator can request resources for an event and sees availability [C3]
- [x] **COORD-04**: Coordinator can allocate tasks to students with due dates and see task status [C4]
- [x] **COORD-05**: Coordinator can submit an event for approval via Review & Confirm and see its approval state [C5]
- [x] **COORD-06**: Coordinator can monitor registrations against capacity, overdue tasks and event status [C6]
- [x] **COORD-07**: Coordinator can edit or cancel an event with confirmation, and registrants are notified in-app [C7]

### Student interface

- [x] **STUD-01**: Student can discover events with search and filters for date, type, venue and department [S1]
- [x] **STUD-02**: Event detail shows what, when, where, seats left and status at a glance [S2]
- [x] **STUD-03**: Student can register via Review & Confirm, is waitlisted when the event is full, and can cancel a registration [S3]
- [x] **STUD-04**: Student can see My Registrations and a calendar view, with in-app reminders [S4]
- [x] **STUD-05**: Student Organizer can see My Tasks with due dates and mark them done [S5]

### Admin interface

- [x] **ADMIN-01**: Admin has an approvals queue showing clash check and resources, and can approve or return with a reason [A1]
- [x] **ADMIN-02**: Admin sees a calendar of all events and venues with conflicts highlighted [A2]
- [x] **ADMIN-03**: Admin can manage venues and resources [A3]
- [x] **ADMIN-04**: Admin dashboard shows events, pending approvals, utilisation and department split [A4]

### Cross-cutting (Phase 5)

- [ ] **XCUT-01**: Reports export as CSV or print [A5]
- [ ] **XCUT-02**: Alerts for clash, low registrations and overdue tasks are surfaced without overwhelming the screen (`dom-hmi-problems` #6)
- [ ] **XCUT-03**: Every screen has designed empty, loading and error states with plain-language messages [X2]
- [ ] **XCUT-04**: Text size control A-/A/A+, 44px targets and a full keyboard path work on every screen [X3]
- [ ] **XCUT-05**: Same terms and layouts are used across roles; heuristic consistency check passes [X4]
- [ ] **XCUT-06**: Every irreversible action (submit, register, cancel, approve) goes through Review & Confirm with plain-language feedback afterwards [X2]

### Validation (GDD deliverables 10-12)

- [ ] **VAL-01**: Usability test plan, task sheets and metric sheets are ready for the team to run (`src-evaluation-methods`)
- [ ] **VAL-02**: Heuristic evaluation, cognitive walkthrough and accessibility checklist are completed against the built app
- [ ] **VAL-03**: Findings from real team sessions are recorded and drive a redesign iteration (results come only from the team)

### Deploy and documentation (GDD deliverable 13)

- [ ] **DEP-01**: App is deployed on Cloudflare Workers with D1, reachable at a shareable URL
- [ ] **DEP-02**: Authorization layer is reviewed and no secrets are committed before deploy
- [ ] **DEP-03**: Final documentation and the one-page design-model infographic are complete (`src-model-infographic`)

## v2 Requirements (FastAPI + Next.js rebuild, added 2026-10-23)

v1 behaviour (COORD, STUD, ADMIN, XCUT, VAL, DEP) must keep holding on the new stack. The ids below are what is new.

### Re-baseline (Phase 8)

- [x] **REBASE-01**: ADR-001 v3 (FastAPI + Postgres on AWS, Next.js on Vercel) is recorded. PROJECT.md, AGENTS.md and CLAUDE.md agree with it.
- [x] **REBASE-02**: The domain model says only approved and later events book a venue (makes TT-A1 reachable). Templates, reasons and the venue `active` flag are documented (`dom-domain-model`).
- [x] **REBASE-03**: The status vocabulary covers event, task, registration and alert statuses, and all docs use the canonical words (`dom-status-vocabulary`). IA inconsistencies are fixed.
- [x] **REBASE-04**: The repo is split into `/backend` + `/frontend`, with Cloudflare-only and generated clutter removed.

### Backend (Phase 9)

- [ ] **API-01**: FastAPI + Postgres run with `docker compose up`, and the schema and seed load from plain SQL migrations.
- [ ] **API-02**: An exclusion constraint blocks venue clashes among approved/open/ongoing events. Overlapping pending requests are allowed, and approving the clashing one fails (X5).
- [ ] **API-03**: Capacity/waitlist with promotion, the status state machine and resource limits (re-checked on approve and on reschedule) are enforced in domain transactions.
- [ ] **API-04**: Auth uses a hashed-token session cookie, argon2 passwords, a sign-in rate limit and a demo login gated by an env flag.
- [ ] **API-05**: Every endpoint, including CSV export, checks the actor's role. Cross-role access gets 403.
- [ ] **API-06**: The v1 domain and trigger tests are ported to pytest and pass, and OpenAPI documents every endpoint.

### Design system and shell (Phase 10)

- [ ] **UI-01**: A user-approved UI-SPEC sets the visual direction (type, OKLCH palette in light and dark, radius, elevation, motion, charts).
- [ ] **UI-02**: shadcn/ui components on the tokens, with StatusBadge covering all status families. The contrast test passes AA in both themes (X1).
- [ ] **UI-03**: ConfirmDialog focuses "Go back" first and has a destructive variant (X2).
- [ ] **UI-04**: Role AppShells: sidebar + sheet for Coordinator/Admin, bottom tab bar for Student, correct current-nav marking, A-/A/A+ kept (X3).
- [ ] **UI-05**: The login and typed API client (openapi-typescript, `/api/*` rewrite, first-party cookie) work against FastAPI.

### Role screens (Phase 11)

- [ ] **ROLE-01**: Student screens ST-01..06 work on v2 (STUD-01..05).
- [ ] **ROLE-02**: Coordinator screens CO-01..08 work on v2 (COORD-01..07, XCUT-01).
- [ ] **ROLE-03**: Admin screens AD-01..06 work on v2, with a reachable live clash check (ADMIN-01..04, XCUT-01, XCUT-02).
- [ ] **ROLE-04**: Every screen has empty, loading and error states, a keyboard path, 44px targets and a consistent vocabulary (XCUT-03..06).

### Deploy (Phase 12)

- [ ] **DEPLOY-01**: The backend is live on AWS EC2 free tier over HTTPS, with a nightly DB backup to S3.
- [ ] **DEPLOY-02**: The frontend is live on Vercel and reaches the backend through the rewrite.
- [ ] **DEPLOY-03**: Playwright smoke tests of the three primary flows pass against the deployed URLs.

Note: DEP-01 (Cloudflare deploy) is superseded by DEPLOY-01/02. DEP-02 moves to Phase 12 and DEP-03 to Phase 13.

## Deferred (stretch)

Deferred, in this order (`adr-004-scope`).

### Stretch

- **I18N-01**: Interface available in Hindi and Marathi
- **EXPT-01**: CSV and print polish beyond the v1 export
- **CHKN-01**: Event check-in

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email/SMS notifications | In-app only; no provider or deliverability work (`adr-004-scope`) |
| Payments or ticketing | Not part of the allotted topic |
| Native mobile apps | Responsive web covers phones |
| QR check-in, calendar sync | No role's goal needs them in v1 |
| Multi-college tenancy | Single college only |
| Vector search for the KB | grep by id is enough at this size (`adr-003-kb-format`) |
| Attendance features | The attendance documents are a method reference only |
| Invented research or usability results | Violates the honesty rule; only real team data may be `evidence` |

## Traceability

Which phases cover which requirements. Filled during roadmap creation (2026-10-20).

| Requirement | Phase | Status |
|-------------|-------|--------|
| RSCH-01 | Phase 1 | Complete |
| RSCH-02 | Phase 1 | Complete |
| FRAM-01 | Phase 2 | Complete |
| FRAM-02 | Phase 2 | Complete |
| FRAM-03 | Phase 2 | Complete |
| FRAM-04 | Phase 2 | Complete |
| FRAM-05 | Phase 2 | Complete |
| FOUND-01 | Phase 3 | Complete |
| FOUND-02 | Phase 3 | Complete |
| FOUND-03 | Phase 3 | Complete |
| FOUND-04 | Phase 3 | Complete |
| FOUND-05 | Phase 3 | Complete |
| FOUND-06 | Phase 3 | Complete |
| FOUND-07 | Phase 3 | Complete |
| COORD-01 | Phase 4 | Complete |
| COORD-02 | Phase 4 | Complete |
| COORD-03 | Phase 4 | Complete |
| COORD-04 | Phase 4 | Complete |
| COORD-05 | Phase 4 | Complete |
| COORD-06 | Phase 4 | Complete |
| COORD-07 | Phase 4 | Complete |
| STUD-01 | Phase 4 | Complete |
| STUD-02 | Phase 4 | Complete |
| STUD-03 | Phase 4 | Complete |
| STUD-04 | Phase 4 | Complete |
| STUD-05 | Phase 4 | Complete |
| ADMIN-01 | Phase 4 | Complete |
| ADMIN-02 | Phase 4 | Complete |
| ADMIN-03 | Phase 4 | Complete |
| ADMIN-04 | Phase 4 | Complete |
| XCUT-01 | Phase 5 (built, unverified) → re-delivered by ROLE-02..04 | Pending |
| XCUT-02 | Phase 5 (built, unverified) → re-delivered by ROLE-02..04 | Pending |
| XCUT-03 | Phase 5 (built, unverified) → re-delivered by ROLE-02..04 | Pending |
| XCUT-04 | Phase 5 (built, unverified) → re-delivered by ROLE-02..04 | Pending |
| XCUT-05 | Phase 5 (built, unverified) → re-delivered by ROLE-02..04 | Pending |
| XCUT-06 | Phase 5 (built, unverified) → re-delivered by ROLE-02..04 | Pending |
| VAL-01 | Phase 13 | Pending |
| VAL-02 | Phase 13 | Pending |
| VAL-03 | Phase 13 | Pending |
| DEP-01 | - | Superseded by DEPLOY-01/02 |
| DEP-02 | Phase 12 | Pending |
| DEP-03 | Phase 13 | Pending |
| REBASE-01 | Phase 8 | Complete |
| REBASE-02 | Phase 8 | Complete |
| REBASE-03 | Phase 8 | Complete |
| REBASE-04 | Phase 8 | Complete |
| API-01 | Phase 9 | Pending |
| API-02 | Phase 9 | Pending |
| API-03 | Phase 9 | Pending |
| API-04 | Phase 9 | Pending |
| API-05 | Phase 9 | Pending |
| API-06 | Phase 9 | Pending |
| UI-01 | Phase 10 | Pending |
| UI-02 | Phase 10 | Pending |
| UI-03 | Phase 10 | Pending |
| UI-04 | Phase 10 | Pending |
| UI-05 | Phase 10 | Pending |
| ROLE-01 | Phase 11 | Pending |
| ROLE-02 | Phase 11 | Pending |
| ROLE-03 | Phase 11 | Pending |
| ROLE-04 | Phase 11 | Pending |
| DEPLOY-01 | Phase 12 | Pending |
| DEPLOY-02 | Phase 12 | Pending |
| DEPLOY-03 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0 ✓
- v2 requirements: 22 new (REBASE 4, API 6, UI 5, ROLE 4, DEPLOY 3), all mapped to Phases 8–12

---
*Requirements defined: 2026-10-20*
*Last updated: 2026-10-23: milestone v2 (FastAPI + Next.js) added*
