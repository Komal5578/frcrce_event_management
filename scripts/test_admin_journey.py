"""Test Admin Journey (TT-A1) against live services."""
import requests
import json
import sys

API_BASE = "http://127.0.0.1:8000"

s_admin = requests.Session()
s_coord = requests.Session()

print("--- 1. Login as Admin & Coordinator ---")
login_admin = s_admin.post(f"{API_BASE}/api/auth/demo-login", json={"role": "admin"})
assert login_admin.status_code == 200, f"Admin login failed: {login_admin.text}"
admin_info = login_admin.json()
print("Logged in as Admin:", admin_info["name"], f"({admin_info['role']})")

login_coord = s_coord.post(f"{API_BASE}/api/auth/demo-login", json={"role": "coordinator"})
assert login_coord.status_code == 200, f"Coordinator login failed: {login_coord.text}"
coord_info = login_coord.json()
print("Logged in as Coordinator:", coord_info["name"])

print("\n--- 2. Coordinator creates an event for Admin to review ---")
venues = s_coord.get(f"{API_BASE}/api/venues").json()
venue_id = venues[0]["id"]
draft_res = s_coord.post(f"{API_BASE}/api/events/drafts", json={})
event_id = draft_res.json()["id"]

import time
run_ts = int(time.time())
day_num = (run_ts % 20) + 10
date_prefix = f"2033-08-{day_num:02d}"
starts_at = f"{date_prefix}T09:00:00.000Z"
ends_at = f"{date_prefix}T12:00:00.000Z"
clash_starts = f"{date_prefix}T10:00:00.000Z"
clash_ends = f"{date_prefix}T11:00:00.000Z"

s_coord.patch(f"{API_BASE}/api/events/{event_id}/draft", json={
    "title": f"Quantum Symposium {run_ts}",
    "capacity": 50,
    "description": "Annual symposium on quantum computing algorithms.",
    "starts_at": starts_at,
    "ends_at": ends_at,
    "venue_id": venue_id,
})
submit_res = s_coord.post(f"{API_BASE}/api/events/{event_id}/submit")
assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"
print(f"Event {event_id} submitted by coordinator. Status is pending.")

print("\n--- 3. Admin Queue Inspection ---")
events_res = s_admin.get(f"{API_BASE}/api/events")
assert events_res.status_code == 200
all_events = events_res.json()
pending_events = [e for e in all_events if e["status"] == "pending"]
print(f"Admin found {len(pending_events)} pending events in queue.")
assert any(e["id"] == event_id for e in pending_events), f"Event {event_id} not found in pending list!"

print("\n--- 4. Admin Inspects Clash Check ---")
busy_res = s_admin.get(f"{API_BASE}/api/venues/busy", params={
    "start": starts_at,
    "end": ends_at
})
assert busy_res.status_code == 200, f"Busy check failed: {busy_res.text}"
print("Venue busy check:", busy_res.json())

print("\n--- 5. Admin Approves Event ---")
review_res = s_admin.post(f"{API_BASE}/api/events/{event_id}/review", json={
    "action": "approve"
})
assert review_res.status_code == 200, f"Approval failed: {review_res.text}"
print("Approval result:", review_res.json())

event_detail = s_admin.get(f"{API_BASE}/api/events/{event_id}").json()
print("Updated event status:", event_detail["status"])
assert event_detail["status"] == "approved", f"Expected approved, got {event_detail['status']}"

print("\n--- 6. Coordinator Creates Another Event that Clashes ---")
clash_draft = s_coord.post(f"{API_BASE}/api/events/drafts", json={})
clash_event_id = clash_draft.json()["id"]
s_coord.patch(f"{API_BASE}/api/events/{clash_event_id}/draft", json={
    "title": "Overlapping AI Seminar",
    "capacity": 30,
    "starts_at": clash_starts,  # overlaps with Quantum Symposium
    "ends_at": clash_ends,
    "venue_id": venue_id,
})
s_coord.post(f"{API_BASE}/api/events/{clash_event_id}/submit")
print(f"Submitted clashing event {clash_event_id}")

print("\n--- 7. Admin Detects Clash and Returns Event ---")
busy_clash = s_admin.get(f"{API_BASE}/api/venues/busy", params={
    "start": clash_starts,
    "end": clash_ends,
    "exclude_event_id": clash_event_id,
}).json()
print("Busy venues for clash window:", busy_clash)
assert any(b["venue_id"] == venue_id for b in busy_clash), f"Expected venue {venue_id} to be busy! Got: {busy_clash}"

return_res = s_admin.post(f"{API_BASE}/api/events/{clash_event_id}/review", json={
    "action": "return",
    "reason": "Clash with Quantum Computing Symposium in the same venue"
})
assert return_res.status_code == 200, f"Return failed: {return_res.text}"
print("Return result:", return_res.json())

returned_detail = s_admin.get(f"{API_BASE}/api/events/{clash_event_id}").json()
print("Returned event status:", returned_detail["status"])
assert returned_detail["status"] == "returned", f"Expected returned, got {returned_detail['status']}"

print("\n--- 8. Admin Catalog Management ---")
cat_venues = s_admin.get(f"{API_BASE}/api/venues").json()
print(f"Catalog venues: {len(cat_venues)}")
cat_resources = s_admin.get(f"{API_BASE}/api/resources").json()
print(f"Catalog resources: {len(cat_resources)}")

# Test creating a new venue
new_venue_res = s_admin.post(f"{API_BASE}/api/venues", json={
    "name": "Innovation Hub Annex",
    "capacity": 120,
    "location": "North Wing, Floor 3"
})
print("Create venue status:", new_venue_res.status_code)
assert new_venue_res.status_code == 200

# Test creating a new resource
new_res_res = s_admin.post(f"{API_BASE}/api/resources", json={
    "name": "AR VR Headset Kit",
    "quantity": 15
})
print("Create resource status:", new_res_res.status_code)
assert new_res_res.status_code == 200

print("\n--- 9. Admin Calendar & Bookings ---")
bookings_res = s_admin.get(f"{API_BASE}/api/admin/bookings", params={
    "from_time": "2031-07-01T00:00:00.000Z",
    "to_time": "2031-08-01T00:00:00.000Z"
})
assert bookings_res.status_code == 200, f"Bookings failed: {bookings_res.text}"
bookings = bookings_res.json()
print(f"Found {len(bookings)} bookings in admin view.")

print("\n--- 10. Admin Reports & CSV Export ---")
reports_res = s_admin.get(f"{API_BASE}/api/reports")
assert reports_res.status_code == 200
reports = reports_res.json()
print(f"Generated {len(reports)} report rows.")

export_res = s_admin.get(f"{API_BASE}/api/reports/export.csv")
assert export_res.status_code == 200
assert "text/csv" in export_res.headers.get("content-type", "")
print("Export CSV lines:", len(export_res.text.strip().split("\n")))

print("\n=== TT-A1 ADMIN JOURNEY PASSED! ===")
