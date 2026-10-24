---
id: ds-readme
type: design
title: Design system
tags: [design-system,tokens]
confidence: derived
sources: [dom-status-vocabulary, src-accessibility-areas, src-hmi-principles, adr-001-stack]
summary: Colour, spacing, type and status tokens, computed contrast record, and the frozen shared component set in components/ui.
updated: 2026-10-24
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

## v2 visual direction (2026-10-24, user-pinned reference: `src-model-infographic`, `kb/source/attendance-reference/design-model.png`)

The v2 frontend (`/frontend`) is built to the original mockup's look, not a generic SaaS kit. Decisions that supersede the v1 notes above:

- **Layout:** dark navy sidebar (`--navy`) against a light canvas (`--canvas`) with white cards, for Coordinator and Admin. Student is phone-first (purple header band, bottom tab bar) and becomes a purple sidebar with multi-column card grids from 1024px up: responsive, not a phone frame on desktop.
- **Stat tiles:** a big coloured number over a plain label (green / red / amber / slate / blue pairs reuse the status tokens, so contrast is already checked).
- **Themes:** light is the default (matches the mockup); dark is opt-in via the header toggle, stored in `localStorage.theme`. Tokens live in `app/globals.css` as CSS variables; `data-theme="dark"` re-maps them.
- **Text size:** `html[data-text]` 14 / 16 / 19px (A- / A / A+), set before paint. Only text scales; interactive targets are `min-h-11` (44px).
- **Returned** now has its own colour family (fuchsia, fg `#86198f` on `#fae8ff`) so it no longer reads the same as Pending approval; icon and word are unchanged.
- **Type:** Plus Jakarta Sans (one family). Numbers use tabular figures.
- **Motion:** `motion` library; staggered list entrances, count-up on stat tiles, spring dialogs and toasts, a sliding active-nav pill. Everything honours `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` plus a CSS fallback).
- **Review & Confirm:** native `<dialog>`; first focus is Go back; `destructive` variant uses the danger colour; plain-language feedback arrives as a toast (with Undo where the action is reversible).
- **Pending clash display:** the Admin approval screen lists other pending requests for the same slot as a warning and does not block; only approved/open/ongoing bookings block Approve (`dom-domain-model`, TT-A1).

Verification (computed, not user-tested): Lighthouse accessibility 100 on login, coordinator and student screens (desktop and mobile emulation); the impeccable detector reports no findings; the taste-skill `inspect.mjs --app` gate was run on every screen of all three roles at 1440 / 768 / 390px with 0 FAIL. Two deliberate allowances: `palette-purple` and `colour-sprawl` on the student interface (the purple header band is pinned by the original mockup) and `icon-chips` on the product's brand mark. Three WARNs are data-driven and accepted (short task list, an empty calendar day cell, a long notification list). Playwright specs live in `frontend/e2e` and clean up after themselves (`npm run test:e2e`).

Panels use real borders, not box-shadow rings; the status chips use a border; buttons have no glow; skeletons are a flat tone with an opacity pulse (no gradients).

Power-design web-rule audit (2026-10-24, computed): colour tokens are OKLCH and components contain no raw hex; first-load JS is 235-254 KB gzip per role entry (budget 300 KB; Recharts is lazy-loaded); lab LCP 122 ms and CLS 0.00 on the admin dashboard; `frontend/e2e/structure.spec.ts` asserts, on every screen at 320 / 390 / 1440px, one h1, no skipped heading levels, a `main` landmark, a per-page title, no horizontal scroll and 44px targets (dense month-calendar chips are 24px+ for a mouse and 44px on coarse pointers). Not applicable to an authenticated app: OG image and JSON-LD (the pages are private); the favicon is `app/icon.svg`.

Chart colour (dataviz skill, 2026-10-24): the status donut was first red+green, which failed colour-blind separation (deutan dE 4.0). It is now amber / blue / red / neutral, validated with `validate_palette.js` in light and dark (CVD dE >= 20); dark steps `chart-1/3/4` were re-picked to sit in the dark lightness band. Never pair red with green. Every chart has a screen-reader table; line markers are 8px; slices have a 2px surface gap and a legend with values.

Accessibility review (WCAG 2.1 AA walk-through): dialog title ids are unique (`useId`); the venue picker and the Upcoming/Past switch are `aria-pressed` buttons (not `radio`/`tab` roles that would promise arrow-key patterns we do not implement); `e2e/keyboard.spec.ts` proves Enter opens Review & Confirm, Go back has focus, Tab stays inside, Esc closes and focus returns. Motion audit: the list entrance no longer replays on every filter change, and the route transition is 200 ms.

Bolder pass (2026-10-24, user-chosen direction): the Admin dashboard leads with a navy decision hero (the one waiting decision, the next request in the queue, one Review button), as `docs/wireframes/admin.md` AD-01 asks ("the one waiting decision is the biggest element"); empty states use flat token-coloured spot illustrations (`components/ui/illustrations.tsx`, no gradients); the student's next registered event is a countdown card. Motion stays restrained and reduced-motion safe.
