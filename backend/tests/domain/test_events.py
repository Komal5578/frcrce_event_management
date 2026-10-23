"""Tests for event lifecycle, state transitions, approvals, drafts, and clash handling."""

from datetime import UTC, datetime, timedelta

import pytest

from app.domain.actor import Actor
from app.domain.drafts import create_draft, save_draft, update_event
from app.domain.events import (
    advance_event,
    manageable_event,
    review_event,
    submit_event,
)
from app.domain.rules import assert_transition
from app.errors import DomainError


def test_state_machine_transitions() -> None:
    # Valid NEXT transitions
    assert_transition("draft", "pending")
    assert_transition("returned", "pending")
    assert_transition("pending", "approved")
    assert_transition("pending", "returned")
    assert_transition("approved", "open")
    assert_transition("open", "ongoing")
    assert_transition("ongoing", "completed")

    # Cancellations from active states
    for s in ["draft", "pending", "returned", "approved", "open", "ongoing"]:
        assert_transition(s, "cancelled")

    # Invalid transitions raise BAD_STATE
    with pytest.raises(DomainError) as exc_info:
        assert_transition("completed", "open")
    assert exc_info.value.code == "BAD_STATE"

    with pytest.raises(DomainError) as exc_info:
        assert_transition("cancelled", "open")
    assert exc_info.value.code == "BAD_STATE"


def test_submit_and_approve_lifecycle(conn, make_user, make_venue, make_event) -> None:
    coord = make_user(role="coordinator")
    admin = make_user(role="admin")
    coord_actor = Actor(id=coord["id"], role="coordinator")
    admin_actor = Actor(id=admin["id"], role="admin")
    venue = make_venue()
    now = datetime.now(UTC)

    # 1. Draft event created
    ev = make_event(
        status="draft",
        coordinator_id=coord["id"],
        venue_id=venue["id"],
        starts_at=now + timedelta(days=2),
        ends_at=now + timedelta(days=2, hours=2),
        capacity=50,
    )

    # 2. Submit moves draft -> pending
    submit_event(coord_actor, conn, ev["id"])
    e_row = manageable_event(coord_actor, conn, ev["id"])
    assert e_row["status"] == "pending"

    # 3. Approve moves pending -> approved and creates notification
    review_event(admin_actor, conn, ev["id"], approve=True)
    e_row = manageable_event(admin_actor, conn, ev["id"])
    assert e_row["status"] == "approved"

    with conn.cursor() as cur:
        cur.execute(
            "SELECT kind FROM notifications WHERE event_id = %s;",
            (ev["id"],),
        )
        assert cur.fetchone()["kind"] == "event_approved"

    # 4. Advance approved -> open -> ongoing -> completed
    assert advance_event(coord_actor, conn, ev["id"]) == "open"
    assert advance_event(coord_actor, conn, ev["id"]) == "ongoing"
    assert advance_event(coord_actor, conn, ev["id"]) == "completed"


def test_approve_clashing_pending_event_surfaces_clash_and_conn_usable(
    conn, make_user, make_venue, make_event
) -> None:
    coord1 = make_user(role="coordinator")
    coord2 = make_user(role="coordinator")
    admin = make_user(role="admin")
    admin_actor = Actor(id=admin["id"], role="admin")
    venue = make_venue()
    now = datetime.now(UTC)
    t1 = now + timedelta(days=3)
    t2 = t1 + timedelta(hours=3)

    # Event 1 is already approved
    make_event(status="approved", coordinator_id=coord1["id"], venue_id=venue["id"], starts_at=t1, ends_at=t2)

    # Event 2 is pending during an overlapping window (allowed to exist as pending per A1)
    ev2 = make_event(
        status="pending",
        coordinator_id=coord2["id"],
        venue_id=venue["id"],
        starts_at=t1 + timedelta(hours=1),
        ends_at=t2 + timedelta(hours=1),
    )

    # Approving ev2 must raise VENUE_CLASH
    with pytest.raises(DomainError) as exc_info:
        review_event(admin_actor, conn, ev2["id"], approve=True)
    assert exc_info.value.code == "VENUE_CLASH"

    # No notification was inserted for ev2
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM notifications WHERE event_id = %s;", (ev2["id"],))
        assert cur.fetchone()["count"] == 0

    # Connection remains fully usable after the caught clash (savepoint via guarded)
    ev_check = manageable_event(admin_actor, conn, ev2["id"])
    assert ev_check["status"] == "pending"


def test_review_return_requires_reason(conn, make_user, make_venue, make_event) -> None:
    admin = make_user(role="admin")
    admin_actor = Actor(id=admin["id"], role="admin")
    venue = make_venue()
    ev = make_event(status="pending", venue_id=venue["id"])

    # Empty reason on return raises INVALID_INPUT
    with pytest.raises(DomainError) as exc_info:
        review_event(admin_actor, conn, ev["id"], approve=False, reason="   ")
    assert exc_info.value.code == "INVALID_INPUT"

    # Valid return
    review_event(admin_actor, conn, ev["id"], approve=False, reason="Too close to exams")
    with conn.cursor() as cur:
        cur.execute("SELECT status, return_reason FROM events WHERE id = %s;", (ev["id"],))
        row = cur.fetchone()
        assert row["status"] == "returned"
        assert row["return_reason"] == "Too close to exams"


def test_reschedule_checks_venue_clash_and_resources(conn, make_user, make_venue, make_event, make_resource) -> None:
    coord = make_user(role="coordinator")
    coord_actor = Actor(id=coord["id"], role="coordinator")
    venue = make_venue()
    resource = make_resource(quantity=2)
    now = datetime.now(UTC)
    t1 = now + timedelta(days=10)
    t2 = t1 + timedelta(hours=2)

    # Event 1 approved
    make_event(status="approved", venue_id=venue["id"], starts_at=t1, ends_at=t2)

    # Event 2 approved at another time, holding 2 units of resource
    ev2 = make_event(
        status="approved",
        coordinator_id=coord["id"],
        venue_id=venue["id"],
        starts_at=t2 + timedelta(days=1),
        ends_at=t2 + timedelta(days=1, hours=2),
    )
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO resource_allocations (event_id, resource_id, quantity) VALUES (%s, %s, 2);",
            (ev2["id"], resource["id"]),
        )

    # Rescheduling ev2 to overlap ev1 at the same venue raises VENUE_CLASH
    with pytest.raises(DomainError) as exc_info:
        update_event(
            coord_actor,
            conn,
            ev2["id"],
            {"starts_at": t1 + timedelta(minutes=30), "ends_at": t2 + timedelta(minutes=30)},
        )
    assert exc_info.value.code == "VENUE_CLASH"


def test_draft_patch_whitelist_and_save(conn, make_user, make_venue) -> None:
    coord = make_user(role="coordinator")
    coord_actor = Actor(id=coord["id"], role="coordinator")
    venue = make_venue()

    draft_id = create_draft(coord_actor, conn)

    # Patch whitelisted fields
    save_draft(
        coord_actor,
        conn,
        draft_id,
        {
            "title": "Updated Draft Title",
            "capacity": 75,
            "venue_id": venue["id"],
            "starts_at": "2030-05-01T10:00:00Z",
            "ends_at": "2030-05-01T12:00:00Z",
            "status": "approved",  # Should NOT change status!
        },
    )

    ev = manageable_event(coord_actor, conn, draft_id)
    assert ev["title"] == "Updated Draft Title"
    assert ev["capacity"] == 75
    assert ev["status"] == "draft"  # Status remains draft!
