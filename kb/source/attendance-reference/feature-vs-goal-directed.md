---
id: src-feature-vs-goal-directed
type: source
title: Feature-driven vs goal-directed design
tags: [gdd,principle,core-idea]
confidence: source
sources: [original.md, original.pdf]
summary: The central teaching idea: the interface is a consequence of user goals, not a feature list.
updated: 2026-10-20
---

# Feature-driven vs goal-directed

- **Feature-driven:** "The system should have QR attendance, reports, dashboards, alerts."
- **Goal-directed:** "The faculty's goal is to record attendance quickly and accurately. What is the *minimum interaction* needed to achieve that goal?"

Pattern: Student goal "know status" → simple status dashboard. Faculty goal "record" → schedule-driven workflow. Admin goal "monitor" → analytical dashboard.

Rules derived:
- Don't give users a menu of dozens of functions; guide them through the real task sequence ("I want to record today's attendance").
- The system already knows context (subject, class, time, headcount) so the user never re-enters it: **goal-directed design + reduced cognitive load**.
- Don't build "just a database". Investigate the HMI problems (see `src-hmi-problems-pattern`).

Event-system translation: see `dom-how-to-think`.
