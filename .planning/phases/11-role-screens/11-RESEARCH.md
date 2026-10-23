# Phase 11: Role Screens - Research

**Researched:** 2026-10-23
**Domain:** Porting Next.js role screens from the SQLite reference to the FastAPI/Postgres API
**Confidence:** HIGH for repository structure and API coverage; MEDIUM for sequencing because Phase 10 is not recorded complete

## User Constraints

### Locked Decisions
- Build the roles **one after another**, each with its own plan. A role's primary flow must work in the browser before the next role starts.
- Rebuild the Student, Coordinator, and Admin screen inventories in `CONTEXT.md` against the Phase 10 design system and FastAPI backend.
- Every screen needs empty, loading (`loading.tsx`), and error states with plain-language copy.
- Status is shown as icon + text + colour; use canonical vocabulary.
- Keyboard-only path, minimum 44px targets, and A+ text size are required.
- Use the existing IA, flows, wireframes, test tasks, v1 pages, and `_lib` view helpers as source material; reuse logic and restyle the screens.
- Notifications navigation uses `/notifications/unread-count`, not a full notification-list fetch.
- Record real screenshots and keyboard runs in each role summary; never invent timing or usability evidence.

### Codex's Discretion
- The phase context does not list discretion areas. Keep implementation choices within existing project patterns and the approved phase UI contract.

### Deferred Ideas (OUT OF SCOPE)
- ADR-004 scope cuts remain binding: no email/SMS, payments, QR check-in, calendar sync, native apps, multi-tenancy, vector search, or Hindi/Marathi localization.
- Deployment and security hardening belong to Phase 12; real team usability sessions belong to Phase 13.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROLE-01 | Student screens ST-01..06 work on v2 (STUD-01..05). | Existing student route and helpers can be ported; API routes cover event listing/detail, registrations, tasks, notifications and unread count. |
| ROLE-02 | Coordinator screens CO-01..08 work on v2 (COORD-01..07, XCUT-01). | Existing builder and monitoring patterns exist; API covers templates, draft autosave, free venues, resource availability, tasks, event changes, reports and notifications. |
| ROLE-03 | Admin screens AD-01..06 work on v2, with reachable live clash check (ADMIN-01..04, XCUT-01, XCUT-02). | API covers pending event data through event listing, review, bookings with conflicts, catalogs and reports; seeded overlapping pending requests are the required live-clash fixture. |
| ROLE-04 | Every screen has empty, loading and error states, keyboard path, 44px targets and consistent vocabulary (XCUT-03..06). | Phase 10 UI contract and existing `loading.tsx`/`error.tsx` patterns establish the shell; verify all new role routes against these invariants. |

## Summary

Phase 11 is a migration of existing role behavior to the new backend, not a product redesign. The repository already has role routes, screen helpers, flow definitions and the FastAPI endpoints needed for most of the journeys. The frontend still imports `frontend/lib/domain/*`, which is the SQLite/D1 reference implementation, and `frontend/next.config.ts` has no API rewrite. Phase 10 is expected to supply the typed API client and rewrite; role work should consume those rather than calling the old domain modules or writing another fetch layer. [VERIFIED: repository files `frontend/app/(student)/student/page.tsx`, `frontend/app/(coordinator)/coordinator/page.tsx`, `frontend/app/(admin)/admin/page.tsx`, `frontend/lib/domain/*`, `frontend/next.config.ts`, `backend/app/routers/*`]

The smallest coherent delivery is three sequential plans, Student then Coordinator then Admin. Each plan should finish its role's browser flow before the next begins. Existing `_lib` pure view helpers and route-specific UI can be retained where they operate on API response shapes; UI should adopt Phase 10 shared components and route-level loading/error patterns. [VERIFIED: `CONTEXT.md`, `ROADMAP.md`, existing route tree]

**Primary recommendation:** First confirm Phase 10 is executed and verified, including the shared API client and UI contract; then port the existing Student flow, Coordinator flow, and Admin flow in that order, mapping each call to the existing FastAPI endpoint and preserving server-side role authorization.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Role access and business rules | API / Backend | Frontend Server (SSR) | API domains enforce actor-based authorization; route guards keep unauthorized users out of role pages. |
| Role screen rendering and navigation | Frontend Server (SSR) | Browser / Client | App Router server components already load data; client components are needed only for interactive forms, filters or calendars. |
| Drafts, registration, approvals, tasks and catalog changes | API / Backend | Frontend Server (SSR) | Existing FastAPI routes call `app.domain`; frontend should call these endpoints through Phase 10 API client. |
| Calendar display and filtering | Frontend Server (SSR) | Browser / Client | Backend provides event/bookings windows; view layout and filtering belong to role screens. |
| Persistent state and clash constraints | Database / Storage | API / Backend | Postgres owns unique registration and exclusion constraints; UI availability is assistance, not enforcement. |

## Existing Stack and Patterns

- Next.js App Router with React server components is already used for role pages; client components handle forms/actions. `next` and `react` are pinned in `frontend/package.json`; no Phase 11 dependency addition is indicated. [VERIFIED: `frontend/package.json`, existing role pages]
- `lucide-react`, Tailwind v4 and shared UI components exist. Reuse Phase 10 status, buttons, dialogs, shell and toast components when verified present. [VERIFIED: `frontend/package.json`, `frontend/components/ui/`, Phase 10 plan/spec artifacts]
- FastAPI routes already provide role-guarded JSON endpoints. Authorization must remain in `backend/app/domain`; do not move business rules into route handlers or treat hidden UI actions as security. [VERIFIED: `backend/app/routers/*.py`, `CLAUDE.md`, `dom-domain-model`]
- Frontend API types are generated from FastAPI OpenAPI per `CLAUDE.md`; never hand-write API client types.

## API Coverage and Role Mapping

| Role journey | Existing API coverage | Planning implication |
|---|---|---|
| Student Discover/detail | `GET /api/events`, `GET /api/events/{event_id}`, `GET /api/venues` | Search and the date/type/venue/department filters can use event/venue data already loaded by the page. Confirm event fields in generated API types. |
| Register/waitlist/cancel | `POST` and `DELETE /api/events/{event_id}/register`, `GET /api/events/{event_id}/seats`, `GET /api/registrations/mine` | Keep Review & Confirm before irreversible registration/cancel actions; backend owns capacity and duplicate checks. |
| Student My Events/calendar/tasks/notifications | registrations mine, events list, `GET /api/tasks/mine`, `GET /api/notifications`, `GET /api/notifications/unread-count`, mark-read route | Build calendar from returned registrations/events; show organizer tasks only when appropriate. Use unread-count endpoint for nav badge. |
| Coordinator builder | `GET /api/events/templates`; create and patch `/api/events/drafts`; `/api/venues/free`; `/api/resources` and `/api/resources/{id}/available`; event allocations and tasks routes | Preserve template defaults and autosave. Availability is checked from API; handle `VENUE_CLASH` and `RESOURCE_SHORT` returned at submit/approval as races can occur. |
| Coordinator monitor/change | event list/detail, event task list, coordinator task list, `PATCH /api/events/{id}`, submit, cancel, reports, notifications | Use existing `app/domain` semantics through API. Notify registrants in-app after changes/cancellation according to current API/domain behavior. |
| Admin dashboard/queue/detail | event list, `POST /api/events/{id}/review`, `GET /api/admin/bookings?from=&to=` | Queue can select pending requests from event data. The approval-detail clash check must show overlapping pending requests; approval must surface a conflict failure clearly. |
| Admin calendar/catalog/reports | admin bookings, `/api/venues`, `/api/resources`, catalog create/update routes, `/api/reports`, `/api/reports/export.csv` | Reuse backend reporting and CSV output; do not duplicate report aggregation or export logic in the browser. |

All endpoint existence and route-level role declarations are verified in `backend/app/routers/{events,approvals,registrations,tasks,venues,resources,notifications,reports}.py`. The API method bodies delegate to `app.domain`, consistent with the authorization boundary.

## Recommended Plan Structure

1. **Student plan (ROLE-01):** port Discover/detail/Register & Confirm/My Events calendar/My Tasks/Notifications. Preserve mobile bottom navigation from Phase 10; derive calendar from registrations/events; include empty/loading/error states. Verify TT-S1 through browser flow, without reporting fabricated timings.
2. **Coordinator plan (ROLE-02):** port My Events, five-step template builder, live venue/resource availability, task allocation, submit Review & Confirm, monitoring, edit/cancel, cross-event tasks, reports and notifications. Use backend CSV/report endpoints and handle domain errors in plain language.
3. **Admin plan (ROLE-03):** dashboard and attention list, approvals queue/detail with live clash data, return-with-reason/approve confirmation, calendar, catalog management and reports. Keep the overlapping pending events in the provided seed; do not alter backend clash semantics to make the UI appear successful.

ROLE-04 is a cross-role acceptance gate and should be checked in each role plan rather than deferred to a fourth screen-build plan.

## Common Pitfalls

1. **Using the SQLite reference at runtime:** frontend route pages currently import `frontend/lib/domain/*`. Continuing those imports would bypass FastAPI and keep the old storage model live. Replace page/action data calls with the Phase 10 API client.
2. **Planning Phase 11 before Phase 10 is ready:** `.planning/STATE.md` currently says Phase 10 is next, and Phase 10 contains plans but no summaries/verification. Its shared shell/API work is a hard dependency; execution of role plans should not start until Phase 10 gate is green.
3. **Treating UI checks as integrity controls:** venue, resource, capacity and duplicate registration can change between display and submission. Handle backend errors and keep database/domain constraints authoritative (`dom-domain-model`).
4. **Making admin clashes unreachable:** pending events intentionally may overlap; admin should see clash details before approval. Do not hide pending events from the clash response or convert pending requests into bookings.
5. **Loading all notifications for a badge:** call unread-count, as the phase context explicitly requires.
6. **Expanding scope:** keep in-app notifications, CSV and existing calendar behavior; exclude ADR-004 cuts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Authentication/authorization | Role checks based only on hidden links or client state | Existing route guards plus actor-authorized FastAPI domain methods | Client visibility is not an authorization boundary. |
| API type definitions | Duplicated TypeScript request/response interfaces | Phase 10 generated OpenAPI types | Keeps frontend contract aligned with FastAPI schemas. |
| Clash/capacity/resource enforcement | Frontend-only validation or duplicate rules | Existing backend domain + Postgres constraints, with friendly error mapping | Availability can change after render; backend transaction remains authoritative. |
| CSV/report calculations | Browser-generated report aggregation or separate export implementation | `/api/reports` and `/api/reports/export.csv` | Maintains one source for report data and export formatting. |
| Status label/color mappings | Per-page ad hoc badges | Canonical shared `STATUS_META`/StatusBadge from Phase 10 | Prevents vocabulary and accessibility drift. |

## Project Constraints (from AGENTS.md)

- Read `kb/INDEX.md` before design, UX or scope decisions; consult only needed notes and cite ids.
- One GSD phase per session; use `.planning/` as state source.
- Never fabricate research, usability results, quotes or participants; mark guesses `assumed`.
- Do not expand beyond `adr-004-scope`; stay within Phase 11.
- FastAPI/Postgres backend and Next.js/Vercel frontend; `app/domain` is the authorization layer and route handlers call only it.
- API types are generated; do not hand-write them.
- Update the KB index only if KB files change; no KB change is required for this phase.

## Security Domain

- Every write screen must call the authenticated API. The backend route uses `current_actor` and `require_roles`; server route guards provide UX but do not replace API checks.
- Do not expose session tokens to client JavaScript. Use the Phase 10 first-party cookie/API forwarding implementation.
- Treat all event/task/catalog ids and form values as untrusted input; FastAPI schemas and domain validation remain authoritative.
- No new auth, crypto, storage, or external package is indicated by the phase scope.

## Validation Architecture

The project config enables Nyquist validation. Existing commands are `cd frontend && npm run lint && npm run typecheck && npm test && npm run build`; browser checks use the existing Playwright setup when Phase 12 adds/runs deployment smoke coverage. Existing unit tests should be extended only where the current role helper behavior changes; the phase's required acceptance remains a real browser walkthrough for each role.

| Req ID | Behavior | Test Type | Automated Command | Existing coverage |
|---|---|---|---|---|
| ROLE-01 | Student can find and register/waitlist, then see registration/tasks/notifications | Browser flow + existing unit tests | `cd frontend && npm test` | Existing v1 unit coverage; browser proof required |
| ROLE-02 | Coordinator builds/submits event and monitors/changes it | Browser flow + existing unit tests | `cd frontend && npm test` | Existing v1 domain tests; API behavior tested in backend suite |
| ROLE-03 | Admin approves/returns with live clash details and manages calendar/catalog/report | Browser flow + API/domain tests | `cd backend && pytest` | Backend tests are the authority for domain cases |
| ROLE-04 | Keyboard, 44px targets, A+, status vocabulary and route states | Manual keyboard/accessibility review plus lint/build | `cd frontend && npm run lint && npm run typecheck && npm run build` | Per-screen checklist required |

**Wave 0 gaps:** no role-specific v2 browser test suite is listed in current `frontend/package.json`; phase plan should identify the available browser automation setup before depending on it. Do not add a new dependency unless existing setup cannot cover the required browser flow.

## Open Questions / Dependencies (RESOLVED)

1. **RESOLVED — Phase 10 completion and UI approval:** `.planning/STATE.md` says Phase 10 is next and no Phase 10 summaries/verification are present. Phase 11 plans carry a hard execution gate: complete and verify Phase 10, including the shared API client and rewrite, before executing role plans.
2. **RESOLVED — Student registration overlap warning:** `dom-requirements` includes S6, but Phase 11 maps STUD-01..05 only. S6 remains out of scope for this phase.
3. **RESOLVED — Calendar behavior:** use date-window bookings for Admin and registration/event data for Student and Coordinator with existing calendar view helpers. Calendar sync remains excluded by `adr-004-scope`.

## Sources

### Repository sources (verified)
- `.planning/phases/11-role-screens/CONTEXT.md` — role order, screen inventories, invariants and evidence rules.
- `.planning/ROADMAP.md` — phase goal, requirements and success criteria.
- `.planning/REQUIREMENTS.md` — ROLE-01..04 and carried role requirements.
- `.planning/STATE.md` — Phase 10 is recorded as next; Phase 10 completion is not recorded.
- `.planning/phases/10-design-system-shell/CONTEXT.md`, `10-UI-SPEC.md`, `10-RESEARCH.md` — shared UI/API dependency.
- `backend/app/routers/*.py`, `backend/app/domain/*` — current API endpoints and domain ownership.
- `frontend/app/(student)`, `frontend/app/(coordinator)`, `frontend/app/(admin)`, `frontend/lib/domain/*` — porting reference and existing route patterns.
- `kb/domain/requirements.md` (`dom-requirements`), `kb/domain/domain-model.md` (`dom-domain-model`), `kb/domain/flows.md` (`dom-flows`), `kb/domain/scenarios.md` (`dom-scenarios`), `docs/ia/{student,coordinator,admin}.md`, `kb/decisions/adr-004-scope.md` (`adr-004-scope`).

### External documentation
- None consulted; this research records repository-local API and implementation facts. No new library is recommended.

## Metadata

**Confidence breakdown:** API coverage HIGH (direct route inspection); screen reuse HIGH (current files inspected); execution sequencing MEDIUM (Phase 10 is explicitly unresolved in project state).

**Research date:** 2026-10-23
**Valid until:** 2026-11-22, or until Phase 10/API contracts change.
