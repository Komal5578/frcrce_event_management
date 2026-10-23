"""Tests for venue clash exclusion constraint and database uniqueness guarantees."""

from datetime import UTC, datetime, timedelta

import pytest
from psycopg import errors as pg_errors

from app.errors import DomainError, guarded


def test_approved_overlap_rejected(conn, make_venue, make_event) -> None:
    venue = make_venue()
    now = datetime.now(UTC)
    t1 = now + timedelta(days=2)
    t2 = t1 + timedelta(hours=3)

    make_event(status="approved", venue_id=venue["id"], starts_at=t1, ends_at=t2)

    # Overlapping approved event at same venue must fail exclusion constraint
    t_overlap_start = t1 + timedelta(hours=1)
    t_overlap_end = t2 + timedelta(hours=1)

    with pytest.raises(pg_errors.ExclusionViolation):
        make_event(status="approved", venue_id=venue["id"], starts_at=t_overlap_start, ends_at=t_overlap_end)


def test_adjacent_time_slots_allowed(conn, make_venue, make_event) -> None:
    venue = make_venue()
    now = datetime.now(UTC)
    t1 = now + timedelta(days=2)
    t2 = t1 + timedelta(hours=2)
    t3 = t2 + timedelta(hours=2)

    # [t1, t2) and [t2, t3) do not overlap
    ev1 = make_event(status="approved", venue_id=venue["id"], starts_at=t1, ends_at=t2)
    ev2 = make_event(status="open", venue_id=venue["id"], starts_at=t2, ends_at=t3)
    assert ev1["id"] != ev2["id"]


def test_pending_pending_and_pending_approved_overlap_allowed(conn, make_venue, make_event) -> None:
    venue = make_venue()
    now = datetime.now(UTC)
    t1 = now + timedelta(days=3)
    t2 = t1 + timedelta(hours=3)

    approved = make_event(status="approved", venue_id=venue["id"], starts_at=t1, ends_at=t2)
    # Pending overlapping approved is allowed
    p1 = make_event(status="pending", venue_id=venue["id"], starts_at=t1 + timedelta(hours=1), ends_at=t2 + timedelta(hours=1))
    # Another pending overlapping both is allowed
    p2 = make_event(status="pending", venue_id=venue["id"], starts_at=t1 + timedelta(hours=2), ends_at=t2 + timedelta(hours=2))

    assert approved["id"] and p1["id"] and p2["id"]


def test_update_pending_to_approved_raises_and_guarded_recovers(conn, make_venue, make_event) -> None:
    venue = make_venue()
    now = datetime.now(UTC)
    t1 = now + timedelta(days=4)
    t2 = t1 + timedelta(hours=3)

    make_event(status="approved", venue_id=venue["id"], starts_at=t1, ends_at=t2)
    pending = make_event(status="pending", venue_id=venue["id"], starts_at=t1 + timedelta(hours=1), ends_at=t2)

    # Direct UPDATE raises ExclusionViolation inside a savepoint
    with pytest.raises(pg_errors.ExclusionViolation):
        with conn.transaction(), conn.cursor() as cur:
            cur.execute("UPDATE events SET status = 'approved' WHERE id = %s;", (pending["id"],))

    # Under guarded(conn), it raises DomainError('VENUE_CLASH') and connection stays usable
    with pytest.raises(DomainError) as exc_info:
        with guarded(conn), conn.cursor() as cur:
            cur.execute("UPDATE events SET status = 'approved' WHERE id = %s;", (pending["id"],))

    assert exc_info.value.code == "VENUE_CLASH"

    # Connection is immediately usable for following queries
    with conn.cursor() as cur:
        cur.execute("SELECT id, status FROM events WHERE id = %s;", (pending["id"],))
        row = cur.fetchone()
        assert row["status"] == "pending"


def test_cancelling_or_returning_event_frees_venue(conn, make_venue, make_event) -> None:
    venue = make_venue()
    now = datetime.now(UTC)
    t1 = now + timedelta(days=5)
    t2 = t1 + timedelta(hours=2)

    ev1 = make_event(status="approved", venue_id=venue["id"], starts_at=t1, ends_at=t2)

    with conn.cursor() as cur:
        cur.execute("UPDATE events SET status = 'cancelled' WHERE id = %s;", (ev1["id"],))

    # Now another approved event can take the exact same slot
    ev2 = make_event(status="approved", venue_id=venue["id"], starts_at=t1, ends_at=t2)
    assert ev2["id"] != ev1["id"]


def test_approved_without_venue_or_time_fails_check(conn, make_user) -> None:
    coord = make_user(role="coordinator")
    with pytest.raises(pg_errors.CheckViolation), conn.cursor() as cur:
        cur.execute(
            """
                INSERT INTO events (title, coordinator_id, status)
                VALUES ('Incomplete Approved', %s, 'approved');
                """,
            (coord["id"],),
        )


def test_duplicate_registration_rejected(conn, make_event, make_user) -> None:
    event = make_event(status="open")
    student = make_user(role="student")

    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO registrations (event_id, user_id, status) VALUES (%s, %s, 'confirmed');",
            (event["id"], student["id"]),
        )

    # Second registration for same event and user fails UNIQUE constraint
    with pytest.raises(DomainError) as exc_info:
        with guarded(conn):
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO registrations (event_id, user_id, status) VALUES (%s, %s, 'confirmed');",
                    (event["id"], student["id"]),
                )
    assert exc_info.value.code == "ALREADY_REGISTERED"
