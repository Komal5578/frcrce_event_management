"""Event lifecycle management, state transitions, approvals, and visibility."""

from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role, visible_where
from app.domain.allocations import check_resources
from app.domain.rules import assert_transition
from app.errors import DomainError, guarded


def list_visible_events(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Return all events visible to the given actor based on role."""
    where_sql = visible_where(actor)
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT e.* FROM events e {where_sql} ORDER BY e.starts_at NULLS LAST, e.created_at;",
            (actor.id,),
        )
        return cur.fetchall()


def manageable_event(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> dict[str, Any]:
    """Retrieve an event the actor has permission to manage (owner coordinator or admin).

    Returns identical NOT_ALLOWED for missing or foreign events to avoid IDOR leaks.
    """
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, status, title, coordinator_id, venue_id, starts_at, ends_at, capacity
            FROM events
            WHERE id = %s AND (coordinator_id = %s OR %s = 'admin');
            """,
            (event_id, actor.id, actor.role),
        )
        ev = cur.fetchone()
        if not ev:
            raise DomainError(
                "NOT_ALLOWED",
                "Only the event coordinator or an administrator can do that.",
            )
        return ev


def submit_event(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> None:
    """Coordinator submits a draft or returned event for review."""
    require_actor_role(actor, "coordinator")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status, coordinator_id, title FROM events WHERE id = %s FOR UPDATE;",
            (event_id,),
        )
        ev = cur.fetchone()
        if not ev or str(ev["coordinator_id"]) != str(actor.id):
            raise DomainError("NOT_ALLOWED", "Only the event coordinator can do that.")

        assert_transition(ev["status"], "pending")

        with guarded(conn):
            cur.execute(
                """
                UPDATE events
                SET status = 'pending', updated_at = now()
                WHERE id = %s;
                """,
                (event_id,),
            )


def review_event(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
    approve: bool,
    reason: str | None = None,
) -> None:
    """Administrator approves or returns a pending event.

    Approving checks resource capacity and venue clash. Pending events holding no resources
    or venue allows pending requests to overlap until approval.
    """
    require_actor_role(actor, "admin")
    why = reason.strip() if reason else ""
    if not approve and not why:
        raise DomainError(
            "INVALID_INPUT",
            "Say why you are returning this event so the coordinator can fix it.",
        )

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status, title, coordinator_id FROM events WHERE id = %s FOR UPDATE;",
            (event_id,),
        )
        ev = cur.fetchone()
        if not ev or ev["status"] != "pending":
            raise DomainError(
                "BAD_STATE",
                "Only events waiting for review can be approved or returned.",
            )

        target_status = "approved" if approve else "returned"
        assert_transition(ev["status"], target_status)

        if approve:
            # Re-check resource allocations against other approved/open/ongoing holders (A2)
            check_resources(conn, event_id)

            with guarded(conn):
                cur.execute(
                    """
                    UPDATE events
                    SET status = 'approved', return_reason = NULL, updated_at = now()
                    WHERE id = %s;
                    """,
                    (event_id,),
                )

            # Notify coordinator of approval
            cur.execute(
                """
                INSERT INTO notifications (user_id, event_id, kind, body)
                VALUES (%s, %s, 'event_approved', %s);
                """,
                (
                    ev["coordinator_id"],
                    event_id,
                    f'"{ev["title"]}" was approved.',
                ),
            )
        else:
            with guarded(conn):
                cur.execute(
                    """
                    UPDATE events
                    SET status = 'returned', return_reason = %s, updated_at = now()
                    WHERE id = %s;
                    """,
                    (why, event_id),
                )

            cur.execute(
                """
                INSERT INTO notifications (user_id, event_id, kind, body)
                VALUES (%s, %s, 'event_returned', %s);
                """,
                (
                    ev["coordinator_id"],
                    event_id,
                    f'"{ev["title"]}" was returned: {why}',
                ),
            )


def cancel_event(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
    reason: str | None = None,
) -> None:
    """Coordinator or administrator cancels an active event and notifies registered attendees."""
    ev = manageable_event(actor, conn, event_id)
    assert_transition(ev["status"], "cancelled")

    why = reason.strip() if reason else None
    body = f'"{ev["title"]}" has been cancelled.' + (f" Reason: {why}" if why else "")

    with conn.cursor() as cur:
        with guarded(conn):
            cur.execute(
                """
                UPDATE events
                SET status = 'cancelled', cancel_reason = %s, updated_at = now()
                WHERE id = %s;
                """,
                (why, event_id),
            )

        cur.execute(
            """
            INSERT INTO notifications (user_id, event_id, kind, body)
            SELECT r.user_id, r.event_id, 'event_cancelled', %s
            FROM registrations r
            WHERE r.event_id = %s AND r.status IN ('confirmed', 'waitlisted');
            """,
            (body, event_id),
        )


def advance_event(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> str:
    """Coordinator advances approved -> open -> ongoing -> completed."""
    require_actor_role(actor, "coordinator")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status, coordinator_id, title FROM events WHERE id = %s FOR UPDATE;",
            (event_id,),
        )
        ev = cur.fetchone()
        if not ev or str(ev["coordinator_id"]) != str(actor.id):
            raise DomainError("NOT_ALLOWED", "Only the event coordinator can do that.")

        next_map = {
            "approved": "open",
            "open": "ongoing",
            "ongoing": "completed",
        }
        if ev["status"] not in next_map:
            raise DomainError(
                "BAD_STATE",
                "only approved, open or ongoing events can move on.",
            )

        next_status = next_map[ev["status"]]
        assert_transition(ev["status"], next_status)

        with guarded(conn):
            cur.execute(
                "UPDATE events SET status = %s, updated_at = now() WHERE id = %s;",
                (next_status, event_id),
            )

        return next_status
