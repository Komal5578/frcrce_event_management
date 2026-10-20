---
phase: 01-research-modeling-kit
plan: 01
subsystem: research
tags: [research, interview, questionnaire, traceability]
requires: []
provides:
  - Runnable interview guide and questionnaire (Coordinator, Student incl. Organizer, Admin)
  - P1..P10 key and question-to-problem coverage matrix
  - Empty results placeholder
affects: [01-03 check-kit.mjs, 02-modeling]
tech-stack:
  added: []
  patterns: ["[P#] tag at end of every question line; matrix derived from tags"]
key-files:
  created:
    - docs/research/interview-guide.md
    - docs/research/questionnaire.md
    - docs/research/question-trace.md
    - docs/research/README.md
    - docs/research/results-placeholder.md
  modified: []
key-decisions:
  - "Tags in the instruments are the source of truth; matrix derived from them with a scratch script (not committed)"
  - "Organizer handled as a variant inside Section B (adr-002-roles)"
requirements-completed: [RSCH-01]
duration: ~15 min
completed: 2026-10-20
---

# Phase 1 Plan 01: Research Kit Summary

Five AI-drafted Markdown files in `docs/research/` (all `confidence: assumed`, banner under every H1, no responses): an interview guide with 40 tagged questions and probes, a 37-item questionnaire, a P1..P10 trace key with a coverage matrix, a README with consent, anonymity and drafted-not-evidence sample sizes, and an empty results placeholder.

## Files created
- `docs/research/interview-guide.md`: Sections A (Q-C01..14), B (Q-S01..13), C (Q-A01..13); intro script, warm-up, core + probes, optional task observation, wrap-up, time budget (about 35-38 min, marked drafted), blank note sheet.
- `docs/research/questionnaire.md`: consent intro, Section A (11 items), B (14), C (12); 37 Options lines, 3 free-text items, Prefer not to say on all demographic/self-report items.
- `docs/research/question-trace.md`: problem key (from `dom-hmi-problems` numbering) plus matrix, all ten rows non-empty.
- `docs/research/README.md`, `docs/research/results-placeholder.md`.

## Verification (all task automated checks run, all passing)
- Role headings present in both instruments; every question line ends with a valid [P1..P10] tag (0 untagged).
- Counts: interview C/S/A = 14/13/13 question lines, 37 `Probes:`; questionnaire C/S/A = 11/14/12 (S largest), 37 `Options:`, 3 `Free text`.
- All P1..P10 covered; P3, P4, P7, P8 appear in every role section in both instruments.
- Matrix IDs match the tags (derived by script from the instrument tags).
- Tripwire greps (attendance, shortage, payment, email, sms, participant/respondent N, quote:, findings:, n=N, percent) return nothing; no `confidence: evidence|source` under docs/research.
- No commits made; STATE.md and ROADMAP.md untouched; kb/ not run or touched by this plan.

## Deviations from Plan
None - plan executed as written. Minor choices: warm-up and observation questions also carry `Probes:` lines (harmless to the checks); questionnaire has 11/14/12 items (plan allowed "10 or more" for A and C).

## Known Stubs
None. Results placeholder is intentionally empty by design (D-03).

## Self-Check: PASSED
All five files exist in `docs/research/`; no commits created per project override.
