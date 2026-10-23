---
id: dom-status-vocabulary
type: domain
title: Status vocabulary (single visual language)
tags: [status,consistency,design-language]
confidence: derived
sources: [src-hmi-principles,src-universal-design]
summary: Canonical event/registration/task statuses with icon, label and colour rule.
updated: 2026-10-23
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

## Task
| Status | Icon (suggested) | Colour family |
|---|---|---|
| To do | circle | grey |
| In progress | loader | blue |
| Done | check-circle | green |
| Overdue | alarm-clock | red |

## Registration
| Status | Icon (suggested) | Colour family |
|---|---|---|
| Registered | ticket-check | green |
| Waitlisted | hourglass | orange |
| Cancelled | x-circle | red |

## Alert
| Alert | Icon (suggested) | Colour family |
|---|---|---|
| Clash | triangle-alert | red |
| Low registrations | trending-down | amber |
| Overdue | alarm-clock | red |

Each row shows icon + text + colour; labels are unique per table.

**DB value to display label:** registration `confirmed` shows as Registered; task `doing` shows as In progress. Pending shows as "Pending approval" (never "Submitted"); a finished task is "Done" (never "Completed", which is an event status); the in-app list is "Notifications" (never "Alerts"). Alert is a kind of notification, not the list name.

Exact tokens and contrast ratios are fixed in `kb/design-system` during Phase 3.
