---
phase: 02
slug: requirements-framework
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-20
---

# Phase 2 — Validation Strategy

> Docs-only phase. Details in `02-RESEARCH.md` "Validation Architecture".

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node 24 script (no deps), modelled on `docs/research/check-kit.mjs` |
| **Config file** | none |
| **Quick run command** | `node docs/check-framework.mjs` |
| **Full suite command** | `node docs/check-framework.mjs && node docs/research/check-kit.mjs && node kb/tools/build-index.mjs` |
| **Estimated runtime** | ~2 seconds |

## Sampling Rate

- **After every task commit:** `node docs/check-framework.mjs`
- **After every plan wave:** full suite command
- **Before `/gsd:verify-work`:** full suite green
- **Max feedback latency:** 5 seconds

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-xx | per plan | per plan | FRAM-01 | script | all 22 ids (C1-C7,S1-S5,A1-A5,X1-X5) in goals-tasks | ✅ | ✅ green |
| 02-xx | per plan | per plan | FRAM-02 | script+grep | test tasks per role; no UI control names | ✅ | ✅ green |
| 02-xx | per plan | per plan | FRAM-03 | script | each interface has IA file, nav ≤5, My Tasks on Student | ✅ | ✅ green |
| 02-xx | per plan | per plan | FRAM-04 | script | every `DO:` node preceded by `RC` node | ✅ | ✅ green |
| 02-xx | per plan | per plan | FRAM-05 | script | every IA screen id has a wireframe heading | ✅ | ✅ green |

## Wave 0 Requirements

- [x] `docs/check-framework.mjs` — covers FRAM-01..05

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Walk each primary flow screen by screen | FRAM-05 | Judgement | Follow numbered wireframes per flow; no dead ends |

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependency
- [x] Wave 0 covers all MISSING references
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-20
