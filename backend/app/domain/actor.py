"""Actor model, role requirements, and visibility rules."""

from dataclasses import dataclass
from typing import Literal

from app.errors import MSG, DomainError

Role = Literal["coordinator", "student", "admin"]


@dataclass(frozen=True)
class Actor:
    """Represents the authenticated actor performing an operation."""

    id: str
    role: Role
    name: str = ""
    email: str = ""


def require_actor_role(actor: Actor, *roles: Role) -> None:
    """Ensure the actor has one of the allowed roles, else raise NOT_ALLOWED."""
    if actor.role not in roles:
        raise DomainError("NOT_ALLOWED", MSG["NOT_ALLOWED"])


# Constant WHERE fragments per role (constant SQL templates with single %s parameter for actor.id).
VISIBLE: dict[str, str] = {
    "student": " WHERE (e.status IN ('open', 'ongoing', 'completed') OR EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = %s))",
    "coordinator": " WHERE e.coordinator_id = %s",
    "admin": " WHERE (%s::text) IS NOT NULL",
}


def visible_where(actor: Actor) -> str:
    """Return the SQL WHERE clause fragment defining events visible to this actor."""
    return VISIBLE[actor.role]
