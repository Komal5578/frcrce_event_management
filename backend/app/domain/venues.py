"""Venue and resource availability domain logic."""

from datetime import datetime
from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role

HELD_STATUSES = "('approved', 'open', 'ongoing')"


def free_venues(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    start: datetime | str,
    end: datetime | str,
    exclude_event_id: str | None = None,
) -> list[dict[str, Any]]:
    """Active venues with no active event overlapping [start, end)."""
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT v.id, v.name, v.capacity, v.location, v.active
            FROM venues v
            WHERE v.active = TRUE
              AND NOT EXISTS (
                SELECT 1 FROM events e
                WHERE e.venue_id = v.id
                  AND e.status IN {HELD_STATUSES}
                  AND e.starts_at < %s
                  AND %s < e.ends_at
                  AND e.id <> COALESCE(%s, '00000000-0000-0000-0000-000000000000'::uuid)
              )
            ORDER BY v.name;
            """,
            (end, start, exclude_event_id),
        )
        return cur.fetchall()


def resource_available(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    resource_id: str,
    start: datetime | str,
    end: datetime | str,
    exclude_event_id: str | None = None,
) -> int:
    """Quantity of a resource still free for [start, end)."""
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT res.quantity - COALESCE(
              (
                SELECT SUM(a.quantity)
                FROM resource_allocations a
                JOIN events e ON e.id = a.event_id
                WHERE a.resource_id = res.id
                  AND e.status IN {HELD_STATUSES}
                  AND e.starts_at < %s
                  AND %s < e.ends_at
                  AND e.id <> COALESCE(%s, '00000000-0000-0000-0000-000000000000'::uuid)
              ),
              0
            ) AS left
            FROM resources res
            WHERE res.id = %s;
            """,
            (end, start, exclude_event_id, resource_id),
        )
        row = cur.fetchone()
        return int(row["left"]) if row and row["left"] is not None else 0
