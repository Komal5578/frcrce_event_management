# Phase 09 Plan 04 Summary: Core Domain & State Machine

**Executed:** Wave 3, Plan 09-04
**Requirements covered:** API-02, API-03, API-05
**KB notes consulted:** `dom-domain-model`, `adr-001-stack`, `adr-004-scope`

## What Changed

1. **Allocations & Resource Capacity (`backend/app/domain/allocations.py`):**
   - Implemented `check_resources(conn, event_id)` locking involved resource rows `FOR UPDATE` and verifying that total allocations across approved/open/ongoing events do not exceed resource capacity.
   - Per decision A1: pending events do not hold resources, allowing multiple pending requests to hold allocations without blocking each other.
   - Implemented `set_allocation(actor, conn, event_id, resource_id, quantity)` and `list_allocations(actor, conn, event_id)` with ownership checks and input validation.

2. **Rules & Pure Functions (`backend/app/domain/rules.py`):**
   - Implemented `assert_transition(old_status, new_status)` enforcing the state machine (`NEXT` transitions and `CANCELLABLE` states).
   - Ported alert predicates `is_overdue` and `is_low_reg` along with domain constants (`LOWREG_FRACTION`, `LOWREG_DAYS`, `REMINDER_DAYS`, `BOOKABLE_HOURS_PER_DAY`).

3. **Event Lifecycle & Drafts (`backend/app/domain/events.py`, `backend/app/domain/drafts.py`):**
   - Implemented `list_visible_events`, `manageable_event`, `submit_event`, `review_event`, `cancel_event`, and `advance_event`.
   - In `review_event(approve=True)`: verified that approval checks resources and triggers the `events_no_venue_clash` exclusion constraint inside `guarded(conn)`, translating any collision to `VENUE_CLASH` and leaving the connection usable without partial writes or unneeded notification records.
   - In `review_event(approve=False)`: enforced required return reason.
   - In `backend/app/domain/drafts.py`: implemented `create_draft`, `save_draft`, `update_event`, `delete_draft`, and `list_templates` with strict whitelist filtering (`WHITELIST_KEYS`) preventing status or owner tampering.

4. **Registrations & Waitlists (`backend/app/domain/registrations.py`):**
   - Implemented `register_for_event`: locks the event row `SELECT ... FOR UPDATE`, checks capacity, places registrant into `confirmed` or `waitlisted`, and uses `clock_timestamp()` for consistent sub-transaction ordering.
   - Implemented `cancel_registration`: locks registration `FOR UPDATE`, sets status to `cancelled`, and if the cancelled seat was confirmed, promotes the oldest waitlisted registrant (`ORDER BY created_at, id LIMIT 1`) and sends a `waitlist_promoted` notification.
   - Implemented `seat_counts(actor, conn, event_id)`.

5. **Test Suite (`backend/tests/domain/`):**
   - `test_allocations.py` (5 tests): verifies allocation limits, resource checks against approved holders, pending exemption (A1), adjacent time window compatibility, and coordinator authorization.
   - `test_events.py` (6 tests): verifies state machine transitions, submit/approve/advance flow, clash detection at approval, return reason requirement, reschedule clash/resource checks, and draft patch whitelist integrity.
   - `test_authz.py` (4 tests): verifies missing vs foreign event error equivalence, coordinator boundary enforcement, student management rejection, and admin super-access.
   - `test_registrations.py` (7 tests): verifies capacity limits, open state requirement, duplicate registration handling, re-registration after cancel, waitlist promotion on cancellation, waitlisted cancellation without spurious promotions, unassigned cancellation rejection, and multi-thread race concurrency on the last seat (`@pytest.mark.concurrency`).

## Ported vs Dropped Counts

- **Ported logic from v1:**
  - `domain.test.ts`, `domain-phase4.test.ts`, `authz.test.ts`, `coordinator/actions.test.ts`, `student/actions.test.ts`:
  - 22 comprehensive Python unit and concurrency tests implemented in `tests/domain/`.
- **Known Gaps / Notes:**
  - Decision A8: No auto-promotion when an event's capacity is increased (matches v1 behavior; documented known gap).
  - Decision A1 / A2: Pending events do not hold resources or venues; resource check and venue exclusion run at approval and reschedule.

## How to Verify

```bash
cd backend && uv run ruff check && uv run pytest -q tests/domain
```
All 22 tests pass.
