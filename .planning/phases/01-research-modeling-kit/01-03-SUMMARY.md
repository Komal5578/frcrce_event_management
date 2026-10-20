---
phase: 01-research-modeling-kit
plan: 03
subsystem: research
tags: [validation, check-script, honesty]
requires: [01-01, 01-02]
provides: [docs/research/check-kit.mjs, green full suite]
affects: [01-VALIDATION.md]
key-files:
  created:
    - docs/research/check-kit.mjs
  modified:
    - .planning/phases/01-research-modeling-kit/01-VALIDATION.md
    - kb/manifest.json
requirements-completed: [RSCH-01, RSCH-02]
duration: short
completed: 2026-10-20
---

# Phase 1 Plan 03: check-kit.mjs and full validation Summary

One 77-line `node:fs`-only script (`docs/research/check-kit.mjs`) checks tags, P1..P10 coverage, per-role-section P3/P4/P7/P8 coverage in both instruments, trace-matrix vs tag consistency, role sections, persona frontmatter/labels and the results placeholder. It passes on the real files (77 questions) and the full suite is green.

## Negative checks (exercised, then restored)
- Removed `[P8]` from `Q-C01`: exit 1, "interview-guide.md: Q-C01 has no trailing [P#] tag" (plus trace mismatch for P8).
- Removed P7 from every Admin-section question in the questionnaire (on the file, backed up in the scratchpad): exit 1, "questionnaire.md: Admin section has no question tagged P7".
- Both files restored byte-identical (`cmp`), script green again.

## Final suite output
```
node docs/research/check-kit.mjs && node kb/tools/build-index.mjs
ok: kit checks passed (77 questions)
ok: 25 notes -> kb/manifest.json
exit 0
```
All other VALIDATION.md commands (SC1 role loop, trace P1..P10 loop, persona `ls`, `confidence: assumed` and label `grep -L`, tripwire, attendance/shortage, `confidence: evidence|source`) printed nothing / passed; placeholder greps ok. Script self-grep for tripwire words: 0 hits, `from 'node:fs'` count 1.

## State
- `kb/manifest.json` modified by build-index (left uncommitted); `kb/INDEX.md` unchanged; no new files under `kb/`.
- No commits made (`git log -1` still `f9bb5cf`); STATE.md and ROADMAP.md not edited by me (STATE.md shows modified from before).
- `01-VALIDATION.md`: `nyquist_compliant: true`, `wave_0_complete: true`, `status: complete`, map statuses green, sign-off ticked. Approval line says the manual reads are still pending.

## Deviations from Plan
None. No Markdown fixes were needed; the script passed first run.

## Human review checklist (PENDING, not done by the executor)
No real research was run and none was invented. These manual reads are pending the human:
1. Read `docs/research/results-placeholder.md`; confirm it holds no results.
2. Read each persona in `docs/personas/`; confirm every detail is labelled assumed.
3. Read `docs/research/interview-guide.md` start to finish as a facilitator: intro script, consent line, timing, probes present.

## Known Stubs
None.

## Threat Flags
None (read-only local script).

## Self-Check: PASSED
`check-kit.mjs` and this file exist; final suite exit 0; no commits.
