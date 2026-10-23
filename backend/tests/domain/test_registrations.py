"""Tests for student event registrations, capacity enforcement, waitlists, and promotion."""

import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta

import psycopg
import pytest
from psycopg.rows import dict_row

from app.config import TEST_DATABASE_URL
from app.domain.actor import Actor
from app.domain.registrations import (
    cancel_registration,
    register_for_event,
    seat_counts,
)
from app.errors import DomainError


def test_capacity_and_waitlisting(conn, make_user, make_event) -> None:
    # Event with capacity 2
    ev = make_event(status="open", capacity=2)
    s1 = Actor(id=make_user(role="student")["id"], role="student")
    s2 = Actor(id=make_user(role="student")["id"], role="student")
    s3 = Actor(id=make_user(role="student")["id"], role="student")

    # s1 and s2 get confirmed seats
    assert register_for_event(s1, conn, ev["id"]) == "confirmed"
    assert register_for_event(s2, conn, ev["id"]) == "confirmed"

    # s3 exceeds capacity -> waitlisted
    assert register_for_event(s3, conn, ev["id"]) == "waitlisted"

    counts = seat_counts(s1, conn, ev["id"])
    assert counts == {"confirmed": 2, "waitlisted": 1}


def test_cannot_register_unless_open(conn, make_user, make_event) -> None:
    ev = make_event(status="pending")
    s = Actor(id=make_user(role="student")["id"], role="student")

    with pytest.raises(DomainError) as exc_info:
        register_for_event(s, conn, ev["id"])
    assert exc_info.value.code == "BAD_STATE"


def test_duplicate_registration_and_reregister_after_cancel(conn, make_user, make_event) -> None:
    ev = make_event(status="open", capacity=5)
    s = Actor(id=make_user(role="student")["id"], role="student")

    assert register_for_event(s, conn, ev["id"]) == "confirmed"

    # Duplicate registration raises ALREADY_REGISTERED
    with pytest.raises(DomainError) as exc_info:
        register_for_event(s, conn, ev["id"])
    assert exc_info.value.code == "ALREADY_REGISTERED"

    # Cancel registration
    cancel_registration(s, conn, ev["id"])

    # Re-register succeeds
    assert register_for_event(s, conn, ev["id"]) == "confirmed"


def test_cancel_confirmed_promotes_oldest_waitlisted(conn, make_user, make_event) -> None:
    ev = make_event(status="open", capacity=1)
    s1 = Actor(id=make_user(role="student")["id"], role="student")
    s2 = Actor(id=make_user(role="student")["id"], role="student")
    s3 = Actor(id=make_user(role="student")["id"], role="student")

    register_for_event(s1, conn, ev["id"])  # confirmed
    register_for_event(s2, conn, ev["id"])  # waitlisted 1
    register_for_event(s3, conn, ev["id"])  # waitlisted 2

    # s1 cancels confirmed seat -> s2 is promoted to confirmed
    cancel_registration(s1, conn, ev["id"])

    with conn.cursor() as cur:
        cur.execute("SELECT status FROM registrations WHERE event_id = %s AND user_id = %s;", (ev["id"], s2.id))
        assert cur.fetchone()["status"] == "confirmed"

        cur.execute("SELECT status FROM registrations WHERE event_id = %s AND user_id = %s;", (ev["id"], s3.id))
        assert cur.fetchone()["status"] == "waitlisted"

        # Check notification for s2
        cur.execute("SELECT kind, body FROM notifications WHERE user_id = %s AND event_id = %s;", (s2.id, ev["id"]))
        notif = cur.fetchone()
        assert notif["kind"] == "waitlist_promoted"
        assert 'A seat opened up and you are now confirmed for' in notif["body"]


def test_cancel_waitlisted_promotes_nobody(conn, make_user, make_event) -> None:
    ev = make_event(status="open", capacity=1)
    s1 = Actor(id=make_user(role="student")["id"], role="student")
    s2 = Actor(id=make_user(role="student")["id"], role="student")

    register_for_event(s1, conn, ev["id"])  # confirmed
    register_for_event(s2, conn, ev["id"])  # waitlisted

    # s2 cancels waitlisted registration
    cancel_registration(s2, conn, ev["id"])

    # s1 remains confirmed
    with conn.cursor() as cur:
        cur.execute("SELECT status FROM registrations WHERE event_id = %s AND user_id = %s;", (ev["id"], s1.id))
        assert cur.fetchone()["status"] == "confirmed"

        cur.execute("SELECT count(*) FROM notifications WHERE event_id = %s AND kind = 'waitlist_promoted';", (ev["id"],))
        assert cur.fetchone()["count"] == 0


def test_cancel_when_not_registered_raises_bad_state(conn, make_user, make_event) -> None:
    ev = make_event(status="open")
    s = Actor(id=make_user(role="student")["id"], role="student")

    with pytest.raises(DomainError) as exc_info:
        cancel_registration(s, conn, ev["id"])
    assert exc_info.value.code == "BAD_STATE"


@pytest.mark.concurrency
def test_concurrent_last_seat_registration_race() -> None:
    # Use real committed connections to test concurrency race for 1 available seat
    user_id_1 = str(uuid.uuid4())
    user_id_2 = str(uuid.uuid4())
    event_id = str(uuid.uuid4())
    coord_id = str(uuid.uuid4())
    venue_id = str(uuid.uuid4())

    with psycopg.connect(TEST_DATABASE_URL, autocommit=True, row_factory=dict_row) as setup_conn, setup_conn.cursor() as cur:
        cur.execute("INSERT INTO profiles (id, email, password_hash, name, role) VALUES (%s, %s, 'x', 'Coord', 'coordinator');", (coord_id, f"{coord_id}@test.local"))
        cur.execute("INSERT INTO profiles (id, email, password_hash, name, role) VALUES (%s, %s, 'x', 'Student 1', 'student');", (user_id_1, f"{user_id_1}@test.local"))
        cur.execute("INSERT INTO profiles (id, email, password_hash, name, role) VALUES (%s, %s, 'x', 'Student 2', 'student');", (user_id_2, f"{user_id_2}@test.local"))
        cur.execute("INSERT INTO venues (id, name, capacity) VALUES (%s, 'Conc Venue', 100);", (venue_id,))
        now = datetime.now(UTC)
        cur.execute(
            """
            INSERT INTO events (id, title, coordinator_id, venue_id, starts_at, ends_at, capacity, status)
            VALUES (%s, 'Race Event', %s, %s, %s, %s, 1, 'open');
            """,
            (event_id, coord_id, venue_id, now + timedelta(days=1), now + timedelta(days=1, hours=2)),
        )

    results: list[str] = []

    def _attempt_registration(u_id: str) -> None:
        with psycopg.connect(TEST_DATABASE_URL, autocommit=True, row_factory=dict_row) as thread_conn:
            actor = Actor(id=u_id, role="student")
            status = register_for_event(actor, thread_conn, event_id)
            results.append(status)

    try:
        with ThreadPoolExecutor(max_workers=2) as executor:
            f1 = executor.submit(_attempt_registration, user_id_1)
            f2 = executor.submit(_attempt_registration, user_id_2)
            f1.result()
            f2.result()

        # Exactly one confirmed and one waitlisted
        assert sorted(results) == ["confirmed", "waitlisted"]
    finally:
        with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as teardown_conn, teardown_conn.cursor() as cur:
            cur.execute("DELETE FROM registrations WHERE event_id = %s;", (event_id,))
            cur.execute("DELETE FROM events WHERE id = %s;", (event_id,))
            cur.execute("DELETE FROM venues WHERE id = %s;", (venue_id,))
            cur.execute("DELETE FROM profiles WHERE id IN (%s, %s, %s);", (user_id_1, user_id_2, coord_id))
