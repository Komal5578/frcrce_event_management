"""Registration management: seat allocation, waitlists, promotion, and seat counts."""

from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role, visible_where
from app.errors import DomainError, guarded


def register_for_event(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> str:
    """Register the student actor for an open event, placing them in confirmed or waitlisted status.

    Uses SELECT ... FOR UPDATE on the event row inside a transaction to serialise concurrent registrations.
    """
    require_actor_role(actor, "student")

    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            "SELECT id, capacity FROM events WHERE id = %s AND status = 'open' FOR UPDATE;",
            (event_id,),
        )
        ev = cur.fetchone()
        if not ev:
            raise DomainError("BAD_STATE", "Registration for this event is not open.")

        cur.execute(
            "SELECT count(*) AS count FROM registrations WHERE event_id = %s AND status = 'confirmed';",
            (event_id,),
        )
        confirmed_count = cur.fetchone()["count"]
        target_status = "confirmed" if confirmed_count < ev["capacity"] else "waitlisted"

        with guarded(conn):
            cur.execute(
                """
                INSERT INTO registrations (event_id, user_id, status, created_at)
                VALUES (%s, %s, %s, clock_timestamp())
                ON CONFLICT (event_id, user_id) DO UPDATE
                  SET status = EXCLUDED.status, created_at = clock_timestamp()
                  WHERE registrations.status = 'cancelled'
                RETURNING status;
                """,
                (event_id, actor.id, target_status),
            )
            row = cur.fetchone()

        if row is None:
            raise DomainError("ALREADY_REGISTERED", "You are already registered for this event.")

        return row["status"]


def cancel_registration(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> None:
    """Cancel a student registration. If a confirmed seat is freed, promotes the oldest waitlisted student."""
    require_actor_role(actor, "student")

    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            "SELECT id, title FROM events WHERE id = %s FOR UPDATE;",
            (event_id,),
        )
        ev = cur.fetchone()

        cur.execute(
            "SELECT id, status FROM registrations WHERE event_id = %s AND user_id = %s FOR UPDATE;",
            (event_id, actor.id),
        )
        existing = cur.fetchone()
        if not existing or existing["status"] not in ("confirmed", "waitlisted"):
            raise DomainError("BAD_STATE", "You are not registered for this event.")

        old_status = existing["status"]
        cur.execute(
            "UPDATE registrations SET status = 'cancelled' WHERE id = %s;",
            (existing["id"],),
        )
        if old_status == "confirmed":
            # Find and promote oldest waitlisted registrant
            cur.execute(
                """
                SELECT id, user_id
                FROM registrations
                WHERE event_id = %s AND status = 'waitlisted'
                ORDER BY created_at, id
                LIMIT 1
                FOR UPDATE;
                """,
                (event_id,),
            )
            waitlisted = cur.fetchone()
            if waitlisted:
                cur.execute(
                    "UPDATE registrations SET status = 'confirmed' WHERE id = %s;",
                    (waitlisted["id"],),
                )
                title = ev["title"] if ev else "the event"
                body = f'A seat opened up and you are now confirmed for "{title}".'
                cur.execute(
                    """
                    INSERT INTO notifications (user_id, event_id, kind, body)
                    VALUES (%s, %s, 'waitlist_promoted', %s);
                    """,
                    (waitlisted["user_id"], event_id, body),
                )


def seat_counts(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> dict[str, int]:
    """Return confirmed and waitlisted seat counts for an event visible to the actor."""
    where_sql = visible_where(actor)
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT e.id,
              (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed,
              (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted') AS waitlisted
            FROM events e {where_sql} AND e.id = %s;
            """,
            (actor.id, event_id),
        )
        row = cur.fetchone()
        if not row:
            raise DomainError("NOT_ALLOWED", "You cannot see this event.")
        return {"confirmed": row["confirmed"], "waitlisted": row["waitlisted"]}
