---
id: dom-requirements
type: domain
title: Requirements (functional + interaction)
tags: [requirements,functional,interaction]
confidence: derived
sources: [src-gdd-process,src-universal-design]
summary: Prioritised requirements per role plus cross-cutting HMI requirements.
updated: 2026-10-20
---

# Requirements (IDs are stable; cite them in plans)

## Coordinator
- C1 Create event from template with pre-filled defaults; autosave draft
- C2 Venue picker shows only free venues for the chosen slot, with capacity
- C3 Request resources against an event (projector, mics, chairs...) with availability shown
- C4 Allocate tasks to students with due dates; see status
- C5 Submit for approval via Review & Confirm; see approval state
- C6 Monitor registrations (count vs capacity), overdue tasks, status
- C7 Edit/cancel with confirmation; notify registrants

## Student
- S1 Discover events with search + filters (date, type, venue, department)
- S2 Event detail shows what/when/where/seats/status at a glance
- S3 Register via Review & Confirm; waitlist when full; cancel registration
- S4 My Registrations and calendar view; reminders in-app
- S5 (Organizer) My Tasks with due dates; mark done

## Admin
- A1 Approvals queue with clash check, resources, approve / return with reason
- A2 Calendar of all events/venues with conflicts highlighted
- A3 Manage venues and resources
- A4 Dashboard: events, pending approvals, utilisation, department split
- A5 Reports exportable (CSV/print)

## Cross-cutting (HMI)
- X1 Status is always icon + text + colour (`dom-status-vocabulary`)
- X2 Every irreversible action uses Review & Confirm; plain-language errors
- X3 Text size control A−/A/A+, 44px targets, full keyboard path, WCAG 2.2 AA
- X4 Same terms and layouts across roles
- X5 Double-booking and double-registration are impossible (DB-enforced) and prevented in the UI
