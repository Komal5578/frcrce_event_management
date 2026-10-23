"""Notifications / alerts computation logic (user-facing term is Notifications)."""

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any, Literal

from app.domain.rules import is_low_reg, is_overdue

AlertKind = Literal["clash", "overdue", "lowreg"]

SEVERITY_ORDER: dict[AlertKind, int] = {
    "clash": 0,
    "overdue": 1,
    "lowreg": 2,
}


def alert_href(role: str, kind: AlertKind, event_id: str | None = None) -> str:
    """Canonical link target for an alert kind and role."""
    if role == "admin":
        if kind == "clash":
            return "/admin/calendar"
        return f"/admin/approvals/{event_id}" if event_id else "/admin/calendar"

    if role == "coordinator":
        if kind == "overdue":
            return f"/coordinator/{event_id}" if event_id else "/coordinator/tasks"
        return f"/coordinator/{event_id}"

    # student
    return "/student/tasks"


def split_alerts(items: list[Any], limit: int = 5) -> dict[str, list[Any]]:
    """Cap alert presentation to limit (defaults to 5 if limit <= 0)."""
    cap = limit if limit > 0 else 5
    return {
        "shown": items[:cap],
        "rest": items[cap:],
    }


def compute_alerts(
    role: str,
    events: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
    bookings: list[dict[str, Any]] | None = None,
    now: datetime | None = None,
    href_for: Callable[[AlertKind, str], str] | None = None,
) -> list[dict[str, Any]]:
    """Compute active notification items for an actor (clock-free pure logic).

    User-facing term is 'Notifications'.
    Sorted by severity: clash -> overdue -> lowreg, stable by key.
    """
    current_time = now or datetime.now(UTC)
    resolve_href = href_for or (lambda kind, eid: alert_href(role, kind, eid))
    booking_list = bookings or []
    items: list[dict[str, Any]] = []

    own_event_ids = {str(e["id"]) for e in events}

    # 1. Clash notifications (admin and coordinator only; students never receive clash)
    if role in ("admin", "coordinator"):
        for booking in booking_list:
            if not booking.get("conflict"):
                continue
            b_event_id = str(booking["event_id"])
            if role == "coordinator" and b_event_id not in own_event_ids:
                continue
            items.append(
                {
                    "kind": "clash",
                    "key": f"clash-{b_event_id}",
                    "text": booking["conflict"],
                    "href": resolve_href("clash", b_event_id),
                }
            )

    # 2. Overdue task notifications (grouped per event; all roles can receive)
    overdue_by_event: dict[str, dict[str, Any]] = {}
    for task in tasks:
        if not is_overdue(task, current_time):
            continue
        eid = str(task["event_id"])
        if eid in overdue_by_event:
            overdue_by_event[eid]["count"] += 1
        else:
            overdue_by_event[eid] = {
                "count": 1,
                "title": task.get("event_title", "Event"),
            }

    for eid, data in overdue_by_event.items():
        count = data["count"]
        title = data["title"]
        text = f"1 task is overdue on {title}" if count == 1 else f"{count} tasks are overdue on {title}"
        items.append(
            {
                "kind": "overdue",
                "key": f"overdue-{eid}",
                "text": text,
                "href": resolve_href("overdue", eid),
            }
        )

    # 3. Low registration notifications (admin and coordinator only; students never receive)
    if role in ("admin", "coordinator"):
        for ev in events:
            if not is_low_reg(ev, current_time):
                continue
            eid = str(ev["id"])
            if role == "coordinator" and eid not in own_event_ids:
                continue
            items.append(
                {
                    "kind": "lowreg",
                    "key": f"lowreg-{eid}",
                    "text": f"{ev['title']} has low registrations",
                    "href": resolve_href("lowreg", eid),
                }
            )

    # Sort: clash (0) -> overdue (1) -> lowreg (2), stable by key
    items.sort(key=lambda a: (SEVERITY_ORDER[a["kind"]], a["key"]))
    return items
