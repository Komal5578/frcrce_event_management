"""Admin calendar and clash inspection domain logic."""

from datetime import datetime
from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role

DONE = {"completed", "cancelled"}


def flag_conflicts(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Flag booking conflicts.

    Overlaps between pending-vs-pending, pending-vs-held, or draft-vs-held/pending are flagged
    as potential clashes, as are live events scheduled on retired venues.
    Adjacent events (where one ends exactly when the other starts) do NOT conflict.
    """
    flagged: list[dict[str, Any]] = []
    for r in rows:
        conflict: str | None = None
        if not r.get("venue_active", True) and r.get("status") not in DONE:
            conflict = f"{r['venue_name']} is retired. Move this event to another venue."
        else:
            for x in rows:
                if (
                    str(x["event_id"]) != str(r["event_id"])
                    and str(x["venue_id"]) == str(r["venue_id"])
                    and x.get("status") not in DONE
                    and r.get("status") not in DONE
                    and x["starts_at"] < r["ends_at"]
                    and r["starts_at"] < x["ends_at"]
                ):
                    conflict = f'Overlaps "{x["title"]}" at {r["venue_name"]}.'
                    break

        item = dict(r)
        item["conflict"] = conflict
        flagged.append(item)
    return flagged


def list_bookings(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    from_time: datetime | str,
    to_time: datetime | str,
) -> list[dict[str, Any]]:
    """Admin calendar rows: events with a venue starting in [from_time, to_time), cancelled ones omitted, conflicts flagged."""
    require_actor_role(actor, "admin")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT e.id AS event_id, e.title, e.status, e.department, e.venue_id,
                   v.name AS venue_name, v.active AS venue_active, e.starts_at, e.ends_at
            FROM events e
            JOIN venues v ON v.id = e.venue_id
            WHERE e.starts_at >= %s
              AND e.starts_at < %s
              AND e.status <> 'cancelled'
            ORDER BY e.starts_at, e.id;
            """,
            (from_time, to_time),
        )
        rows = cur.fetchall()
        return flag_conflicts(rows)
