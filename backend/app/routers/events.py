"""Events and drafts API router."""

from typing import Any
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends

from app.deps import current_actor, get_conn, require_roles, roles_extra
from app.domain.actor import Actor
from app.domain.drafts import create_draft, delete_draft, list_templates, save_draft, update_event
from app.domain.events import advance_event, cancel_event, submit_event
from app.domain.views import get_event_detail, list_events_with_seats
from app.schemas import (
    SHARED_RESPONSES,
    DraftCreate,
    DraftPatch,
    EventCancel,
    EventViewItem,
    IdResponse,
    SuccessResponse,
    TemplateItem,
)

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get(
    "",
    summary="List visible events with seat counts",
    response_model=list[EventViewItem],
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def list_events(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_events_with_seats(actor, conn)


@router.get(
    "/templates",
    summary="List event templates",
    response_model=list[TemplateItem],
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_templates(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_templates(actor, conn)


@router.post(
    "/drafts",
    summary="Create a new event draft",
    response_model=IdResponse,
    dependencies=[Depends(require_roles("coordinator"))],
    openapi_extra=roles_extra("coordinator"),
    responses=SHARED_RESPONSES,
)
def post_draft(
    body: DraftCreate,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    t_id = str(body.template_id) if body.template_id else None
    ev_id = create_draft(actor, conn, t_id)
    return {"id": ev_id}


@router.get(
    "/{event_id}",
    summary="Get single event detail with seat counts",
    response_model=EventViewItem,
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_event(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, Any]:
    return get_event_detail(actor, conn, str(event_id))


@router.patch(
    "/{event_id}/draft",
    summary="Autosave draft event fields",
    response_model=IdResponse,
    dependencies=[Depends(require_roles("coordinator"))],
    openapi_extra=roles_extra("coordinator"),
    responses=SHARED_RESPONSES,
)
def patch_draft(
    event_id: UUID,
    body: DraftPatch,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    data = body.model_dump(exclude_unset=True)
    if "venue_id" in data and data["venue_id"] is not None:
        data["venue_id"] = str(data["venue_id"])
    save_draft(actor, conn, str(event_id), data)
    return {"id": str(event_id)}


@router.patch(
    "/{event_id}",
    summary="Update/reschedule event fields",
    response_model=IdResponse,
    dependencies=[Depends(require_roles("coordinator"))],
    openapi_extra=roles_extra("coordinator"),
    responses=SHARED_RESPONSES,
)
def patch_event(
    event_id: UUID,
    body: DraftPatch,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    data = body.model_dump(exclude_unset=True)
    if "venue_id" in data and data["venue_id"] is not None:
        data["venue_id"] = str(data["venue_id"])
    update_event(actor, conn, str(event_id), data)
    return {"id": str(event_id)}


@router.delete(
    "/{event_id}/draft",
    summary="Discard draft event",
    response_model=SuccessResponse,
    dependencies=[Depends(require_roles("coordinator"))],
    openapi_extra=roles_extra("coordinator"),
    responses=SHARED_RESPONSES,
)
def discard_draft(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, bool]:
    delete_draft(actor, conn, str(event_id))
    return {"ok": True}


@router.post(
    "/{event_id}/submit",
    summary="Submit draft or returned event for review",
    response_model=SuccessResponse,
    dependencies=[Depends(require_roles("coordinator"))],
    openapi_extra=roles_extra("coordinator"),
    responses=SHARED_RESPONSES,
)
def submit_for_review(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, bool]:
    submit_event(actor, conn, str(event_id))
    return {"ok": True}


@router.post(
    "/{event_id}/cancel",
    summary="Cancel event with reason",
    response_model=SuccessResponse,
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def cancel(
    event_id: UUID,
    body: EventCancel | None = None,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, bool]:
    reason = body.reason if body else None
    cancel_event(actor, conn, str(event_id), reason)
    return {"ok": True}


@router.post(
    "/{event_id}/advance",
    summary="Advance event to next lifecycle status",
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def advance(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    new_status = advance_event(actor, conn, str(event_id))
    return {"status": new_status}
