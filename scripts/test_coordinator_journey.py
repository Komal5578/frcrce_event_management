"""Test Coordinator Journey (TT-C1) against live services."""
import requests
import json
import sys

API_BASE = "http://127.0.0.1:8000"
FRONTEND_BASE = "http://localhost:3000"

s = requests.Session()

print("--- 1. Login as Coordinator ---")
login_res = s.post(f"{API_BASE}/api/auth/demo-login", json={"role": "coordinator"})
print("Demo login status:", login_res.status_code)
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
user_info = login_res.json()
print("Logged in user:", user_info)
assert user_info["role"] == "coordinator"

print("\n--- 2. Fetch Templates and Venues ---")
tpl_res = s.get(f"{API_BASE}/api/events/templates")
assert tpl_res.status_code == 200
templates = tpl_res.json()
print(f"Found {len(templates)} templates")
tpl_id = templates[0]["id"] if templates else None

venues_res = s.get(f"{API_BASE}/api/venues")
assert venues_res.status_code == 200
venues = venues_res.json()
print(f"Found {len(venues)} venues")
venue_id = venues[0]["id"]

resources_res = s.get(f"{API_BASE}/api/resources")
assert resources_res.status_code == 200
resources = resources_res.json()
print(f"Found {len(resources)} resources")
resource_id = resources[0]["id"]

print("\n--- 3. Create Draft from Template ---")
draft_res = s.post(f"{API_BASE}/api/events/drafts", json={"template_id": tpl_id})
print("Create draft status:", draft_res.status_code)
assert draft_res.status_code == 200, f"Draft creation failed: {draft_res.text}"
event_id = draft_res.json()["id"]
print("Created draft event ID:", event_id)

print("\n--- 4. Save Draft Details (Step 1) ---")
patch1_res = s.patch(f"{API_BASE}/api/events/{event_id}/draft", json={
    "title": "Automated Robotics Workshop 2031",
    "capacity": 45,
    "description": "Hands-on robotics workshop with ROS2 and microcontrollers."
})
assert patch1_res.status_code == 200

print("\n--- 5. Save Draft Schedule & Venue (Step 2) ---")
patch2_res = s.patch(f"{API_BASE}/api/events/{event_id}/draft", json={
    "starts_at": "2031-06-15T10:00:00.000Z",
    "ends_at": "2031-06-15T13:00:00.000Z",
    "venue_id": venue_id
})
assert patch2_res.status_code == 200

print("\n--- 6. Allocate Resource (Step 3) ---")
alloc_res = s.post(f"{API_BASE}/api/events/{event_id}/allocations", json={
    "resource_id": resource_id,
    "quantity": 2
})
assert alloc_res.status_code == 200
print("Allocated 2 of resource:", resource_id)

print("\n--- 7. Add Task (Step 4) ---")
task_res = s.post(f"{API_BASE}/api/events/{event_id}/tasks", json={
    "title": "Prepare robot starter kits",
    "assignee_id": None,
    "due_at": "2031-06-14T18:00:00.000Z"
})
assert task_res.status_code == 200
task_id = task_res.json()["id"]
print("Created task ID:", task_id)

print("\n--- 8. Submit Draft for Review ---")
submit_res = s.post(f"{API_BASE}/api/events/{event_id}/submit")
print("Submit status:", submit_res.status_code)
assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"

print("\n--- 9. Verify Event Status is Pending ---")
get_ev = s.get(f"{API_BASE}/api/events/{event_id}")
assert get_ev.status_code == 200
ev_data = get_ev.json()
print("Event status after submit:", ev_data["status"])
assert ev_data["status"] == "pending", f"Expected pending, got {ev_data['status']}"
assert ev_data["title"] == "Automated Robotics Workshop 2031"
assert ev_data["capacity"] == 45

print("\n--- 10. Check Coordinator Events List ---")
evs_res = s.get(f"{API_BASE}/api/events")
assert evs_res.status_code == 200
my_evs = evs_res.json()
found = any(e["id"] == event_id for e in my_evs)
assert found, "Created event should appear in coordinator events list"

print("\n--- 11. Check Notifications & Alerts ---")
alerts_res = s.get(f"{API_BASE}/api/notifications/alerts")
assert alerts_res.status_code == 200
alerts = alerts_res.json()
print(f"Coordinator alerts count: {len(alerts)}")

unread_res = s.get(f"{API_BASE}/api/notifications/unread-count")
assert unread_res.status_code == 200
print("Unread notifications count:", unread_res.json())

print("\n=== TT-C1 COORDINATOR JOURNEY PASSED! ===")
