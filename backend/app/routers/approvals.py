"""Admin approvals and booking review API router."""

from typing import Any
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, Query
from pydantic import AwareDatetime

from app.deps import current_actor, get_conn, require_roles, roles_extra
from app.domain.actor import Actor
from app.domain.admin import list_bookings
from app.domain.events import review_event
from app.schemas import (
    SHARED_RESPONSES,
    BookingItem,
    EventReview,
)

router = APIRouter(prefix="/api", tags=["approvals"])


@router.post(
    "/events/{event_id}/review",
    summary="Approve or return an event pending review",
    dependencies=[Depends(require_roles("admin"))],
    openapi_extra=roles_extra("admin"),
    responses=SHARED_RESPONSES,
)
def post_review(
    event_id: UUID,
    body: EventReview,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    review_event(actor, conn, str(event_id), body.action, body.reason)
    new_status = "approved" if body.action == "approve" else "returned"
    return {"status": new_status}


@router.get(
    "/admin/bookings",
    summary="List calendar bookings with conflict detection",
    response_model=list[BookingItem],
    dependencies=[Depends(require_roles("admin"))],
    openapi_extra=roles_extra("admin"),
    responses=SHARED_RESPONSES,
)
def get_bookings(
    from_time: AwareDatetime = Query(..., description="Start of calendar window"),
    to_time: AwareDatetime = Query(..., description="End of calendar window"),
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_bookings(actor, conn, from_time, to_time)
