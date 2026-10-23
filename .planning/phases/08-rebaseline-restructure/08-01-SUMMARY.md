---
phase: 08-rebaseline-restructure
plan: 01
subsystem: docs
tags: [kb, adr, domain-model, status-vocabulary]
requirements-completed: [REBASE-01, REBASE-02, REBASE-03]
key-files:
  modified:
    - kb/decisions/adr-001-stack.md
    - kb/domain/domain-model.md
    - kb/domain/status-vocabulary.md
    - kb/domain/scenarios.md
    - kb/design-system/README.md
    - AGENTS.md
    - .planning/PROJECT.md
completed: 2026-10-23
---

# Phase 8 Plan 01: Re-baseline kb and project docs Summary

ADR-001 v3 (FastAPI + Postgres on EC2, Next.js on Vercel), domain model with pending-may-overlap and approve/reschedule resource re-check, and status vocabulary with task, registration and alert tokens.

## Done
- ADR-001 rewritten as v3 with a History section (Supabase, Cloudflare + D1, AWS + Vercel, each with a reason).
- AGENTS.md: worktree, frozen-file and proposal/amendment rules removed; stack pointer added.
- PROJECT.md: human steps, constraints and process lines moved to v2 (remaining Cloudflare/D1 mentions are history or the v1 reference).
- domain-model.md: only approved/open/ongoing book a venue (gist exclusion); pending may overlap, `VENUE_CLASH` at approval; resources re-checked on approve and reschedule; `return_reason`, `cancel_reason`, `event_templates`, venue `active` (maintenance maps to `active=false`).
- status-vocabulary.md: Task, Registration and Alert tables plus the `confirmed`/`doing` display mapping.
- design-system README: new token table; student bottom tab bar on phone replaces the "Menu" disclosure.
- scenarios.md: "Submitted" is now "Pending approval".

## Verification
Plan grep checks pass. `node kb/tools/build-index.mjs`: `ok: 25 notes -> kb/manifest.json`. Nothing committed.

## Deviations
None. The new design-system token rows deliberately have no hex values or contrast ratios (not computed yet; Phase 10 sets them).

## Notes for others
- Other drift items in CONTEXT (docs/flows, docs/wireframes, docs/ia) are not in this plan's files.
- `.planning/PROJECT.md` line 39 and the decisions table still say "Cloudflare" as v1 history, intended.
