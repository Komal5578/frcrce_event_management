---
phase: 02-requirements-framework
plan: 02
subsystem: docs
tags: [information-architecture, navigation, vocabulary]
requires: [02-01]
provides:
  - docs/ia/{coordinator,student,admin}.md with screen ids CO-01..08, ST-01..06, AD-01..06
  - docs/ia/shared-vocabulary.md (X4 terms and layout rules)
affects: [02-03, 02-04]
key-files:
  created: [docs/ia/coordinator.md, docs/ia/student.md, docs/ia/admin.md, docs/ia/shared-vocabulary.md]
key-decisions:
  - "Organizer is a flag on Student (My Tasks tab only for organizers); adr-002-roles stays assumed"
  - "AD-01 is Admin home, not a sixth nav item"
requirements-completed: [FRAM-03]
completed: 2026-10-20
---

# Phase 2 Plan 02: Information architecture Summary

Three per-role IA files (Mermaid sitemap, nav of at most 5, screens table with stable ids) plus shared vocabulary covering all status words and reusable layout rules.

## Commits
- 8be6d6a docs(02-02): coordinator and student IA
- b138719 docs(02-02): admin IA and shared vocabulary

## Verification
- `node docs/check-framework.mjs --wave 2` passes; `node kb/tools/build-index.mjs` passes (25 notes, no kb edits).
- Acceptance greps: 8 CO, 6 ST, 6 AD screen rows; 0 hex colours in shared-vocabulary.

## Deviations from Plan
None. Wave-2 check code needed no fixes. Task 1 verify command's first half is a grep that exits 1 on no match (the desired result); the second half is the real assertion.

## Honesty
All files labelled `derived`; no research or usability results claimed.

## Known Stubs
None.

## Self-Check: PASSED
