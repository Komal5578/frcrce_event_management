---
phase: 02-requirements-framework
plan: 01
subsystem: docs
tags: [requirements, goals-tasks, scenarios, check-script]
requires: []
provides:
  - docs/check-framework.mjs (wave-gated, --wave N)
  - dom-requirements with Accept + Priority on all 22 ids
  - dom-goals-tasks per-role tables + Coverage
  - dom-scenarios edge scenarios + TT-C1/TT-S1/TT-A1
affects: [02-02, 02-03, 02-04]
key-files:
  created: [docs/check-framework.mjs]
  modified: [kb/domain/requirements.md, kb/domain/goals-tasks.md, kb/domain/scenarios.md, kb/manifest.json]
key-decisions:
  - "Priorities are derived (AI-proposed), flagged for revision after team research"
  - "X3 listed on every task row; Organizer kept as a flag on Student (adr-002-roles stays assumed)"
requirements-completed: [FRAM-01, FRAM-02]
duration: short
completed: 2026-10-20
---

# Phase 2 Plan 01: Requirements, goals-tasks and scenarios Summary

Wave-gated `docs/check-framework.mjs` plus finalised requirements (22 ids with acceptance + must/should), per-role goal-task tables with a Coverage section, and edge scenarios with three reusable test tasks.

## Commits
- 276641a feat(02-01): wave-gated check script
- 70822ee docs(02-01): requirements acceptance/priority, goals-tasks tables + coverage
- b8f10f9 docs(02-01): edge scenarios and test tasks (also carries kb/manifest.json refresh)

## Verification
- `node docs/check-framework.mjs --wave 1` passes; `node kb/tools/build-index.mjs` passes (25 notes).
- `--wave 4` fails as expected (IA, flows, wireframes not yet written). Waves 2-4 check code was written to spec but is untested against real files.

## Deviations from Plan
None. Admin edge scenario text adds a resource-overlap reason for the return (plan only required "a written reason").

## Honesty
All content `confidence: derived`; the 38/60 figure labelled illustrative; test tasks state no results recorded. No research invented.

## Known Stubs
None.

## Self-Check: PASSED
