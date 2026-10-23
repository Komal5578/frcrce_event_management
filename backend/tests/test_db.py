"""Database schema constraints, checks, foreign key cascades, and seed verification tests."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from psycopg import errors as pg_errors
from pwdlib import PasswordHash


def test_schema_checks_and_time_order(conn, make_user, make_venue) -> None:
    # 1. Invalid profile role
    with pytest.raises(pg_errors.CheckViolation):
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO profiles (email, password_hash, name, role) VALUES ('x@test.com', 'h', 'X', 'superadmin');"
            )
    conn.rollback()

    # 2. Venue non-positive capacity
    with pytest.raises(pg_errors.CheckViolation), conn.cursor() as cur:
        cur.execute("INSERT INTO venues (name, capacity) VALUES ('V', 0);")
    conn.rollback()

    # 3. Resource negative quantity
    with pytest.raises(pg_errors.CheckViolation), conn.cursor() as cur:
        cur.execute("INSERT INTO resources (name, quantity) VALUES ('R', -1);")
    conn.rollback()

    # 4. Event ends_at <= starts_at
    coord = make_user(role="coordinator")
    venue = make_venue()
    now = datetime.now(UTC)
    with pytest.raises(pg_errors.CheckViolation):
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO events (title, coordinator_id, venue_id, starts_at, ends_at, capacity, status)
                VALUES ('Bad Order', %s, %s, %s, %s, 50, 'open');
                """,
                (coord["id"], venue["id"], now + timedelta(hours=2), now + timedelta(hours=1)),
            )
    conn.rollback()

    # 5. Invalid registration status
    with pytest.raises(pg_errors.CheckViolation), conn.cursor() as cur:
        cur.execute(
            """
                INSERT INTO registrations (event_id, user_id, status)
                VALUES (%s, %s, 'invalid_status');
                """,
            (str(uuid.uuid4()), coord["id"]),
        )
    conn.rollback()

    # 6. Invalid task status
    with pytest.raises(pg_errors.CheckViolation), conn.cursor() as cur:
        cur.execute(
            """
                INSERT INTO tasks (event_id, title, status)
                VALUES (%s, 'Task', 'unknown_status');
                """,
            (str(uuid.uuid4()),),
        )
    conn.rollback()


def test_foreign_key_cascades(conn, make_event, make_user, make_resource) -> None:
    event = make_event(status="open")
    student = make_user(role="student")
    resource = make_resource()

    with conn.cursor() as cur:
        # Add a registration
        cur.execute(
            "INSERT INTO registrations (event_id, user_id, status) VALUES (%s, %s, 'confirmed');",
            (event["id"], student["id"]),
        )
        # Add an allocation
        cur.execute(
            "INSERT INTO resource_allocations (event_id, resource_id, quantity) VALUES (%s, %s, 2);",
            (event["id"], resource["id"]),
        )
        # Add a task
        cur.execute(
            "INSERT INTO tasks (event_id, title, status) VALUES (%s, 'Task 1', 'todo');",
            (event["id"],),
        )

        # Deleting event cascades and cleans up child rows
        cur.execute("DELETE FROM events WHERE id = %s;", (event["id"],))

        cur.execute("SELECT count(*) FROM registrations WHERE event_id = %s;", (event["id"],))
        assert cur.fetchone()["count"] == 0

        cur.execute("SELECT count(*) FROM resource_allocations WHERE event_id = %s;", (event["id"],))
        assert cur.fetchone()["count"] == 0

        cur.execute("SELECT count(*) FROM tasks WHERE event_id = %s;", (event["id"],))
        assert cur.fetchone()["count"] == 0


def test_user_session_cascade(conn, make_user) -> None:
    user = make_user(role="student")
    now = datetime.now(UTC)
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO sessions (token_hash, user_id, expires_at)
            VALUES ('dummy_hash', %s, %s);
            """,
            (user["id"], now + timedelta(days=7)),
        )
        # Deleting user cascades to session
        cur.execute("DELETE FROM profiles WHERE id = %s;", (user["id"],))
        cur.execute("SELECT count(*) FROM sessions WHERE token_hash = 'dummy_hash';")
        assert cur.fetchone()["count"] == 0


def test_seed_structure_and_counts(conn, seeded) -> None:
    with conn.cursor() as cur:
        # Check profiles breakdown
        cur.execute("SELECT role, count(*) AS count FROM profiles GROUP BY role;")
        role_counts = {r["role"]: r["count"] for r in cur.fetchall()}
        assert role_counts == {"admin": 1, "coordinator": 2, "student": 4}

        # Check organizer count
        cur.execute("SELECT count(*) AS count FROM profiles WHERE is_organizer = TRUE;")
        assert cur.fetchone()["count"] == 1

        # Check venues and resources counts
        cur.execute("SELECT count(*) AS count FROM venues;")
        assert cur.fetchone()["count"] == 6

        cur.execute("SELECT count(*) AS count FROM resources;")
        assert cur.fetchone()["count"] == 6

        # Check distinct statuses
        cur.execute("SELECT DISTINCT status FROM events;")
        statuses = sorted(r["status"] for r in cur.fetchall())
        assert statuses == ["approved", "cancelled", "completed", "draft", "ongoing", "open", "pending", "returned"]

        # Check two overlapping pending events at Seminar Hall A (venue 'b...02')
        cur.execute(
            """
            SELECT e1.id, e2.id
            FROM events e1
            JOIN events e2 ON e1.venue_id = e2.venue_id AND e1.id < e2.id
            WHERE e1.status = 'pending' AND e2.status = 'pending'
              AND tstzrange(e1.starts_at, e1.ends_at, '[)') && tstzrange(e2.starts_at, e2.ends_at, '[)');
            """
        )
        overlapping_pending = cur.fetchall()
        assert len(overlapping_pending) >= 1

        # Check that approved/open/ongoing events have ZERO overlaps per venue
        cur.execute(
            """
            SELECT e1.id, e2.id
            FROM events e1
            JOIN events e2 ON e1.venue_id = e2.venue_id AND e1.id < e2.id
            WHERE e1.status IN ('approved', 'open', 'ongoing')
              AND e2.status IN ('approved', 'open', 'ongoing')
              AND tstzrange(e1.starts_at, e1.ends_at, '[)') && tstzrange(e2.starts_at, e2.ends_at, '[)');
            """
        )
        clashes = cur.fetchall()
        assert clashes == []

        # Check demo passwords
        ph = PasswordHash.recommended()
        cur.execute("SELECT email, password_hash FROM profiles WHERE email LIKE '%@demo.college.test';")
        for row in cur.fetchall():
            assert ph.verify("demo-password-2026", row["password_hash"])
