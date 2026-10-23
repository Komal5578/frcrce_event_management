"""Task assignment and status tracking domain logic."""

from datetime import datetime
from typing import Any

import psycopg

from app.domain.actor import Actor, require_actor_role
from app.domain.events import manageable_event
from app.errors import DomainError

STATUS_MAP: dict[str, str] = {
    "To do": "todo",
    "Doing": "doing",
    "Done": "done",
    "todo": "todo",
    "doing": "doing",
    "done": "done",
}


def set_task_status(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    task_id: str,
    label: str,
) -> None:
    """Assignee, owning coordinator or admin sets To do / Doing / Done."""
    status = STATUS_MAP.get(label)
    if not status:
        raise DomainError("INVALID_INPUT", "Choose To do, Doing or Done.")

    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE tasks
            SET status = %s,
                completed_at = CASE WHEN %s = 'done' THEN now() ELSE NULL END
            WHERE id = %s
              AND (
                assignee_id = %s
                OR %s = 'admin'
                OR event_id IN (
                    SELECT id FROM events WHERE coordinator_id = %s AND %s = 'coordinator'
                )
              );
            """,
            (status, status, task_id, actor.id, actor.role, actor.id, actor.role),
        )
        if cur.rowcount == 0:
            raise DomainError("NOT_ALLOWED", "You cannot change this task.")


def create_task(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
    title: str,
    assignee_id: str | None = None,
    due_at: datetime | str | None = None,
) -> str:
    """Add a task to an event the coordinator owns; notify the student assignee (XCUT-02)."""
    require_actor_role(actor, "coordinator")
    ev = manageable_event(actor, conn, event_id)
    if ev["status"] in ("completed", "cancelled"):
        raise DomainError(
            "BAD_STATE",
            f"This event is {ev['status']}; tasks can no longer be added.",
        )

    clean_title = title.strip() if title else ""
    if not clean_title:
        raise DomainError("INVALID_INPUT", "Give the task a title.")

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO tasks (event_id, title, assignee_id, due_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
            """,
            (event_id, clean_title, assignee_id or None, due_at or None),
        )
        task_id = str(cur.fetchone()["id"])

        if assignee_id:
            cur.execute(
                """
                INSERT INTO notifications (user_id, event_id, kind, body)
                VALUES (%s, %s, 'task_assigned', %s);
                """,
                (
                    assignee_id,
                    event_id,
                    f'You were given the task "{clean_title}" for "{ev["title"]}".',
                ),
            )

        return task_id


def list_event_tasks(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
    event_id: str,
) -> list[dict[str, Any]]:
    """List tasks on a single event the actor may view/manage."""
    manageable_event(actor, conn, event_id)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT t.id, t.event_id, e.title AS event_title, t.title,
                   t.assignee_id, p.name AS assignee_name, t.due_at,
                   t.status, t.completed_at
            FROM tasks t
            JOIN events e ON e.id = t.event_id
            LEFT JOIN profiles p ON p.id = t.assignee_id
            WHERE t.event_id = %s
            ORDER BY t.due_at, t.id;
            """,
            (event_id,),
        )
        return cur.fetchall()


def list_coordinator_tasks(
    actor: Actor,
    conn: psycopg.Connection[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Tasks across the coordinator's own events (admin: all)."""
    require_actor_role(actor, "coordinator", "admin")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT t.id, t.event_id, e.title AS event_title, t.title,
                   t.assignee_id, p.name AS assignee_name, t.due_at,
                   t.status, t.completed_at
            FROM tasks t
            JOIN events e ON e.id = t.event_id
            LEFT JOIN profiles p ON p.id = t.assignee_id
            WHERE (e.coordinator_id = %s OR %s = 'admin')
            ORDER BY t.due_at, t.id;
            """,
            (actor.id, actor.role),
        )
        return cur.fetchall()
