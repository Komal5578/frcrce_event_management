---
phase: 02-requirements-framework
plan: 03
subsystem: docs
tags: [task-flows, review-and-confirm, mermaid]
requires: [02-02]
provides:
  - docs/flows/{coordinator-create-event,student-register,admin-approve,organizer-mark-task-done}.md
  - dom-flows linked to the four flow files
affects: [02-04]
key-files:
  created: [docs/flows/coordinator-create-event.md, docs/flows/student-register.md, docs/flows/admin-approve.md, docs/flows/organizer-mark-task-done.md]
  modified: [kb/domain/flows.md]
key-decisions:
  - "Organizer mark-done is reversible: Undo, no Review & Confirm"
  - "Quotes inside ERR labels written as #quot; so Mermaid renders them"
requirements-completed: [FRAM-04]
completed: 2026-10-20
---

# Phase 2 Plan 03: Task flows Summary

Four Mermaid flowcharts (confidence: derived) with Review & Confirm directly before every irreversible action (submit, cancel event, register, waitlist, cancel registration, approve, return), prefill steps and human ERR messages. Illustrative figures (waitlist number 4, Robotics Workshop clash) are labelled as such (T-02-05).

## Commits
- 3cba463 coordinator and student flows
- 80ac8f2 admin and organizer flows, dom-flows Detail section

## Verification
- `node docs/check-framework.mjs --wave 3` prints no line containing `flows/`; wireframe errors (plan 04) not in scope.
- `node kb/tools/build-index.mjs` passes (25 notes). `DO:` count in organizer flow is 0, `Undo` present.

## Deviations
None.
