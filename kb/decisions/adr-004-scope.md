---
id: adr-004-scope
type: decision
title: ADR-004 Scope cuts (ponytail)
tags: [scope,yagni]
confidence: derived
sources: [user-chat]
summary: What we deliberately do not build, and when to add it.
updated: 2026-10-20
---

# ADR-004 Scope cuts
Not building: email/SMS (in-app notifications only), payments, QR check-in, calendar sync, native apps, multi-tenancy, vector search. i18n (Hindi/Marathi) is a stretch goal because the reference mentions language accessibility.
Add when: the team has time after Phase 6 validation, in this order: i18n, CSV/print polish, check-in.
