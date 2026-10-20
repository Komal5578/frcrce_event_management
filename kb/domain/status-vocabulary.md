---
id: dom-status-vocabulary
type: domain
title: Status vocabulary (single visual language)
tags: [status,consistency,design-language]
confidence: derived
sources: [src-hmi-principles,src-universal-design]
summary: Canonical event/registration/task statuses with icon, label and colour rule.
updated: 2026-10-20
---

# Status vocabulary

Rule: every status shows **icon + text label + colour**, same everywhere (consistency, perceptible information).

| Status | Meaning | Icon (suggested) | Colour family |
|---|---|---|---|
| Draft | Coordinator still editing | pencil | grey |
| Pending approval | Waiting for admin | clock | amber |
| Approved | Admin approved, not yet open | check-shield | blue |
| Open | Registration open | door-open | green |
| Full / Waitlist | At capacity | users | orange |
| Ongoing | Happening now | play-circle | teal |
| Completed | Done | check-circle | slate |
| Cancelled | Cancelled | x-circle | red |
| Returned | Sent back with reason | corner-up-left | amber |

Task: To do / In progress / Done / Overdue. Registration: Registered / Waitlisted / Cancelled. Alerts: Clash, Low registrations, Overdue.
Exact tokens and contrast ratios are fixed in `kb/design-system` during Phase 3.
