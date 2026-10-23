"""Tests for notifications and admin booking conflict flagging."""

from datetime import UTC, datetime

import pytest

from app.domain.actor import Actor
from app.domain.admin import flag_conflicts, list_bookings
from app.domain.notifications import list_notifications, mark_read, notify_registrants, unread_count
from app.errors import DomainError


def test_flag_conflicts_matrix():
    v1 = "v1"
    v2 = "v2"
    t1 = datetime(2030, 1, 1, 10, 0, tzinfo=UTC)
    t2 = datetime(2030, 1, 1, 12, 0, tzinfo=UTC)
    t3 = datetime(2030, 1, 1, 11, 0, tzinfo=UTC)
    t4 = datetime(2030, 1, 1, 13, 0, tzinfo=UTC)
    t5 = datetime(2030, 1, 1, 12, 0, tzinfo=UTC)
    t6 = datetime(2030, 1, 1, 14, 0, tzinfo=UTC)

    # 1. Overlapping pending vs pending on same venue
    rows = [
        {"event_id": "e1", "title": "Pending A", "status": "pending", "venue_id": v1, "venue_name": "Hall", "venue_active": True, "starts_at": t1, "ends_at": t2},
        {"event_id": "e2", "title": "Pending B", "status": "pending", "venue_id": v1, "venue_name": "Hall", "venue_active": True, "starts_at": t3, "ends_at": t4},
    ]
    flagged = flag_conflicts(rows)
    assert flagged[0]["conflict"] == 'Overlaps "Pending B" at Hall.'
    assert flagged[1]["conflict"] == 'Overlaps "Pending A" at Hall.'

    # 2. Overlapping pending vs approved on same venue
    rows = [
        {"event_id": "e1", "title": "Held Event", "status": "approved", "venue_id": v1, "venue_name": "Hall", "venue_active": True, "starts_at": t1, "ends_at": t2},
        {"event_id": "e2", "title": "Pending Event", "status": "pending", "venue_id": v1, "venue_name": "Hall", "venue_active": True, "starts_at": t3, "ends_at": t4},
    ]
    flagged = flag_conflicts(rows)
    assert flagged[0]["conflict"] == 'Overlaps "Pending Event" at Hall.'
    assert flagged[1]["conflict"] == 'Overlaps "Held Event" at Hall.'

    # 3. Adjacent events on same venue (t1..t2 and t5..t6 where t2 == t5 == 12:00) -> NO conflict
    rows = [
        {"event_id": "e1", "title": "Morning", "status": "approved", "venue_id": v1, "venue_name": "Hall", "venue_active": True, "starts_at": t1, "ends_at": t2},
        {"event_id": "e2", "title": "Afternoon", "status": "approved", "venue_id": v1, "venue_name": "Hall", "venue_active": True, "starts_at": t5, "ends_at": t6},
    ]
    flagged = flag_conflicts(rows)
    assert flagged[0]["conflict"] is None
    assert flagged[1]["conflict"] is None

    # 4. Overlapping times but different venues -> NO conflict
    rows = [
        {"event_id": "e1", "title": "Event Hall 1", "status": "pending", "venue_id": v1, "venue_name": "Hall 1", "venue_active": True, "starts_at": t1, "ends_at": t2},
        {"event_id": "e2", "title": "Event Hall 2", "status": "pending", "venue_id": v2, "venue_name": "Hall 2", "venue_active": True, "starts_at": t1, "ends_at": t2},
    ]
    flagged = flag_conflicts(rows)
    assert flagged[0]["conflict"] is None
    assert flagged[1]["conflict"] is None

    # 5. Live event on retired venue -> retired message
    rows = [
        {"event_id": "e1", "title": "Event Old", "status": "approved", "venue_id": v1, "venue_name": "Old Room", "venue_active": False, "starts_at": t1, "ends_at": t2},
    ]
    flagged = flag_conflicts(rows)
    assert flagged[0]["conflict"] == "Old Room is retired. Move this event to another venue."


def test_list_bookings_auth(conn, make_user, make_venue, make_event):
    admin = Actor(id=str(make_user(role="admin")["id"]), role="admin")
    coord = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    student = Actor(id=str(make_user(role="student")["id"]), role="student")
    v_id = str(make_venue(name="Conference Room")["id"])

    t1 = datetime(2030, 2, 1, 10, 0, tzinfo=UTC)
    t2 = datetime(2030, 2, 1, 12, 0, tzinfo=UTC)
    make_event(coordinator_id=coord.id, venue_id=v_id, starts_at=t1, ends_at=t2, status="pending")

    # Non-admin rejected
    with pytest.raises(DomainError) as exc:
        list_bookings(coord, conn, datetime(2030, 2, 1, tzinfo=UTC), datetime(2030, 2, 2, tzinfo=UTC))
    assert exc.value.code == "NOT_ALLOWED"

    with pytest.raises(DomainError) as exc:
        list_bookings(student, conn, datetime(2030, 2, 1, tzinfo=UTC), datetime(2030, 2, 2, tzinfo=UTC))
    assert exc.value.code == "NOT_ALLOWED"

    # Admin allowed
    bookings = list_bookings(admin, conn, datetime(2030, 2, 1, tzinfo=UTC), datetime(2030, 2, 2, tzinfo=UTC))
    assert len(bookings) >= 1
    assert any(b["venue_name"] == "Conference Room" for b in bookings)


def test_notifications_lifecycle(conn, make_user, make_venue, make_event):
    coord = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    s1 = Actor(id=str(make_user(role="student")["id"]), role="student")
    s2 = Actor(id=str(make_user(role="student")["id"]), role="student")
    v_id = str(make_venue()["id"])

    ev = make_event(coordinator_id=coord.id, venue_id=v_id, status="open")
    ev_id = str(ev["id"])

    # Register s1 (confirmed) and s2 (waitlisted)
    with conn.cursor() as cur:
        cur.execute("INSERT INTO registrations (event_id, user_id, status) VALUES (%s, %s, 'confirmed');", (ev_id, s1.id))
        cur.execute("INSERT INTO registrations (event_id, user_id, status) VALUES (%s, %s, 'waitlisted');", (ev_id, s2.id))

    # Notify registrants
    created = notify_registrants(coord, conn, ev_id, "room_change", "The event moved to Room 101.")
    assert created == 2

    # s1 checks notifications
    assert unread_count(s1, conn) == 1
    assert unread_count(s2, conn) == 1

    notes1 = list_notifications(s1, conn)
    assert len(notes1) == 1
    assert notes1[0]["body"] == "The event moved to Room 101."
    assert notes1[0]["read_at"] is None

    # s1 marks read
    n_id = str(notes1[0]["id"])
    mark_read(s1, conn, n_id)
    assert unread_count(s1, conn) == 0
    assert unread_count(s2, conn) == 1

    # s2 cannot mark s1's notification
    with pytest.raises(DomainError) as exc:
        mark_read(s2, conn, n_id)
    assert exc.value.code == "NOT_ALLOWED"
