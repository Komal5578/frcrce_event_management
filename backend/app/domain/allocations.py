"""Resource allocation domain logic and capacity validation."""

from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role
from app.errors import MSG, DomainError


def check_resources(conn: psycopg.Connection[dict[str, Any]], event_id: str) -> None:
    """Validate that the event's allocations do not exceed available quantities during its time window.

    Only events with status in ('approved', 'open', 'ongoing') hold resource allocations (A1).
    Pending events hold no resources, but their allocations are checked against approved/open/ongoing events.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT starts_at, ends_at, status FROM events WHERE id = %s;", (event_id,))
        ev = cur.fetchone()
        if not ev or not ev["starts_at"] or not ev["ends_at"]:
            return

        cur.execute(
            """
            SELECT resource_id, quantity
            FROM resource_allocations
            WHERE event_id = %s;
            """,
            (event_id,),
        )
        allocations = cur.fetchall()
        if not allocations:
            return

        for alloc in allocations:
            r_id = alloc["resource_id"]
            cur.execute("SELECT id, name, quantity FROM resources WHERE id = %s FOR UPDATE;", (r_id,))
            res = cur.fetchone()
            if not res:
                raise DomainError("INVALID_INPUT", "That resource is not available. Pick another.")

            # Sum allocated quantity of other events holding resources in an overlapping time window
            cur.execute(
                """
                SELECT COALESCE(SUM(a.quantity), 0) AS other_total
                FROM resource_allocations a
                JOIN events e ON e.id = a.event_id
                WHERE a.resource_id = %s
                  AND a.event_id <> %s
                  AND e.status IN ('approved', 'open', 'ongoing')
                  AND tstzrange(e.starts_at, e.ends_at, '[)') && tstzrange(%s, %s, '[)');
                """,
                (r_id, event_id, ev["starts_at"], ev["ends_at"]),
            )
            other_total = cur.fetchone()["other_total"]
            if other_total + alloc["quantity"] > res["quantity"]:
                raise DomainError("RESOURCE_SHORT", MSG["RESOURCE_SHORT"])


def set_allocation(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
    resource_id: str,
    quantity: int,
) -> None:
    """Set how many units of a resource an event allocates (0 deletes the allocation)."""
    require_actor_role(actor, "coordinator")

    if not isinstance(quantity, int) or quantity < 0:
        raise DomainError("INVALID_INPUT", "Quantity must be a whole number, 0 or more.")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT coordinator_id, status FROM events WHERE id = %s;",
            (event_id,),
        )
        ev = cur.fetchone()
        if not ev or str(ev["coordinator_id"]) != str(actor.id):
            raise DomainError("NOT_ALLOWED", "Only the event coordinator can do that.")

        if ev["status"] not in ("draft", "returned", "pending"):
            raise DomainError(
                "BAD_STATE",
                f"This event is {ev['status']}; resources can only be changed before it is approved.",
            )

        if quantity == 0:
            cur.execute(
                "DELETE FROM resource_allocations WHERE event_id = %s AND resource_id = %s;",
                (event_id, resource_id),
            )
            return

        cur.execute("SELECT id, active FROM resources WHERE id = %s;", (resource_id,))
        res = cur.fetchone()
        if not res or not res["active"]:
            raise DomainError("INVALID_INPUT", "That resource is not available. Pick another.")

        cur.execute(
            """
            INSERT INTO resource_allocations (event_id, resource_id, quantity)
            VALUES (%s, %s, %s)
            ON CONFLICT (event_id, resource_id)
            DO UPDATE SET quantity = EXCLUDED.quantity;
            """,
            (event_id, resource_id, quantity),
        )

    check_resources(conn, event_id)


def list_allocations(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> list[dict[str, Any]]:
    """List allocations for an event, accessible to owning coordinator or admin."""
    with conn.cursor() as cur:
        cur.execute("SELECT coordinator_id FROM events WHERE id = %s;", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise DomainError("NOT_ALLOWED", "You do not have permission to do that.")

        if (actor.role == "coordinator" and str(ev["coordinator_id"]) != str(actor.id)) or actor.role not in ("coordinator", "admin"):
            raise DomainError("NOT_ALLOWED", "You do not have permission to do that.")

        cur.execute(
            """
            SELECT a.resource_id, r.name, a.quantity
            FROM resource_allocations a
            JOIN resources r ON r.id = a.resource_id
            WHERE a.event_id = %s
            ORDER BY r.name;
            """,
            (event_id,),
        )
        return cur.fetchall()
