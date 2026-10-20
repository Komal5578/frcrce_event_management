---
id: doc-research-readme
type: research-instrument
title: Research kit README
tags: [research,readme]
confidence: assumed
sources: [dom-topic-brief, dom-hmi-problems]
summary: How a student team runs the AI-drafted interview guide and questionnaire, with consent, anonymity and sample size guidance (drafted, not evidence) and the results policy.
updated: 2026-10-20
---

# Research kit

> AI-drafted instrument. This file contains no responses, quotes or findings. Only the team may record results, and only real sessions may be marked evidence.

## Purpose

This folder is deliverable 1 (research instruments) for the College Event Planning and Management System (`dom-topic-brief`). It gives the team an interview guide and a questionnaire for Coordinators, Students (including Organizers) and Admins that can be run as written. Every question is tagged with one or more of the ten HMI problems P1 to P10 from `dom-hmi-problems`, so each answer feeds a known metric. Nothing here is research evidence until the team runs real sessions.

## Contents

| File | What it is |
|------|------------|
| `interview-guide.md` | Interview instrument, one section per role, with intro script, warm-up, core questions, probes, optional task observation, wrap-up, time budget and a blank note-taking sheet |
| `questionnaire.md` | Short questionnaire, one section per role, with a consent line and mostly closed items |
| `question-trace.md` | Key for P1 to P10 and the matrix of which questions inform which problem |
| `results-placeholder.md` | Empty tables for the team to fill from real sessions |
| check script (`check-kit.mjs`) | Checks that every question is tagged and that the matrix matches the tags |

## How to run

1. Pilot first: run each instrument once with one person per role and fix any wording that confuses them.
2. Run the interviews, one role section per interview, using the note-taking sheet at the end of the guide.
3. Hand out the questionnaire (paper copy or a free online form; copy the items from the file, no form app is built).
4. Record the real results in `results-placeholder.md`, never in the instrument files.

## Consent and anonymity

- Participation is voluntary and the participant may stop at any time. Say so before starting (the intro script and questionnaire introduction do).
- Ask permission before any audio recording. Never record faces.
- Do not collect names in the questionnaire. Use session ids in the S-01 style in notes. Keep any list that could identify people separate from the answers.
- Keep raw data and recordings outside git, or commit anonymised text only. Never commit names or recordings.
- The team checks whether the college requires ethics approval for student research. [ASSUMED: the college rule is unknown]

## Sample size guidance

Drafted, not evidence; the team decides the real numbers and records them in the results file.

- Interviews: about 3 to 5 each for Coordinators and Admins, and 5 to 8 for Students, including at least one participant from each diverse-user group the team can reach (different ages, low digital literacy, visual or motor impairment, bright-light or phone-only use, slow internet; see `src-evaluation-methods`).
- Questionnaire: about 20 to 30 responses, with Students making up most of them.
- The "5 users find most issues" rule of thumb is a heuristic and was not verified here.
- Interview length (about 30 to 40 minutes) and questionnaire length (5 to 8 minutes) are also drafted, not evidence.

## Results policy

All files in this folder are `confidence: assumed`. Real results go only in [results-placeholder.md](results-placeholder.md), are written only by the team, and only results from real sessions may be marked as evidence. Do not paste invented answers, example quotes or sample participants anywhere in this folder.
