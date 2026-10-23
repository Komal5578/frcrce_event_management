"""Event views with aggregated seat and registration state per actor."""

from typing import Any

import psycopg

from app.domain.actor import Actor, visible_where
from app.errors import DomainError

SELECT_EVENTS_WITH_SEATS = """
SELECT e.id, e.title, e.type, e.description, e.coordinator_id, e.venue_id,
       e.starts_at, e.ends_at, e.capacity, e.status, e.department,
       e.template_id, e.return_reason, e.cancel_reason, e.created_at, e.updated_at,
       v.name AS venue_name, v.location AS venue_location, v.capacity AS venue_capacity,
       c.name AS coordinator_name,
       (
           SELECT COUNT(*)
           FROM registrations r
           WHERE r.event_id = e.id AND r.status = 'confirmed'
       ) AS confirmed,
       (
           SELECT COUNT(*)
           FROM registrations r
           WHERE r.event_id = e.id AND r.status = 'waitlisted'
       ) AS waitlisted,
       (
           SELECT m.status
           FROM registrations m
           WHERE m.event_id = e.id AND m.user_id = %s
       ) AS my_reg,
       (
           SELECT CASE
               WHEN m.status = 'waitlisted' THEN 1 + (
                   SELECT COUNT(*)
                   FROM registrations w
                   WHERE w.event_id = e.id
                     AND w.status = 'waitlisted'
                     AND (w.created_at < m.created_at OR (w.created_at = m.created_at AND w.id < m.id))
               )
               ELSE NULL
           END
           FROM registrations m
           WHERE m.event_id = e.id AND m.user_id = %s
       ) AS my_waitlist_pos
FROM events e
LEFT JOIN venues v ON v.id = e.venue_id
LEFT JOIN profiles c ON c.id = e.coordinator_id
"""


def list_events_with_seats(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """One query, role-scoped: every event the actor may see, with seat counts and their own registration."""
    sql = SELECT_EVENTS_WITH_SEATS + visible_where(actor) + " ORDER BY e.starts_at, e.id;"
    with conn.cursor() as cur:
        cur.execute(sql, (actor.id, actor.id, actor.id))
        return cur.fetchall()


def get_event_detail(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> dict[str, Any]:
    """Single event detail with seat counts and actor's registration, or NOT_ALLOWED."""
    sql = SELECT_EVENTS_WITH_SEATS + visible_where(actor) + " AND e.id = %s;"
    with conn.cursor() as cur:
        cur.execute(sql, (actor.id, actor.id, actor.id, event_id))
        row = cur.fetchone()
        if not row:
            raise DomainError("NOT_ALLOWED", "You cannot see this event.")
        return row
