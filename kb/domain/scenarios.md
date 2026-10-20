---
id: dom-scenarios
type: domain
title: User scenarios
tags: [scenarios,narrative]
confidence: derived
sources: [src-gdd-process]
summary: One narrative scenario per role used for design and for test tasks.
updated: 2026-10-20
---

# Scenarios

**Coordinator (plan a workshop).** Prof. Anita opens the system and sees *My Events*. She starts a new event from the "Workshop" template. She types a title and picks a date; the venue picker shows only rooms free in that slot with capacity beside each. She picks Seminar Hall, requests a projector and 2 mics, assigns "Poster design" to Rohan and "Registration desk" to two other students, and reviews the summary. She submits for approval and sees "Submitted — waiting for Dr. Sharma". Later the dashboard shows 38 of 60 registered and one overdue task (illustrative figures, not an observed result).

**Student (register).** Rohan opens Discover on his phone, filters "This week", opens the Robotics Workshop card, sees date, venue, seats left and status Open. He taps Register, reviews details, confirms, and sees "You're registered" with the event in My Registrations and a reminder set. If full, the button says Join waitlist and says his position.

**Admin (approve).** Dr. Sharma opens Approvals. Each request shows event, venue, clash check result and resources. A clash with another event is flagged with the other event's name. He approves two, sends one back with a reason, then opens the utilisation report to see which halls are underused.

**Coordinator edge (venue clash).** Prof. Anita tries Seminar Hall for a slot another event has just taken. The picker shows only the venues still free for that slot, with capacity, and a plain message: "Seminar Hall is taken for that time. These rooms are free." She picks another one and carries on.

**Student edge (full event, waitlist).** Rohan finds the Robotics Workshop full. The page says Full and offers to join the waitlist; after he confirms, it shows his position ("You are 3rd on the waitlist"). If he is already registered he is told so instead of being able to register twice.

**Admin edge (return with reason).** Dr. Sharma cannot approve a request because the resources overlap with another event. He returns it with a written reason, confirms, and the coordinator sees the status Returned with his reason on the event.

## Test tasks (for Phase 6 task sheets)
AI-drafted, to be run by the team; no results recorded here. Success and time limits are targets to be tested, not results.

### TT-C1
- Start state: Prof. Anita is signed in; no draft exists; Seminar Hall is free next Friday afternoon.
- Goal (plain words): You want a workshop on next Friday afternoon, with a projector, and your department head asked to approve it.
- Success: The event is waiting for approval with a venue, a time slot and the projector.
- Max time: 5 min
- Metrics to capture later: success y/n, time, errors, clicks
- Reqs: C1, C2, C3, C5, X2

### TT-S1
- Start state: Rohan is signed in on a phone; the Robotics Workshop is open with seats left this week.
- Goal (plain words): You want to attend the Robotics Workshop this week.
- Success: Rohan can say he is registered and sees the event among his own events.
- Max time: 90 s
- Metrics to capture later: success y/n, time, errors, clicks
- Reqs: S1, S2, S3, S4, X2

### TT-A1
- Start state: Dr. Sharma is signed in; three requests wait, one of them clashes with another event.
- Goal (plain words): You need to decide on today's requests: accept the good ones and send the clashing one back with a reason.
- Success: Two requests are approved, the clashing one is returned with a reason the coordinator can read.
- Max time: 3 min
- Metrics to capture later: success y/n, time, errors, clicks
- Reqs: A1, A2, X2
