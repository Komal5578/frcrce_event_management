---
id: dom-domain-model
type: domain
title: Domain model and data rules
tags: [data,model,database,constraints]
confidence: derived
sources: [src-hmi-problems-pattern]
summary: Entities, relationships and the integrity rules the UI relies on.
updated: 2026-10-20
---

# Domain model

- profiles(id, name, role: coordinator|student|admin, department, is_organizer)
- venues(id, name, capacity, location) · resources(id, name, quantity)
- events(id, title, type, description, coordinator_id, venue_id, starts_at, ends_at, capacity, status, department)
- bookings → derived from events via venue+time range. **Database triggers** (BEFORE INSERT/UPDATE on events) reject an overlapping half-open `[starts_at, ends_at)` range on the same venue for active statuses: a clash cannot be saved (D1 has no exclusion constraints).
- resource_allocations(event_id, resource_id, quantity) with availability check per time range
- registrations(id, event_id, user_id, status: confirmed|waitlisted|cancelled) unique(event_id, user_id); promote from waitlist on cancel
- tasks(id, event_id, title, assignee_id, due_at, status: todo|doing|done)
- notifications(id, user_id, kind, body, read_at, created_at)

Authorization layer (D1 has no RLS): `lib/domain` takes the actor explicitly. Students read open events and own rows; coordinators write own events/tasks; admins read/write all. Treat this layer as the security boundary; review before deploy.
Lifecycle: see `dom-status-vocabulary`.
