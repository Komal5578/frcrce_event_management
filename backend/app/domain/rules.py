"""Event status transitions, alert rules, and validation predicates."""

from datetime import UTC, datetime
from typing import Any

from app.errors import MSG, DomainError

# Allowed forward transitions in the event lifecycle
NEXT: set[tuple[str, str]] = {
    ("draft", "pending"),
    ("returned", "pending"),
    ("pending", "approved"),
    ("pending", "returned"),
    ("approved", "open"),
    ("open", "ongoing"),
    ("ongoing", "completed"),
}

# Statuses from which an event may be cancelled
CANCELLABLE: set[str] = {
    "draft",
    "pending",
    "returned",
    "approved",
    "open",
    "ongoing",
}

# Domain constants for reports and alerts
LOWREG_FRACTION: float = 0.25
LOWREG_DAYS: int = 7
REMINDER_DAYS: int = 2
BOOKABLE_HOURS_PER_DAY: int = 12


def assert_transition(old_status: str, new_status: str) -> None:
    """Ensure the transition from old_status to new_status is permitted by the state machine."""
    is_valid_next = (old_status, new_status) in NEXT
    is_valid_cancel = new_status == "cancelled" and old_status in CANCELLABLE

    if not (is_valid_next or is_valid_cancel):
        raise DomainError("BAD_STATE", MSG["BAD_STATE"])


def is_overdue(
    due_at: datetime | dict[str, Any] | None,
    status: str | datetime | None = None,
    now: datetime | None = None,
) -> bool:
    """Check if an uncompleted task is past its due timestamp.

    Supports both is_overdue(task_dict, now) and is_overdue(due_at, status, now).
    """
    if isinstance(due_at, dict):
        task = due_at
        d = task.get("due_at")
        s = task.get("status", "todo")
        n = status if isinstance(status, datetime) else now
    else:
        d = due_at
        s = str(status) if status is not None else "todo"
        n = now

    if not d or s == "done":
        return False
    current_time = n or datetime.now(UTC)
    if isinstance(d, str):
        d = datetime.fromisoformat(d)
    return d < current_time


def is_low_reg(
    status: str | dict[str, Any],
    capacity: int | datetime | None = None,
    starts_at: datetime | None = None,
    confirmed_count: int = 0,
    now: datetime | None = None,
) -> bool:
    """Check if an open event starting within LOWREG_DAYS has fewer registrations than threshold.

    Supports both is_low_reg(event_dict, now) and is_low_reg(status, capacity, starts_at, confirmed_count, now).
    """
    if isinstance(status, dict):
        ev = status
        st = ev.get("status")
        cap = ev.get("capacity")
        starts = ev.get("starts_at")
        conf = ev.get("confirmed", 0)
        n = capacity if isinstance(capacity, datetime) else now
    else:
        st = status
        cap = capacity if isinstance(capacity, int) else None
        starts = starts_at
        conf = confirmed_count
        n = now

    if st != "open" or not cap or not starts:
        return False
    if isinstance(starts, str):
        starts = datetime.fromisoformat(starts)
    current_time = n or datetime.now(UTC)
    delta = starts - current_time
    if delta.total_seconds() <= 0:
        return False
    in_window = delta.days < LOWREG_DAYS or (delta.days == LOWREG_DAYS and delta.seconds == 0)
    return in_window and conf < (LOWREG_FRACTION * cap)
