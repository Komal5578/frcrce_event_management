"""Tasks and people API router."""

from typing import Any
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends

from app.deps import current_actor, get_conn, require_roles, roles_extra
from app.domain.actor import Actor
from app.domain.people import list_my_tasks, list_students, my_profile
from app.domain.tasks import create_task, list_coordinator_tasks, list_event_tasks, set_task_status
from app.schemas import (
    SHARED_RESPONSES,
    IdResponse,
    MyProfileItem,
    MyTaskItem,
    StudentProfileItem,
    SuccessResponse,
    TaskCreate,
    TaskItem,
    TaskStatusUpdate,
)

router = APIRouter(prefix="/api", tags=["tasks"])


@router.post(
    "/events/{event_id}/tasks",
    summary="Add a task to an owned event",
    response_model=IdResponse,
    dependencies=[Depends(require_roles("coordinator"))],
    openapi_extra=roles_extra("coordinator"),
    responses=SHARED_RESPONSES,
)
def post_task(
    event_id: UUID,
    body: TaskCreate,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, str]:
    assignee = str(body.assignee_id) if body.assignee_id else None
    task_id = create_task(actor, conn, str(event_id), body.title, assignee, body.due_at)
    return {"id": task_id}


@router.get(
    "/events/{event_id}/tasks",
    summary="List tasks on a single event",
    response_model=list[TaskItem],
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_event_tasks(
    event_id: UUID,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_event_tasks(actor, conn, str(event_id))


@router.get(
    "/tasks/coordinator",
    summary="List all tasks across coordinator's events",
    response_model=list[TaskItem],
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_coordinator_tasks(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_coordinator_tasks(actor, conn)


@router.get(
    "/tasks/mine",
    summary="List student's assigned tasks",
    response_model=list[MyTaskItem],
    dependencies=[Depends(require_roles("student"))],
    openapi_extra=roles_extra("student"),
    responses=SHARED_RESPONSES,
)
def get_my_tasks(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_my_tasks(actor, conn)


@router.patch(
    "/tasks/{task_id}/status",
    summary="Update task status (To do / Doing / Done)",
    response_model=SuccessResponse,
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def patch_task_status(
    task_id: UUID,
    body: TaskStatusUpdate,
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, bool]:
    set_task_status(actor, conn, str(task_id), body.label)
    return {"ok": True}


@router.get(
    "/people/students",
    summary="List students available for task assignment",
    response_model=list[StudentProfileItem],
    dependencies=[Depends(require_roles("coordinator", "admin"))],
    openapi_extra=roles_extra("coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_students(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> list[dict[str, Any]]:
    return list_students(actor, conn)


@router.get(
    "/people/me",
    summary="Get authenticated actor profile details",
    response_model=MyProfileItem,
    dependencies=[Depends(require_roles("student", "coordinator", "admin"))],
    openapi_extra=roles_extra("student", "coordinator", "admin"),
    responses=SHARED_RESPONSES,
)
def get_my_profile(
    actor: Actor = Depends(current_actor),
    conn: psycopg.Connection[dict[str, Any]] = Depends(get_conn),
) -> dict[str, Any]:
    return my_profile(actor, conn)
