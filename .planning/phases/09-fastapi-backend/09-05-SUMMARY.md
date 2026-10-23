# Plan 09-05 Summary: Domain Support, Admin Flags, Reports & CSV

## 1. Objectives Achieved
- **Tasks & People Domain (`tasks.py`, `people.py`)**:
  - `set_task_status`: Assignee student, owning coordinator, or admin can set task status ("To do", "Doing", "Done"); status values are mapped to schema values (`todo`, `doing`, `done`), setting `completed_at = now()` when done. Non-authorized users receive `NOT_ALLOWED`.
  - `create_task`, `list_event_tasks`, `list_coordinator_tasks`: Managed by owning coordinator and admin; notifies assignee student.
  - `list_students`: Coordinators/admins look up students.
  - `my_profile`, `list_my_registrations`, `list_my_tasks`: Role-gated personal queries for students with dynamic waitlist position calculation.
- **Venues & Catalog (`venues.py`, `catalog.py`)**:
  - `free_venues`: Filters out venues holding active events (`approved`, `open`, `ongoing`).
  - `resource_available`: Computes remaining resource quantity factoring in active allocations.
  - `list_venues`, `busy_venues`, `list_resources`: Support coordinators and admins in venue/resource discovery.
  - `save_venue`, `save_resource`: Admin-only mutations with validation (capacity >= 1, name <= 80 chars, resource quantity cannot drop below peak future reservations).
- **Views (`views.py`)**:
  - `list_events_with_seats` & `get_event_detail`: Single query aggregate for events with seat counts (`confirmed`, `waitlisted`), personal registration status (`my_reg`), and waitlist position (`my_waitlist_pos`). Scoped by role-based `visible_where`.
- **Notifications & Admin Bookings (`notifications.py`, `admin.py`)**:
  - `notify_registrants`: Mass-messages confirmed and waitlisted attendees on event changes.
  - `list_notifications`, `unread_count`, `mark_read`: Scoped strictly to the authenticated actor.
  - `list_bookings` & `flag_conflicts` (Audit Pitfall 2 Fix): Overlaps between pending-vs-pending and pending-vs-held events are flagged as potential clashes on the calendar without blocking DB insertion. Adjacent events (`t_end == t_start`) and retired venues are handled properly.
- **Reports, Alerts & CSV (`reports.py`, `alerts.py`, `csv.py`)**:
  - `to_csv`: RFC 4180 CSV generation with UTF-8 BOM (`\ufeff`), CRLF line endings, all cells double-quoted, and spreadsheet formula injection protection (leading `'` on strings starting with `=`, `+`, `-`, `@`, `\t`, `\r`, while numeric negatives remain unescaped).
  - `build_report` & `export_csv`: Single read model for reports and CSV downloads; admin sees all, coordinators see own events, students receive `NOT_ALLOWED`. PII-free columns.
  - `compute_alerts`: Clock-free pure domain logic for active alerts (user-facing terminology is "Notifications"), sorted by severity (`clash` -> `overdue` -> `lowreg`), stable by key.

---

## 2. Test Accounting: Ported vs Dropped

### Ported Backend Tests (19 tests, all passing):
- `backend/tests/domain/test_catalog_views.py`: 4 tests (tasks lifecycle/auth, venue/resource availability, catalog admin CRUD, people/views).
- `backend/tests/domain/test_notifications_admin.py`: 3 tests (conflict matrix with pending-vs-pending and pending-vs-held, admin booking auth, notifications lifecycle/unread count).
- `backend/tests/domain/test_reports_alerts.py`: 5 tests (filter parsing, report auth and CSV export, no PII in reports, overdue tasks scoping, alert severity ordering and student filtering).
- `backend/tests/test_csv.py`: 7 tests (BOM and CRLF, header labels and quoting, embedded quotes/commas, embedded newlines, formula injection escaping, negative numbers unescaped, null cells).

### Dropped Pure-UI Helpers (22 vitest tests kept in frontend, not ported to backend):
- `app/(coordinator)/coordinator/_lib/venues.ts` (`venueGroups`, `venueState` UI groupings): 5 tests in `coordinator/venues.test.ts`.
- `app/(coordinator)/coordinator/_lib/monitor.ts` (`ago`, `monitorModel` display percentages): covered in frontend vitest.
- `app/(student)/student/_lib/mine.ts` (`group`, `reminders`, `orderTasks` UI sorting): 4 tests in `student/mine.test.ts`.
- `app/(student)/student/_lib/view.ts` (`cardModel`, `detailModel` UI button labels): 7 tests in `student/view.test.ts`.
- `app/(admin)/admin/_lib/clash.ts` (`clashCheck` UI explanation sentences): 3 tests in `admin/clash.test.ts`.
- `app/(admin)/admin/_lib/dashboard.ts` (`stats` UI bar charts): 3 tests in `admin/dashboard.test.ts`.

---

## 3. Verification
- `cd backend && uv run ruff check`: Clean (no lint errors).
- `cd backend && uv run pytest -q`: 62 tests passing.
- `cd frontend && npx vitest run`: 260 tests passing.
- DB isolation: Tests run in rollback transactions against PostgreSQL on port 5433 without cross-test leakage.
