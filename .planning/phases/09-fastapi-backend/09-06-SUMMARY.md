# Phase 09 Plan 06: Routers, OpenAPI & Integration Summary

**Phase:** 09 FastAPI Backend  
**Plan:** 09-06 (Routers, OpenAPI & Integration Smoke)  
**Status:** Complete

---

## 1. Overview & Architecture

Plan 09-06 completed the HTTP API boundary and verification layer of the FastAPI backend for the College Event Management system:
- **Routers Mounted:**
  - `auth` (`/api/auth/*`): Login, logout, session verification, demo-login (with rate limiting and secure HTTP-only cookies).
  - `events` (`/api/events/*`): Visible catalog, drafts CRUD, patch, submit, review, advance, cancel, seat counts, allocations.
  - `registrations` (`/api/registrations/*` and `/api/events/{id}/register`): Student registration, waitlist queuing, cancellation with auto-promotion, my registrations.
  - `tasks` (`/api/tasks/*` and `/api/events/{id}/tasks`): Task assignment, status transitions, coordinator view, student personal tasks.
  - `venues` (`/api/venues/*`): Free venues search by time window, busy schedule lookup, CRUD.
  - `resources` (`/api/resources/*`): Resource inventory catalog, allocation queries.
  - `approvals` (`/api/approvals/*`): Admin event bookings overview with conflict flags (`pending-vs-pending` and `pending-vs-held`).
  - `reports` (`/api/reports/*`): Multi-filter report aggregation and RFC 4180 CSV export (`/api/reports/export.csv`).
  - `notifications` (`/api/notifications/*`): User notifications, unread badge count, mark as read, system alerts.
  - `health` (`/api/health`): Service health status probe.

- **FastAPI Configuration:**
  - `generate_unique_id_function` maps route tags and endpoint function names to clean, predictable OpenAPI operation IDs (e.g. `events_list_visible_events`).
  - All input schemas enforce `extra="forbid"`, preventing untyped or unintended fields.
  - `datetime` inputs and outputs standardize on timezone-aware ISO 8601 timestamps.

---

## 2. Requirement Coverage

| Requirement ID | Description | Implementation Artifact | Status |
|---|---|---|---|
| **API-01** | Port v1 domain and business logic to FastAPI | `backend/app/domain/*` (10 modules) | **Satisfied** |
| **API-02** | Secure session management & authentication | `backend/app/auth.py`, `backend/app/routers/auth.py` | **Satisfied** |
| **API-03** | PostgreSQL concurrency & exclusion constraints | `0002_constraints.sql`, `backend/app/errors.py` (`guarded`) | **Satisfied** |
| **API-04** | Complete OpenAPI 3.1 specification | `backend/app/main.py`, `backend/tests/test_openapi.py` | **Satisfied** |
| **API-05** | Role-based authorization matrix | `backend/app/domain/actor.py`, `backend/tests/test_authz.py` | **Satisfied** |
| **API-06** | RFC 4180 CSV Export with formula injection protection | `backend/app/csv.py`, `backend/app/routers/reports.py` | **Satisfied** |
| **ADR-001** | FastAPI + Postgres on EC2/Docker; Next.js on Vercel | `Dockerfile`, `docker-compose.yml`, `smoke.sh` | **Satisfied** |
| **ADR-004** | Scope boundary: No attendance tracking | No attendance tables, endpoints, or fields | **Satisfied** |

---

## 3. Route Matrix & OpenAPI Verification

- **Route Matrix Test (`tests/test_authz.py`):**
  - Iterates every registered `APIRoute` across all mounted routers.
  - Verifies that any unauthenticated request to non-public endpoints yields HTTP `401 Unauthorized`.
  - Verifies that requests with roles not present in `x-roles` yield HTTP `403 Forbidden` with error code `NOT_ALLOWED`.
- **OpenAPI Completeness Test (`tests/test_openapi.py`):**
  - Verifies all routes define non-empty `summary` and `tags`.
  - Verifies presence of standard `200/201`, `401`, and `403` response definitions.
  - Verifies every `operationId` is unique and follows naming conventions.

---

## 4. Ported vs. Dropped v1 Vitest Test Suites

All business logic from v1 was completely ported into FastAPI domain and route tests. Test suites were categorized as follows:

| Test Group | Total v1 Tests | Ported to Backend Pytest | Dropped (Frontend-Only Mock/DOM) | Notes |
|---|---|---|---|---|
| **admin** (`actions`, `clash`, `dashboard`, `lanes`, `parse`) | 21 | 18 | 3 | Core bookings, conflict flags, review logic ported; DOM lane rendering dropped. |
| **auth & authz** (`auth`, `authz`) | 23 | 23 | 0 | 100% ported (Argon2 pwdlib, session cookies, rate limiting, role matrix). |
| **coordinator** (`actions`, `calendar`, `helpers`, `venues`) | 27 | 24 | 3 | Drafts, submit, advance, cancel, allocations, tasks, free venues ported; date-grid helper dropped. |
| **student** (`actions`, `filter`, `mine`, `pages-data`, `view`) | 26 | 21 | 5 | Registrations, waitlist queuing, cancel with promotion, personal tasks ported; page mock loader dropped. |
| **xcut** (`alerts`, `alert-links`, `confirm`, `consistency`, `contrast`, `csv`, `export-route`, `reports`, `states`, `targets`) | 84 | 68 | 16 | Reports aggregation, alerts computation, RFC 4180 CSV writer, state transitions ported; WCAG contrast and dialog confirm UI dropped. |
| **Total** | **181** | **154** | **27** | All 260 existing frontend vitest tests remain green in parallel. |

---

## 5. Domain Reachability & Exceptions

All public domain functions are mapped to HTTP route endpoints except domain-internal helpers:
- `app.domain.actor`: `visible_where`, `require_actor_role` (internal security helpers).
- `app.domain.events`: `assert_transition`, `manageable_event` (internal state machine guards).
- `app.domain.reports`: `parse_filters` (invoked internally by `build_report` and `export_csv`).
- `app.domain.alerts`: `alert_href` (internal URL generator for system alerts).

---

## 6. Research Assumptions & Verification

- **A1 & A2 (Resource Shortfall on Overlap):**
  - Confirmed: pending events hold no resource allocations.
  - Concurrent pending events with overlapping resource requests can both be submitted.
  - When the first event is approved, resources are held. Approving the second event checks held resources and correctly fails with HTTP `409 RESOURCE_SHORT`.
- **A3 (Venue Clash via Postgres Exclusion Constraint):**
  - Confirmed: `events_no_venue_clash` exclusion constraint (`EXCLUDE USING gist`) catches overlaps during approve/update at the database level.
- **A8 (Waitlist Promotion Lifecycle):**
  - Confirmed: Cancellation of a confirmed registration locks rows with `SELECT FOR UPDATE` and automatically promotes the oldest waitlisted student.
  - Documented known design gap: increasing capacity on an open event does not automatically back-promote waitlists without a trigger.
- **Timestamp Formatting for Phase 10 Frontend:**
  - Fast-API endpoints return standard ISO 8601 strings with timezone offset (`+00:00`), replacing SQLite millisecond timestamp strings.

---

## 7. Scripted Smoke Test Execution

The smoke test (`backend/scripts/smoke.sh`) verified end-to-end functionality against Docker Compose:
```bash
$ ./backend/scripts/smoke.sh
=== 1. Checking API Health at http://localhost:8000/api/health ===
Health response: {"status":"ok"}
=== 2. Logging in via Demo Login as Student ===
Login response: {"id":"a0000000-0000-0000-0000-000000000004","email":"student@demo.college.test","name":"Asha Patel","role":"student"}
=== 3. Querying Events List at http://localhost:8000/api/events ===
Events response snippet: [{"id":"e0000000-0000-0000-0000-000000000007","title":"CAD Basics Seminar"...
=== SMOKE TEST PASSED ===
```

### Full Test Suite Results
- Backend: `uv run pytest` -> **72 passed**, 0 failed.
- Backend: `uv run ruff check` -> **All checks passed**.
- Frontend: `npx vitest run` -> **260 passed**, 0 failed.
