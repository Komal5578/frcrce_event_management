# Product

## Register
product (Operate mode: app UI, the visitor completes a task).

## Product
College Event Planning & Management System, working name **CampusEvent**. One centralized system where coordinators plan events, students discover and register, and the admin approves and monitors. Three role interfaces, each shaped by that role's goal (GDD): see `kb/INDEX.md`, `docs/ia/*`, `docs/wireframes/*`.

## Users
- **Coordinator (Priya, staff):** get an event approved and running in the fewest steps. Desktop-first.
- **Student (Asha):** find an event and be registered in few steps; keep track. Phone-first, bottom tab bar. An organizer flag adds a My Tasks tab.
- **Admin (Dr. Rao):** decide quickly and safely, clashes surfaced before approval. Desktop.

## Visual authority (user-pinned 2026-10-24; inspiration: deepseek.com/en/harness)
"Slate Glass": atmospheric, gradient-led, dark by default with a full light theme. Tokens live in `frontend/app/globals.css`.
- Field: deep slate-blue canvas with a fixed, slowly drifting set of soft light blooms (`body::before`, the one ambient motion). Light theme swaps to pale sky blooms on near-white.
- Surfaces: frosted glass (translucent fill, backdrop blur, faint diagonal sheen, inset top highlight). Dialogs stay opaque (`bg-surface-solid`).
- Hero panels (`.hero-bg` theme-aware, `.hero-dark` always dark): layered radial blooms over a slate (dark) or pale-sky (light) gradient.
- Accent: one ice-blue (`--ice`) for dates, avatars, current step, active tab. Primary buttons are white pills in dark, navy in light.
- Type: Montserrat 500 (`.display`, sentence case, tight) for titles, dates and countdowns; DM Sans for everything else.
- Student: phone-first, glass cards with ice date tiles, pill search and chips, circular arrow buttons, bottom tab bar with an ice pill. Coordinator and Admin: same glass system with Linear-style density (hairlines, 10-12px radius, list-first dashboards).
- Status colours always icon + text + colour. Chart primary series is ice (dark) / navy (light); not yet CVD-revalidated.

## Principles (non-negotiable)
HMI: visibility of status, recognition over recall, consistency, error prevention and recovery (Review & Confirm before irreversible actions), feedback, flexibility, accessibility (WCAG 2.2 AA, 44px targets, A-/A/A+ text size, keyboard path). Pre-fill what the system knows.

## Anti-references
Generic gradient SaaS, glassmorphism, emoji, icon-in-tinted-circle on every card, purple or purple-to-blue anywhere, eyebrow labels, big-number hero templates, lorem/placeholder data, colour-only status.

## Tone
Plain-language, human error messages, calm and confident. Motion is smooth and purposeful (page transitions, count-up, staggered lists, spring dialogs) and always honours prefers-reduced-motion.
