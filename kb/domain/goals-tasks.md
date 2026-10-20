---
id: dom-goals-tasks
type: domain
title: User goals and task analysis
tags: [goals,tasks,analysis]
confidence: derived
sources: [src-gdd-process,dom-requirements,dom-flows]
summary: Primary/secondary goals and the ordered task list per role.
updated: 2026-10-20
---

# Goals and tasks

| Role | Primary goal | Secondary goals |
|---|---|---|
| Faculty Coordinator | Plan and run an event without clashes | Allocate tasks, request resources, track registrations, produce event summary |
| Student | Find and join an event, know my status | See my schedule, get reminders, (organizer) complete my tasks |
| Event Admin/HOD | Approve events confidently, monitor | Resolve conflicts, view utilisation, generate reports |

**Frequent tasks (optimise first):** coordinator creates event; student registers; admin approves; organizer marks task done.
**Rare tasks:** cancel event, reschedule, manage venues, export reports.

Task steps per role: see `dom-flows`. X3 (text size, 44px, keyboard, WCAG 2.2 AA) applies to every row, so it is listed on each. Tables are derived, not research.

## Coordinator
| Goal | Task | Steps | Req ids |
|---|---|---|---|
| Plan an event without clashes | Create event from template | My Events, New Event (template), details prefilled | C1, X3, X4 |
| Plan an event without clashes | Choose venue and slot | Venue + slot with live availability | C2, X3, X5 |
| Have what the event needs | Request resources | Resources | C3, X3 |
| Share the work | Allocate tasks to students | Tasks | C4, X3 |
| Get the event approved | Submit for approval | Review & Confirm, Submit | C5, X2, X3 |
| Know how the event is going | Monitor registrations and tasks | Monitor, Event summary | C6, X1, X3 |
| Change plans safely | Edit or cancel event | Edit/Cancel, Review & Confirm, notify registrants | C7, X2, X3 |

## Student
| Goal | Task | Steps | Req ids |
|---|---|---|---|
| Find an event to join | Discover events | Discover, search + filters | S1, X1, X3, X4 |
| Decide quickly | View event detail | Event detail | S2, X1, X3 |
| Join an event, know my status | Register, join waitlist, cancel | Register, Review & Confirm, confirmation | S3, X2, X3, X5 |
| See my schedule | See my registrations and reminders | My Registrations/Calendar, Reminders | S4, X3 |
| Finish my part (Organizer) | Organizer: view My Tasks and mark done | My Tasks, Mark done | S5, X3 |

Organizer is a flag on the Student interface, not a fourth interface (`adr-002-roles`, still `assumed` until the team confirms).

## Admin
| Goal | Task | Steps | Req ids |
|---|---|---|---|
| Approve events confidently | Review approvals queue | Approvals, clash check | A1, X1, X3 |
| Approve events confidently | Approve or return with reason | Approve / Return, Review & Confirm | A1, X2, X3, X5 |
| Resolve conflicts | View calendar conflicts | Calendar | A2, X1, X3 |
| Keep venues usable | Manage venues and resources | Venues & Resources | A3, X3 |
| Monitor | Read dashboard | Admin home dashboard, Utilisation | A4, X1, X3 |
| Report | Export report | Reports, CSV/print | A5, X3 |

## Coverage
| Req id | Satisfied by task (role) |
|---|---|
| C1 | Create event from template (Coordinator) |
| C2 | Choose venue and slot (Coordinator) |
| C3 | Request resources (Coordinator) |
| C4 | Allocate tasks to students (Coordinator) |
| C5 | Submit for approval (Coordinator) |
| C6 | Monitor registrations and tasks (Coordinator) |
| C7 | Edit or cancel event (Coordinator) |
| S1 | Discover events (Student) |
| S2 | View event detail (Student) |
| S3 | Register, join waitlist, cancel (Student) |
| S4 | See my registrations and reminders (Student) |
| S5 | Organizer: view My Tasks and mark done (Student) |
| A1 | Review approvals queue; Approve or return with reason (Admin) |
| A2 | View calendar conflicts (Admin) |
| A3 | Manage venues and resources (Admin) |
| A4 | Read dashboard (Admin) |
| A5 | Export report (Admin) |
| X1 | Discover events, View event detail, Monitor, Review approvals, View calendar conflicts, Read dashboard (all roles) |
| X2 | Submit, Register/cancel, Approve/return, Edit/cancel event (all roles) |
| X3 | Every task in all three roles |
| X4 | Create event and Discover events (Coordinator, Student) |
| X5 | Choose venue and slot, Register, Approve or return (Coordinator, Student, Admin) |

No orphan tasks, no orphan ids.
