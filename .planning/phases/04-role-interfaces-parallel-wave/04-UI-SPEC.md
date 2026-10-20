---
phase: 4
slug: role-interfaces-parallel-wave
status: approved
reviewed_at: 2026-10-20
shadcn_initialized: false
preset: none
created: 2026-10-20
---

# Phase 4 — UI Design Contract

> Scope: the three role interfaces (Coordinator 4a, Student 4b, Admin 4c) built in parallel on the frozen Phase 3 system. Requirements COORD-01..07, STUD-01..05, ADMIN-01..04. This contract EXTENDS `03-UI-SPEC.md` (tokens, type scale, spacing, components, shell). It does not contradict it. Anything not restated here is inherited unchanged.
> Method: power-design web principles (20 rules, `~/.claude/skills/power-design/principles/web-principles.md`) are the floor. This is an APP UI (Path B), so the landing spine, hero, social proof, pricing and SEO meta items are skipped (marked N/A in the checklist). Brand = this project's own tokens in `app/globals.css`; no other brand is imported.
> Sources: `03-UI-SPEC.md`, `03-HANDOFF.md`, `04-RESEARCH.md`, `docs/wireframes/*`, `docs/ia/*`, `dom-status-vocabulary`, `src-hmi-principles`, `src-accessibility-areas`, `adr-004-scope`. Confidence `derived`. The wireframes are AI-drafted and untested. No usability result, timing or user number is claimed in this document; "read in < 3 s" and similar are DESIGN TARGETS to be measured by the team in Phase 6, not findings.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (inherited: hand-built `components/ui` + Tailwind v4 tokens in `app/globals.css`) |
| Preset | not applicable |
| Component library | none; native elements first (`<button>`, `<input>`, `<select>`, `<dialog>`, `<details>`, `<progress>`, GET `<form>`) |
| Icon library | `lucide-react` (installed; no new dependency) |
| Font | Inter via `next/font` (self-hosted by Next, `display: swap`, size-adjusted fallback), single family (inherited) |
| Theme | Light only. Checked `app/globals.css`: it defines no `prefers-color-scheme` or dark token set, so Phase 4 ships no dark mode and sets nothing that implies one (YAGNI, `adr-004-scope`). |
| New dependencies | none. No calendar, chart, date, table or form library. Charts are CSS/`<progress>`/inline SVG. |
| Freeze | `components/ui/**`, `app/globals.css`, `app/layout.tsx`, `lib/**` are not edited by wave agents. Shared additions are Wave 0 items (list at the end). Role-specific components live in the role's own `_components/` folder. Role-local CSS uses Tailwind utilities with arbitrary values on existing token variables only. |

---

## Spacing Scale

Inherited (multiples of 4): xs 4, sm 8, md 16, lg 24, xl 32, 2xl 48, 3xl 64. 12px is allowed only for icon-tight internal gaps (icon-to-label inside a control), nowhere else. Every margin, padding and gap in Phase 4 is on this scale (rule 10).

Rhythm (proximity = relationship): related items <= 16px apart; unrelated groups >= 32px apart (>= 2x the in-group gap). Section gap fluid between endpoints that sit on the scale: `clamp(24px, 1rem + 2vw, 48px)`. Grid gap: `clamp(16px, 2vw, 24px)`. Page side padding: `clamp(16px, 4vw, 24px)` (shell provides it).

Targets: every interactive element is `min-h-11 min-w-11` (44px) with >= 8px between neighbours, including filter chips, radio/checkbox rows (whole row is the hit area), step-rail items, calendar cells, row actions, pane list items and the text-size buttons. On `@media (pointer: coarse)` row gaps between actions rise to 16px.

---

## Typography

Inherited: 4 sizes, 2 weights (400, 600). Body 16px/1.5, Label 14px/1.4 (600), Heading 20px/1.2 (600), Display 28px/1.2 (600). Left-aligned only, never justified (rule 7). Prose (event descriptions, notices) max width 65ch (rule 8). No text under 14px; inputs 16px (no mobile zoom).

Type is fixed at the inherited scale (rule 3, PARTIAL by design): the A-/A/A+ control is the only scaler, and a second fluid scaler would fight it. All sizes are `rem`, so 200% zoom also works. No `clamp()` on type.

| Role | Declaration | Result at 360 / 1440 (A = 16px root) |
|------|-------------|------------------------------------|
| Display (page `<h1>` and key numerals) | 1.75rem fixed (28px), weight 600, line-height 1.2, tracking -0.01em; key numerals add `font-variant-numeric: tabular-nums` | 28px |
| Heading | 1.25rem fixed (20px) | 20px |
| Body, Label | fixed 1rem / 0.875rem | 16px / 14px |

Key numerals ("38 / 60", "1 overdue", dashboard numbers) use Display with `tabular-nums`. They win the squint test by isolation (>= 48px of space around the numeral block) and by the bar beneath, not by a fifth size. Exactly 4 sizes and 2 weights (400, 600).

Text-spacing resilience (WCAG 1.4.12): no fixed-height text containers; use `min-h-*`, never `h-*`, around text. Muted text keeps the same size and uses `text-muted` (7.58:1 on white).

---

## Color

Split: 60% dominant (`#FFFFFF`/`#F8FAFC`), 30% secondary (`#F1F5F9` panels, cards, nav), 10% accent (`#3730A3`, scarce). Inherited tokens: Dominant `#FFFFFF`/`#F8FAFC`, Secondary `#F1F5F9`, Accent `#3730A3`, Destructive `#B91C1C`, Ink `#0F172A`, Muted `#475569`, UI border `#64748B`, Card border `#CBD5E1`. Components reference token variables only (`bg-panel`, `text-ink`, ...), never hex literals (rule 12, see checklist for the OKLCH note).

Accent reserved for in Phase 4 (nothing else):
1. The one primary button per view (rule 5): "New event", "Save and continue", "Review and submit", "Register", "Join waitlist", "Approve", "Apply filters", "Save venue", "Confirm {verb}" inside ConfirmDialog.
2. Active nav item (left bar + text + `aria-current="page"`), current step in the step rail (bar + number ring + `aria-current="step"`), the selected venue radio row (2px border + `Check`), selected pane item (left bar).
3. Focus ring (3px, 9.93:1).
4. Inline text links.
5. Selected filter chip: 2px accent border + accent text + `Check` icon.

Never accent: statuses, calendar blocks, chart bars, stat figures, decoration, hover.

Chart ink: bars use `text-muted` colour (`#475569`) fill on a `#E2E8F0` track (contrast >= 3:1 for non-text), with the value printed as text at the end of every bar. Single hue, flat fill, no gradient, no 3D, no shadow, no legend needed because every mark is directly labelled (never hue alone).

Destructive `#B91C1C` fill only on the final confirm button for: Cancel event, Cancel registration, Return with reason.

### Status vocabulary (extends Phase 3; icon + text + colour via one `StatusBadge`)

Existing keys: draft, pending, approved, open, ongoing, completed, cancelled, full, returned.
Wave 0 adds the keys below. They reuse existing colour pairs, so no new contrast pair is introduced; shape (icon) and word separate statuses that share a colour family. Ratios re-computed with the WCAG 2.2 formula. `tests/contrast.test.ts` is extended by Wave 0 to cover the new keys.

| Group | Key | Label | Icon (lucide; Wave 0 confirms the export exists in 1.60 else nearest distinct shape) | Text/icon | Background | Ratio |
|---|---|---|---|---|---|---|
| Registration | `registered` | Registered | `BadgeCheck` | `#166534` | `#DCFCE7` | 6.49 |
| Registration | `waitlisted` | Waitlisted | `Hourglass` | `#9A3412` | `#FFEDD5` | 6.38 |
| Task | `todo` | To do | `Circle` | `#374151` | `#F3F4F6` | 9.37 |
| Task | `doing` | In progress | `CircleDot` | `#1E40AF` | `#DBEAFE` | 7.15 |
| Task | `done` | Done | `CircleCheckBig` | `#334155` | `#E2E8F0` | 8.40 |
| Task / alert | `overdue` | Overdue | `AlarmClock` | `#991B1B` | `#FEE2E2` | 6.80 |
| Alert | `clash` | Clash | `TriangleAlert` | `#991B1B` | `#FEE2E2` | 6.80 |
| Alert | `lowreg` | Low registrations | `TrendingDown` | `#78350F` | `#FEF3C7` | 8.15 |

Notes: a cancelled registration reuses `cancelled`. A full event shows `full`; a student on its waitlist shows `waitlisted`. `Clash` appears only where a real data condition exists (Admin calendar rules); never fabricate a red clash on approved data the DB makes impossible (Research pitfall 11). Every badge is paired with a plain sentence of the consequence ("22 of 60 seats left").

---

## Shared system (all roles)

### Layout system (rules 1, 2, 3, 8; breakpoints follow content)

Mobile-first: base styles are the 360px single column; every media query is `min-width`. Test widths 320 / 360 / 768 / 1024 / 1440 plus A+ and 200% zoom; zero horizontal page scroll at each (WCAG 1.4.10).

| Breakpoint | Why it exists (content reason) |
|---|---|
| base (360) | Single column, shell "Menu" disclosure, cards stacked, actions full-width stacked |
| 640 | Action buttons sit beside titles; tables stop stacking into cards; side padding 24px |
| 768 | Two-column intrinsic grids; filters stay visible instead of in a disclosure; form + summary side-by-side not yet (still stacked) |
| 1024 | Shell sidebar appears (inherited); split panes, live summary column and venue lanes become possible |
| 1440 | No new layout. Content is capped at the shell's 1152px and centred (rule 1). Extra width is whitespace on purpose, not stretched lines. |

Intrinsic grids first: card lists use `grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr))`; toolbars use `flex-wrap`. Media queries are used only for the panes that cannot be intrinsic (split pane, live summary).

Skeleton for every data region reserves the final dimensions (min-height of a row card = 96px; stat card = 120px) so no layout shift (rule 16).

### Five states on every interactive element (rule 13)

Frozen `Button`, `Input`, `Select`, `Textarea`, `ConfirmDialog` already carry these. Role-local controls (chip, step-rail item, pane item, calendar cell, row title link, table action) must match this table exactly:

| State | Treatment |
|---|---|
| default | Control surface `bg-surface`, 1px `border-ui` (`#64748B`, 4.76:1), ink text; links ink + underline |
| hover (`@media (hover: hover)` only; enhancement, never the only cue) | Surface `bg-panel`, border ink; links accent |
| focus-visible | Inherited 3px accent outline, 2px offset, never clipped (no `overflow:hidden` on ancestors of focusable items; use `overflow:clip` with padding or `outline-offset` inside scroll regions), not covered by sticky header (`scroll-padding-top: 80px` inherited) |
| active (pressed) | Surface `#E2E8F0` (the completed-badge tint), no movement; duration 0ms in, 150ms out |
| disabled | `aria-disabled="true"`, 60% opacity, text kept readable, and a visible text reason next to it ("Add a venue first"); disabled controls stay focusable so keyboard users can read the reason |

Touch/hover parity (rule 13/touch): nothing is revealed on hover only. Any tooltip-like info is a visible text line or a `<details>` toggled by click/Enter/Space. No drag-only, no long-press.

### Motion (rule 15)

Only these transitions exist: colour/border/background 150ms ease-out; `<details>` open, pane switch and skeleton-to-content fade `opacity` 200ms ease-out (enter) / 150ms ease-in (exit); dialog inherited. Animate only `opacity` and `transform`; never `width/height/top/left`. Nothing loops except skeleton pulse (opacity 0.6 to 1, 1.2s) which is removed under `prefers-reduced-motion: reduce` (global reset in `globals.css` already sets `transition: none; animation: none`). Nothing flashes. No autoplay.

### Landmarks, titles, keyboard (rule 18, 20 partial)

Each page: skip link (shell), `<header>`, `<nav aria-label="Main">`, `<main id="main">`, exactly one `<h1>`, no skipped heading levels (page h1 -> section h2 -> item h3), an `<aside aria-label="...">` only for the Coordinator live summary and the Admin list pane. Each route exports a metadata `title` of the form "{Screen} - College Events" (<= 60 characters). Tab order = DOM order = visual order; no positive `tabindex`; no CSS `order` that desyncs focus. `Esc` closes the dialog and the shell menu. No keyboard traps except the modal dialog.

### Forms (rule 19)

Single column. Every field: persistent visible `<label>` (never placeholder-as-label), the right `type` and `inputmode` (`number` + `inputmode="numeric"` for seats/quantity, `date`, `time`, `search` + `enterkeyhint="search"`), `autocomplete="off"` on domain fields, fields >= 44px tall and >= 16px text, optional fields marked "(optional)" and required ones carrying the word "required" in the label. Validate on blur: message adjacent (8 to 16px) to the field with `CircleAlert` icon + sentence naming problem and fix, `aria-invalid` + `aria-describedby`, input value preserved. On submit with errors: a summary error `Alert` at the top with links to each field takes focus. Submit buttons are never silently disabled: use `aria-disabled` plus a visible reason. Fewest fields: every date, department and seat count is prefilled from the template, profile or last value (what the system already knows).

Dates and times: one fixed display zone constant (Wave 0, default Asia/Kolkata), format "Fri 20 Feb 2026, 17:00 to 18:30" (24h), native `date`/`time` inputs with helper "Times are in college local time."; never show ISO strings.

### Loading, empty, error (rule 14)

Every data region has three designed states:
- Loading: skeleton in the final shape (`loading.tsx` per route; `bg-panel` blocks), visually hidden "Loading {screen}...", `aria-busy="true"` on `<main>`. Buttons that run an action show "Working..." (Button `loading`), never a bare spinner.
- Empty: heading + one sentence + the one next action as the primary button (or link) of that view.
- Error: `error.tsx` per role: error `Alert` "We could not load this page" / "Your work is safe. Check your connection and try again." + "Try again" (secondary). Inline action errors show `DomainError.message` verbatim; anything else shows "Something went wrong on our side. Please try again in a moment." Never codes, trigger names or SQL.

### Review & Confirm (X2) via frozen `ConfirmDialog`

Trigger is a normal button. Title default "Review before you {verb}". `summary` is a `<dl>` (what, when, where); `consequence` is 1 to 2 plain sentences: what happens, who is told, whether it can be undone. "Go back" is first in DOM and takes initial focus; "Confirm {verb}" is primary (destructive red for cancels/returns). Busy label "Working...". After success: dialog closes, focus moves to the success `Alert` (`role="status"`, `tabIndex=-1`) stating the result and the new `StatusBadge`; on failure an error `Alert` (`role="alert"`) with `DomainError.message`; the page is revalidated so a stale action disappears (X5). Marking a task done and draft autosave are reversible and do NOT use R&C; "Mark done" offers Undo.

| Action | Verb | Summary | Consequence | Confirm button | Success Alert (title / body) |
|---|---|---|---|---|---|
| Submit event (COORD-05) | submit | Event, date and time, venue, seats, resources, number of tasks | "The Admin is asked to approve this event. You can still edit it until they decide." | Confirm submit | "Sent for approval" / "We will tell you here when the Admin decides. Status is now Pending approval." |
| Open registration | open registration | Event, date and time, venue | "Students can now see and register for this event." | Confirm open registration | "Registration is open" / "Status is now Open." |
| Start / Complete event | start the event / complete the event | Event, date and time | "The event is marked as happening now." / "The event is marked completed and its venue and resources are released." | Confirm start / Confirm complete | "Event started" / "Status is now Ongoing." ; "Event completed" / "Venue and resources are released." |
| Cancel event (COORD-07) | cancel this event | Event, date, venue, number registered | "The event is cancelled, the venue and resources are released, and {n} registrants are told in the app. This cannot be undone." | Confirm cancel event | "Event cancelled" / "{n} registrants have been notified." |
| Save changes to a live event (COORD-07) | save changes | "Before / After" pairs for each changed field | "Registrants are told about the change in the app. Venue and time checks run again." | Confirm changes | "Changes saved" / "{n} registrants have been notified." |
| Register (STUD-03) | register | Event, date and time, venue | "You get a seat. You can cancel later." | Confirm register | "You are registered" / "See it under My events." |
| Join waitlist | join the waitlist | Event, date and time, venue | "You will be added to the waitlist. We will tell you in the app if a seat opens. You can leave any time." | Confirm waitlist | "You are on the waitlist" / "We will tell you in the app if a seat opens." |
| Cancel registration | cancel your registration | Event, date and time | "Your seat is released and the next person on the waitlist is offered it." | Confirm cancel registration | "Registration cancelled" / "Your seat has been released." |
| Approve (ADMIN-01) | approve | Event, date and time, venue, seats, resources, clash-check result | "The venue is booked for this time and the coordinator is told in the app." | Confirm approve | "Approved" / "The coordinator has been notified." |
| Return with reason | return | Event, date and time, the reason (read-only echo) | "The coordinator is told your reason in the app and can fix and resubmit." | Confirm return | "Returned" / "The coordinator has been notified with your reason." |

### Calendar primitive (duplicated inside each role folder, no shared module)

Agenda is the default and the only view below 768px: events grouped under `<h3>` day headings, each entry = time, title link, venue, `StatusBadge`. Month/week grids are a second view behind a two-button toggle ("Agenda" / "Month", `aria-pressed`, 44px). Grid cells are real buttons/links >= 44x44px, `aria-label` such as "Fri 20 February, 2 events"; event days carry the count as a number plus the text "2 events" (not a dot alone); today has a 2px ink border plus visually hidden "Today". Month navigation is "Previous month" / "Next month" buttons around an `<h2 aria-live="polite">`.

### Navigation (inherited shell; each role supplies items)

| Role | Items (icon, route) |
|---|---|
| Coordinator | My Events (`CalendarCheck`, `/coordinator`), Calendar (`CalendarDays`, `/coordinator/calendar`), Tasks (`ListChecks`, `/coordinator/tasks`), Notifications (`Bell`, `/coordinator/notifications`, count in the label text) |
| Student | Discover (`Search`, `/student`), My Events (`Ticket`, `/student/mine`), My Tasks (`ListChecks`, `/student/tasks`, organizers only), Alerts (`Bell`, `/student/alerts`, count in the label text) |
| Admin | Dashboard (`LayoutDashboard`, `/admin`), Approvals (`ShieldCheck`, `/admin/approvals`, pending count in the label), Calendar (`CalendarDays`, `/admin/calendar`), Venues and Resources (`Building2`, `/admin/catalog`) |

All <= 7 items, text label always visible (no icon-only nav). Deviations from wireframes, this contract wins: Student has no bottom tab bar (frozen shell only offers sidebar + Menu); Admin has no Reports/Notifications items (Phase 5 / no requirement; no dead links); Admin Dashboard is an explicit nav item. Student My Tasks shows only if Wave 0 exposes `isOrganizer`; otherwise it shows for all students with the empty state below.

---

## Coordinator interface (4a): guided builder + one-glance monitor

Goal: get an event approved and running with the fewest steps, and never be surprised at Review & Confirm. Routes `app/(coordinator)/coordinator/**`. Role-local components in `_components/`: `StepRail`, `LiveSummary`, `VenueList`, `ResourceRows`, `TaskTable`, `GlanceStrip`, `AutosaveStatus`.

### CO-01 My Events (home)

Focal point: the "New event" primary button, then the first event that needs you (returned/draft). Squint test: one filled indigo button; event cards read as equal grey blocks; the only other emphasis is badge icons.
- `<h1>` "My Events"; subtitle (muted) "{n} events, {m} need you". Primary Button "New event". Filter as checkbox-chips (see Student chips pattern): "Needs attention", "Drafts", "Past".
- Event Card = title link (Heading), `StatusBadge`, "Fri 12 Mar 2026, 10:00 · Seminar Hall", a compact seat meter (`<progress>` 8px high + text "38 of 60 seats"), an `overdue` badge only when overdue tasks exist, a `lowreg` badge when applicable (rule: open, under 25% of capacity, within 7 days of start; constants in one file with a unit test). Row action "Continue" (secondary, drafts/returned) or "View".
- A returned event puts a warning Alert above the list: "{title} was returned: {reason}" + "Fix it".
- Empty: "No events yet" / "Start one from a template and it saves as you go." + primary "New event".

| 360 | 768 | 1024 | 1440 |
|---|---|---|---|
| Single column cards, actions full-width under meta | Two-column auto-fit card grid | Sidebar + two columns | Same as 1024, content capped 1152 |

### CO-02..CO-06 Guided event builder (COORD-01..05)

Layout: a step rail on top, the step form in the main column, and a persistent Live Summary beside it.
- Step rail (`<nav aria-label="Event steps"><ol>`): 4 steps: Details, Venue and time, Resources, Tasks. Each item is a link (44px) with a number in a ring, the name and a state word: "Done", "Current", "To do", "Needs attention" (with `TriangleAlert`). Current = accent bar + `aria-current="step"`. Steps are reachable in any order after Details (non-linear for edits); state is text + icon, never colour only. Below 768 the rail collapses to one line "Step 2 of 4: Venue and time" plus a `<progress>` and a "Steps" `<details>` listing all four.
- Live Summary (`<aside aria-label="Event summary">`), rows of icon + label + value + state in text. It is rendered from the saved draft after each save and recomputed from the current inputs on blur:
  1. What: title, seats expected.
  2. When: "Fri 12 Mar 2026, 10:00 to 12:00" or "Not set".
  3. Venue: name + capacity + state: `CircleCheck` "Free for this time" or `clash` "Booked by {event}, 09:00 to 13:00" or "Too small: seats 40, you need 60" or "Not chosen".
  4. Resources: "Projector x1, Microphone x2" with "1 short" `clash`-styled line if short, or "None requested".
  5. Tasks: "3 tasks, earliest due 05 Mar 2026" + `overdue` badge if any due date is in the past.
  6. Readiness line (bold): "Ready to submit" with `CircleCheck`, or "Missing: venue, date" with links to those steps. Readiness changes are announced through one `aria-live="polite"` region; the rest of the panel is not live (avoid chatter).
  The summary contains NO primary button. Primary stays unique per view (rule 5).
- Placement: >= 1024: two columns, form `minmax(0, 1fr)` and summary 320px, `position: sticky; top: 80px` (never over the header; focus not obscured). 640 to 1023: summary above the form as a `<details open>` card ("Summary") in a closed-by-default variant below 640 whose `<summary>` line shows the readiness and venue state in text ("Room 204 free, 60 seats, ready"). So the user is never surprised at the end.
- Step 1 Details: Title (required, prefilled "{Template} - {Department}"), Department (read-only text "Computer Science (from your profile)"), Expected seats (numeric, prefilled from template), Description (optional, max 65ch wide Textarea).
- Step 0 `/coordinator/new`: radio group "Start from" (Seminar, Workshop, Fest, Blank), each row 56px with one-line description; primary "Start". Creates the draft row immediately (Wave 0 `createDraft`) and redirects to `/coordinator/{id}?step=1`.
- Step 2 Venue and time: Start date, Start time, End time (end defaults from template duration); the venue list renders for that slot on "Show free venues" (GET) and on blur. Two groups. "Free for your slot": radio rows "Seminar Hall, capacity 120, fits your 60 seats" (selected row: 2px accent border + `Check`). "Not available": non-selectable rows, plain text with reason (`clash` badge + "Booked by Annual Day, 09:00 to 13:00"; "Capacity 40 is below your 60 seats"; "Not in use"). Unavailable venues are never hidden and never merely greyed.
- Step 3 Resources: checkbox rows from the template (pre-ticked) with a quantity field; availability as text ("1 free", "All booked: cannot be requested"). Over-limit input shows RESOURCE_SHORT message under the row.
- Step 4 Tasks: table (cards below 640) Task, Assigned to, Due, Status badge. Template tasks prefilled; owner `<select>` of students; `<input type="date">`; inline "Add task" Field group (not a modal). Overdue = due < today and not Done.
- Footer of each step: "Go back" (secondary) and the one primary "Save and continue" (last step: "Review and submit", which opens the ConfirmDialog; it is `aria-disabled` with a visible reason if venue/date/seats are missing). "Save and close" is a text link. Autosave: field blur posts `saveDraft` (debounced >= 800ms); `AutosaveStatus` shows `Check` "Saved just now" / "Saving..." / error "Not saved. Check your connection. Your last saved version is kept." in an `aria-live="polite"` region next to the footer. Closing the tab keeps the draft (DB row; no localStorage).
- Wizard state is in the URL (`?step=`), so back/forward and refresh work.

| 360 | 768 | 1024 | 1440 |
|---|---|---|---|
| Rail as "Step n of 4" + progress; summary is a `<details>` under it; form single column; footer buttons stacked, primary on top | Rail horizontal 4 items; summary `<details open>` above form; form single column, max 65ch | Form left, sticky Live Summary right (320px); rail horizontal above both | Same as 1024, capped 1152 |

Focal point: the form field group of the current step; the Live Summary Readiness line is the second anchor. Squint test: one indigo "Save and continue", the rail's current step bar, and the summary panel as a quiet panel-grey card.

### CO-07 Event monitor (COORD-05, 06, 07)

`/coordinator/{id}` for non-draft events. Focal point: the registrations numeral. Squint test: a large "38 / 60" with its bar is the biggest thing on the page; everything else is secondary cards.
- Header: `<h1>` title, `StatusBadge`, one-sentence state ("Sent 2 days ago. The Admin has not decided yet." / returned: Alert with reason first).
- Glance strip (3 cards in an intrinsic grid, `GlanceStrip`): (1) Registrations: Display numeral "38 / 60", `<progress>` 12px high with text "63% full", "4 on the waitlist" (counts only, never names), `lowreg` badge if applicable; (2) Tasks: Display numeral "1 overdue" with `overdue` badge, text "5 tasks, 3 done"; (3) Status: large `StatusBadge` and the next step in words ("Next: wait for approval" / "Next: open registration").
- Sections as Cards below: Tasks table, Resources and venue (read-only), Timeline text list (Submitted, Approved, Opened, with dates).
- One primary per state, rendered only when it applies (no greyed mystery buttons): Approved -> "Open registration"; Open -> "Start event"; Ongoing -> "Complete event"; Pending -> none (secondary "Edit"). Always-available secondaries: "Edit", "Cancel event" (R&C destructive). Completed: read-only recap "Registered 52 of 60. Tasks done 5 of 5. Venue and resources released." + "Back to My Events".

| 360 | 768 | 1024 | 1440 |
|---|---|---|---|
| Glance cards stacked, numeral first | 3 cards in a row only if they fit 18rem each, else 2+1 (auto-fit) | Same, with Tasks table full width below | capped 1152 |

### Secondary screens
- Calendar: shared Calendar primitive over own events; read-only. Empty: "No events in this month" / "Pick another month or start a new event."
- Tasks: all tasks across own events as a table grouped "Overdue" first, filter chip "Only overdue". Empty: "No tasks yet" / "Add tasks on an event page and they show up here."
- Notifications: list from `listNotifications`, kind icon + text + date; "New" word on recent. Empty: "Nothing new" / "Changes to your events will show up here."

### Coordinator copy
| Element | Copy |
|---|---|
| Primary CTA | "New event" (home), "Save and continue" (steps), "Review and submit" (last step), "Open registration" etc. (monitor) |
| Empty (venues for slot) | "No venue is free for this time" / "Try another time or date. Busy venues are listed below with the reason." |
| Error (load) | "We could not load your events. Your work is safe. Check your connection and try again." |
| Error (clash) | "That venue is already booked for part of this time. Pick another venue or time." (DomainError, verbatim) |
| Error (field) | "Enter a title, for example Quiz Night." / "Enter the number of seats as a whole number, at least 1." / "Choose an end time after the start time." / "Choose a due date." |
| Disabled reason | "Add a venue, date and seats before you submit." with links to the missing steps |

Primary-flow keyboard path (checked in the browser pass): New event -> Tab to Workshop radio -> Start -> title/seats -> Save and continue -> date/time -> Show free venues -> arrow to venue radio -> Save and continue -> tick Projector -> Save and continue -> Add task (Karan, due date) -> Review and submit -> Confirm submit -> Pending approval Alert focused.

---

## Student interface (4b): discovery-first, "Am I registered?" first

Goal: find an event and be sure of a seat in as few taps as possible. Routes `app/(student)/student/**`. Role-local: `RegistrationStrip`, `FilterChips`, `EventCard`, `RegisterFlow`, `TaskCard`. Designed at 360px first.

### ST-01 Discover (STUD-01, STUD-04 strip)

Focal point: the first event card's what/when/where/seats. Squint test: at top a quiet panel-grey strip, then white cards each with one badge and one button; only one accent-filled button reads loudest per card region, so exactly one primary is visible per viewport (the first card's action; other card actions render as secondary except the one in the nearest card, see below).
- Primary-action rule on lists: because a list repeats actions, only the first actionable card in DOM order uses the primary variant; the remaining cards use secondary ("Register"/"Join waitlist" in secondary style). The detail page always uses a single primary. (Keeps rule 5: one primary per screenful.)
- `<h1>` "Discover events".
- "Am I registered?" strip (`RegistrationStrip`, `<section aria-labelledby>` heading "Your next events"), at the very top: a horizontal row (auto-fit minmax(min(100%, 16rem), 1fr), max 3) of the student's next upcoming items, each a compact card: title link, "Fri 20 Feb 2026, 17:00", `registered` or `waitlisted` badge ("Waitlisted, number 4"), and a "Cancel registration" link-button (44px) with a visually hidden event title so its accessible name is "Cancel registration for {title}". If none: one-line "You are not registered for anything yet. Pick an event below." A link "See all my events" -> My events. It answers the question with text and badges, no table. The strip also marks "Today" / "Tomorrow" words for nearest events.
- Search + filter chips (GET form `role="search"`): "Search events" input (type search, visible label). Chips are native checkboxes styled as chips (visible `Check` icon when on, accent border 2px, 44px tall, 8px gap, wrap): "This week" (on by default, the system knows today), "Open only", "Has seats", plus Select controls "Type", "Venue", "Department" (department prefilled from the profile) and date "From/To" inside a `<details>` "More filters" below 768 (always visible from 768). "Apply filters" (secondary here because the cards own the page's primary), "Clear filters" link-button. A text echo lists active filters ("Showing: this week, Computer Science. 12 events found.") in an `aria-live="polite"` region.
- `EventCard` read order (target < 3 s scan; unmeasured): title (Heading) -> badge -> "Fri 20 Feb 2026, 17:00 to 18:30" -> venue name -> "22 seats left" (or "0 seats left, waitlist open") -> action. Laid out as a 2-line meta block, never a table. Cancelled events appear only if the student was registered; they show the `cancelled` badge and no action.
- Empty: "No events match" / "Clear a filter to see more." + "Clear filters". Error: "We could not load events. Check your connection and try again." + "Try again". Loading: 3 card skeletons (96px).

| 360 | 768 | 1024 | 1440 |
|---|---|---|---|
| Strip stacked, filters in "More filters" `<details>` except search + chips, cards one column, actions full-width | Strip up to 3 across, filters inline, cards two columns | Sidebar + two columns | capped 1152, still two columns (cards would exceed 75ch otherwise) |

### ST-02 Event detail (STUD-02)
Focal point: the title + badge + the single primary action. Squint test: title, then one indigo button under the facts.
`<h1>` title + `StatusBadge`. Definition list (max 65ch): When, Where (venue name and building), Seats ("22 of 60 seats left"), Hosted by, About. One primary under the list: "Register"; full -> `full` badge, text "You would be number {n} on the waitlist" and primary "Join waitlist"; already registered -> `registered` badge and secondary "Cancel registration" (no Register button, X5); waitlisted -> `waitlisted` badge, "You are number {n} on the waitlist", secondary "Leave waitlist". Back link "Back to Discover" (44px). No sticky bottom bar (it would cover content at A+).

### ST-03 Register flow (STUD-03)
ConfirmDialog from the shared table. Waitlist position only if known. Errors verbatim: "This event is full. You can join the waitlist instead." (button revalidates to Join waitlist), "You are already registered for this event.", BAD_STATE "This can't be done at the event's current stage. Refresh and try again." After success the Alert includes a link "View my events". Overlap-with-another-registration blocking is not a Phase 4 requirement and is not built.

### ST-04 My events (STUD-04)
`/student/mine`. Focal point: the first "Coming up" card. Squint test: two stacked groups, badges as the only colour.
`<h1>` "My events". Calendar primitive on top (Agenda default; Month toggle) marking registered dates, then "Coming up" and "Past and cancelled" sections of cards: title link, badge (`registered`/`waitlisted`/`cancelled`/`completed`), when/where, secondary "Cancel registration" (upcoming only). Reminder Alert (info) when a registration is within 2 days: "Reminder: {title} is tomorrow at 17:00, {venue}." Empty: "You have not registered for anything yet" / "Find an event and register in two taps." + primary "Find events".

### ST-05 My tasks (STUD-05, organizers)
`/student/tasks`. Focal point: the most overdue task. Squint test: red-family `overdue` badge on top card is the only warm mark.
`<h1>` "My tasks". `TaskCard`: task title, event link, "Due 08 Mar 2026", badge (`todo`/`doing`/`done`/`overdue`), secondary "Mark done" (done tasks: secondary "Mark as to do"). Overdue first, then by due date. After Mark done: success Alert "Marked done" with "Undo". Empty: "You have no tasks" / "Tasks appear here when a coordinator assigns you one." A non-organizer opening the URL sees the same empty state.

### ST-06 Alerts (STUD-04)
`/student/alerts`. `<h1>` "Alerts". List: kind icon + text + date; "New" word on notices from the last 7 days (not bold alone). No mark-read, no preferences (Phase 5). Empty: "Nothing new" / "Reminders and changes to your events will show up here." In-app only; no email/SMS wording.

### Student copy
| Element | Copy |
|---|---|
| Primary CTA | "Register" / "Join waitlist" |
| Empty | "No events match" / "Clear a filter to see more." |
| Error (load) | "We could not load events. Check your connection and try again." |
| Loading | "Loading events..." |
| Destructive | Cancel registration (R&C table) |

Keyboard path: Discover -> Tab to search -> type -> Enter -> Tab to first card action -> Enter -> dialog (focus "Go back") -> Tab -> "Confirm register" -> Enter -> success Alert focused -> strip now shows `Registered`. Full-event path ends on `Waitlisted`.

---

## Admin interface (4c): triage-first

Goal: make approval decisions fast and keep venues/resources conflict-free. Routes `app/(admin)/admin/**`. Role-local: `PaneSwitch` (client, reads path), `QueueList`, `ClashCheck`, `VenueLanes`, `BarList`, `CatalogForm`.

### AD-01 Dashboard (ADMIN-04)

Focal point: the pending-approvals numeral and its single primary button. Squint test: one big number with an indigo button; three equal quiet number cards; two flat grey bar lists.
- `<h1>` "Dashboard". At most 4 headline numbers, in this order, as Display numeral + Label (intrinsic grid, the first spans 2 columns >= 768; emphasis by isolation, >= 48px space around it, and its button, no accent border):
  1. "Waiting for your decision" (pending count) + the one primary button "Review approvals" (when 0: "Nothing needs your decision" / "New submissions will appear here." and no button, so the page's primary disappears honestly).
  2. "Events this month".
  3. "Open for registration".
  4. "Venue use this month" (overall utilisation %, text "of bookable hours").
- Charts (honest, high data-ink, no 3D, no gradients, no pie): two `BarList` blocks, each `<section>` with `<h2>` and a table-equivalent `<ul>`: "Venue use" (one horizontal bar per venue, label left, bar, "70%" and "42 of 60 hours" at the end) and "Events by department" (bar per department, count at the end). Bars start at zero on a flat track, all one hue (`#475569` on `#E2E8F0`), direct value labels, sorted descending, no axis ticks needed. Implemented as `<progress>`-like divs with `role="img"`-free structure: the text values are the accessible content. Formula note (muted): "Booked hours divided by 12 bookable hours a day" (Phase 4 default, stated on screen).
- Attention list: `lowreg` / `overdue` badges with link sentences ("Photo Walk has low registrations", "2 tasks are overdue"). Empty: "Nothing needs attention."
- Error: "We could not load the dashboard numbers. Your data is safe. Try again in a moment." + "Try again". Loading: 4 stat skeletons (120px) + 2 bar-list skeletons.

| 360 | 768 | 1024 | 1440 |
|---|---|---|---|
| Single column: decision card, then 3 numbers stacked, bar lists | Decision card spans full row; 3 numbers in a row; bar lists in two columns | Sidebar + same as 768 | capped 1152 |

### AD-02/AD-03 Approvals: split-pane triage (ADMIN-01)

Focal point: the Approve/Return decision area in the detail pane (selected item is accent-barred in the list). Squint test: list on the left is plain grey rows with amber badges; right pane has one indigo "Approve".
- Layout >= 1024: two panes inside `<main>`: left `<aside aria-label="Approval queue">` (width `clamp(280px, 30%, 360px)`, own scroll region `max-height: calc(100dvh - 128px)`, `tabIndex=0`, `overflow-y: auto`) and right the detail. The queue is soonest event first; each `QueueList` item is a link (44px+): title, date, venue, department, `pending` badge; selected = accent left bar + `aria-current="true"`. Opening the page with no selection auto-selects nothing; the right pane shows an empty state "Choose an event to review" (hidden below 1024).
- Layout < 1024: the queue is a full-width list (the page `/admin/approvals`); choosing an item navigates to `/admin/approvals/{id}`, which shows the detail full-width with "Back to approvals" (44px) and hides the queue (`PaneSwitch`).
- URL is the state (`/admin/approvals/{id}`); next/previous item links ("Next waiting event") at the foot of the decision card speed up triage: after a decision focus goes to the success Alert, which has the primary "Next waiting event" link-button if any remain.
- Detail pane order (reading order = tab order): `<h1>` title + `pending` badge; facts `<dl>` (When, Where with capacity, Seats, Department, Coordinator); ClashCheck; Resources list; Decision card.
  - ClashCheck (Heading "Clash check"): pass = `CircleCheck` + "No clash. {venue} is free for this time and seats {seats} fit its capacity {cap}." Fail = `clash` badge + sentence naming the cause ("Not enough Projectors are free for this time: 1 free, 2 requested." / "Seats 80 exceed capacity 70."). Fail hides "Approve" and replaces it with the text "Fix the conflict or return the event." (DB also blocks; UI prevents first, X5). Computed from `resourceAvailable`, `freeVenues`, capacity; do not invent clashes the DB cannot hold.
  - Resources: rows "Projector x1, 1 free" with a check or `clash` icon + text.
  - Decision card: primary "Approve", secondary "Return with reason". "Return with reason" reveals a required Textarea "Reason for returning (required)" (helper "Say what the coordinator needs to fix."; on blur empty: "Add a short reason so the coordinator knows what to fix."). Each opens the R&C dialog (rows in the shared table).
- Error: "We could not save your decision. Nothing was changed. Try again."
- Empty (queue): "No events are waiting" / "You are all caught up." Loading: 4 list-row skeletons + a detail skeleton.

| 360 | 768 | 1024 | 1440 |
|---|---|---|---|
| Queue list full width; detail is its own page with Back link | Same as 360 but facts in two columns | Split pane: queue 30% + detail | Split pane capped at 1152 inside main |

### AD-04 Calendar with venue lanes (ADMIN-02)

Focal point: any `clash` marker; with none, the "No conflicts this month" line. Squint test: venue names down the left, a few quiet badge blocks, and red-family blocks only where a real conflict exists.
- `<h1>` "Calendar". Month stepper (Previous/Next buttons around `<h2 aria-live="polite">`); view toggle "Week lanes" / "Agenda".
- Week lanes (>= 768): a real `<table>` with caption "Bookings by venue, week of {date}": rows = venues (lanes, row header), columns = the 7 days. Each cell lists booking blocks (time, title link, `StatusBadge` word + icon). Conflict cells get `clash` badge + sentence "Overlaps with {other} in {venue}" ONLY for real data conditions: overlapping bookings where at least one is not an active-booking status (draft/returned) as returned by `listBookings`, or a future event on a venue that is not in use ("Venue is not in use"). Cell blocks are 44px+ links. The table scrolls horizontally inside a `role="region"` labelled container with `tabIndex=0` only between 768 and 1023; from 1024 it fits 7 columns of >= 112px.
- Agenda (default < 768, selectable above): grouped by day with the same entries.
- When no conflicts: info Alert "No conflicts this month." Legend lists each status as icon + word. Empty: "No events this month" / "Pick another month."

| 360 | 768 | 1024 | 1440 |
|---|---|---|---|
| Agenda only | Week lanes table in a scroll region (toggle available) | Week lanes fit, no scroll | capped 1152, lanes keep >= 112px columns |

### AD-05 Venues and resources (ADMIN-03)

Focal point: the table whose row is being edited. Squint test: two plain tables, one indigo "Save venue" only while a form is open, otherwise secondary "Add venue".
- `<h1>` "Venues and resources". Two sections, each a real `<table>` with `<caption>` and `th scope` (stacked cards < 640): Venues (Name, Capacity, In use [`Check` "Yes" / `X` "No" text + icon], "Edit"), Resources (Name, Total, Free today, In use, "Edit"). "Add venue" / "Add resource" are secondary buttons opening an inline Card form (not a modal): Name (required), Capacity/Total (required, numeric, whole >= 1), checkbox "In use (can be booked)". Primary in the form: "Save venue" / "Save resource"; secondary "Go back".
- Retire (untick In use) is not delete. When future events use it a warning Alert shows before save: "{n} future events use this venue. They keep their booking, but new events cannot pick it." (reversible, so no R&C). Lowering Total below the amount reserved: "{n} are already reserved for events. Choose {n} or more." After save: success Alert "Venue saved". Validate on blur with inline errors: "Enter a name for the venue." / "Enter the capacity as a whole number, at least 1."
- Empty: "No venues yet" / "Add the first venue so coordinators can book it." (primary "Add venue" because it is the view's only action).

| 360 | 768 | 1024 | 1440 |
|---|---|---|---|
| Tables become stacked cards | Tables, inline form full width | Tables side by side only if both fit 28rem, else stacked vertically | capped 1152 |

### Admin copy
| Element | Copy |
|---|---|
| Primary CTA | "Review approvals", "Approve", "Save venue" / "Save resource" |
| Empty | "Nothing needs your decision" / "New submissions will appear here."; "No events are waiting" / "You are all caught up." |
| Error | "We could not load the dashboard numbers. Your data is safe. Try again in a moment." ; "We could not save your decision. Nothing was changed. Try again." |
| Destructive | Return with reason (R&C table) |

Keyboard path: Approvals nav -> Tab into queue -> arrow-free Tab to an item -> Enter -> detail loads -> Tab through facts -> Approve -> Enter -> dialog (focus "Go back") -> "Confirm approve" -> success Alert focused with "Next waiting event". Return: "Return with reason" -> Textarea focused -> type -> Enter -> dialog -> "Confirm return".

---

## Pre-emit checklist: web principles (20 rules) mapped to screens

PASS = the contract specifies it; the executor and verifier confirm it in the browser pass (results come from the team). N/A states why.

| # | Rule | Status | Where it applies / how |
|---|---|---|---|
| 1 | Mobile-first, fluid, capped measure | PASS | All screens; base 360 single column, `min-width` queries only, shell cap 1152, prose 65ch (ST-02, CO-02 description) |
| 2 | Content-driven breakpoints | PASS | 640 / 768 / 1024 with stated reasons; tested 320, 360, 768, 1024, 1440 |
| 3 | Fluid type and space with clamp() | PARTIAL | Type is fixed on the inherited scale because A-/A/A+ is the only scaler; only section and grid gaps use clamp() (endpoints on the spacing scale) |
| 4 | Body >= 16px, targets >= 44px with >= 8px | PASS | Every screen (chips, radios, cells, queue items, rail steps) |
| 5 | One primary action per view | PASS | CO-02..06 "Save and continue"; CO-07 one state action; ST-01 first-actionable-card-in-DOM-order primary; ST-02 one; AD-01 "Review approvals"; AD-03 "Approve"; AD-05 "Save venue" / "Save resource" only inside the open form |
| 6 | The fold answers three questions | PASS (app form) | What (h1 + subtitle), who/where am I (role label + nav current), what next (the one primary); CO-01, ST-01 (strip answers "Am I registered?"), AD-01 (decision number) |
| 7 | Scan patterns, left-aligned, never justify | PASS | All text-heavy screens; informative word first in titles |
| 8 | Measure 45 to 75ch | PASS | Event descriptions, notices, dl blocks capped 65ch |
| 9 | Line-height and rhythm | PASS | Body 1.5, headings 1.2; no fixed-height text boxes |
| 10 | 8pt spacing, one scale | PASS | Phase 3 scale only; no off-scale values; fluid gaps end on scale values |
| 11 | WCAG 2.2 AA floor, never hue alone | PASS | Body ink 17.85:1 (AAA), muted 7.58:1; badges 6.38 to 9.37:1; focus 9.93:1; every status icon + word + colour; chart marks labelled |
| 12 | Semantic tokens, OKLCH | PARTIAL | Semantic CSS-variable tokens only, zero hex in components; hex values are Phase 3's and frozen, and `tests/contrast.test.ts` parses hex. OKLCH conversion is out of scope for Phase 4 (would edit `globals.css`); logged below as a post-phase option. Dark mode: not supported by existing tokens, so not specified. |
| 13 | Five states on every interactive element | PASS | Shared states table covers chip, rail step, queue item, calendar cell, row link, table action; frozen components inherit |
| 14 | Empty, loading (skeleton), error states | PASS | Every screen has all three, with human copy |
| 15 | Motion 150 to 300ms, opt-out | PASS | Motion section; transform/opacity only; reduced-motion global reset present |
| 16 | Reserve space, protect CLS | PASS | Skeletons in final dimensions; no images in Phase 4; font via `next/font` size-adjusted |
| 17 | Performance budget | PASS (by construction) | Server Components by default; client components only for dialog, autosave, chips, PaneSwitch, calendar toggle; no chart/calendar/date library; no new JS dependency. LCP/INP/CLS to be measured by the team, not asserted here |
| 18 | Landmarks, keyboard-complete, one h1 | PASS | Every screen; asides labelled; DOM order = visual order; skip link inherited |
| 19 | Forms: label, type, inline validation, fewest fields | PASS | CO-02..04, ST-01 search/filters, AD-03 reason, AD-05 forms; prefilled from template/profile |
| 20 | Meta layer | N/A (app UI) | Landing/SEO/OG/JSON-LD skipped (authenticated app). Only per-route `<title>` "{Screen} - College Events" <= 60 characters is specified |

Skipped web-principle sections (marketing): five-second hero, landing spine, CTA copy tests, social proof, pricing. Not applicable to a signed-in tool.

---

## Accessibility acceptance checklist (per role; ticked by the team in each handoff, not asserted here)

- [ ] Every interactive element >= 44x44px at A and A+, >= 8px apart.
- [ ] Primary flow completable by keyboard alone; focus ring visible and not obscured; no traps.
- [ ] One `<h1>`; headings in order; landmarks; tables with captions and `th scope`.
- [ ] Every status is icon + word + colour from the shared table; no status by colour, dot or position alone.
- [ ] Every field has a visible label, "required"/"(optional)" in words; errors inline with icon, summary Alert on submit.
- [ ] Review & Confirm on every irreversible action listed; focus on feedback after.
- [ ] A-/A/A+, 200% zoom, 320px: no clipping, no horizontal page scroll.
- [ ] Human error messages only (use `DomainError.message`).
- [ ] `prefers-reduced-motion` honoured.
- [ ] Dynamic results in polite live regions.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (not initialised) | not applicable |
| third-party | none | not applicable, no registry used |

No new runtime dependencies in Phase 4.

---

## Wave 0 items (shared; owned by the Phase 3 owner, serial, before 4a/4b/4c)

1. The eight status keys above in `STATUS_META` and `globals.css`, with contrast test coverage.
2. Shared date-format helper and display time-zone constant.
3. Domain functions listed in `04-RESEARCH.md` Gaps, including `advanceEvent` (Open registration / Start / Complete), `isOrganizer`, `listVenues`, `listBookings`, `listResources`, `listEventTasks`, `listStudents`, `createDraft`, `saveDraft`.
4. Icon export check for `BadgeCheck`, `Hourglass`, `CircleDot`, `CircleCheckBig`, `AlarmClock`, `TriangleAlert`, `TrendingDown` in `lucide-react` 1.60.
If Wave 0 is rejected, the Coordinator lifecycle buttons, draft builder, task creation and ADMIN-03 forms cannot be built; this contract does not substitute for that decision. Post-phase option (not Phase 4): convert tokens to OKLCH when `globals.css` is unfrozen.

Defaults chosen here (not research): low registrations = under 25% of capacity within 7 days of start; reminder window 2 days; utilisation basis 12 bookable hours a day; autosave debounce 800ms. Each is one constant per role, changeable without redesign.

---

## Decisions log (for planner)

| # | Decision | Reason / kb id |
|---|---|---|
| 1 | Reuse existing colour pairs for new statuses; separate by icon and word | Contrast already proven, X1 `dom-status-vocabulary` |
| 2 | Coordinator builder = step rail + persistent Live Summary with readiness line | Review & Confirm never a surprise, X2, `src-hmi-principles` |
| 3 | Student: "Am I registered?" strip above the list, chips as checkboxes in a GET form | Answers the top goal without a table; works by keyboard and without JS |
| 4 | Admin: split pane via URL state, venue lanes as a table | Triage speed; accessible table semantics |
| 5 | Primary on repeated list actions only on the first card | Rule 5, one primary per screenful |
| 6 | Charts: flat single-hue labelled bars; no pies | Rule 11 never hue alone; data-ink |
| 7 | Light only; OKLCH deferred | Tokens frozen and have no dark set |
| 8 | Counts only for registrants, never names | Privacy, Research pitfall 10 |
| 9 | Student uses shell menu, Admin nav excludes Reports | Shell frozen; scope (Phase 5) |
| 10 | Admin clash shown only for real data conditions | DB makes active clashes impossible, Research pitfall 11 |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-10-20 (Dimensions 1 and 5 carry non-blocking FLAGs)
