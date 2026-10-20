# Requirements: College Event Planning and Management System

**Defined:** 2026-10-20
**Core Value:** Each role completes its primary task fast, with few errors, and always knows the state of the system; clashes are impossible, not just discouraged.

Source: `kb/domain/requirements.md` (`dom-requirements`, ids in brackets are the stable KB ids), `dom-deliverable-map`, `dom-hmi-problems`, `adr-004-scope`. Cite both the REQ-ID and the KB id in plans and commits.

## v1 Requirements

### Research and Modeling (GDD deliverables 1-2)

- [x] **RSCH-01**: Team has an interview guide and questionnaire for coordinators, students and admins, ready to run (instruments only, no invented results)
- [x] **RSCH-02**: Persona template and proto-personas exist, each labelled `assumed` until real research replaces them (`dom-personas`)

### Requirements and Framework (GDD deliverables 3-8)

- [ ] **FRAM-01**: Goals and task analysis per role is written and linked to requirement ids (`dom-goals-tasks`)
- [ ] **FRAM-02**: Scenarios and test tasks are written per role (`dom-scenarios`)
- [ ] **FRAM-03**: Information architecture and navigation map exist for each of the three interfaces
- [ ] **FRAM-04**: Task flows exist for the Coordinator, Student and Admin primary journeys (`dom-flows`)
- [ ] **FRAM-05**: Low-fi wireframes cover every primary screen of the three interfaces

### Foundation

- [ ] **FOUND-01**: Next.js + Tailwind app builds and runs locally, with dev/build/lint/test commands recorded in `CLAUDE.md`
- [ ] **FOUND-02**: Design tokens, status vocabulary components (icon + text + colour) and shared UI components exist, with contrast ratios checked (`dom-status-vocabulary`, X1)
- [ ] **FOUND-03**: Supabase schema, seed data and RLS policies implement the domain model (`dom-domain-model`)
- [ ] **FOUND-04**: A venue/time clash cannot be saved: the database rejects it via exclusion constraint (X5)
- [ ] **FOUND-05**: A user cannot register for the same event twice: the database rejects it via unique constraint (X5)
- [ ] **FOUND-06**: User can sign in and land in the interface for their role
- [ ] **FOUND-07**: Reviewer can enter any of the three interfaces from a one-click demo login with seeded test users

### Coordinator interface

- [ ] **COORD-01**: Coordinator can create an event from a template with pre-filled defaults, and the draft autosaves [C1]
- [ ] **COORD-02**: Venue picker lists only venues free for the chosen slot, with capacity shown [C2]
- [ ] **COORD-03**: Coordinator can request resources for an event and sees availability [C3]
- [ ] **COORD-04**: Coordinator can allocate tasks to students with due dates and see task status [C4]
- [ ] **COORD-05**: Coordinator can submit an event for approval via Review & Confirm and see its approval state [C5]
- [ ] **COORD-06**: Coordinator can monitor registrations against capacity, overdue tasks and event status [C6]
- [ ] **COORD-07**: Coordinator can edit or cancel an event with confirmation, and registrants are notified in-app [C7]

### Student interface

- [ ] **STUD-01**: Student can discover events with search and filters for date, type, venue and department [S1]
- [ ] **STUD-02**: Event detail shows what, when, where, seats left and status at a glance [S2]
- [ ] **STUD-03**: Student can register via Review & Confirm, is waitlisted when the event is full, and can cancel a registration [S3]
- [ ] **STUD-04**: Student can see My Registrations and a calendar view, with in-app reminders [S4]
- [ ] **STUD-05**: Student Organizer can see My Tasks with due dates and mark them done [S5]

### Admin interface

- [ ] **ADMIN-01**: Admin has an approvals queue showing clash check and resources, and can approve or return with a reason [A1]
- [ ] **ADMIN-02**: Admin sees a calendar of all events and venues with conflicts highlighted [A2]
- [ ] **ADMIN-03**: Admin can manage venues and resources [A3]
- [ ] **ADMIN-04**: Admin dashboard shows events, pending approvals, utilisation and department split [A4]

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

- [ ] **DEP-01**: App is deployed on Vercel against a Supabase project, reachable at a shareable URL
- [ ] **DEP-02**: RLS policies are reviewed and no secrets are committed before deploy
- [ ] **DEP-03**: Final documentation and the one-page design-model infographic are complete (`src-model-infographic`)

## v2 Requirements

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
| FRAM-01 | Phase 2 | Pending |
| FRAM-02 | Phase 2 | Pending |
| FRAM-03 | Phase 2 | Pending |
| FRAM-04 | Phase 2 | Pending |
| FRAM-05 | Phase 2 | Pending |
| FOUND-01 | Phase 3 | Pending |
| FOUND-02 | Phase 3 | Pending |
| FOUND-03 | Phase 3 | Pending |
| FOUND-04 | Phase 3 | Pending |
| FOUND-05 | Phase 3 | Pending |
| FOUND-06 | Phase 3 | Pending |
| FOUND-07 | Phase 3 | Pending |
| COORD-01 | Phase 4 | Pending |
| COORD-02 | Phase 4 | Pending |
| COORD-03 | Phase 4 | Pending |
| COORD-04 | Phase 4 | Pending |
| COORD-05 | Phase 4 | Pending |
| COORD-06 | Phase 4 | Pending |
| COORD-07 | Phase 4 | Pending |
| STUD-01 | Phase 4 | Pending |
| STUD-02 | Phase 4 | Pending |
| STUD-03 | Phase 4 | Pending |
| STUD-04 | Phase 4 | Pending |
| STUD-05 | Phase 4 | Pending |
| ADMIN-01 | Phase 4 | Pending |
| ADMIN-02 | Phase 4 | Pending |
| ADMIN-03 | Phase 4 | Pending |
| ADMIN-04 | Phase 4 | Pending |
| XCUT-01 | Phase 5 | Pending |
| XCUT-02 | Phase 5 | Pending |
| XCUT-03 | Phase 5 | Pending |
| XCUT-04 | Phase 5 | Pending |
| XCUT-05 | Phase 5 | Pending |
| XCUT-06 | Phase 5 | Pending |
| VAL-01 | Phase 6 | Pending |
| VAL-02 | Phase 6 | Pending |
| VAL-03 | Phase 6 | Pending |
| DEP-01 | Phase 7 | Pending |
| DEP-02 | Phase 7 | Pending |
| DEP-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-20*
*Last updated: 2026-10-20 after roadmap creation*
