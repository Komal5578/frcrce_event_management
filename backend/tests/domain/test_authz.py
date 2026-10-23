"""Tests for domain authorization boundaries and IDOR prevention."""

import uuid

import pytest

from app.domain.actor import Actor
from app.domain.drafts import save_draft
from app.domain.events import cancel_event, manageable_event, submit_event
from app.errors import DomainError


def test_missing_and_foreign_event_return_same_not_allowed(conn, make_user, make_event) -> None:
    owner = make_user(role="coordinator")
    other_coord = make_user(role="coordinator")
    other_actor = Actor(id=other_coord["id"], role="coordinator")

    ev = make_event(status="draft", coordinator_id=owner["id"])
    missing_id = str(uuid.uuid4())

    # Foreign event returns NOT_ALLOWED
    with pytest.raises(DomainError) as exc_foreign:
        manageable_event(other_actor, conn, ev["id"])
    assert exc_foreign.value.code == "NOT_ALLOWED"

    # Missing event returns identical NOT_ALLOWED
    with pytest.raises(DomainError) as exc_missing:
        manageable_event(other_actor, conn, missing_id)
    assert exc_missing.value.code == "NOT_ALLOWED"
    assert exc_foreign.value.message == exc_missing.value.message


def test_coordinator_cannot_mutate_another_coordinators_event(conn, make_user, make_event) -> None:
    owner = make_user(role="coordinator")
    other = make_user(role="coordinator")
    other_actor = Actor(id=other["id"], role="coordinator")

    draft = make_event(status="draft", coordinator_id=owner["id"])

    # save_draft by foreign coordinator raises NOT_ALLOWED
    with pytest.raises(DomainError) as exc_info:
        save_draft(other_actor, conn, draft["id"], {"title": "Hijacked"})
    assert exc_info.value.code == "NOT_ALLOWED"

    # submit_event by foreign coordinator raises NOT_ALLOWED
    with pytest.raises(DomainError) as exc_info:
        submit_event(other_actor, conn, draft["id"])
    assert exc_info.value.code == "NOT_ALLOWED"


def test_student_cannot_manage_events(conn, make_user, make_event) -> None:
    student = make_user(role="student")
    student_actor = Actor(id=student["id"], role="student")
    ev = make_event(status="open")

    with pytest.raises(DomainError) as exc_info:
        manageable_event(student_actor, conn, ev["id"])
    assert exc_info.value.code == "NOT_ALLOWED"

    with pytest.raises(DomainError) as exc_info:
        cancel_event(student_actor, conn, ev["id"])
    assert exc_info.value.code == "NOT_ALLOWED"


def test_admin_can_manage_any_event(conn, make_user, make_event) -> None:
    coord = make_user(role="coordinator")
    admin = make_user(role="admin")
    admin_actor = Actor(id=admin["id"], role="admin")

    ev = make_event(status="pending", coordinator_id=coord["id"])
    managed = manageable_event(admin_actor, conn, ev["id"])
    assert managed["id"] == ev["id"]
