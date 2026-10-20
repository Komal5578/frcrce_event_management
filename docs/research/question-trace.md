---
id: doc-research-question-trace
type: research-instrument
title: Question-to-problem trace
tags: [research,trace]
confidence: assumed
sources: [dom-hmi-problems, dom-topic-brief]
summary: AI-drafted key for problems P1 to P10 and the coverage matrix linking each instrument question to the HMI problems it informs. Contains no responses.
updated: 2026-10-20
---

# Question-to-problem trace

> AI-drafted instrument. This file contains no responses, quotes or findings. Only the team may record results, and only real sessions may be marked evidence.

## Problem key

P1 to P10 are the items of `dom-hmi-problems` in the same order (P1 is item 1, P10 is item 10).

| Id | Problem (events) | Reqs | Metric | Evidence type |
|----|------------------|------|--------|---------------|
| P1 | How little interaction can creating an event take? | C1, C2 | clicks/time to submit | interview baseline |
| P2 | How does the interface make double-booking impossible and visible? | C2, A2, X5 | clash attempts that reach the DB | interview baseline; metric is measured on the built app in Phase 6, the kit only establishes today's baseline |
| P3 | Can everyone see event status at a glance? | X1 | status recognition accuracy | interview baseline |
| P4 | Is feedback clear after register/submit/approve? | S3, C5 | users who correctly state what happened | interview baseline |
| P5 | Can students understand their status without tables? | S4 | task success on "Am I registered?" | interview baseline |
| P6 | How are clashes, low registration and overdue tasks surfaced without overwhelming? | C6, A4 | time to find the problem | interview baseline |
| P7 | Can errors be detected and corrected easily? | X2 | error recovery success | interview baseline |
| P8 | Does it work across technical levels? | X3 | success by user group | interview baseline |
| P9 | Are visualisations effective, not decorative? | A4 | info-finding time | interview baseline; metric is measured on the built app in Phase 6, the kit only establishes today's baseline |
| P10 | Is vocabulary and layout consistent across roles? | X4 | heuristic score | interview baseline; metric is measured on the built app in Phase 6, the kit only establishes today's baseline |

## Coverage matrix

The [P#] tags in the instruments are the source of truth; this matrix is derived from them and docs/research/check-kit.mjs fails if they differ. Interview ids are in `interview-guide.md`; questionnaire ids are in `questionnaire.md`.

| Id | Interview questions | Questionnaire items | Note |
|----|---------------------|---------------------|------|
| P1 | Q-C03, Q-C13 | QN-C03, QN-C04, QN-C11 | Coordinator only: creating an event is a coordinator task |
| P2 | Q-C04, Q-C05, Q-S07, Q-A04, Q-A05 | QN-C05, QN-S09, QN-A06 | Baseline of how often clashes happen and how they are found today |
| P3 | Q-C06, Q-C07, Q-S03, Q-S12, Q-A02, Q-A03, Q-A04, Q-A12 | QN-C07, QN-S06, QN-S14, QN-A03, QN-A04 | Asked in all three role sections |
| P4 | Q-C06, Q-S04, Q-S05, Q-S09, Q-S12, Q-A03, Q-A09, Q-A12 | QN-C06, QN-S01, QN-S08, QN-A05 | Asked in all three role sections |
| P5 | Q-S05, Q-S06 | QN-S07 | Student only: knowing whether I am registered |
| P6 | Q-C03, Q-C05, Q-C09, Q-S09, Q-A05, Q-A06 | QN-C09, QN-S11, QN-A07, QN-A12 | Coordinators, admins, and organizers within the student section |
| P7 | Q-C08, Q-C12, Q-S07, Q-S08, Q-A08, Q-A11 | QN-C08, QN-S10, QN-S13, QN-A11 | Asked in all three role sections |
| P8 | Q-C01, Q-C02, Q-C12, Q-C14, Q-S01, Q-S02, Q-S11, Q-S13, Q-A01, Q-A11, Q-A13 | QN-C01, QN-C02, QN-S02, QN-S03, QN-S04, QN-S05, QN-A01, QN-A02 | Volunteered needs only, never a required field |
| P9 | Q-C10, Q-A07 | QN-C10, QN-A08, QN-A09 | Baseline of the summaries and charts used today |
| P10 | Q-C02, Q-C11, Q-S10, Q-A10 | QN-S12, QN-A10 | Baseline of the words used for the same thing across roles |
