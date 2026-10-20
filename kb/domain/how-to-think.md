---
id: dom-how-to-think
type: domain
title: How to think: translating the attendance reference to events
tags: [mapping,method,reference]
confidence: derived
sources: [src-feature-vs-goal-directed,src-hmi-principles,src-gdd-process]
summary: Maps each attendance-doc idea to its event-system equivalent; read before any design decision.
updated: 2026-10-20
---

# Translation table

| Attendance reference | Event-system equivalent |
|---|---|
| Faculty "record attendance quickly and accurately" | Coordinator "plan an event without clashes and know it's on track" |
| Student "know my attendance and shortage" | Student "find and join the right event fast and know my status" |
| Admin "monitor attendance across classes" | Admin "approve confidently and see venue/resource utilisation" |
| Today's Schedule pre-fills subject/class/time | My Events + venue picker pre-fills what the system already knows (coordinator dept, past venues, standard resources) |
| Present/Absent/Late/Excused status | Event status Draft/Pending/Approved/Open/Ongoing/Completed/Cancelled (`dom-status-vocabulary`) |
| Review & Confirm → Confirm & Submit | Review & Confirm on: submit for approval, register, cancel, reassign task |
| Shortage alert | Clash warning, low-registration alert, overdue-task alert |
| Admin dashboard (KPIs, trend, dept pie) | Admin dashboard (events this month, venue utilisation, pending approvals, department split) |
| QR + manual (flexibility) | Quick-create template + full form; list view + calendar view |
| Duplicate/accidental entry | Double-booking and double-registration prevented |

Decision procedure for any UI question: (1) which persona and goal? (2) what does the system already know? (3) minimum interaction? (4) which HMI principle and UD check applies? (5) cite kb ids.
