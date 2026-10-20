---
id: doc-persona-admin
type: domain
title: Proto-persona - Dr. Sharma (Event Admin / HOD)
tags: [persona,admin,assumed]
confidence: assumed
sources: [dom-personas, dom-goals-tasks]
summary: Assumed proto-persona for the Event Admin / HOD role; hypotheses to test with the research kit.
updated: 2026-10-20
---

# Dr. Sharma (Event Admin / HOD)

> **Assumed, pending research.** This persona is a hypothesis from the design team, not based on interviews. Replace it with evidence-based content once the team has run the research kit.

## 1. Name, role and one-line description

Dr. Sharma, Event Admin / HOD. Approves events and venues (assumed, from `dom-personas`).

## 2. Primary goal

Approve confidently, see utilisation, avoid clashes (assumed). Matches the Admin primary goal in `dom-goals-tasks`.

## 3. Secondary goals

- Resolve conflicts (assumed)
- View utilisation (assumed)
- Generate reports (assumed)

## 4. Frequent tasks

Approve an event. Steps are in `dom-flows`.

## 5. Behaviours and tech comfort

Tech comfort: Low-Medium (assumed). Currently approves by paper or chat (assumed).

## 6. Pain points (hypotheses)

- Approvals by paper or chat (assumed)
- No consolidated view of venue usage (assumed)

## 7. Accessibility and context notes

Likely reviews requests in short sittings and wants clear text and large targets (assumed). Check the diverse-user groups in `src-evaluation-methods` section B, including low technical confidence and larger text sizes.

## 8. HMI problems this persona drives

- P2: double-booking must be impossible and visible when approving.
- P3: event status must be readable at a glance.
- P4: feedback after approving must be clear.
- P6: clashes and problems must surface without overwhelming.
- P8: it must work for a low-to-medium comfort user.
- P9: utilisation visualisations must be effective, not decorative.
- P10: vocabulary and layout must match the other roles.

P ids follow `dom-hmi-problems`.

## 9. Research to confirm

The matching questions are in `docs/research/question-trace.md`.

| Hypothesis | P ids that test it |
|---|---|
| Approvals by paper or chat are slow and unclear (assumed) | P3, P4 |
| There is no consolidated view of venue usage (assumed) | P6, P9 |
| Clashes reach the approver (assumed) | P2, P6 |
| A low-to-medium comfort user can approve unaided (assumed) | P8, P10 |

## 10. Status

Assumed, pending research. Becomes "Evidence-based" only after the team's sessions are run and recorded; then superseded by `dom-personas-evidence`.
