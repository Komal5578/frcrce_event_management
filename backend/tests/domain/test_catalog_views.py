"""Tests for tasks, venues, catalog, people, and views domain modules."""

from datetime import UTC, datetime

import pytest

from app.domain.actor import Actor
from app.domain.catalog import busy_venues, list_resources, list_venues, save_resource, save_venue
from app.domain.people import list_my_registrations, list_my_tasks, list_students, my_profile
from app.domain.tasks import create_task, list_coordinator_tasks, list_event_tasks, set_task_status
from app.domain.venues import free_venues, resource_available
from app.domain.views import get_event_detail, list_events_with_seats
from app.errors import DomainError


def test_task_lifecycle_and_auth(conn, make_user, make_venue, make_event):
    coord = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    coord2 = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    student = Actor(id=str(make_user(role="student")["id"]), role="student")
    other_student = Actor(id=str(make_user(role="student")["id"]), role="student")
    admin = Actor(id=str(make_user(role="admin")["id"]), role="admin")
    venue_id = str(make_venue()["id"])

    ev = make_event(coordinator_id=coord.id, venue_id=venue_id, status="approved")
    ev_id = str(ev["id"])

    # Coord creates task
    task_id = create_task(coord, conn, ev_id, "Prepare slides", assignee_id=student.id)
    assert task_id

    # Non-owning coordinator cannot add task
    with pytest.raises(DomainError) as exc:
        create_task(coord2, conn, ev_id, "Sneak in")
    assert exc.value.code == "NOT_ALLOWED"

    # Tasks on event visible to owning coord
    tasks = list_event_tasks(coord, conn, ev_id)
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Prepare slides"
    assert tasks[0]["status"] == "todo"

    # Coord tasks listing
    c_tasks = list_coordinator_tasks(coord, conn)
    assert any(str(t["id"]) == task_id for t in c_tasks)

    # Assignee student can update status
    set_task_status(student, conn, task_id, "Doing")
    tasks = list_event_tasks(coord, conn, ev_id)
    assert tasks[0]["status"] == "doing"
    assert tasks[0]["completed_at"] is None

    # Other student cannot update status
    with pytest.raises(DomainError) as exc:
        set_task_status(other_student, conn, task_id, "Done")
    assert exc.value.code == "NOT_ALLOWED"

    # Owning coord can mark Done
    set_task_status(coord, conn, task_id, "Done")
    tasks = list_event_tasks(coord, conn, ev_id)
    assert tasks[0]["status"] == "done"
    assert tasks[0]["completed_at"] is not None

    # Admin can change back to To do
    set_task_status(admin, conn, task_id, "To do")
    tasks = list_event_tasks(coord, conn, ev_id)
    assert tasks[0]["status"] == "todo"
    assert tasks[0]["completed_at"] is None


def test_venues_and_resources_availability(conn, make_user, make_venue, make_event):
    coord = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    v_id = str(make_venue(name="Auditorium", capacity=500)["id"])

    # Resource
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO resources (name, quantity, active) VALUES ('Microphones', 5, TRUE) RETURNING id;"
        )
        r_id = str(cur.fetchone()["id"])

    t1 = datetime(2030, 5, 10, 10, 0, tzinfo=UTC)
    t2 = datetime(2030, 5, 10, 12, 0, tzinfo=UTC)

    # Initially venue is free
    free = free_venues(coord, conn, t1, t2)
    assert any(str(v["id"]) == v_id for v in free)
    assert resource_available(coord, conn, r_id, t1, t2) == 5

    # Event approved holding venue and 2 mics
    ev = make_event(
        coordinator_id=coord.id,
        venue_id=v_id,
        starts_at=t1,
        ends_at=t2,
        status="approved",
    )
    ev_id = str(ev["id"])
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO resource_allocations (event_id, resource_id, quantity) VALUES (%s, %s, 2);",
            (ev_id, r_id),
        )

    # Now venue is not free
    free = free_venues(coord, conn, t1, t2)
    assert not any(str(v["id"]) == v_id for v in free)
    assert resource_available(coord, conn, r_id, t1, t2) == 3

    # Free if we exclude this event
    free = free_venues(coord, conn, t1, t2, exclude_event_id=ev_id)
    assert any(str(v["id"]) == v_id for v in free)
    assert resource_available(coord, conn, r_id, t1, t2, exclude_event_id=ev_id) == 5


def test_catalog_admin_crud(conn, make_user, make_venue, make_event):
    admin = Actor(id=str(make_user(role="admin")["id"]), role="admin")
    student = Actor(id=str(make_user(role="student")["id"]), role="student")

    # Save venue
    v_id = save_venue(admin, conn, {"name": "Lab 1", "capacity": 30, "location": "Science Block"})
    assert v_id

    # Non-admin cannot save venue
    with pytest.raises(DomainError) as exc:
        save_venue(student, conn, {"name": "Lab 2", "capacity": 30})
    assert exc.value.code == "NOT_ALLOWED"

    # Save resource
    r_id = save_resource(admin, conn, {"name": "Laptops", "quantity": 10})
    assert r_id

    # Reserve 4 laptops for future event
    coord_id = str(make_user(role="coordinator")["id"])
    t1 = datetime(2030, 6, 1, 10, 0, tzinfo=UTC)
    t2 = datetime(2030, 6, 1, 12, 0, tzinfo=UTC)
    make_event(coordinator_id=coord_id, venue_id=v_id, starts_at=t1, ends_at=t2, status="approved")
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO resource_allocations (event_id, resource_id, quantity) VALUES ((SELECT id FROM events WHERE coordinator_id = %s), %s, 4);",
            (coord_id, r_id),
        )

    # Admin cannot lower quantity below 4
    with pytest.raises(DomainError) as exc:
        save_resource(admin, conn, {"id": r_id, "name": "Laptops", "quantity": 3})
    assert exc.value.code == "INVALID_INPUT"
    assert "4 are already reserved" in exc.value.message

    # Can set to 4 or higher
    save_resource(admin, conn, {"id": r_id, "name": "Laptops", "quantity": 5})

    # List resources and venues
    res_list = list_resources(admin, conn)
    assert any(str(r["id"]) == r_id and r["quantity"] == 5 for r in res_list)

    ven_list = list_venues(student, conn)
    assert any(str(v["id"]) == v_id for v in ven_list)

    busy = busy_venues(admin, conn, t1, t2)
    assert any(str(b["venue_id"]) == v_id for b in busy)


def test_people_and_views(conn, make_user, make_venue, make_event):
    coord = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    student = Actor(id=str(make_user(role="student")["id"]), role="student")
    admin = Actor(id=str(make_user(role="admin")["id"]), role="admin")
    v_id = str(make_venue(name="Main Hall", capacity=100)["id"])

    # list_students
    students = list_students(coord, conn)
    assert any(str(s["id"]) == student.id for s in students)

    with pytest.raises(DomainError) as exc:
        list_students(student, conn)
    assert exc.value.code == "NOT_ALLOWED"

    # my_profile
    prof = my_profile(student, conn)
    assert prof["is_organizer"] is False

    # Event views
    t1 = datetime(2030, 7, 1, 10, 0, tzinfo=UTC)
    t2 = datetime(2030, 7, 1, 12, 0, tzinfo=UTC)
    ev = make_event(
        coordinator_id=coord.id,
        venue_id=v_id,
        starts_at=t1,
        ends_at=t2,
        capacity=100,
        status="open",
    )
    ev_id = str(ev["id"])

    # Register student
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO registrations (event_id, user_id, status) VALUES (%s, %s, 'confirmed');",
            (ev_id, student.id),
        )

    # Student my registrations
    my_regs = list_my_registrations(student, conn)
    assert len(my_regs) == 1
    assert str(my_regs[0]["event_id"]) == ev_id
    assert my_regs[0]["reg_status"] == "confirmed"

    # Student my tasks
    create_task(coord, conn, ev_id, "Set up microphones", assignee_id=student.id)
    s_tasks = list_my_tasks(student, conn)
    assert len(s_tasks) == 1
    assert s_tasks[0]["title"] == "Set up microphones"

    # Student views list_events_with_seats
    events = list_events_with_seats(student, conn)
    assert len(events) >= 1
    e = next(x for x in events if str(x["id"]) == ev_id)
    assert e["confirmed"] == 1
    assert e["my_reg"] == "confirmed"

    # Admin also sees the event
    admin_events = list_events_with_seats(admin, conn)
    assert any(str(x["id"]) == ev_id for x in admin_events)

    # get_event_detail
    detail = get_event_detail(student, conn, ev_id)
    assert str(detail["id"]) == ev_id
    assert detail["confirmed"] == 1
    assert detail["my_reg"] == "confirmed"
