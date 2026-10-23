"""Test Student Journey (TT-S1) against live services."""
import requests
import json
import sys

API_BASE = "http://127.0.0.1:8000"

s = requests.Session()

print("--- 1. Login as Student ---")
login_res = s.post(f"{API_BASE}/api/auth/demo-login", json={"role": "student"})
assert login_res.status_code == 200, f"Student login failed: {login_res.text}"
user_info = login_res.json()
print("Logged in student:", user_info["name"])

print("\n--- 2. Fetch Events Feed ---")
events_res = s.get(f"{API_BASE}/api/events")
print("Events status:", events_res.status_code, events_res.text[:200])
assert events_res.status_code == 200
events = events_res.json()
print(f"Total events: {len(events)}")
open_events = [e for e in events if e["status"] == "open"]
assert len(open_events) > 0, "No open events found for student to view!"
target_event = open_events[0]
event_id = target_event["id"]
print(f"Target event: {target_event['title']} ({event_id})")

print("\n--- 3. Event Detail & Seat Status ---")
detail_res = s.get(f"{API_BASE}/api/events/{event_id}")
assert detail_res.status_code == 200
detail = detail_res.json()
print("Event details fetched:", detail["title"])

seats_res = s.get(f"{API_BASE}/api/events/{event_id}/seats")
assert seats_res.status_code == 200
seats = seats_res.json()
print("Seat counts:", seats)

print("\n--- 4. Register for Event ---")
reg_res = s.post(f"{API_BASE}/api/events/{event_id}/register")
assert reg_res.status_code in (200, 400), f"Registration request failed: {reg_res.text}"
print("Register response:", reg_res.json())

print("\n--- 5. Verify Registration in Mine ---")
mine_res = s.get(f"{API_BASE}/api/registrations/mine")
assert mine_res.status_code == 200
mine = mine_res.json()
print(f"Student has {len(mine)} registrations.")
assert any(r["event_id"] == event_id for r in mine), f"Event {event_id} not in mine list!"

print("\n--- 6. Cancel Registration ---")
cancel_res = s.delete(f"{API_BASE}/api/events/{event_id}/register")
assert cancel_res.status_code == 200, f"Cancel registration failed: {cancel_res.text}"
print("Cancel response:", cancel_res.json())

print("\n--- 7. Check Student Tasks & Alerts ---")
tasks_res = s.get(f"{API_BASE}/api/tasks/mine")
assert tasks_res.status_code == 200, f"Tasks failed: {tasks_res.text}"
tasks = tasks_res.json()
print(f"Assigned student tasks: {len(tasks)}")

alerts_res = s.get(f"{API_BASE}/api/notifications/alerts")
assert alerts_res.status_code == 200
alerts = alerts_res.json()
print(f"Student alerts: {len(alerts)}")

print("\n=== TT-S1 STUDENT JOURNEY PASSED! ===")
