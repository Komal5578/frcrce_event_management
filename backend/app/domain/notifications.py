"""Notifications domain logic."""

from typing import Any

import psycopg

from app.domain.actor import Actor
from app.domain.events import manageable_event
from app.errors import DomainError


def notify_registrants(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
    kind: str,
    body: str,
) -> int:
    """Message everyone confirmed or waitlisted for an event; returns rows created."""
    manageable_event(actor, conn, event_id)
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO notifications (user_id, event_id, kind, body)
            SELECT r.user_id, r.event_id, %s, %s
            FROM registrations r
            WHERE r.event_id = %s AND r.status IN ('confirmed', 'waitlisted');
            """,
            (kind, body, event_id),
        )
        return cur.rowcount


def list_notifications(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """The actor's own notifications, newest first."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, event_id, kind, body, read_at, created_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC;
            """,
            (actor.id,),
        )
        return cur.fetchall()


def unread_count(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> int:
    """Count of unread notifications for the actor only."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) AS c
            FROM notifications
            WHERE user_id = %s AND read_at IS NULL;
            """,
            (actor.id,),
        )
        row = cur.fetchone()
        return int(row["c"]) if row and row["c"] is not None else 0


def mark_read(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    notification_id: str,
) -> None:
    """Mark a notification read; modifies only the actor's own row."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE notifications
            SET read_at = now()
            WHERE id = %s AND user_id = %s;
            """,
            (notification_id, actor.id),
        )
        if cur.rowcount == 0:
            # Check if notification exists under another user to prevent cross-user mutations
            cur.execute("SELECT user_id FROM notifications WHERE id = %s;", (notification_id,))
            row = cur.fetchone()
            if row and str(row["user_id"]) != str(actor.id):
                raise DomainError("NOT_ALLOWED", "You cannot modify this notification.")
