"""Reports read model and CSV export for Admin and Coordinator roles."""

import re
from datetime import UTC, datetime
from typing import Any

import psycopg

from app.csv import to_csv
from app.domain.actor import Actor, require_actor_role
from app.domain.rules import is_overdue
from app.domain.views import list_events_with_seats

COLUMNS: list[dict[str, str]] = [
    {"key": "title", "label": "Title"},
    {"key": "status", "label": "Status"},
    {"key": "starts_at", "label": "Date & Time"},
    {"key": "venue", "label": "Venue"},
    {"key": "department", "label": "Department"},
    {"key": "registered", "label": "Registered"},
    {"key": "capacity", "label": "Capacity"},
    {"key": "overdue_tasks", "label": "Overdue tasks"},
]

STATUS_LABELS: dict[str, str] = {
    "draft": "Draft",
    "pending": "Pending approval",
    "approved": "Approved",
    "open": "Open",
    "ongoing": "Ongoing",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "returned": "Returned",
}

VALID_STATUS_KEYS = set(STATUS_LABELS.keys())
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_filters(raw: dict[str, Any]) -> dict[str, str]:
    """Whitelist only valid report filters; unknown keys are silently dropped."""
    out: dict[str, str] = {}
    status = raw.get("status")
    if status and status in VALID_STATUS_KEYS:
        out["status"] = str(status)

    from_date = raw.get("from")
    if from_date and ISO_DATE_RE.match(str(from_date)):
        out["from"] = str(from_date)

    to_date = raw.get("to")
    if to_date and ISO_DATE_RE.match(str(to_date)):
        out["to"] = str(to_date)

    return out


def list_overdue_tasks_for_actor(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    now: datetime,
) -> list[dict[str, Any]]:
    """List overdue tasks scoped to actor role (admin: all, coordinator: own events)."""
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        if actor.role == "admin":
            cur.execute(
                """
                SELECT t.id, t.event_id, e.title AS event_title, t.title,
                       t.assignee_id, p.name AS assignee_name, t.due_at,
                       t.status, t.completed_at
                FROM tasks t
                JOIN events e ON e.id = t.event_id
                LEFT JOIN profiles p ON p.id = t.assignee_id
                WHERE t.status <> 'done'
                  AND t.due_at IS NOT NULL
                  AND t.due_at < %s
                ORDER BY t.due_at, t.id;
                """,
                (now,),
            )
        else:
            cur.execute(
                """
                SELECT t.id, t.event_id, e.title AS event_title, t.title,
                       t.assignee_id, p.name AS assignee_name, t.due_at,
                       t.status, t.completed_at
                FROM tasks t
                JOIN events e ON e.id = t.event_id
                LEFT JOIN profiles p ON p.id = t.assignee_id
                WHERE t.status <> 'done'
                  AND t.due_at IS NOT NULL
                  AND t.due_at < %s
                  AND e.coordinator_id = %s
                ORDER BY t.due_at, t.id;
                """,
                (now, actor.id),
            )
        raw = cur.fetchall()
        return [t for t in raw if is_overdue(t, now)]


def build_report(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    raw_filters: dict[str, Any],
    now: datetime,
) -> dict[str, Any]:
    """Single read model for reports page and CSV export."""
    require_actor_role(actor, "coordinator", "admin")
    filters = parse_filters(raw_filters)

    events = list_events_with_seats(actor, conn)

    if "status" in filters:
        events = [e for e in events if e["status"] == filters["status"]]
    if "from" in filters:
        from_ts = datetime.fromisoformat(f"{filters['from']}T00:00:00+00:00")
        events = [e for e in events if e.get("starts_at") is not None and e["starts_at"] >= from_ts]
    if "to" in filters:
        to_ts = datetime.fromisoformat(f"{filters['to']}T23:59:59.999999+00:00")
        events = [e for e in events if e.get("starts_at") is not None and e["starts_at"] <= to_ts]

    overdue_tasks = list_overdue_tasks_for_actor(actor, conn, now)
    overdue_by_event: dict[str, int] = {}
    for t in overdue_tasks:
        eid = str(t["event_id"])
        overdue_by_event[eid] = overdue_by_event.get(eid, 0) + 1

    rows: list[dict[str, Any]] = []
    for e in events:
        starts_at_val = e["starts_at"].isoformat() if e.get("starts_at") else None
        rows.append(
            {
                "title": e["title"],
                "status": STATUS_LABELS.get(e["status"], e["status"]),
                "starts_at": starts_at_val,
                "venue": e.get("venue_name"),
                "department": e.get("department"),
                "registered": e.get("confirmed", 0),
                "capacity": e.get("venue_capacity"),
                "overdue_tasks": overdue_by_event.get(str(e["id"]), 0),
            }
        )

    totals = {
        "events": len(rows),
        "registered": sum(r["registered"] for r in rows if isinstance(r.get("registered"), int)),
    }

    return {
        "columns": COLUMNS,
        "rows": rows,
        "totals": totals,
        "generatedAt": now.isoformat(),
    }


def export_csv(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    raw_filters: dict[str, Any],
    now: datetime | None = None,
) -> str:
    """Generate CSV string with UTF-8 BOM, RFC-4180 quoting, and injection protection."""
    require_actor_role(actor, "coordinator", "admin")
    current_time = now or datetime.now(UTC)
    result = build_report(actor, conn, raw_filters, current_time)
    return to_csv(result["columns"], result["rows"])
