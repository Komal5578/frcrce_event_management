"""Domain errors, HTTP status mapping, error translation, and savepoint guarding."""

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

import psycopg
from psycopg import errors as pg_errors


class DomainError(Exception):
    """Domain layer error with stable error code and human message."""

    def __init__(self, code: str, message: str | None = None) -> None:
        self.code = code
        self.message = message or MSG.get(code, MSG["INTERNAL"])
        super().__init__(self.message)


MSG: dict[str, str] = {
    "VENUE_CLASH": "That venue is already booked for part of this time. Pick another venue or time.",
    "ALREADY_REGISTERED": "You are already registered for this event.",
    "NOT_ALLOWED": "You do not have permission to do that.",
    "INVALID_INPUT": "Some details are missing or not valid. Check the form and try again.",
    "RESOURCE_SHORT": "Not enough of that resource is free for this time. Choose a smaller number or another time.",
    "EVENT_FULL": "This event is full. You can join the waitlist instead.",
    "BAD_STATE": "This can't be done at the event's current stage. Refresh the page to see where it stands.",
    "UNAUTHENTICATED": "You must be signed in to do that.",
    "RATE_LIMITED": "Too many sign-in attempts. Please try again in a few minutes.",
    "INTERNAL": "Something went wrong on our side. Please try again in a moment.",
}

STATUS: dict[str, int] = {
    "NOT_ALLOWED": 403,
    "UNAUTHENTICATED": 401,
    "INVALID_INPUT": 422,
    "RATE_LIMITED": 429,
    "VENUE_CLASH": 409,
    "EVENT_FULL": 409,
    "RESOURCE_SHORT": 409,
    "BAD_STATE": 409,
    "ALREADY_REGISTERED": 409,
    "INTERNAL": 500,
}


def translate(e: psycopg.Error) -> DomainError:
    """Translate psycopg database error to DomainError using error class and constraint name."""
    diag = getattr(e, "diag", None)
    constraint = getattr(diag, "constraint_name", "") or ""

    if isinstance(e, pg_errors.ExclusionViolation):
        return DomainError("VENUE_CLASH", MSG["VENUE_CLASH"])

    if isinstance(e, pg_errors.UniqueViolation):
        if "registrations" in constraint:
            return DomainError("ALREADY_REGISTERED", MSG["ALREADY_REGISTERED"])
        return DomainError("INVALID_INPUT", MSG["INVALID_INPUT"])

    if isinstance(e, pg_errors.CheckViolation):
        if "events_complete_unless_draft" in constraint:
            return DomainError("INVALID_INPUT", "Add a venue, date and capacity before submitting.")
        if "events_time_order" in constraint:
            return DomainError("INVALID_INPUT", "The event must end after it starts.")
        return DomainError("INVALID_INPUT", MSG["INVALID_INPUT"])

    if isinstance(e, (pg_errors.NotNullViolation, pg_errors.ForeignKeyViolation)):
        return DomainError("INVALID_INPUT", MSG["INVALID_INPUT"])

    return DomainError("INTERNAL", MSG["INTERNAL"])


@contextmanager
def guarded(conn: psycopg.Connection[Any]) -> Iterator[None]:
    """Execute risky SQL within a savepoint, translating psycopg errors to DomainError so conn stays usable."""
    try:
        with conn.transaction():
            yield
    except psycopg.Error as e:
        raise translate(e) from e
