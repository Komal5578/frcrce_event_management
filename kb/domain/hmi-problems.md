---
id: dom-hmi-problems
type: domain
title: HMI problems for the event system
tags: [hmi,problems,research-questions]
confidence: derived
sources: [src-hmi-problems-pattern]
summary: Event-specific versions of the ten HMI questions, each tied to a requirement and metric.
updated: 2026-10-20
---

# HMI problems (events)

1. How little interaction can creating an event take? (C1,C2) — metric: clicks/time to submit
2. How does the interface make double-booking impossible and visible? (C2,A2,X5) — metric: clash attempts that reach the DB
3. Can everyone see event status at a glance? (X1) — metric: status recognition accuracy
4. Is feedback clear after register/submit/approve? (S3,C5) — metric: users who correctly state what happened
5. Can students understand their status without tables? (S4) — metric: task success on "Am I registered?"
6. How are clashes, low registration and overdue tasks surfaced without overwhelming? (C6,A4) — metric: time to find the problem
7. Can errors be detected and corrected easily? (X2) — metric: error recovery success
8. Does it work across technical levels? (X3) — metric: success by user group
9. Are visualisations effective, not decorative? (A4) — metric: info-finding time
10. Is vocabulary and layout consistent across roles? (X4) — metric: heuristic score
