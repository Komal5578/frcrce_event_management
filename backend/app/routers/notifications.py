"""Notifications and alerts API router."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends

from app.deps import current_actor, get_conn, require_roles, roles_extra
from app.domain.actor import Actor
from app.domain.admin import list_bookings
from app.domain.alerts import compute_alerts
from app.domain.notifications import list_notifications, mark_read, notify_registrants, unread_count
from app.domain.people import list_my_tasks
from app.domain.tasks import list_coordinator_tasks
from app.domain.views import list_events_with_seats
from app.schemas import (
    SHARED_RESPONSES,
    AlertItem,
    NotificationCreate,
    NotificationItem,
    SuccessResponse,
    UnreadCountItem,
)

router = APIRouter(prefix="/api", tags=["notifications"])


@router.get(
    "/notifications",
    summary="List actor's notifications, newest first",
    response_model=list[NotificationItem],
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_notifications(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_notifications(actor, conn)


@router.get(
    "/notifications/unread-count",
    summary="Get count of unread notifications for actor",
    response_model=UnreadCountItem,
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_unread_count(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, int]:
    count = unread_count(actor, conn)
    return {"count": count}


@router.post(
    "/notifications/{notification_id}/read",
    summary="Mark a notification as read",
    response_model=SuccessResponse,
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def post_mark_read(
    notification_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, bool]:
    mark_read(actor, conn, str(notification_id))
    return {"ok": True}


@router.post(
    "/events/{event_id}/notify",
    summary="Send message to all confirmed and waitlisted registrants",
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def post_notify_registrants(
    event_id: UUID,
    body: NotificationCreate,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, int]:
    created = notify_registrants(actor, conn, str(event_id), body.kind, body.body)
    return {"created": created}


@router.get(
    "/notifications/alerts",
    summary="List active alerts served as Notifications",
    response_model=list[AlertItem],
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_alerts(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    now = datetime.now(UTC)
    events = list_events_with_seats(actor, conn)

    if actor.role == "student":
        tasks = list_my_tasks(actor, conn)
        bookings: list[dict[str, Any]] = []
    elif actor.role == "coordinator":
        tasks = list_coordinator_tasks(actor, conn)
        bookings = []
    else:
        tasks = list_coordinator_tasks(actor, conn)
        bookings = list_bookings(actor, conn, now - timedelta(days=7), now + timedelta(days=60))

    return compute_alerts(
        role=actor.role,
        events=events,
        tasks=tasks,
        bookings=bookings,
        now=now,
    )
