"""Resources and allocations API router."""

from typing import Any
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, Query
from pydantic import AwareDatetime

from app.deps import current_actor, get_conn, require_roles, roles_extra
from app.domain.actor import Actor
from app.domain.allocations import list_allocations, set_allocation
from app.domain.catalog import list_resources, save_resource
from app.domain.venues import resource_available
from app.schemas import (
    SHARED_RESPONSES,
    AllocationItem,
    AllocationSet,
    IdResponse,
    ResourceAvailableItem,
    ResourceItem,
    ResourceSave,
    SuccessResponse,
)

router = APIRouter(prefix="/api", tags=["resources"])


@router.get(
    "/resources",
    summary="List resources with current use and peak reservations",
    response_model=list[ResourceItem],
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_all_resources(
    from_time: AwareDatetime | None = Query(None, description="Start of window for usage calculation"),
    to_time: AwareDatetime | None = Query(None, description="End of window for usage calculation"),
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_resources(actor, conn, from_time, to_time)


@router.get(
    "/resources/{resource_id}/available",
    summary="Check resource quantity available in a time window",
    response_model=ResourceAvailableItem,
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_resource_available(
    resource_id: UUID,
    start: AwareDatetime = Query(..., description="Start of slot"),
    end: AwareDatetime = Query(..., description="End of slot"),
    exclude_event_id: UUID | None = Query(None, description="Event ID to exclude"),
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, Any]:
    exclude_id = str(exclude_event_id) if exclude_event_id else None
    left = resource_available(actor, conn, str(resource_id), start, end, exclude_id)
    return {"resource_id": resource_id, "available": left}


@router.post(
    "/resources",
    summary="Create a new resource",
    response_model=IdResponse,
    dependencies=[Depends(require_roles("admin"))],
    openapi_extra=roles_extra("admin"),
    responses=SHARED_RESPONSES,
)
def post_resource(
    body: ResourceSave,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    data = body.model_dump(exclude_unset=True)
    if "id" in data and data["id"] is not None:
        data["id"] = str(data["id"])
    r_id = save_resource(actor, conn, data)
    return {"id": r_id}


@router.put(
    "/resources/{resource_id}",
    summary="Update an existing resource",
    response_model=IdResponse,
    dependencies=[Depends(require_roles("admin"))],
    openapi_extra=roles_extra("admin"),
    responses=SHARED_RESPONSES,
)
def put_resource(
    resource_id: UUID,
    body: ResourceSave,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    data = body.model_dump(exclude_unset=True)
    data["id"] = str(resource_id)
    r_id = save_resource(actor, conn, data)
    return {"id": r_id}


@router.get(
    "/events/{event_id}/allocations",
    summary="List resource allocations for an event",
    response_model=list[AllocationItem],
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_allocations(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_allocations(actor, conn, str(event_id))


@router.post(
    "/events/{event_id}/allocations",
    summary="Set or remove resource allocation for an event",
    response_model=SuccessResponse,
    dependencies=[Depends(require_roles("coordinator"))],
    openapi_extra=roles_extra("coordinator"),
    responses=SHARED_RESPONSES,
)
def post_allocation(
    event_id: UUID,
    body: AllocationSet,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, bool]:
    set_allocation(actor, conn, str(event_id), str(body.resource_id), body.quantity)
    return {"ok": True}
