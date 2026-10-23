"""Draft management, templates, and event update logic."""

from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role
from app.domain.allocations import check_resources
from app.errors import DomainError, guarded

WHITELIST_KEYS = {"title", "type", "description", "capacity", "venue_id", "starts_at", "ends_at"}


def list_templates(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """List event templates, accessible to coordinators and admins."""
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, type, description, default_duration_minutes, default_capacity, department
            FROM event_templates
            ORDER BY name;
            """
        )
        return cur.fetchall()


def create_draft(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    template_id: str | None = None,
) -> str:
    """Create a new draft event prefilled from an optional template."""
    require_actor_role(actor, "coordinator")

    with conn.cursor() as cur:
        template = None
        if template_id:
            cur.execute(
                "SELECT id, name, type, description, default_capacity, department FROM event_templates WHERE id = %s;",
                (template_id,),
            )
            template = cur.fetchone()
            if not template:
                raise DomainError(
                    "INVALID_INPUT",
                    "That template no longer exists. Pick another or start from scratch.",
                )

        cur.execute("SELECT department FROM profiles WHERE id = %s;", (actor.id,))
        profile = cur.fetchone()
        dept = (profile["department"] if profile and profile["department"] else None) or (
            template["department"] if template else None
        )

        title = (
            (f"{template['name']} - {dept}" if dept else template["name"])
            if template
            else "Untitled event"
        )
        e_type = template["type"] if template else None
        desc = template["description"] if template else None
        cap = template["default_capacity"] if template else None

        cur.execute(
            """
            INSERT INTO events (title, type, description, capacity, department, template_id, coordinator_id, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft')
            RETURNING id;
            """,
            (title, e_type, desc, cap, dept, template_id, actor.id),
        )
        return str(cur.fetchone()["id"])


def _merge_and_validate_patch(
    cur_row: dict[str, Any],
    patch: dict[str, Any],
    conn: psycopg.Connection[dict[str, Any]],
) -> dict[str, Any]:
    """Merge patch over existing row ensuring whitelist and validating constraint shapes."""
    merged = {
        "title": patch.get("title", cur_row["title"]),
        "type": patch.get("type", cur_row["type"]),
        "description": patch.get("description", cur_row["description"]),
        "capacity": patch.get("capacity", cur_row["capacity"]),
        "venue_id": patch.get("venue_id", cur_row["venue_id"]),
        "starts_at": patch.get("starts_at", cur_row["starts_at"]),
        "ends_at": patch.get("ends_at", cur_row["ends_at"]),
    }

    title = str(merged["title"]).strip() if merged["title"] is not None else ""
    if not title:
        raise DomainError("INVALID_INPUT", "Give the event a title.")
    if len(title) > 120:
        raise DomainError("INVALID_INPUT", "Keep the title to 120 characters or fewer.")
    merged["title"] = title

    cap = merged["capacity"]
    if cap is not None and (not isinstance(cap, int) or cap < 1):
        raise DomainError("INVALID_INPUT", "Capacity must be a whole number, 1 or more.")

    s_at = merged["starts_at"]
    e_at = merged["ends_at"]
    if s_at and e_at and e_at <= s_at:
        raise DomainError("INVALID_INPUT", "The event must end after it starts.")

    v_id = merged["venue_id"]
    if v_id and str(v_id) != str(cur_row.get("venue_id")):
        with conn.cursor() as cur:
            cur.execute("SELECT active FROM venues WHERE id = %s;", (v_id,))
            v = cur.fetchone()
            if not v or not v["active"]:
                raise DomainError("INVALID_INPUT", "That venue is not available. Pick another venue.")

    return merged


def save_draft(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
    patch: dict[str, Any],
) -> None:
    """Autosave partial patch on a draft or returned event."""
    require_actor_role(actor, "coordinator")

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, title, type, description, capacity, venue_id, starts_at, ends_at, status, coordinator_id
            FROM events
            WHERE id = %s FOR UPDATE;
            """,
            (event_id,),
        )
        cur_row = cur.fetchone()
        if not cur_row or str(cur_row["coordinator_id"]) != str(actor.id):
            raise DomainError("NOT_ALLOWED", "Only the event coordinator can do that.")

        if cur_row["status"] not in ("draft", "returned"):
            raise DomainError(
                "BAD_STATE",
                f"This event is {cur_row['status']}; only drafts and returned events can be edited here.",
            )

        m = _merge_and_validate_patch(cur_row, patch, conn)

        with guarded(conn):
            cur.execute(
                """
                UPDATE events
                SET title = %s, type = %s, description = %s, capacity = %s,
                    venue_id = %s, starts_at = %s, ends_at = %s, updated_at = now()
                WHERE id = %s AND status IN ('draft', 'returned');
                """,
                (
                    m["title"],
                    m["type"],
                    m["description"],
                    m["capacity"],
                    m["venue_id"],
                    m["starts_at"],
                    m["ends_at"],
                    event_id,
                ),
            )


def update_event(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
    patch: dict[str, Any],
) -> dict[str, int]:
    """Edit a live event (pending, approved, open); checks capacity and notifies registrants."""
    require_actor_role(actor, "coordinator")

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT e.id, e.title, e.type, e.description, e.capacity, e.venue_id, e.starts_at, e.ends_at,
                   e.status, e.coordinator_id,
                   (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed
            FROM events e
            WHERE e.id = %s FOR UPDATE;
            """,
            (event_id,),
        )
        cur_row = cur.fetchone()
        if not cur_row or str(cur_row["coordinator_id"]) != str(actor.id):
            raise DomainError("NOT_ALLOWED", "Only the event coordinator can do that.")

        if cur_row["status"] not in ("pending", "approved", "open"):
            raise DomainError(
                "BAD_STATE",
                f"This event is {cur_row['status']}; only pending, approved or open events can be changed this way.",
            )

        m = _merge_and_validate_patch(cur_row, patch, conn)

        if m["capacity"] is not None and m["capacity"] < cur_row["confirmed"]:
            raise DomainError(
                "INVALID_INPUT",
                f"{cur_row['confirmed']} people are already confirmed. Choose {cur_row['confirmed']} or more.",
            )

        with guarded(conn):
            cur.execute(
                """
                UPDATE events
                SET title = %s, type = %s, description = %s, capacity = %s,
                    venue_id = %s, starts_at = %s, ends_at = %s, updated_at = now()
                WHERE id = %s;
                """,
                (
                    m["title"],
                    m["type"],
                    m["description"],
                    m["capacity"],
                    m["venue_id"],
                    m["starts_at"],
                    m["ends_at"],
                    event_id,
                ),
            )

        # Re-check resources if timing or venue changed on an approved or open event (A2)
        if cur_row["status"] in ("approved", "open"):
            check_resources(conn, event_id)

        body = f'The details of "{m["title"]}" were updated. Open the event to see the new time and venue.'
        cur.execute(
            """
            INSERT INTO notifications (user_id, event_id, kind, body)
            SELECT r.user_id, r.event_id, 'event_changed', %s
            FROM registrations r
            WHERE r.event_id = %s AND r.status IN ('confirmed', 'waitlisted');
            """,
            (body, event_id),
        )
        notified_count = cur.rowcount

        return {"notified": notified_count}


def delete_draft(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> None:
    """Delete a draft or returned event."""
    require_actor_role(actor, "coordinator")
    with conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM events
            WHERE id = %s AND coordinator_id = %s AND status IN ('draft', 'returned');
            """,
            (event_id, actor.id),
        )
        if cur.rowcount == 0:
            raise DomainError(
                "NOT_ALLOWED",
                "Only the event coordinator can delete a draft.",
            )
