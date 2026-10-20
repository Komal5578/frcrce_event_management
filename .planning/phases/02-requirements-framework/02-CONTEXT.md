# Phase 2: Requirements & Framework - Context

**Gathered:** 2026-10-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Paper design only: GDD deliverables 3-8 for the three role interfaces (Coordinator, Student, Admin). Finalise goals/tasks (`dom-goals-tasks`), scenarios and test tasks (`dom-scenarios`), requirements (`dom-requirements`), IA + navigation map (`docs/ia/`), task flows (`dom-flows`, `docs/flows/`) and low-fi wireframes (`docs/wireframes/`). Covers FRAM-01..FRAM-05. No app code, no Supabase, no design tokens (Phase 3). No new features beyond `adr-004-scope`.

</domain>

<decisions>
## Implementation Decisions

All decisions below were auto-selected (`--auto`, recommended default). Revisit any before planning if wrong.

### Traceability of goals/tasks to requirements (FRAM-01)
- **D-01:** Extend `kb/domain/goals-tasks.md` in place with a per-role table: goal -> task -> step -> requirement id (C1-C7, S1-S5, A1-A5, X1-X5). Add a coverage check at the bottom listing every requirement id and the task that satisfies it; no orphan tasks, no orphan ids.
- **D-02:** Confirm the Student Organizer as a flag, not a fourth interface (`adr-002-roles`); Organizer tasks live under the Student interface "My Tasks". Keep `adr-002-roles` confidence `assumed` until the team confirms.
- **D-03:** Keep confidence `derived` on goals/tasks, scenarios and flows. Nothing here is `evidence`.

### Scenarios and test tasks (FRAM-02)
- **D-04:** Keep the three existing narrative scenarios; add per role one test task written as a Phase 6 task-sheet entry (start state, goal in plain words, success criterion, max time), mirroring the task-success style in `src-evaluation-methods`. Add a second scenario per role for the error/edge path (Coordinator: venue clash; Student: full event -> waitlist; Admin: return with reason).
- **D-05:** Test tasks never name UI features as instructions ("Register for Robotics Workshop", not "use the Register button").

### Information architecture and navigation (FRAM-03)
- **D-06:** Top-level nav per `dom-flows`, max 5 per role. Coordinator: My Events / Calendar / Tasks / Notifications. Student: Discover / My Events / My Tasks (organizer only) / Notifications. Admin: Approvals / Calendar / Venues & Resources / Reports / Notifications. The A4 dashboard is the Admin home, shown above Approvals.
- **D-07:** IA deliverable = one Markdown file per interface in `docs/ia/` with a Mermaid sitemap plus a nav table (item, goal served, requirement ids), plus `docs/ia/shared-vocabulary.md` (terms and layout rules reused across roles, X4).
- **D-08:** Mobile-first for Student (phone), desktop-first for Coordinator and Admin; all three responsive. Student nav = bottom tab bar on phone; Coordinator/Admin = left sidebar on desktop collapsing to a menu.

### Task flows (FRAM-04)
- **D-09:** One Mermaid flowchart per primary journey in `docs/flows/` (coordinator-create-event, student-register, admin-approve) plus a short organizer-mark-task-done flow. Each flow marks the Review & Confirm node before every irreversible action (submit, register, cancel, approve, return) and the system-prefill steps. `kb/domain/flows.md` stays the one-page summary linking to `docs/flows/`.
- **D-10:** Each flow includes the error branch for its clash/duplicate case (venue taken, already registered, event full) showing the human message, not only the happy path.

### Low-fi wireframes (FRAM-05)
- **D-11:** Wireframes are ASCII/Markdown boxes, one file per interface (`docs/wireframes/coordinator.md`, `student.md`, `admin.md`), not Figma/Canva. Greyscale only; status shown as icon + vocabulary text label with a colour-name annotation (no colour fills). Every primary screen in the IA has a numbered wireframe in flow order citing its requirement ids.
- **D-12:** Screens to wire. Coordinator: My Events, New Event (template + details), Venue & slot picker, Resources, Tasks, Review & Confirm, Submitted/Monitor, Event summary. Student: Discover, Event detail, Review & Confirm (register), My Events + calendar, My Tasks, Notifications. Admin: Dashboard, Approvals queue + detail (clash check), Calendar with conflicts, Venues & Resources, Reports.
- **D-13:** Each role's primary screen shows the A-/A/A+ control position, an empty state and a plain-language error example (X2, X3).

### Requirements finalisation (deliverable 5)
- **D-14:** `dom-requirements` is already drafted. Finalise by adding one testable acceptance line and a must/should priority per requirement, ids unchanged. No new requirements; proposals go to `.planning/` as notes.

### Claude's Discretion
- Diagrams as Mermaid text in Markdown (no rendering toolchain).
- Exact file names and ordering inside `docs/ia/`, `docs/flows/`, `docs/wireframes/`.
- Wireframe fidelity details (box sizes, annotations).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project rules and scope
- `CLAUDE.md` - design rules, honesty rules, definition of done
- `AGENTS.md` - ownership (`docs/` is Phase 2 territory, no app code)
- `.planning/ROADMAP.md` (Phase 2 section) - goal and 5 success criteria
- `.planning/REQUIREMENTS.md` - FRAM-01..FRAM-05
- `kb/INDEX.md` - routing

### KB notes (design source of truth)
- `kb/domain/goals-tasks.md` - `dom-goals-tasks`, to be extended
- `kb/domain/scenarios.md` - `dom-scenarios`, to be extended
- `kb/domain/requirements.md` - `dom-requirements`, ids C1-C7, S1-S5, A1-A5, X1-X5
- `kb/domain/flows.md` - `dom-flows`, nav + flows summary
- `kb/domain/status-vocabulary.md` - `dom-status-vocabulary`, icon + text + colour
- `kb/domain/domain-model.md` - `dom-domain-model`, clash/double-registration rules
- `kb/domain/personas.md`, `docs/personas/` - proto-personas (`assumed`)
- `kb/domain/deliverable-map.md` - where each deliverable lives
- `kb/domain/hmi-problems.md` - problems the design must address
- `kb/decisions/adr-002-roles.md`, `kb/decisions/adr-004-scope.md` - roles and scope cuts
- `kb/source/` notes `src-hmi-principles`, `src-accessibility-areas`, `src-evaluation-methods`, `src-feature-vs-goal-directed`
- `kb/source/attendance-reference/` - method example only, never copy attendance features

### Prior phase outputs
- `docs/research/`, `docs/personas/` - Phase 1 instruments and proto-personas

</canonical_refs>

<code_context>
## Existing Code Insights

No application code yet (greenfield; Phase 3 scaffolds `app/`).

### Reusable Assets
- `kb/tools/build-index.mjs`: KB check, must pass after any kb change
- `docs/research/check-kit.mjs`: pattern for a runnable check script over docs

### Established Patterns
- Markdown + YAML frontmatter (`id, type, title, tags, confidence, sources, summary, updated`) for kb notes; new kb notes need a row in `kb/INDEX.md`
- One runnable check per non-trivial artifact: a small script verifying every requirement id appears in goals-tasks and every IA screen has a wireframe

### Integration Points
- Phase 3 builds tokens/components from the status vocabulary and wireframes
- Phase 4 agents build each role's screens from `docs/wireframes/<role>.md` and `docs/flows/`
- Phase 6 reuses test tasks as usability task sheets

</code_context>

<specifics>
## Specific Ideas

- Number wireframes in flow order so a person can walk a primary flow screen by screen (success criterion 5).
- Reuse scenario names (Prof. Anita, Rohan, Dr. Sharma) in test tasks.

</specifics>

<deferred>
## Deferred Ideas

- Hi-fi mockups in Figma/Canva - Phases 3-5 build the real app instead
- Hindi/Marathi wireframe variants - v2 (I18N-01)

</deferred>

---

*Phase: 02-requirements-framework*
*Context gathered: 2026-10-20*
