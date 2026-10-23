"""Tests for reports, alerts computation, and CSV export domain logic."""

from datetime import UTC, datetime, timedelta

import pytest

from app.domain.actor import Actor
from app.domain.alerts import compute_alerts, split_alerts
from app.domain.reports import build_report, export_csv, list_overdue_tasks_for_actor, parse_filters
from app.domain.tasks import create_task
from app.errors import DomainError


def test_parse_filters():
    assert parse_filters({"status": "open"}) == {"status": "open"}
    assert parse_filters({"status": "draft"}) == {"status": "draft"}
    assert parse_filters({"status": "injected'; DROP"}) == {}
    assert parse_filters({"from": "2026-01-01", "to": "2026-12-31"}) == {
        "from": "2026-01-01",
        "to": "2026-12-31",
    }
    assert parse_filters({"from": "invalid-date"}) == {}
    assert parse_filters({"unknown_col": "value", "status": "open"}) == {"status": "open"}


def test_build_report_and_export_csv_auth(conn, make_user, make_venue, make_event):
    coord1 = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    coord2 = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    admin = Actor(id=str(make_user(role="admin")["id"]), role="admin")
    student = Actor(id=str(make_user(role="student")["id"]), role="student")
    v_id = str(make_venue()["id"])

    t1 = datetime(2030, 3, 1, 10, 0, tzinfo=UTC)
    t2 = datetime(2030, 3, 1, 12, 0, tzinfo=UTC)

    make_event(coordinator_id=coord1.id, venue_id=v_id, starts_at=t1, ends_at=t2, title="Coord 1 Event", status="open")
    make_event(coordinator_id=coord2.id, venue_id=v_id, starts_at=t1 + timedelta(days=2), ends_at=t2 + timedelta(days=2), title="Coord 2 Event", status="open")

    now = datetime(2030, 3, 1, tzinfo=UTC)

    # Student cannot read or export
    with pytest.raises(DomainError) as exc:
        build_report(student, conn, {}, now)
    assert exc.value.code == "NOT_ALLOWED"

    with pytest.raises(DomainError) as exc:
        export_csv(student, conn, {}, now)
    assert exc.value.code == "NOT_ALLOWED"

    # Coord 1 sees only own event
    rep1 = build_report(coord1, conn, {}, now)
    titles1 = [r["title"] for r in rep1["rows"]]
    assert "Coord 1 Event" in titles1
    assert "Coord 2 Event" not in titles1
    assert rep1["totals"]["events"] == 1

    # Admin sees both events
    rep_admin = build_report(admin, conn, {}, now)
    titles_admin = [r["title"] for r in rep_admin["rows"]]
    assert "Coord 1 Event" in titles_admin
    assert "Coord 2 Event" in titles_admin
    assert rep_admin["totals"]["events"] >= 2

    # Export CSV contains BOM, header, and data
    csv_str = export_csv(coord1, conn, {}, now)
    assert csv_str.startswith("\ufeff")
    assert '"Title","Status"' in csv_str
    assert "Coord 1 Event" in csv_str


def test_build_report_no_pii(conn, make_user, make_venue, make_event):
    coord = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    v_id = str(make_venue()["id"])
    make_event(coordinator_id=coord.id, venue_id=v_id, status="open")

    report = build_report(coord, conn, {}, datetime.now(UTC))
    for col in report["columns"]:
        assert not any(pii in col["key"].lower() for pii in ("name", "email", "registrant"))
    for row in report["rows"]:
        for key in row:
            assert not any(pii in key.lower() for pii in ("name", "email", "registrant"))


def test_overdue_tasks_scoping(conn, make_user, make_venue, make_event):
    coord1 = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    coord2 = Actor(id=str(make_user(role="coordinator")["id"]), role="coordinator")
    admin = Actor(id=str(make_user(role="admin")["id"]), role="admin")
    student = Actor(id=str(make_user(role="student")["id"]), role="student")
    v1_id = str(make_venue()["id"])
    v2_id = str(make_venue()["id"])

    ev1 = make_event(coordinator_id=coord1.id, venue_id=v1_id, status="open")
    ev2 = make_event(coordinator_id=coord2.id, venue_id=v2_id, status="open")
    ev1_id = str(ev1["id"])
    ev2_id = str(ev2["id"])

    past = datetime(2025, 1, 1, tzinfo=UTC)
    now = datetime(2026, 1, 1, tzinfo=UTC)

    t1_id = create_task(coord1, conn, ev1_id, "Past Task 1", assignee_id=student.id, due_at=past)
    t2_id = create_task(coord2, conn, ev2_id, "Past Task 2", assignee_id=student.id, due_at=past)

    # Student cannot list overdue tasks directly
    with pytest.raises(DomainError) as exc:
        list_overdue_tasks_for_actor(student, conn, now)
    assert exc.value.code == "NOT_ALLOWED"

    # Coord 1 sees only task 1
    c1_overdue = list_overdue_tasks_for_actor(coord1, conn, now)
    c1_ids = [str(t["id"]) for t in c1_overdue]
    assert t1_id in c1_ids
    assert t2_id not in c1_ids

    # Admin sees both
    admin_overdue = list_overdue_tasks_for_actor(admin, conn, now)
    admin_ids = [str(t["id"]) for t in admin_overdue]
    assert t1_id in admin_ids
    assert t2_id in admin_ids


def test_compute_alerts_logic():
    now = datetime(2030, 6, 1, 12, 0, tzinfo=UTC)
    future = now + timedelta(days=3)
    past = now - timedelta(days=1)

    # 1. Low registration event
    ev_lowreg = {
        "id": "e1",
        "title": "Low Reg Event",
        "status": "open",
        "capacity": 40,
        "confirmed": 2,
        "starts_at": future,
    }

    # 2. Overdue task
    task_overdue = {
        "id": "t1",
        "event_id": "e1",
        "event_title": "Low Reg Event",
        "title": "Do slides",
        "due_at": past,
        "status": "todo",
    }

    # 3. Clash booking
    booking_clash = {
        "event_id": "e1",
        "conflict": 'Overlaps "Other Event" at Main Hall.',
    }

    # Admin receives clash, overdue, lowreg in order
    alerts = compute_alerts(
        role="admin",
        events=[ev_lowreg],
        tasks=[task_overdue],
        bookings=[booking_clash],
        now=now,
    )

    assert len(alerts) == 3
    assert alerts[0]["kind"] == "clash"
    assert alerts[0]["text"] == 'Overlaps "Other Event" at Main Hall.'
    assert alerts[1]["kind"] == "overdue"
    assert "1 task is overdue" in alerts[1]["text"]
    assert alerts[2]["kind"] == "lowreg"
    assert "low registrations" in alerts[2]["text"]

    # Student never receives clash or lowreg
    student_alerts = compute_alerts(
        role="student",
        events=[ev_lowreg],
        tasks=[task_overdue],
        bookings=[booking_clash],
        now=now,
    )
    assert len(student_alerts) == 1
    assert student_alerts[0]["kind"] == "overdue"


def test_split_alerts():
    items = list(range(7))
    res = split_alerts(items, 5)
    assert res["shown"] == [0, 1, 2, 3, 4]
    assert res["rest"] == [5, 6]

    res_zero = split_alerts(items, 0)
    assert len(res_zero["shown"]) == 5
