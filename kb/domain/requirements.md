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

Priorities are derived (AI-proposed), to be revised after team research.

## Coordinator
- C1 Create event from template with pre-filled defaults; autosave draft Accept: A coordinator can start an event from a template, sees defaults already filled, and a closed browser tab keeps the draft. Priority: must.
- C2 Venue picker shows only free venues for the chosen slot, with capacity Accept: After choosing a date and slot, the venue list shows only venues free in that slot, each with its capacity. Priority: must.
- C3 Request resources against an event (projector, mics, chairs...) with availability shown Accept: A coordinator can add a resource to an event and sees its availability for that slot before adding. Priority: should.
- C4 Allocate tasks to students with due dates; see status Accept: A coordinator can assign a task with a due date to a student and later see its status. Priority: must.
- C5 Submit for approval via Review & Confirm; see approval state Accept: Submit shows a Review & Confirm step first, and afterwards the event shows Pending approval. Priority: must.
- C6 Monitor registrations (count vs capacity), overdue tasks, status Accept: The event page shows registered count against capacity and lists overdue tasks. Priority: must.
- C7 Edit/cancel with confirmation; notify registrants Accept: Cancelling or editing a submitted event asks for confirmation and tells the registrants. Priority: should.

## Student
- S1 Discover events with search + filters (date, type, venue, department) Accept: A student can find an event by search text and narrow it by date, type, venue or department. Priority: must.
- S2 Event detail shows what/when/where/seats/status at a glance Accept: The event page shows what, when, where, seats left and status without scrolling on a phone. Priority: must.
- S3 Register via Review & Confirm; waitlist when full; cancel registration Accept: Registering shows Review & Confirm first; a full event offers the waitlist; a registration can be cancelled. Priority: must.
- S4 My Registrations and calendar view; reminders in-app Accept: A student sees their registrations in a list and a calendar, and an in-app reminder for upcoming events. Priority: should.
- S5 (Organizer) My Tasks with due dates; mark done Accept: An organizer sees their tasks with due dates and can mark one done in one step. Priority: should.
- S6 Warn on time overlap when registering Accept: Registering for an event that overlaps another event the student is registered for shows a plain-language warning naming that event, and the student can still confirm. Warn-only: it never blocks; blocking is reserved for venue clash and double registration (X5). Priority: should.

## Admin
- A1 Approvals queue with clash check, resources, approve / return with reason Accept: Each pending request shows clash result and resources; approve and return (with a required reason) are both available. Priority: must.
- A2 Calendar of all events/venues with conflicts highlighted Accept: The calendar shows all events by venue, and clashing events are visibly flagged. Priority: must.
- A3 Manage venues and resources Accept: An admin can add, edit or retire a venue or resource. Priority: should.
- A4 Dashboard: events, pending approvals, utilisation, department split Accept: The Admin home shows event count, pending approvals, venue utilisation and department split. Priority: must.
- A5 Reports exportable (CSV/print) Accept: A report can be downloaded as CSV or printed. Priority: should.

## Cross-cutting (HMI)
- X1 Status is always icon + text + colour (`dom-status-vocabulary`) Accept: Every status shown has an icon, a vocabulary word and a colour; none relies on colour alone. Priority: must.
- X2 Every irreversible action uses Review & Confirm; plain-language errors Accept: Submit, register, cancel, approve and return each pass through Review & Confirm, and failures show a plain-language message. Priority: must.
- X3 Text size control A−/A/A+, 44px targets, full keyboard path, WCAG 2.2 AA Accept: A-/A/A+ changes text size, targets are at least 44px, every task works by keyboard, and WCAG 2.2 AA checks pass. Priority: must.
- X4 Same terms and layouts across roles Accept: The same term and the same layout is used for the same thing in all three roles. Priority: must.
- X5 Double-booking and double-registration are impossible (DB-enforced) and prevented in the UI Accept: Booking a taken slot or registering twice is rejected by the database and not offered in the UI. Priority: must.
