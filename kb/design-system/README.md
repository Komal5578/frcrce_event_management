---
id: ds-readme
type: design
title: Design system
tags: [design-system,tokens]
confidence: derived
sources: [dom-status-vocabulary, src-accessibility-areas, src-hmi-principles, adr-001-stack]
summary: Colour, spacing, type and status tokens, computed contrast record, and the frozen shared component set in components/ui.
updated: 2026-10-20
---

# Design system

Single source of tokens: `app/globals.css` (`@theme`). Light theme only. Contrast ratios are computed by the WCAG relative-luminance formula (`tests/contrast.test.ts`); computed, not user-tested. No research is claimed here.

## Tokens

| Token | Hex | Role |
|---|---|---|
| page | #F8FAFC | page background |
| surface | #FFFFFF | main content, inputs |
| panel | #F1F5F9 | cards, header, nav |
| accent | #3730A3 | primary button, active nav, focus ring, links, selected text size |
| destructive | #B91C1C | destructive actions and error text only |
| ink | #0F172A | body text and headings |
| muted | #475569 | helper text |
| border-ui | #64748B | input and button borders (3:1) |
| border-card | #CBD5E1 | card and header borders |

- Spacing: fixed 4px steps (`--spacing: 4px`), px not rem, so 44px targets stay 44px at A-/A/A+; only text scales.
- Type (rem, 2 weights 400/600): body 1rem, label 0.875rem, heading 1.25rem, display 1.75rem.
- Radius: 8px controls, 9999px badges. No shadow except the dialog.

## Status vocabulary (`dom-status-vocabulary`)

Icon + word + colour, always. One table: `STATUS_META` in `components/ui/status-badge.tsx`.

| Key | Label | Icon | Text/border | Background | Ratio |
|---|---|---|---|---|---|
| draft | Draft | Pencil | #374151 | #F3F4F6 | 9.37 |
| pending | Pending approval | Clock | #78350F | #FEF3C7 | 8.15 |
| approved | Approved | ShieldCheck | #1E40AF | #DBEAFE | 7.15 |
| open | Open | DoorOpen | #166534 | #DCFCE7 | 6.49 |
| ongoing | Ongoing | CirclePlay | #115E59 | #CCFBF1 | 6.73 |
| completed | Completed | CircleCheck | #334155 | #E2E8F0 | 8.40 |
| cancelled | Cancelled | CircleX | #991B1B | #FEE2E2 | 6.80 |
| full | Full / Waitlist | Users | #9A3412 | #FFEDD5 | 6.38 |
| returned | Returned | CornerUpLeft | #78350F | #FEF3C7 | 8.15 |

## Task, registration and alert tokens (v2, to add in Phase 10)

Same pattern as above: icon + text + `--color-status-<key>-fg/-bg`, each pair checked at 4.5:1 by the contrast test (ratios recorded when computed, not before). Meaning and display mapping: `dom-status-vocabulary`.

| Key | Label | Icon | Colour family |
|---|---|---|---|
| todo | To do | Circle | grey |
| doing | In progress | Loader | blue |
| done | Done | CircleCheck | green |
| overdue | Overdue | AlarmClock | red |
| registered | Registered | TicketCheck | green |
| waitlisted | Waitlisted | Hourglass | orange |
| reg-cancelled | Cancelled | CircleX | red |
| alert-clash | Clash | TriangleAlert | red |
| alert-low | Low registrations | TrendingDown | amber |

## Contrast record

Output of `npx vitest run tests/contrast.test.ts --disableConsoleIntercept`, 2026-10-20. Computed, not user-tested. The test fails if any pair drops below its threshold.

| Pair | Ratio | Needed |
|---|---|---|
| ink on surface | 17.85 | 4.5 |
| ink on panel | 16.30 | 4.5 |
| muted on surface | 7.58 | 4.5 |
| muted on panel | 6.92 | 4.5 |
| white on accent | 9.93 | 4.5 |
| accent on surface | 9.93 | 4.5 |
| white on destructive | 6.47 | 4.5 |
| border-ui on surface | 4.76 | 3 |
| status-draft fg on bg | 9.37 | 4.5 |
| status-pending fg on bg | 8.15 | 4.5 |
| status-approved fg on bg | 7.15 | 4.5 |
| status-open fg on bg | 6.49 | 4.5 |
| status-ongoing fg on bg | 6.73 | 4.5 |
| status-completed fg on bg | 8.40 | 4.5 |
| status-cancelled fg on bg | 6.80 | 4.5 |
| status-full fg on bg | 6.38 | 4.5 |
| status-returned fg on bg | 8.15 | 4.5 |

## Text size A-/A/A+

Root font-size 14 / 16 / 20px on `<html>`. Stored in `localStorage` key `textSize` (`small` / `medium` / `large`); an inline script in `app/layout.tsx` applies it before paint. Unknown values are ignored. Spacing does not scale.

## Components (`components/ui`, frozen after Phase 3, see `AGENTS.md`)

- `status-badge.tsx`: `StatusBadge`, `STATUS_META`, `StatusKey`. Unknown key is a type error.
- `button.tsx`: primary, secondary, destructive, ghost; `size="lg"` 56px; `loading` shows "Working...".
- `field.tsx`: `Field` (label, helper, error, "(required)" word) wrapping `Input`, `Select`, `Textarea`.
- `card.tsx`: panel surface, 24px padding.
- `alert.tsx`: info, success, warning, error; error uses `role="alert"`; accepts a `ref` to move focus.
- `text-size-control.tsx`: the A-/A/A+ group with `aria-pressed`.
- `app-shell.tsx`: skip link, header, sidebar nav at 1024px and up. Below 1024px the student interface uses a bottom tab bar (per the IA); admin and coordinator may keep a collapsible sidebar. Roles pass `navItems`, `roleLabel`, `userName`, `signOut`.
- `confirm-dialog.tsx`: native `<dialog>` Review & Confirm.

All targets are at least 44px, focus ring is never removed, nothing relies on colour alone.

## How to add a status

1. Add `--color-status-<key>-fg` and `-bg` to `app/globals.css` and check the ratio (4.5 minimum).
2. Add a `STATUS_META` entry with a unique label and icon, using literal `text-status-<key>-fg bg-status-<key>-bg border-status-<key>-fg` classes.
3. Run `npm test`; `tests/status.test.ts` and `tests/contrast.test.ts` check tokens, uniqueness and ratios.

## Review & Confirm (X2)

Use `ConfirmDialog` for submit, register, cancel, approve and return: `<ConfirmDialog open verb="register" summary={...} consequence="..." onConfirm onCancel />`. It shows "Review before you {verb}", the summary, a plain consequence sentence, "Confirm {verb}" and "Go back". Esc calls `onCancel`. After success show a plain-language `Alert`, for example "You are registered for {event}." The `/design` route (dev only) shows every component.
