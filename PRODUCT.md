# Product

## Register
product (Operate mode: app UI, the visitor completes a task).

## Product
College Event Planning & Management System, working name **CampusEvent**. One centralized system where coordinators plan events, students discover and register, and the admin approves and monitors. Three role interfaces, each shaped by that role's goal (GDD): see `kb/INDEX.md`, `docs/ia/*`, `docs/wireframes/*`.

## Users
- **Coordinator (Priya, staff):** get an event approved and running in the fewest steps. Desktop-first.
- **Student (Asha):** find an event and be registered in few steps; keep track. Phone-first, bottom tab bar. An organizer flag adds a My Tasks tab.
- **Admin (Dr. Rao):** decide quickly and safely, clashes surfaced before approval. Desktop.

## Visual authority (user-pinned, wins over any default)
The original mockup `kb/source/attendance-reference/design-model.png`: a corporate "modern campus SaaS" look.
- Dark navy sidebar (desktop roles) against a light canvas, white cards, 8-12px radius.
- Stat tiles with large coloured numbers (green / red / amber / grey), a stepper for the workflow, donut and line/bar charts, blue primary button.
- Student interface: phone-first feel, purple header band, bottom tab bar, ring for progress.
- Status colours always icon + text + colour (`dom-status-vocabulary`).

## Principles (non-negotiable)
HMI: visibility of status, recognition over recall, consistency, error prevention and recovery (Review & Confirm before irreversible actions), feedback, flexibility, accessibility (WCAG 2.2 AA, 44px targets, A-/A/A+ text size, keyboard path). Pre-fill what the system knows.

## Anti-references
Generic gradient SaaS, glassmorphism, emoji, icon-in-tinted-circle on every card, purple-to-blue hero gradients, lorem/placeholder data, colour-only status.

## Tone
Plain-language, human error messages, calm and confident. Motion is smooth and purposeful (page transitions, count-up, staggered lists, spring dialogs) and always honours prefers-reduced-motion.
