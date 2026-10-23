"""HTTP integration tests for API endpoints."""

from datetime import UTC, datetime, timedelta


def test_coordinator_draft_and_submit_flow(client_for, make_user, make_venue):
    coord = make_user(role="coordinator")
    coord_id = str(coord["id"])
    coord_client = client_for("coordinator", user_id=coord_id)
    venue_id = str(make_venue(capacity=100)["id"])

    # 1. Create draft
    resp = coord_client.post("/api/events/drafts", json={})
    assert resp.status_code == 200, resp.text
    ev_id = resp.json()["id"]

    # 2. Patch draft details
    t1 = (datetime.now(UTC) + timedelta(days=5)).isoformat()
    t2 = (datetime.now(UTC) + timedelta(days=5, hours=2)).isoformat()
    patch_resp = coord_client.patch(
        f"/api/events/{ev_id}/draft",
        json={
            "title": "Robotics Expo",
            "capacity": 50,
            "venue_id": venue_id,
            "starts_at": t1,
            "ends_at": t2,
        },
    )
    assert patch_resp.status_code == 200, patch_resp.text

    # 3. Submit for review
    sub_resp = coord_client.post(f"/api/events/{ev_id}/submit")
    assert sub_resp.status_code == 200, sub_resp.text
    assert sub_resp.json() == {"ok": True}

    # 4. View event detail
    detail_resp = coord_client.get(f"/api/events/{ev_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["status"] == "pending"
    assert detail_resp.json()["title"] == "Robotics Expo"


def test_student_routes_and_role_boundaries(client, client_for, conn, make_user, make_venue, make_event):
    student = make_user(role="student")
    student_id = str(student["id"])
    student_client = client_for("student", user_id=student_id)

    coord = make_user(role="coordinator")
    coord_id = str(coord["id"])
    venue_id = str(make_venue()["id"])

    # Anonymous request gets 401
    anon_resp = client.get("/api/events")
    assert anon_resp.status_code == 401
    assert anon_resp.json()["code"] == "UNAUTHENTICATED"

    # Student cannot create draft (403)
    forbidden_resp = student_client.post("/api/events/drafts", json={})
    assert forbidden_resp.status_code == 403
    assert forbidden_resp.json()["code"] == "NOT_ALLOWED"

    # Open event created
    ev = make_event(coordinator_id=coord_id, venue_id=venue_id, status="open", capacity=20)
    ev_id = str(ev["id"])

    # Student lists visible events
    list_resp = student_client.get("/api/events")
    assert list_resp.status_code == 200
    events = list_resp.json()
    assert any(e["id"] == ev_id for e in events)

    # Student registers for event
    reg_resp = student_client.post(f"/api/events/{ev_id}/register")
    assert reg_resp.status_code == 200
    assert reg_resp.json()["status"] == "confirmed"

    # Student checks mine
    mine_resp = student_client.get("/api/registrations/mine")
    assert mine_resp.status_code == 200
    assert any(r["event_id"] == ev_id and r["reg_status"] == "confirmed" for r in mine_resp.json())

    # Check seats
    seats_resp = student_client.get(f"/api/events/{ev_id}/seats")
    assert seats_resp.status_code == 200
    assert seats_resp.json()["confirmed"] == 1

    # Student cancels registration
    del_resp = student_client.delete(f"/api/events/{ev_id}/register")
    assert del_resp.status_code == 200
    assert del_resp.json()["ok"] is True


def test_venues_and_tasks_http(client_for, make_user, make_venue, make_event):
    coord = make_user(role="coordinator")
    coord_id = str(coord["id"])
    coord_client = client_for("coordinator", user_id=coord_id)

    student = make_user(role="student")
    student_id = str(student["id"])
    student_client = client_for("student", user_id=student_id)

    admin = make_user(role="admin")
    admin_id = str(admin["id"])
    admin_client = client_for("admin", user_id=admin_id)

    # Admin creates venue
    venue_resp = admin_client.post("/api/venues", json={"name": "Innovation Hub", "capacity": 60})
    assert venue_resp.status_code == 200
    v_id = venue_resp.json()["id"]

    # Student cannot create venue
    bad_venue = student_client.post("/api/venues", json={"name": "Sneak", "capacity": 10})
    assert bad_venue.status_code == 403

    # Coordinator creates event and task
    ev = make_event(coordinator_id=coord_id, venue_id=v_id, status="open")
    ev_id = str(ev["id"])

    task_resp = coord_client.post(f"/api/events/{ev_id}/tasks", json={"title": "Setup projector", "assignee_id": student_id})
    assert task_resp.status_code == 200
    t_id = task_resp.json()["id"]

    # Student checks my tasks
    s_tasks = student_client.get("/api/tasks/mine")
    assert s_tasks.status_code == 200
    assert any(t["id"] == t_id for t in s_tasks.json())

    # Student updates task status to doing
    patch_t = student_client.patch(f"/api/tasks/{t_id}/status", json={"label": "Doing"})
    assert patch_t.status_code == 200
    assert patch_t.json()["ok"] is True


def test_approvals_and_bookings_http(client_for, make_user, make_venue, make_event):
    admin = make_user(role="admin")
    admin_client = client_for("admin", user_id=str(admin["id"]))
    coord = make_user(role="coordinator")
    coord_client = client_for("coordinator", user_id=str(coord["id"]))
    v_id = str(make_venue()["id"])

    t1 = datetime.now(UTC) + timedelta(days=2)
    t2 = t1 + timedelta(hours=2)
    ev = make_event(coordinator_id=str(coord["id"]), venue_id=v_id, starts_at=t1, ends_at=t2, status="pending")
    ev_id = str(ev["id"])

    # Admin lists bookings (200)
    b_resp = admin_client.get("/api/admin/bookings", params={"from_time": t1.isoformat(), "to_time": t2.isoformat()})
    assert b_resp.status_code == 200
    assert any(b["event_id"] == ev_id for b in b_resp.json())

    # Coordinator cannot access bookings (403)
    coord_b = coord_client.get("/api/admin/bookings", params={"from_time": t1.isoformat(), "to_time": t2.isoformat()})
    assert coord_b.status_code == 403

    # Admin approves event
    review_resp = admin_client.post(f"/api/events/{ev_id}/review", json={"action": "approve"})
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "approved"


def test_reports_and_csv_export_http(client_for, make_user, make_venue, make_event):
    admin = make_user(role="admin")
    admin_client = client_for("admin", user_id=str(admin["id"]))
    coord = make_user(role="coordinator")
    coord_client = client_for("coordinator", user_id=str(coord["id"]))
    student = make_user(role="student")
    student_client = client_for("student", user_id=str(student["id"]))
    v_id = str(make_venue()["id"])

    make_event(coordinator_id=str(coord["id"]), venue_id=v_id, status="open")

    # Coordinator views report (200)
    rep_resp = coord_client.get("/api/reports")
    assert rep_resp.status_code == 200
    assert "columns" in rep_resp.json()
    assert "rows" in rep_resp.json()

    # Student cannot view report (403)
    s_rep = student_client.get("/api/reports")
    assert s_rep.status_code == 403

    # Admin exports CSV (200) with BOM
    csv_resp = admin_client.get("/api/reports/export.csv")
    assert csv_resp.status_code == 200
    assert csv_resp.headers["content-type"].startswith("text/csv")
    assert "attachment" in csv_resp.headers["content-disposition"]
    assert csv_resp.text.startswith("\ufeff")

    # Student cannot export CSV (403)
    s_csv = student_client.get("/api/reports/export.csv")
    assert s_csv.status_code == 403


def test_notifications_and_alerts_http(client_for, make_user):
    student = make_user(role="student")
    student_client = client_for("student", user_id=str(student["id"]))
    coord = make_user(role="coordinator")
    coord_client = client_for("coordinator", user_id=str(coord["id"]))

    # Unread count returns number for student and coordinator
    s_count = student_client.get("/api/notifications/unread-count")
    assert s_count.status_code == 200
    assert "count" in s_count.json()

    c_count = coord_client.get("/api/notifications/unread-count")
    assert c_count.status_code == 200
    assert "count" in c_count.json()

    # Alerts endpoint returns list
    alerts_resp = student_client.get("/api/notifications/alerts")
    assert alerts_resp.status_code == 200
    assert isinstance(alerts_resp.json(), list)


def test_http_primary_flows(client_for, make_user, make_venue, conn):
    coord = make_user(role="coordinator")
    coord_id = str(coord["id"])
    coord_client = client_for("coordinator", user_id=coord_id)

    admin = make_user(role="admin")
    admin_id = str(admin["id"])
    admin_client = client_for("admin", user_id=admin_id)

    student1 = make_user(role="student")
    s1_id = str(student1["id"])
    s1_client = client_for("student", user_id=s1_id)

    student2 = make_user(role="student")
    s2_id = str(student2["id"])
    s2_client = client_for("student", user_id=s2_id)

    v_id = str(make_venue(name="Auditorium X", capacity=100)["id"])

    t1 = datetime.now(UTC) + timedelta(days=10)
    t2 = t1 + timedelta(hours=3)

    # Create a resource with quantity 1
    with conn.cursor() as cur:
        cur.execute("INSERT INTO resources (name, quantity, active) VALUES ('VR Headset', 1, TRUE) RETURNING id;")
        res_id = str(cur.fetchone()["id"])

    # 1. Coordinator creates two overlapping pending requests (both allowed)
    d1_resp = coord_client.post("/api/events/drafts", json={})
    ev1_id = d1_resp.json()["id"]
    coord_client.patch(
        f"/api/events/{ev1_id}/draft",
        json={"title": "Hackathon A", "venue_id": v_id, "starts_at": t1.isoformat(), "ends_at": t2.isoformat(), "capacity": 1},
    )
    # Coordinator allocates 1 VR headset to event 1
    alloc1 = coord_client.post(f"/api/events/{ev1_id}/allocations", json={"resource_id": res_id, "quantity": 1})
    assert alloc1.status_code == 200
    coord_client.post(f"/api/events/{ev1_id}/submit")

    d2_resp = coord_client.post("/api/events/drafts", json={})
    ev2_id = d2_resp.json()["id"]
    coord_client.patch(
        f"/api/events/{ev2_id}/draft",
        json={"title": "Hackathon B", "venue_id": v_id, "starts_at": t1.isoformat(), "ends_at": t2.isoformat(), "capacity": 1},
    )
    coord_client.post(f"/api/events/{ev2_id}/submit")

    # Event 3 at different venue v2_id with same 1 VR Headset (for resource shortfall test)
    v2_id = str(make_venue()["id"])
    d3_resp = coord_client.post("/api/events/drafts", json={})
    ev3_id = d3_resp.json()["id"]
    coord_client.patch(
        f"/api/events/{ev3_id}/draft",
        json={"title": "VR Demo", "venue_id": v2_id, "starts_at": t1.isoformat(), "ends_at": t2.isoformat(), "capacity": 10},
    )
    alloc3 = coord_client.post(f"/api/events/{ev3_id}/allocations", json={"resource_id": res_id, "quantity": 1})
    assert alloc3.status_code == 200
    coord_client.post(f"/api/events/{ev3_id}/submit")

    # 2. Admin approves the first pending request -> 200 approved
    appr1 = admin_client.post(f"/api/events/{ev1_id}/review", json={"action": "approve"})
    assert appr1.status_code == 200
    assert appr1.json()["status"] == "approved"

    # 3. Admin attempts to approve the second pending request -> 409 VENUE_CLASH
    appr2 = admin_client.post(f"/api/events/{ev2_id}/review", json={"action": "approve"})
    assert appr2.status_code == 409
    assert appr2.json()["code"] == "VENUE_CLASH"
    assert "already booked" in appr2.json()["message"]

    # 4. Approving event 3 fails on resource shortfall because event 1 is holding the 1 VR Headset during [t1, t2)
    appr3 = admin_client.post(f"/api/events/{ev3_id}/review", json={"action": "approve"})
    assert appr3.status_code == 409
    assert appr3.json()["code"] == "RESOURCE_SHORT"

    # 5. Student registration and waitlist flow
    # Coordinator advances event 1 to open
    coord_client.post(f"/api/events/{ev1_id}/advance")

    # Student 1 registers (capacity is 1) -> confirmed
    r1 = s1_client.post(f"/api/events/{ev1_id}/register")
    assert r1.status_code == 200
    assert r1.json()["status"] == "confirmed"

    # Student 2 registers -> waitlisted
    r2 = s2_client.post(f"/api/events/{ev1_id}/register")
    assert r2.status_code == 200
    assert r2.json()["status"] == "waitlisted"

    # Initial unread count for student 2
    unread_before = s2_client.get("/api/notifications/unread-count").json()["count"]

    # Student 1 cancels
    can1 = s1_client.delete(f"/api/events/{ev1_id}/register")
    assert can1.status_code == 200

    # Student 2 is now promoted to confirmed, and received waitlist_promoted notification
    unread_after = s2_client.get("/api/notifications/unread-count").json()["count"]
    assert unread_after == unread_before + 1

    s2_regs = s2_client.get("/api/registrations/mine").json()
    my_r2 = next(x for x in s2_regs if x["event_id"] == ev1_id)
    assert my_r2["reg_status"] == "confirmed"


