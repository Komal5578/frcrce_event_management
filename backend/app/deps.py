"""FastAPI dependencies: database connection, authenticated actor, and role checks."""

from collections.abc import Iterator
from typing import Any

import psycopg
from fastapi import Depends, Request

from app.auth import resolve_session
from app.db import pool
from app.domain.actor import Actor, require_actor_role
from app.errors import MSG, DomainError


def get_conn() -> Iterator[psycopg.Connection[dict[str, Any]]]:
    """Dependency providing a connection from the pool that commits on clean exit and rolls back on error."""
    with pool.connection() as conn:
        yield conn


def current_actor(
    request: Request,
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> Actor:
    """Dependency extracting and resolving the authenticated Actor from the httpOnly session cookie."""
    token = request.cookies.get("session")
    if not token:
        raise DomainError("UNAUTHENTICATED", MSG["UNAUTHENTICATED"])
    actor = resolve_session(conn, token)
    if not actor:
        raise DomainError("UNAUTHENTICATED", MSG["UNAUTHENTICATED"])
    return actor


def require_roles(*roles: str):
    """Dependency factory enforcing that the current actor holds one of the specified roles."""
    def _role_checker(actor: Actor = Depends(current_actor)) -> Actor:
        require_actor_role(actor, *roles)
        return actor
    return _role_checker


def roles_extra(*roles: str) -> dict[str, Any]:
    """Return openapi_extra metadata dict documenting allowed roles for the endpoint."""
    return {"x-roles": list(roles)}
