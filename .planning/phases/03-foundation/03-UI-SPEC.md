---
phase: 3
slug: foundation
status: draft
shadcn_initialized: false
preset: none
created: 2026-10-20
---

# Phase 3 — UI Design Contract

> Scope: themed app shell, design tokens, status-vocabulary component, shared `components/ui`, login screen (demo buttons + normal sign-in), A-/A/A+ control. Role screens are Phase 4. Auto mode: every choice below is resolved from project sources (`dom-status-vocabulary`, `src-accessibility-areas`, `src-hmi-principles`, `adr-001-stack`, `adr-004-scope`, `dom-requirements` X1-X3, FOUND-02/06/07). Confidence of this contract: `derived`. No research results are claimed. Contrast ratios below are computed (WCAG relative luminance formula), not user-tested.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (hand-built `components/ui` + Tailwind tokens; simplest path, no shadcn/registry, `adr-001-stack`) |
| Preset | not applicable |
| Component library | none (native elements first: `<button>`, `<input>`, `<dialog>`, `<select>`; no Radix) |
| Icon library | `lucide-react` (only new UI dependency; tree-shaken, aria-hidden SVGs) |
| Font | Inter via `next/font`, fallback `system-ui, sans-serif`. Single family. |
| Theme | Light only in Phase 3 (dark mode out of scope, YAGNI `adr-004-scope`) |
| Token home | CSS variables in `app/globals.css` mapped in Tailwind theme; documented in `kb/design-system/README.md` (`ds-readme`) |
| Frozen shared files | `components/ui/*`, tokens, schema (listed in `AGENTS.md` before Phase 4) |

---

## Spacing Scale

Multiples of 4 only. Tailwind default step names map 1:1.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gap, badge inner gap |
| sm | 8px | Compact spacing, between related controls |
| md | 16px | Default padding, form field gap |
| lg | 24px | Card padding, section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: interactive targets have `min-height: 44px; min-width: 44px` (Tailwind `min-h-11 min-w-11`), including the A-/A/A+ buttons, nav items, demo buttons and icon-only buttons. Adjacent targets are separated by at least 8px. Spacing tokens are px and do not scale with text size; text uses rem.

---

## Typography

Sizes are rem, base 16px at "A". Exactly 4 sizes, 2 weights (400, 600).

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px (1rem) | 400 | 1.5 |
| Label (field labels, status badge, nav, buttons) | 14px (0.875rem) | 600 | 1.4 |
| Heading (page/section/card title) | 20px (1.25rem) | 600 | 1.2 |
| Display (login title, page title) | 28px (1.75rem) | 600 | 1.2 |

Text size control (X3, `src-accessibility-areas`): three buttons "A-", "A", "A+" set root font-size to 14px / 16px / 20px (87.5% / 100% / 125%) on `<html>`, so all rem text scales. Persisted in `localStorage` key `textSize`; applied before paint (inline script in layout head) to avoid flash. Control is in the app-shell header and on the login screen; it is a `role="group"` labelled "Text size" with `aria-pressed` on each button; labels spoken as "Smaller text", "Default text", "Larger text". Layout must not break or clip at A+ and at 200% browser zoom (WCAG 1.4.4, 1.4.10 reflow at 320px).

---

## Color

Values verified for contrast (ratio = WCAG 2.2 relative luminance).

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` surface / `#F8FAFC` page background | Page background, main content |
| Secondary (30%) | `#F1F5F9` | Cards, header, sidebar/nav, table header, input hover |
| Accent (10%) | `#3730A3` (indigo-800) | See reserved list |
| Destructive | `#B91C1C` | Destructive actions only |
| Text ink | `#0F172A` | Body and headings |
| Text muted | `#475569` | Helper text, secondary labels |
| UI border | `#64748B` | Input and button borders (non-text contrast >= 3:1) |
| Focus ring | `#3730A3`, 3px solid, 2px offset | `:focus-visible` on every interactive element, never removed |

Accent reserved for: primary action button fill (one per screen region), active nav item indicator and text, focus ring, links inside body text, selected text-size button. Not for status, not for decoration, not for every interactive element.

### Contrast record (FOUND-02 success criterion 2)

| Pair (fg on bg) | Ratio | Needs | Result |
|---|---|---|---|
| Ink `#0F172A` on `#FFFFFF` | 17.85 | 4.5 | pass |
| Ink on `#F1F5F9` | 16.30 | 4.5 | pass |
| Muted `#475569` on `#FFFFFF` | 7.58 | 4.5 | pass |
| Muted on `#F1F5F9` | 6.92 | 4.5 | pass |
| White on accent `#3730A3` | 9.93 | 4.5 | pass |
| Accent on `#FFFFFF` (links, focus ring) | 9.93 | 4.5 / 3 | pass |
| White on destructive `#B91C1C` | 6.47 | 4.5 | pass |
| Border `#64748B` on `#FFFFFF` | 4.76 | 3 (1.4.11) | pass |

The executor must add a runnable check (`npm test`: small node/vitest script computing these ratios from the token file) that fails if any pair drops below threshold, and record the output in `kb/design-system/README.md`.

### Status colours (one vocabulary, `dom-status-vocabulary`, X1)

Each status = icon + text label + tinted background + coloured text and border. Colour is never the only signal; the label word and distinct icon shape carry meaning.

| Status (label text) | Icon (lucide) | Text / icon | Background | Ratio |
|---|---|---|---|---|
| Draft | `Pencil` | `#374151` | `#F3F4F6` | 9.37 |
| Pending approval | `Clock` | `#78350F` | `#FEF3C7` | 8.15 |
| Approved | `ShieldCheck` | `#1E40AF` | `#DBEAFE` | 7.15 |
| Open | `DoorOpen` | `#166534` | `#DCFCE7` | 6.49 |
| Ongoing | `CirclePlay` | `#115E59` | `#CCFBF1` | 6.73 |
| Completed | `CircleCheck` | `#334155` | `#E2E8F0` | 8.40 |
| Cancelled | `CircleX` | `#991B1B` | `#FEE2E2` | 6.80 |
| Full / Waitlist (extra, in vocabulary) | `Users` | `#9A3412` | `#FFEDD5` | 6.38 |
| Returned (extra, in vocabulary) | `CornerUpLeft` | `#78350F` | `#FEF3C7` | 8.15 |

The seven required by the phase (Draft, Pending approval, Approved, Open, Ongoing, Completed, Cancelled) must ship; Full/Waitlist and Returned ship too because they are in the canonical vocabulary and Phase 4 needs them. Task and registration statuses (To do, In progress, Done, Overdue; Registered, Waitlisted) and alerts (Clash, Low registrations, Overdue) reuse the same badge component with their own entries in the same table, added by Phase 4/5 without changing the component API. Pending approval and Returned share a colour family but differ in icon and word.

### Status component contract

`<StatusBadge status="open" />` in `components/ui/status-badge.tsx`:
- Renders `<span>` with 16px icon (`aria-hidden`), then the label text, in a pill: height 28px visual, padding 4px 8px, 1px border in the text colour, label style (14px/600). Badge is not interactive so the 44px rule does not apply; if wrapped in a button, the button is 44px.
- Typed union of status keys; one lookup table (key -> label, icon, classes). Unknown key is a TypeScript error.
- Label is real text (readable by screen readers); no `title`-only meaning.
- A dev-only `/design` route (or Storybook-free page) shows all badges, buttons, inputs and the text-size control for the contrast and keyboard check; excluded from role navigation.

---

## Shared components (`components/ui`, frozen after Phase 3)

Minimum set, all hand-built, all 44px min targets, visible focus ring, no colour-only meaning:

| Component | Contract |
|---|---|
| Button | Variants: primary (accent fill, white text), secondary (white, `#64748B` border, ink text), destructive (`#B91C1C` fill), ghost. Label style. Disabled = 60% opacity plus `aria-disabled`, still readable. Loading state shows text "Working..." not a bare spinner. |
| Input / Select / Textarea + Field | Visible label above (never placeholder-only), helper text, error text with `CircleAlert` icon + message in `#B91C1C`, `aria-describedby` wiring, `aria-invalid`. Autocomplete attributes set on email/password. |
| StatusBadge | As above. |
| Card | `#F1F5F9` surface, 24px padding, 1px `#CBD5E1` border, 8px radius. |
| Alert (inline message) | Icon + title + body; variants info, success, warning, error; uses same colour families as statuses; `role="status"` (or `role="alert"` for errors). |
| TextSizeControl | As in Typography. |
| AppShell | See below. |
| ConfirmDialog (Review & Confirm skeleton) | Native `<dialog>`: summary of what will happen, plain-language consequence, "Confirm {verb}" primary and "Go back" secondary, focus moved in and returned, Esc closes. Used by Phase 4 for submit/register/cancel/approve/return (X2). Included now so Phase 4 does not diverge. |

Radius: 8px for cards/inputs/buttons, 9999px for badges. Shadow: none except dialog (single soft shadow). No animations beyond 150ms colour transitions; respect `prefers-reduced-motion`.

---

## App shell

One shell, role-neutral frame; each role supplies its own nav items in Phase 4 (`adr-002-roles`, one interface per role).

- Skip link "Skip to main content" as first focusable element, visible on focus.
- Header (secondary `#F1F5F9`, 64px tall): product name "College Events" left; right side: TextSizeControl, role label + user name (text, e.g. "Student: Asha"), "Sign out" button.
- Nav: left sidebar >= 1024px (240px wide), collapses to a top disclosure button "Menu" (44px, `aria-expanded`) below 1024px. Nav items are links with icon + text, 44px tall, current page has accent left bar plus accent text plus `aria-current="page"` (not colour alone).
- Landmarks: `<header>`, `<nav aria-label="Main">`, `<main id="main">`, one `<h1>` per page (Display style).
- Content max width 1152px, 24px side padding (16px below 640px).
- Phase 3 nav is a stub: a placeholder landing page per role showing a heading "{Role} home", the user's name and a "Coming in the next phase" notice. Real nav is Phase 4's.
- Responsive floor: works at 320px width without horizontal scroll.

---

## Login screen (FOUND-06, FOUND-07)

Layout: single centred column, max width 480px, on `#F8FAFC`. Text-size control top right. Order (top to bottom), which doubles as tab order:

1. `<h1>` Display: "Sign in to College Events"
2. Section "Demo access" (Heading style): helper line "Pick a role to look around. No password needed."
3. Three full-width buttons, secondary variant, 56px tall (>= 44px), each with a role icon + label + one-line goal. Stacked vertically with 8px gap:
   - `Clapperboard`: "Continue as Coordinator" / "Plan and run events"
   - `Ticket`: "Continue as Student" / "Find and join events"
   - `ShieldCheck`: "Continue as Admin" / "Approve and monitor"
   One click signs in with the seeded test user for that role and redirects straight to that role's home (minimum interactions; the system already knows the credentials, so nothing is asked). While signing in the button label becomes "Signing in..." and others are disabled.
4. Visual divider with text "or sign in with your account" (text, not a line only).
5. Form: Field "Email" (type email, autocomplete `username`), Field "Password" (type password, autocomplete `current-password`, "Show password" checkbox 44px), primary Button "Sign in".
6. Footer note (muted, 14px): "Demo accounts are for review only."

Behaviour: Enter submits the form from either field. After success, redirect to the role home by profile role (Coordinator, Student, Admin). Already signed-in visitor to `/login` is redirected to their home. No self-registration, no password reset, no social login, no email verification flows (`adr-004-scope`: no email/SMS). No "remember me".

Focal point: the `<h1>` first, then the Demo access group (dominant, 56px secondary buttons); "Sign in" is the primary-filled button but sits below the divider as the secondary path. Role home focal point: the "{Role} home" `<h1>`.

States:
- Loading: as above, `aria-busy` on the section.
- Error: Alert (error) above the form, focus moved to it, `role="alert"`.
- Demo buttons visible only when `NEXT_PUBLIC_DEMO_LOGIN=true` (set true in dev and the deployed demo; the button list is the only thing hidden, so a real deployment could hide it).

---

## Interaction and accessibility contract (X3, `src-accessibility-areas`, `src-hmi-principles`)

- Keyboard: every control reachable in logical DOM order, no tab traps, Enter/Space activate buttons, Esc closes dialog/menu. Login fully completable with keyboard alone (demo button -> role home; or email -> password -> Sign in).
- Focus: `:focus-visible` ring 3px accent with 2px offset on all interactive elements; focus never obscured by sticky header (WCAG 2.2 2.4.11): header is not sticky in Phase 3, or `scroll-padding-top: 80px` if made sticky.
- Targets: >= 44px (exceeds WCAG 2.2 2.5.8 minimum of 24px, per project rule).
- Status: icon + text + colour always (X1). Required fields marked with the word "required" in the label, not only an asterisk.
- Errors: human sentences, no codes; say what happened and what to do.
- Language: `<html lang="en">`. Multi-language is a stretch, not built.
- Motion: respects `prefers-reduced-motion`.
- Do not use hover-only information; no drag-only actions.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (login) | "Sign in" |
| Demo CTAs | "Continue as Coordinator", "Continue as Student", "Continue as Admin" |
| Sign out | "Sign out" |
| Empty state heading (role home stub) | "Your {role} screens are not built yet" |
| Empty state body | "Your {role} screens arrive in the next build step. Use the menu or sign out to try another role." |
| Error state: wrong credentials | "We could not sign you in. Check your email and password, then try again, or use a demo button above." |
| Error state: network/server | "Sign in did not work because we could not reach the server. Check your connection and try again." |
| Error state: field | "Enter your email address, for example name@college.edu." / "Enter your password." |
| Loading | "Signing in..." |
| Destructive confirmation | None in Phase 3 (no destructive actions). ConfirmDialog default copy pattern for Phase 4: "Review before you {verb}": summary list, then "Confirm {verb}" and "Go back". After success, plain-language Alert, e.g. "You are registered for {event}." |
| Text size control labels | "A-" (Smaller text), "A" (Default text), "A+" (Larger text) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (not initialised) | not applicable |
| third-party | none | not applicable, no registry used |

New runtime dependencies introduced by this UI: `lucide-react` only (plus `@supabase/ssr` for auth, a Phase 3 backend concern). No other UI libraries.

---

## Decisions log (for planner)

| # | Decision | Reason / kb id |
|---|---|---|
| 1 | Hand-built components, no shadcn | Simplest, frozen small set, `adr-001-stack`, ponytail |
| 2 | Light theme only | YAGNI, `adr-004-scope` |
| 3 | Indigo accent kept off the status palette | Status colours stay unambiguous (`dom-status-vocabulary`, X1) |
| 4 | Text size via root font-size 14/16/20px | Scales all rem text, X3, `src-accessibility-areas` |
| 5 | Demo buttons one click, no password | Minimum interactions, pre-fill what the system knows, FOUND-07, `src-hmi-principles` |
| 6 | ConfirmDialog built now | Prevent divergence across 3 parallel agents, X2 |
| 7 | Contrast check as an automated test | Success criterion 2, FOUND-02 |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
