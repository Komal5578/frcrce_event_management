"""Venues and resources catalog domain logic for listing and admin management."""

from datetime import datetime
from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role
from app.errors import DomainError

HELD_STATUSES = "('approved', 'open', 'ongoing')"


def _validate_name(name: Any) -> str:
    s = str(name).strip() if name is not None else ""
    if not s:
        raise DomainError("INVALID_INPUT", "Give it a name.")
    if len(s) > 80:
        raise DomainError("INVALID_INPUT", "Keep the name to 80 characters or fewer.")
    return s


def _validate_positive_int(val: Any, field_name: str) -> int:
    if not isinstance(val, int) or val < 1:
        raise DomainError("INVALID_INPUT", f"{field_name} must be a whole number, 1 or more.")
    return val


def list_venues(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Every venue (retired ones too) with the count of live events still ahead on it."""
    # any signed-in role may view venues
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT v.id, v.name, v.capacity, v.location, v.active,
                   (
                       SELECT COUNT(*)
                       FROM events e
                       WHERE e.venue_id = v.id
                         AND e.status IN {HELD_STATUSES}
                         AND e.starts_at > now()
                   ) AS future_events
            FROM venues v
            ORDER BY v.active DESC, v.name;
            """
        )
        return cur.fetchall()


def busy_venues(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    start: datetime | str,
    end: datetime | str,
    exclude_event_id: str | None = None,
) -> list[dict[str, Any]]:
    """Active-status events overlapping [start, end): titles only, so the picker can say who holds the venue."""
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT e.venue_id, e.title AS event_title, e.starts_at, e.ends_at
            FROM events e
            WHERE e.venue_id IS NOT NULL
              AND e.status IN {HELD_STATUSES}
              AND e.starts_at < %s
              AND %s < e.ends_at
              AND e.id <> COALESCE(%s, '00000000-0000-0000-0000-000000000000'::uuid)
            ORDER BY e.starts_at;
            """,
            (end, start, exclude_event_id),
        )
        return cur.fetchall()


def list_resources(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    from_time: datetime | str | None = None,
    to_time: datetime | str | None = None,
) -> list[dict[str, Any]]:
    """Resources with current use over [from_time, to_time) and the largest single future reservation."""
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT r.id, r.name, r.quantity, r.active,
                   COALESCE(
                       (
                           SELECT SUM(a.quantity)
                           FROM resource_allocations a
                           JOIN events e ON e.id = a.event_id
                           WHERE a.resource_id = r.id
                             AND e.status IN {HELD_STATUSES}
                             AND e.starts_at < COALESCE(%s, now() + interval '1 day')
                             AND COALESCE(%s, now()) < e.ends_at
                       ),
                       0
                   ) AS in_use,
                   COALESCE(
                       (
                           SELECT MAX(a.quantity)
                           FROM resource_allocations a
                           JOIN events e ON e.id = a.event_id
                           WHERE a.resource_id = r.id
                             AND e.status IN {HELD_STATUSES}
                             AND e.ends_at > now()
                       ),
                       0
                   ) AS reserved_peak
            FROM resources r
            ORDER BY r.active DESC, r.name;
            """,
            (to_time, from_time),
        )
        return cur.fetchall()


def save_venue(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    venue_data: dict[str, Any],
) -> str:
    """Add or edit a venue; retiring sets active false, nothing is deleted."""
    require_actor_role(actor, "admin")
    name = _validate_name(venue_data.get("name"))
    capacity = _validate_positive_int(venue_data.get("capacity"), "Capacity")
    location = str(venue_data.get("location")).strip() if venue_data.get("location") else None
    active = bool(venue_data.get("active", True))
    v_id = venue_data.get("id")

    with conn.cursor() as cur:
        if not v_id:
            cur.execute(
                """
                INSERT INTO venues (name, capacity, location, active)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
                """,
                (name, capacity, location, active),
            )
            return str(cur.fetchone()["id"])

        cur.execute(
            """
            UPDATE venues
            SET name = %s, capacity = %s, location = %s, active = %s
            WHERE id = %s;
            """,
            (name, capacity, location, active, v_id),
        )
        if cur.rowcount == 0:
            raise DomainError("INVALID_INPUT", "That venue no longer exists. Refresh the page.")
        return str(v_id)


def save_resource(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    res_data: dict[str, Any],
) -> str:
    """Add or edit a resource; quantity cannot drop below what future events already reserve."""
    require_actor_role(actor, "admin")
    name = _validate_name(res_data.get("name"))
    quantity = _validate_positive_int(res_data.get("quantity"), "Quantity")
    active = bool(res_data.get("active", True))
    r_id = res_data.get("id")

    with conn.cursor() as cur:
        if not r_id:
            cur.execute(
                """
                INSERT INTO resources (name, quantity, active)
                VALUES (%s, %s, %s)
                RETURNING id;
                """,
                (name, quantity, active),
            )
            return str(cur.fetchone()["id"])

        cur.execute(
            f"""
            SELECT COALESCE(MAX(a.quantity), 0) AS peak
            FROM resource_allocations a
            JOIN events e ON e.id = a.event_id
            WHERE a.resource_id = %s
              AND e.status IN {HELD_STATUSES}
              AND e.ends_at > now();
            """,
            (r_id,),
        )
        row = cur.fetchone()
        peak = int(row["peak"]) if row and row["peak"] is not None else 0
        if quantity < peak:
            raise DomainError("INVALID_INPUT", f"{peak} are already reserved for events. Choose {peak} or more.")

        cur.execute(
            """
            UPDATE resources
            SET name = %s, quantity = %s, active = %s
            WHERE id = %s;
            """,
            (name, quantity, active, r_id),
        )
        if cur.rowcount == 0:
            raise DomainError("INVALID_INPUT", "That resource no longer exists. Refresh the page.")
        return str(r_id)
