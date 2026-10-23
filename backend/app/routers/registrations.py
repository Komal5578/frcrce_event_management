"""Registrations API router."""

from typing import Any
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends

from app.deps import current_actor, get_conn, require_roles, roles_extra
from app.domain.actor import Actor
from app.domain.people import list_my_registrations
from app.domain.registrations import cancel_registration, register_for_event, seat_counts
from app.schemas import (
    SHARED_RESPONSES,
    RegistrationItem,
    RegistrationResult,
    SeatCounts,
    SuccessResponse,
)

router = APIRouter(prefix="/api", tags=["registrations"])


@router.post(
    "/events/{event_id}/register",
    summary="Register or waitlist for an open event",
    response_model=RegistrationResult,
    dependencies=[Depends(require_roles("student"))],
    openapi_extra=roles_extra("student"),
    responses=SHARED_RESPONSES,
)
def register(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    status = register_for_event(actor, conn, str(event_id))
    return {"status": status}


@router.delete(
    "/events/{event_id}/register",
    summary="Cancel own event registration",
    response_model=SuccessResponse,
    dependencies=[Depends(require_roles("student"))],
    openapi_extra=roles_extra("student"),
    responses=SHARED_RESPONSES,
)
def deregister(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, bool]:
    cancel_registration(actor, conn, str(event_id))
    return {"ok": True}


@router.get(
    "/events/{event_id}/seats",
    summary="Get confirmed and waitlisted seat counts",
    response_model=SeatCounts,
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_seats(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, Any]:
    return seat_counts(actor, conn, str(event_id))


@router.get(
    "/registrations/mine",
    summary="List student's own registrations",
    response_model=list[RegistrationItem],
    dependencies=[Depends(require_roles("student"))],
    openapi_extra=roles_extra("student"),
    responses=SHARED_RESPONSES,
)
def get_my_registrations(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_my_registrations(actor, conn)
