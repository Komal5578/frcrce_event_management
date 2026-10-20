---
id: doc-persona-coordinator
type: domain
title: Proto-persona - Prof. Anita (Faculty Coordinator)
tags: [persona,coordinator,assumed]
confidence: assumed
sources: [dom-personas, dom-goals-tasks]
summary: Assumed proto-persona for the Faculty Coordinator role; hypotheses to test with the research kit.
updated: 2026-10-20
---

# Prof. Anita (Faculty Coordinator)

> **Assumed, pending research.** This persona is a hypothesis from the design team, not based on interviews. Replace it with evidence-based content once the team has run the research kit.

## 1. Name, role and one-line description

Prof. Anita, Faculty Coordinator. Runs 3-5 events a year (fest, workshop, seminar) (assumed, from `dom-personas`).

## 2. Primary goal

Plan an event without clashes and know it is on track (assumed). Matches the Coordinator primary goal in `dom-goals-tasks`.

## 3. Secondary goals

- Allocate tasks (assumed)
- Request resources (assumed)
- Track registrations (assumed)
- Produce an event summary (assumed)

## 4. Frequent tasks

Create an event (the task to optimise first, per `dom-goals-tasks`). Steps are in `dom-flows`.

## 5. Behaviours and tech comfort

Tech comfort: Medium (assumed). Currently coordinates task status by chasing students on WhatsApp (assumed).

## 6. Pain points (hypotheses)

- Venue or slot clashes are found late (assumed)
- Chasing students on WhatsApp for task status (assumed)
- Paperwork for approval (assumed)

## 7. Accessibility and context notes

Likely works between classes on a desktop or phone with little time per visit (assumed). Check the diverse-user groups in `src-evaluation-methods` section B when recruiting, including a low-confidence technical user.

## 8. HMI problems this persona drives

- P1: creating an event should take as few interactions as possible.
- P2: double-booking must be impossible and visible.
- P3: event status must be readable at a glance.
- P4: feedback after submit must be clear.
- P6: clashes, low registration and overdue tasks must surface without overwhelming.
- P7: errors must be easy to detect and correct.
- P8: it must work for a medium-comfort user, not only technical ones.

Summary: P1, P2, P3, P4, P6, P7, P8 (ids follow `dom-hmi-problems`).

## 9. Research to confirm

Each row names the P ids that test the hypothesis. The matching questions are in `docs/research/question-trace.md`.

| Hypothesis | P ids that test it |
|---|---|
| Clashes are found late (assumed) | P2, P6 |
| Task status is chased on WhatsApp (assumed) | P3, P6 |
| Approval paperwork is slow (assumed) | P1, P4 |
| Creating an event is too many steps (assumed) | P1, P7 |
| Medium tech comfort is enough to use it unaided (assumed) | P8 |

## 10. Status

Assumed, pending research. Becomes "Evidence-based" only after the team's sessions are run and recorded; then superseded by `dom-personas-evidence`.
