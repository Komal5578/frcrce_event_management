---
phase: 02-requirements-framework
plan: 04
subsystem: docs
tags: [wireframes, ascii, gdd, status-vocabulary]
requires:
  - phase: 02-requirements-framework
    provides: IA screen ids (02-02), shared vocabulary
provides:
  - Low-fi ASCII wireframes for all 20 IA screens (CO-01..08, ST-01..06, AD-01..06)
affects: [phase-3 design tokens, phase-4 role builds]
key-files:
  created: [docs/wireframes/coordinator.md, docs/wireframes/student.md, docs/wireframes/admin.md]
  modified: []
key-decisions:
  - "Status chips use ASCII icon proxies plus vocabulary word plus colour name; colours for Registered, Waitlisted, task states, Clash are marked assumed until Phase 3 tokens"
requirements-completed: [FRAM-05]
duration: ~10min
completed: 2026-10-20
---

# Phase 2 Plan 04: Low-fi Wireframes Summary

Three greyscale ASCII wireframe files covering every IA screen in flow order, each with req ids, a `Next:` line, vocabulary-form status chips and Review & Confirm on CO-06, ST-03, AD-03.

## Tasks

| Task | Commit |
|---|---|
| 1 Coordinator CO-01..CO-08 | b7c2517 |
| 2 Student ST-01..ST-06 | 039a1db |
| 3 Admin AD-01..AD-06 | 589ec60 |

## Verification

`node docs/check-framework.mjs --wave 3 | grep wireframes` prints nothing. Heading counts 8/6/6, `Next:` counts 8/6/6, no hex colours. CO-01, ST-01, AD-01 have `A- A A+`, `Empty:`, `Error:`. The unfiltered wave 3 run was not evaluated here because flow errors from parallel plan 02-03 are out of scope (plan 02-05).

## Deviations from Plan

None. Sample data is illustrative (T-02-07). Colours not in `dom-status-vocabulary` are flagged assumed in each legend.

## Known Stubs

None (wireframes are intentionally low-fi).

## Self-Check: PASSED
