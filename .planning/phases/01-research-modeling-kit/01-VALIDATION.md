---
phase: 1
slug: research-modeling-kit
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract. Docs-only phase: checks are node + grep. Full detail in `01-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (node script + grep) |
| **Config file** | none |
| **Quick run command** | `node docs/research/check-kit.mjs` |
| **Full suite command** | `node docs/research/check-kit.mjs && node kb/tools/build-index.mjs` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task:** run `node docs/research/check-kit.mjs` once it exists, otherwise the task's grep
- **After every plan wave:** run the full suite command
- **Before `/gsd-verify-work`:** full suite green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

Task ids are filled in by the planner; rows below are keyed by success criterion.

| Criterion | Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-----------|-------------|----------|-----------|-------------------|-------------|--------|
| SC1 | RSCH-01 | Guide + questionnaire each have Coordinator / Student / Admin sections | grep | `for f in interview-guide questionnaire; do for r in Coordinator Student Admin; do grep -q "^## .*$r" docs/research/$f.md \|\| echo "MISSING $f $r"; done; done` (empty = pass) | ✅ | ✅ green |
| SC2 | RSCH-01 | Every question tagged `[P1..P10]`; all ten problems covered | script | `node docs/research/check-kit.mjs` | ✅ | ✅ green |
| SC2 | RSCH-01 | Trace table lists P1..P10 | grep | `for i in 1 2 3 4 5 6 7 8 9 10; do grep -q "P$i\b" docs/research/question-trace.md \|\| echo "MISSING P$i"; done` | ✅ | ✅ green |
| SC3 | RSCH-02 | Template + 3 personas exist | smoke | `ls docs/personas/persona-template.md docs/personas/persona-{coordinator,student,admin}.md` | ✅ | ✅ green |
| SC3 | RSCH-02 | Personas carry `confidence: assumed` | grep | `grep -L "^confidence: assumed$" docs/personas/persona-*.md` (empty = pass) | ✅ | ✅ green |
| SC3 | RSCH-02 | Visible "assumed, pending research" label on personas and `dom-personas` | grep | `grep -Li "assumed, pending research" docs/personas/persona-*.md kb/domain/personas.md` (empty = pass) | ✅ | ✅ green |
| SC4 | RSCH-01/02 | No response data, quotes, findings | grep tripwire | `grep -rniE "participant [0-9]\|respondent [0-9]\|[Qq]uote:\|findings?:\|n ?= ?[0-9]+" docs/research docs/personas` (nothing outside banner/placeholder) | ✅ | ✅ green |
| SC4 | RSCH-01 | Placeholder says only the team may record `evidence` | grep | `grep -q evidence docs/research/results-placeholder.md && grep -qi "only the team" docs/research/results-placeholder.md` | ✅ | ✅ green |
| SC4 | — | No attendance features | grep | `grep -rniE "attendance\|shortage" docs/research docs/personas` (nothing) | ✅ | ✅ green |
| SC4 | — | No docs/ file claims `evidence` or `source` | grep | `grep -rlE "^confidence: (evidence\|source)$" docs/` (nothing) | ✅ | ✅ green |
| SC4 | — | KB check passes | script | `node kb/tools/build-index.mjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `docs/research/check-kit.mjs` — covers SC2 tag coverage and SC3 label/frontmatter checks (research has an unrun sketch; run it once)
- [x] The kit and persona files themselves (all checks depend on them)

No framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nothing reads like invented data (personas, placeholder) | RSCH-01/02 | A grep cannot judge plausibility of invented quotes or stats | Read `results-placeholder.md` (must be empty of results) and each persona; confirm every detail is labelled assumed |
| Instruments are runnable without further drafting | RSCH-01 | Needs a human read-through as a facilitator | Read the guide start to finish: intro script, consent line, timing, probes all present |

---

## Validation Sign-Off

- [x] All tasks have an automated verify or Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without an automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** automated checks green 2026-10-20. The three manual-only reads were done by the gsd-verifier agent (see 01-VERIFICATION.md); no real research has been run.
