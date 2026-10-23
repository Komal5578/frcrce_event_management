"""Profile and personal registrations/tasks domain logic."""

from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role
from app.errors import DomainError


def list_students(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Students a coordinator or admin can assign tasks to (names and departments only)."""
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, department, is_organizer
            FROM profiles
            WHERE role = 'student'
            ORDER BY name;
            """
        )
        return cur.fetchall()


def my_profile(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> dict[str, Any]:
    """The actor's own profile row."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT name, department, is_organizer
            FROM profiles
            WHERE id = %s;
            """,
            (actor.id,),
        )
        row = cur.fetchone()
        if not row:
            raise DomainError("NOT_ALLOWED", "We could not find your profile. Sign in again.")
        return {
            "name": row["name"],
            "department": row["department"],
            "is_organizer": bool(row["is_organizer"]),
        }


def list_my_registrations(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Own registrations incl. cancelled; waitlist_pos is 1-based by created_at then id."""
    require_actor_role(actor, "student")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT r.event_id, e.title, e.status AS event_status, e.starts_at, e.ends_at,
                   v.name AS venue_name, r.status AS reg_status,
                   CASE
                       WHEN r.status = 'waitlisted' THEN 1 + (
                           SELECT COUNT(*)
                           FROM registrations w
                           WHERE w.event_id = r.event_id
                             AND w.status = 'waitlisted'
                             AND (w.created_at < r.created_at OR (w.created_at = r.created_at AND w.id < r.id))
                       )
                       ELSE NULL
                   END AS waitlist_pos
            FROM registrations r
            JOIN events e ON e.id = r.event_id
            LEFT JOIN venues v ON v.id = e.venue_id
            WHERE r.user_id = %s
            ORDER BY e.starts_at, r.id;
            """,
            (actor.id,),
        )
        return cur.fetchall()


def list_my_tasks(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Tasks assigned to the student."""
    require_actor_role(actor, "student")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT t.id, t.title, t.event_id, e.title AS event_title, t.due_at, t.status
            FROM tasks t
            JOIN events e ON e.id = t.event_id
            WHERE t.assignee_id = %s
            ORDER BY t.due_at, t.id;
            """,
            (actor.id,),
        )
        return cur.fetchall()
