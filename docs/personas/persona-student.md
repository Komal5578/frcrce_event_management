---
id: doc-persona-student
type: domain
title: Proto-persona - Rohan (Student) with Organizer variant
tags: [persona,student,organizer,assumed]
confidence: assumed
sources: [dom-personas, dom-goals-tasks]
summary: Assumed proto-persona for the Student role plus an Organizer variant; hypotheses to test with the research kit.
updated: 2026-10-20
---

# Rohan (Student)

> **Assumed, pending research.** This persona is a hypothesis from the design team, not based on interviews. Replace it with evidence-based content once the team has run the research kit.

## 1. Name, role and one-line description

Rohan, Student. Wants to attend events and sometimes volunteers as an organizer (assumed, from `dom-personas`).

## 2. Primary goal

Find the right event, register in seconds, and know my status and tasks (assumed). Matches the Student primary goal in `dom-goals-tasks`.

## 3. Secondary goals

- See my schedule (assumed)
- Get reminders (assumed)
- As an organizer, complete my tasks (assumed)

## 4. Frequent tasks

Register for an event; check My Registrations. Steps are in `dom-flows`.

## 5. Behaviours and tech comfort

High on phone, low patience (assumed). Expects an answer to "am I registered?" without reading a table (assumed).

## 6. Pain points (hypotheses)

- Events are announced on scattered groups (assumed)
- Unsure whether registration went through (assumed)
- Misses deadlines (assumed)

## 7. Accessibility and context notes

Mostly uses a phone, possibly one-handed and in a hurry (assumed). Check the diverse-user groups in `src-evaluation-methods` section B, including low vision and keyboard-only use.

## 8. HMI problems this persona drives

- P3: event status must be readable at a glance.
- P4: feedback after registering must be clear.
- P5: status must be understandable without tables.
- P7: a mistaken registration must be easy to correct.
- P8: it must work for different levels of technical comfort.

P ids follow `dom-hmi-problems`.

## 9. Research to confirm

The matching questions are in `docs/research/question-trace.md`.

| Hypothesis | P ids that test it |
|---|---|
| Events are hard to find across scattered groups (assumed) | P3, P8 |
| Students are unsure if they registered (assumed) | P4, P5 |
| Deadlines are missed (assumed) | P3, P7 |

## 10. Status

Assumed, pending research. Becomes "Evidence-based" only after the team's sessions are run and recorded; then superseded by `dom-personas-evidence`.

## Organizer variant

A Student on a committee. This is a flag on a Student, not a fourth role (`adr-002-roles`), and is itself assumed.

- **Primary goal:** know my tasks and deadlines at a glance (assumed).
- **Pain point:** unclear who owns what (assumed).
- **Tech comfort:** High (assumed).
- **Frequent task:** mark a task done (assumed).
- **HMI problems driven:** P3 (status at a glance), P6 (overdue tasks surfaced without overwhelming).
- **Research to confirm:** P3 and P6 test whether task ownership and deadlines are clear; see `docs/research/question-trace.md`.

Status: Assumed, pending research.
