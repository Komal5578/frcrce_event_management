---
id: dom-topic-brief
type: domain
title: Topic brief: College Event Planning and Management System
tags: [topic,brief,scope]
confidence: derived
sources: [src-gdd-process]
summary: The allotted topic, scope, non-goals and success definition.
updated: 2026-10-20
---

# Topic brief

**Allotted topic (verbatim):** Managing college events involves coordination of venues, faculty coordinators, student participants, schedules, registrations, and resources. Manual coordination can lead to communication gaps and scheduling conflicts. The proposed system should provide a centralized interface for event planning, registration, task allocation, and monitoring.

**Deliverable:** a deployed working model + the 13 GDD deliverables (`src-deliverables-13`), designed with Goal-Directed Design (`src-gdd-process`) and evaluated with `src-evaluation-methods`.

**Four verbs the interface must serve:** plan · register · allocate · monitor.

**In scope:** event lifecycle, venue booking with clash prevention, resource requests, registrations with capacity/waitlist, task allocation to student organizers, in-app notifications, dashboards and reports, accessibility.

**Non-goals (YAGNI):** payments, email/SMS, native mobile apps, ticket QR scanning, calendar sync, multi-college tenancy. Attendance system is only a *reference example*, not a feature.

**Anti-goals (failure even if it works):** one generic UI for all roles; colour-only status; submitting/registering with no review step; features nobody's goal needs; invented research data presented as real.

**Success:** each role completes its primary task fast, with few errors, and knows the state of the system; measured per `src-evaluation-methods`.
