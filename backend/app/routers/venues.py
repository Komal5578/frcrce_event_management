"""Venues API router."""

from typing import Any
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, Query
from pydantic import AwareDatetime

from app.deps import current_actor, get_conn, require_roles, roles_extra
from app.domain.actor import Actor
from app.domain.catalog import busy_venues, list_venues, save_venue
from app.domain.venues import free_venues
from app.schemas import (
    SHARED_RESPONSES,
    BusyVenueItem,
    IdResponse,
    VenueItem,
    VenueSave,
)

router = APIRouter(prefix="/api/venues", tags=["venues"])


@router.get(
    "",
    summary="List all venues with future events counts",
    response_model=list[VenueItem],
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_all_venues(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_venues(actor, conn)


@router.get(
    "/free",
    summary="List venues free for a given time window",
    response_model=list[VenueItem],
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_free_venues(
    start: AwareDatetime = Query(..., description="Start of slot"),
    end: AwareDatetime = Query(..., description="End of slot"),
    exclude_event_id: UUID | None = Query(None, description="Event ID to exclude from conflict check"),
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    exclude_id = str(exclude_event_id) if exclude_event_id else None
    return free_venues(actor, conn, start, end, exclude_id)


@router.get(
    "/busy",
    summary="List active events holding venues in a time window",
    response_model=list[BusyVenueItem],
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_busy_venues(
    start: AwareDatetime = Query(..., description="Start of slot"),
    end: AwareDatetime = Query(..., description="End of slot"),
    exclude_event_id: UUID | None = Query(None, description="Event ID to exclude"),
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    exclude_id = str(exclude_event_id) if exclude_event_id else None
    return busy_venues(actor, conn, start, end, exclude_id)


@router.post(
    "",
    summary="Create a new venue",
    response_model=IdResponse,
    dependencies=[Depends(require_roles("admin"))],
    openapi_extra=roles_extra("admin"),
    responses=SHARED_RESPONSES,
)
def post_venue(
    body: VenueSave,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    data = body.model_dump(exclude_unset=True)
    if "id" in data and data["id"] is not None:
        data["id"] = str(data["id"])
    v_id = save_venue(actor, conn, data)
    return {"id": v_id}


@router.put(
    "/{venue_id}",
    summary="Update or retire an existing venue",
    response_model=IdResponse,
    dependencies=[Depends(require_roles("admin"))],
    openapi_extra=roles_extra("admin"),
    responses=SHARED_RESPONSES,
)
def put_venue(
    venue_id: UUID,
    body: VenueSave,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    data = body.model_dump(exclude_unset=True)
    data["id"] = str(venue_id)
    v_id = save_venue(actor, conn, data)
    return {"id": v_id}
