---
phase: 03-foundation
plan: 03
subsystem: ui
tags: [components, status-vocabulary, a11y, design-system, dialog]
requires: [03-01]
provides:
  - StatusBadge with one STATUS_META table (nine statuses, icon + word + colour)
  - Button, Field/Input/Select/Textarea, Card, Alert, TextSizeControl, AppShell, ConfirmDialog
  - Dev-only /design gallery
  - kb/design-system/README.md (ds-readme) with tokens and computed contrast record
affects: [03-04, 03-05, phase-04]
tech-stack:
  added: []
  patterns: [literal Tailwind class strings in lookup table, useSyncExternalStore for localStorage text size, native dialog]
key-files:
  created: [components/ui/status-badge.tsx, components/ui/button.tsx, components/ui/field.tsx, components/ui/card.tsx, components/ui/alert.tsx, components/ui/text-size-control.tsx, components/ui/app-shell.tsx, components/ui/confirm-dialog.tsx, app/design/page.tsx, app/design/dialog-demo.tsx, tests/status.test.ts]
  modified: [kb/design-system/README.md, kb/manifest.json]
key-decisions:
  - "Status keys live in one table; new statuses add a token pair plus one entry"
  - "TextSizeControl reads localStorage via useSyncExternalStore (lint forbids setState in effect)"
requirements-completed: [FOUND-02]
duration: ~20min
completed: 2026-10-20
---

# Phase 3 Plan 03: Shared components, gallery and design-system doc Summary

Hand-made `components/ui` set with a tested nine-status vocabulary, A-/A/A+ control, role-neutral AppShell and a native-dialog Review & Confirm, plus the filled `ds-readme` (`dom-status-vocabulary`, `src-accessibility-areas`, `src-hmi-principles`, `adr-001-stack`).

## Tasks
1. StatusBadge, Button, Field, Card, Alert, status test: 085c940
2. TextSizeControl, AppShell, ConfirmDialog, /design: dc6840a
3. kb/design-system/README.md + manifest: e5fe081

## Verification
- `npm run lint`, `typecheck`, `npm test` (39 tests incl. 5 status tests), `npm run build` (lists /design) all exit 0.
- `node kb/tools/build-index.mjs` passes (25 notes).
- Gates: no `dangerouslySetInnerHTML`, no `@/app` or `@/lib` imports, no `outline-none` in components/ui. `@ts-expect-error` in the status test proves an unknown StatusKey is a type error.
- Contrast table in ds-readme is the printed output of tests/contrast.test.ts (computed, not user-tested).

## Browser check
NOT DRIVEN. No browser or Playwright run was done for /design (tab order, A+ clipping, 320px reflow, dialog focus return are unverified in a real browser). Only build/lint/type/unit checks ran. Needs a manual or e2e pass (plan 03-05 or verify-work).

## Deviations from Plan
**1. [Rule 1 - lint] TextSizeControl setState in effect** rejected by react-hooks lint; switched to `useSyncExternalStore` over localStorage with the same key and values. Commit dc6840a.
**2. Added `app/design/dialog-demo.tsx`** (client wrapper the plan asked for "inside the page folder"); not in the plan's file list.
**3. Field `required`** renders "(required)" after the label and also sets the native `required` attribute on the control.

## Known Stubs
None. `Alert` accepts `ref` as a React 19 prop.

## Self-Check: PASSED
