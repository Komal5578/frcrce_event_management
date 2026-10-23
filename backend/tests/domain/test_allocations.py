"""Tests for resource allocations and capacity checks."""

from datetime import UTC, datetime, timedelta

import pytest

from app.domain.actor import Actor
from app.domain.allocations import check_resources, list_allocations, set_allocation
from app.errors import DomainError


def test_set_allocation_and_list(conn, make_user, make_venue, make_event, make_resource) -> None:
    coord = make_user(role="coordinator")
    actor = Actor(id=coord["id"], role="coordinator")
    venue = make_venue()
    now = datetime.now(UTC)

    event = make_event(
        status="pending",
        coordinator_id=coord["id"],
        venue_id=venue["id"],
        starts_at=now + timedelta(days=2),
        ends_at=now + timedelta(days=2, hours=2),
    )
    resource = make_resource(quantity=5)

    # Set allocation to 3
    set_allocation(actor, conn, event["id"], resource["id"], 3)
    allocs = list_allocations(actor, conn, event["id"])
    assert len(allocs) == 1
    assert allocs[0]["quantity"] == 3

    # Update to 4
    set_allocation(actor, conn, event["id"], resource["id"], 4)
    allocs = list_allocations(actor, conn, event["id"])
    assert allocs[0]["quantity"] == 4

    # Quantity 0 removes allocation
    set_allocation(actor, conn, event["id"], resource["id"], 0)
    allocs = list_allocations(actor, conn, event["id"])
    assert len(allocs) == 0


def test_allocation_resource_short_against_approved_event(conn, make_user, make_venue, make_event, make_resource) -> None:
    coord = make_user(role="coordinator")
    actor = Actor(id=coord["id"], role="coordinator")
    venue1 = make_venue()
    venue2 = make_venue()
    resource = make_resource(quantity=3)
    now = datetime.now(UTC)
    t1 = now + timedelta(days=3)
    t2 = t1 + timedelta(hours=2)

    # Approved event holding 2 units of resource
    ev_approved = make_event(status="approved", venue_id=venue1["id"], starts_at=t1, ends_at=t2)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO resource_allocations (event_id, resource_id, quantity) VALUES (%s, %s, 2);",
            (ev_approved["id"], resource["id"]),
        )

    # Second event by coord at venue2 during overlapping window
    ev_pending = make_event(status="pending", coordinator_id=coord["id"], venue_id=venue2["id"], starts_at=t1, ends_at=t2)

    # Allocating 1 unit succeeds (total 2 + 1 <= 3)
    set_allocation(actor, conn, ev_pending["id"], resource["id"], 1)

    # Allocating 2 units fails (total 2 + 2 > 3) -> RESOURCE_SHORT
    with pytest.raises(DomainError) as exc_info:
        set_allocation(actor, conn, ev_pending["id"], resource["id"], 2)
    assert exc_info.value.code == "RESOURCE_SHORT"


def test_pending_events_hold_no_resources_per_a1(conn, make_user, make_venue, make_event, make_resource) -> None:
    coord = make_user(role="coordinator")
    actor = Actor(id=coord["id"], role="coordinator")
    venue = make_venue()
    resource = make_resource(quantity=4)
    now = datetime.now(UTC)
    t1 = now + timedelta(days=4)
    t2 = t1 + timedelta(hours=2)

    # Other pending event has allocation of 3 units
    ev_other_pending = make_event(status="pending", venue_id=venue["id"], starts_at=t1, ends_at=t2)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO resource_allocations (event_id, resource_id, quantity) VALUES (%s, %s, 3);",
            (ev_other_pending["id"], resource["id"]),
        )

    # Our pending event can also allocate 3 units because pending events do NOT hold resources!
    our_pending = make_event(status="pending", coordinator_id=coord["id"], venue_id=venue["id"], starts_at=t1, ends_at=t2)
    set_allocation(actor, conn, our_pending["id"], resource["id"], 3)
    allocs = list_allocations(actor, conn, our_pending["id"])
    assert allocs[0]["quantity"] == 3


def test_check_resources_adjacent_window_allowed(conn, make_user, make_venue, make_event, make_resource) -> None:
    coord = make_user(role="coordinator")
    actor = Actor(id=coord["id"], role="coordinator")
    venue = make_venue()
    resource = make_resource(quantity=2)
    now = datetime.now(UTC)
    t1 = now + timedelta(days=5)
    t2 = t1 + timedelta(hours=2)
    t3 = t2 + timedelta(hours=2)

    # Event 1: approved, holds all 2 units from t1 to t2
    ev1 = make_event(status="approved", venue_id=venue["id"], starts_at=t1, ends_at=t2)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO resource_allocations (event_id, resource_id, quantity) VALUES (%s, %s, 2);",
            (ev1["id"], resource["id"]),
        )

    # Event 2: pending from t2 to t3 (adjacent, not overlapping) can hold all 2 units
    ev2 = make_event(status="pending", coordinator_id=coord["id"], venue_id=venue["id"], starts_at=t2, ends_at=t3)
    set_allocation(actor, conn, ev2["id"], resource["id"], 2)
    check_resources(conn, ev2["id"])


def test_allocation_permissions_and_state(conn, make_user, make_event, make_resource) -> None:
    coord1 = make_user(role="coordinator")
    coord2 = make_user(role="coordinator")
    actor2 = Actor(id=coord2["id"], role="coordinator")
    student_actor = Actor(id=str(coord1["id"]), role="student")
    resource = make_resource(quantity=5)

    ev = make_event(status="pending", coordinator_id=coord1["id"])

    # Student role cannot allocate
    with pytest.raises(DomainError) as exc_info:
        set_allocation(student_actor, conn, ev["id"], resource["id"], 1)
    assert exc_info.value.code == "NOT_ALLOWED"

    # Foreign coordinator cannot allocate
    with pytest.raises(DomainError) as exc_info:
        set_allocation(actor2, conn, ev["id"], resource["id"], 1)
    assert exc_info.value.code == "NOT_ALLOWED"

    # Immutable event state (e.g. approved) cannot change allocations
    with conn.cursor() as cur:
        cur.execute("UPDATE events SET status = 'approved' WHERE id = %s;", (ev["id"],))

    actor1 = Actor(id=coord1["id"], role="coordinator")
    with pytest.raises(DomainError) as exc_info:
        set_allocation(actor1, conn, ev["id"], resource["id"], 1)
    assert exc_info.value.code == "BAD_STATE"
