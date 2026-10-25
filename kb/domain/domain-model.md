---
id: dom-domain-model
type: domain
title: Domain model and data rules
tags: [data,model,database,constraints]
confidence: derived
sources: [src-hmi-problems-pattern]
summary: Entities, relationships and the integrity rules the UI relies on.
updated: 2026-10-24
---

# Domain model

- profiles(id, name, role: coordinator|student|admin, department, is_organizer)
- venues(id, name, capacity, location, active) · resources(id, name, quantity). `active=false` is how "maintenance" (AD-05) is stored: the venue leaves the picker but past events keep it.
- events(id, title, type, description, coordinator_id, venue_id, starts_at, ends_at, capacity, status, department, return_reason, cancel_reason). `return_reason` is set when the admin sends a request back; `cancel_reason` when an event is cancelled; both are shown to the user in plain language.
- event_templates(id, name, type, default capacity, default duration, default resources): pre-fill for new events (ask first, pre-fill what the system knows).
- bookings → derived from events via venue+time range. **Only approved, open and ongoing events book a venue.** The current Cloudflare D1 implementation enforces clashes with SQLite triggers on event insert/update; a clash fails with `VENUE_CLASH`. **Pending requests may overlap**; the admin sees the clash at approval and approval fails. This makes the admin clash path (TT-A1) reachable (v1 counted pending as booked, which made it unreachable). The former FastAPI/Postgres implementation used an exclusion constraint and is retained as unused code.
- resource_allocations(event_id, resource_id, quantity) with availability check per time range. Limits are re-checked on allocation, **on approve and on reschedule** (v1 gap: `alloc_guard` only fired on allocation writes); failure is `RESOURCE_SHORT`.
- registrations(id, event_id, user_id, status: confirmed|waitlisted|cancelled; `confirmed` displays as Registered, see `dom-status-vocabulary`) unique(event_id, user_id); promote from waitlist on cancel
- tasks(id, event_id, title, assignee_id, due_at, status: todo|doing|done; `doing` displays as In progress)
- notifications(id, user_id, kind, body, read_at, created_at)

Authorization layer (no RLS): Worker `src/domain.ts` takes the session-derived `Actor`; route/session plumbing is in `worker/src/index.ts` and `worker/src/core.ts`. Students read open events and own rows; coordinators write own events/tasks; admins read/write all. Treat this layer as the security boundary; review deployed routes before completion. Registrations stay `UNIQUE(event_id, user_id)`; D1 batches and SQLite triggers enforce multi-row rules. Error markers: `VENUE_CLASH`, `EVENT_FULL`, `RESOURCE_SHORT`, `BAD_STATE`, `NOT_ALLOWED`. Concurrency behavior on deployed D1 remains a verification item.
Lifecycle: see `dom-status-vocabulary`.
