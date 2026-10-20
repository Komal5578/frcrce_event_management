# Phase 1: Research & Modeling Kit - Research

**Researched:** 2026-10-20
**Domain:** Goal-Directed Design research instruments and proto-personas (documentation only, internal KB-driven)
**Confidence:** HIGH (every finding is read from files in this repo; no external sources needed)

No CONTEXT.md exists for this phase, so there are no locked decisions. All choices below are Claude's discretion and are recommendations.

## Summary

Phase 1 writes Markdown only. There are two outputs. The first is a research kit in `docs/research/` that a student team can run as written: an interview guide and a questionnaire, each with Coordinator, Student and Admin sections. The second is a persona template plus three proto-personas, all labelled `assumed`. `kb/domain/personas.md` (`dom-personas`) already holds a four-row proto-persona table with `confidence: assumed`. It is the seed for the persona work, not a blank slate.

The traceability requirement is the core design constraint. `dom-hmi-problems` lists ten problems as a plain numbered list with no ids. The kit must introduce stable ids P1..P10, tag every question with at least one id, and include a coverage table showing that all ten ids are hit. That table is what makes success criterion 2 mechanically checkable.

The kit may only be a blank instrument. It may not contain responses, quotes, participant counts or findings. It must carry a results placeholder saying only the team may record results, and only real sessions may be marked `evidence` (`adr-003-kb-format`, `AGENTS.md` rule 3).

**Primary recommendation:** Create 5 files in `docs/research/` (README, interview-guide, questionnaire, trace table, results placeholder) and 4 files in `docs/personas/` (template + 3 personas). Edit `kb/domain/personas.md` to point at them and carry the visible label. Add a small node check script so criteria 2-4 are checked by a command, not by eye.

## Architectural Responsibility Map

Not applicable. This phase has no app tiers (no browser, API or database work). Omitted on purpose.

## Standard Stack

No packages are installed. Only plain Markdown and the existing `node kb/tools/build-index.mjs` (Node ESM, no dependencies).

**Package Legitimacy Audit:** not required. Nothing is installed. Slopcheck, npm and pip were not run because there is nothing to verify.

**Optional check script:** use only `node:fs`, matching the style of `kb/tools/build-index.mjs`. Do not add a dependency.

## Project Constraints (from CLAUDE.md and AGENTS.md)

- Read `kb/INDEX.md` first, and cite kb ids (`dom-topic-brief`, `dom-hmi-problems`, `dom-personas`, `src-evaluation-methods`, `src-gdd-process`) in the deliverables.
- The attendance PDF and md are a method example only. Never add attendance features or attendance wording to the kit. Reword the original tasks, for example "record attendance and submit" becomes "create an event and submit".
- Honesty: confidence values are `source | derived | assumed | evidence`. Only real team research is `evidence`. Never invent research, quotes or participants. Draft the instruments and leave the results blank.
- One interface per role: sections are separate for Coordinator, Student and Admin. Organizer is a flag on a Student (`adr-002-roles`, itself `assumed`), so it is a variant inside the Student sections, not a fourth role.
- Plain-language, human wording in questions (`src-accessibility-areas`). Student-facing text should be readable by low-digital-literacy respondents.
- `AGENTS.md` ownership: `docs/` is Phase 1 owner territory, with no app code. `kb/` may be edited by any agent, but `node kb/tools/build-index.mjs` must pass afterwards.
- User git rule: do not commit. The orchestrator commits once per phase.
- No `.claude/skills` or `.agents/skills` directories exist in this repo, so there are no project skills to load. [VERIFIED: ls]
- Do not use emojis in files.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RSCH-01 | Interview guide and questionnaire for coordinators, students and admins, ready to run, instruments only | File layout, section structure, question-to-problem trace, consent, timing and probes below |
| RSCH-02 | Persona template and proto-personas, each labelled `assumed` until real research replaces them (`dom-personas`) | Existing `dom-personas` shape, new `docs/personas/` files, frontmatter, label wording below |
</phase_requirements>

## Findings from the KB

### The kb frontmatter schema and what build-index enforces [VERIFIED: kb/tools/build-index.mjs, run result "ok: 25 notes"]

- The checker walks only `kb/`. Files in `docs/` are not checked, not indexed and not in `manifest.json`.
- Required keys: `id, type, title, tags, confidence, summary`. `confidence` must be one of `source|derived|assumed|evidence`. `sources` and `updated` are required by `INDEX.md` convention but not enforced.
- The parser is line-based `key: value`. A colon inside a value is fine (`title: Topic brief: ...` exists). Every key must be on one line, because there is no multi-line YAML.
- Ids must be unique, and every id must appear somewhere in `kb/INDEX.md` as a plain substring.
- Any new `.md` under `kb/` needs frontmatter and an INDEX mention, or the check fails.
- Baseline today: `node kb/tools/build-index.mjs` prints `ok: 25 notes -> kb/manifest.json`. Running it rewrites `kb/manifest.json`, so that file will show as modified. This is expected.

### The existing personas note [VERIFIED: kb/domain/personas.md]

`dom-personas` is `type: domain`, `confidence: assumed`, with a blockquote "These are hypotheses for the team to test in real interviews." Its body is a 4-row table: Prof. Anita (Faculty Coordinator), Rohan (Student), Dr. Sharma (Event Admin / HOD), and an Organizer variant. Columns are Persona, Role, Goal, Pain point (hypothesis), Tech comfort. It says that when real data arrives, the team creates `dom-personas-evidence` (confidence: evidence) and supersedes this note.

It has a top-line `# Proto-personas — confidence: assumed` heading and a blockquote, but no explicit "assumed, pending research" label string. Success criterion 3 requires that exact visible label, so it must be added.

### Where the proto-personas go

`dom-deliverable-map` says deliverable 2 lives in `kb/domain/personas*.md` and `docs/personas/`.

**Recommendation (discretion):**
- Keep `kb/domain/personas.md` (`dom-personas`) as the one KB summary note. Edit it to add the visible label and links to `docs/personas/`. Do not create `personas-*.md` files in `kb/`. That would add three INDEX rows and three manifest entries for content that is a hypothesis.
- Put the template and the three full proto-personas in `docs/personas/`. Give each file the same frontmatter keys as kb notes, including `confidence: assumed`. A script can check those, because build-index does not look in `docs/`.
- The Organizer is a section of the Student persona ("Organizer variant"), not a fourth file, because it is a flag on a Student (`adr-002-roles`).

The tradeoff: files in `docs/` get no automatic frontmatter check from build-index. The Phase 1 check script (see Validation Architecture) closes that gap.

### The ten HMI problems and their metrics [VERIFIED: kb/domain/hmi-problems.md]

The source list has no ids. Define P1..P10 in the kit using the numbering of that list (the roadmap already refers to "#2", "#5", "#6", "#7", "#8", "#10" by number).

| Id | Problem (events) | Reqs | Metric |
|----|------------------|------|--------|
| P1 | How little interaction can creating an event take? | C1, C2 | clicks/time to submit |
| P2 | How does the interface make double-booking impossible and visible? | C2, A2, X5 | clash attempts that reach the DB |
| P3 | Can everyone see event status at a glance? | X1 | status recognition accuracy |
| P4 | Is feedback clear after register/submit/approve? | S3, C5 | users who correctly state what happened |
| P5 | Can students understand their status without tables? | S4 | task success on "Am I registered?" |
| P6 | How are clashes, low registration and overdue tasks surfaced without overwhelming? | C6, A4 | time to find the problem |
| P7 | Can errors be detected and corrected easily? | X2 | error recovery success |
| P8 | Does it work across technical levels? | X3 | success by user group |
| P9 | Are visualisations effective, not decorative? | A4 | info-finding time |
| P10 | Is vocabulary and layout consistent across roles? | X4 | heuristic score |

Some metrics (P2 DB clash attempts, P10 heuristic score) are measured on the built app in Phase 6, not by interview. Research questions for those problems establish the baseline in today's manual process. For P2: "how often does a clash or double-booking happen now, and how is it found?" For P10: "which words do you use for the same thing across roles, such as 'approved', 'confirmed', 'cleared'?" The trace table should say "baseline" for these, and the row should still count as covered.

### Role goals and pain hypotheses to probe (for question content) [VERIFIED: dom-goals-tasks, dom-personas, dom-scenarios]

- Coordinator: plan an event without clashes. Hypothesised pains: clashes found late, chasing students on WhatsApp for task status, approval paperwork. Frequent task: create an event.
- Student: find and join an event, know my status. Hypothesised pains: events announced across scattered groups, unsure whether registered, missed deadlines. Frequent tasks: register, and (organizer) mark a task done.
- Admin/HOD: approve events confidently, monitor. Hypothesised pains: approvals by paper or chat, no consolidated venue usage view. Frequent task: approve.
- Diverse-user groups the sample should try to include (`src-evaluation-methods` section B): different ages, low digital literacy, visual or motor impairment, bright-light or phone-only use, slow internet. These feed P8.

### Method example in the attendance reference [VERIFIED: kb/source/attendance-reference/original.md lines ~101-150, gdd-process, evaluation-methods]

The reference does not contain interview guides or questionnaires. It only states that stage 1 "Research" outputs are "User interviews, observations, questionnaires, existing-system study", and that stage 2 turns research into personas with a Persona / Goal / Pain Point table. So there is no instrument layout to copy. The structure below is Claude-drafted. The method example to follow is the shape (research feeds a Persona / Goal / Pain table, one interface per persona) and the evaluation framing of `src-evaluation-methods` section E (completion, time, errors, clicks, understanding, satisfaction).

## Recommended File Layout

```
docs/research/
├── README.md              # purpose, how to run, consent/anonymity, sample sizes, results policy (placeholder)
├── interview-guide.md     # Section A Coordinators, B Students, C Admins; each question tagged
├── questionnaire.md       # Section A Coordinators, B Students, C Admins; each question tagged
├── question-trace.md      # P1..P10 definitions + coverage matrix (question -> problem ids)
└── results-placeholder.md # empty results tables; only the team may fill and mark `evidence`
docs/personas/
├── persona-template.md    # blank template (fields below)
├── persona-coordinator.md # Prof. Anita, proto
├── persona-student.md     # Rohan, proto, with Organizer variant section
└── persona-admin.md       # Dr. Sharma, proto
kb/domain/personas.md      # EDIT: add visible label + links; keep id dom-personas
kb/tools/ or docs/research/check-kit.mjs   # optional, ~40 lines, see Validation Architecture
```

Optionally add a `dom-research-kit` kb note. That is not recommended. It adds an INDEX row and a manifest entry for content the INDEX route table can reach via `dom-personas` and `dom-deliverable-map`. If the planner wants a router for deliverable 1, add one row in `kb/INDEX.md` under "Who the users are" instead of a new note. Either way, `dom-deliverable-map` already points deliverable 1 at `docs/research/`.

Do not touch `kb/INDEX.md` unless a new kb id is created.

## Instrument conventions (all drafted, none evidence)

### Frontmatter for docs files

```yaml
---
id: doc-research-interview-guide
type: research-instrument
title: Interview guide
tags: [research,interview]
confidence: assumed
sources: [dom-topic-brief, dom-hmi-problems]
summary: AI-drafted instrument. Contains no responses. Results go in results-placeholder.md by the team only.
updated: 2026-10-20
---
```

Use `confidence: assumed` for instruments and personas. Instruments are a hypothesis about what to ask, not research. Use ids prefixed `doc-` so they never collide with kb ids if someone later moves them into `kb/`. If a docs file is ever moved under `kb/`, it would need an INDEX mention. Do not add `type: research-instrument` to anything under `kb/`, because the checker does not validate `type`, but use `domain` there to stay consistent.

### Every instrument starts with a banner

> AI-drafted instrument. This file contains no responses, quotes or findings. Only the team may record results, and only real sessions may be marked `evidence`.

### Question format (machine-checkable)

One question per list item, tagged at the end with `[P#]` ids so a script can count and cross-check:

```
Q-C03. Walk me through the last event you organised, from first idea to the day itself. [P1, P6]
   Probes: What took longest? Where did you wait for someone? Which tool did you use at each step?
```

Rules:
- Question id format: `Q-C##` (Coordinator), `Q-S##` (Student), `Q-A##` (Admin) in the interview guide, and `QN-C##`, `QN-S##`, `QN-A##` in the questionnaire. They must be unique.
- Every question carries at least one `[P#]` tag, where `#` is in 1..10. Tags may only reference P1..P10.
- Interview questions are open and non-leading. Ask about the past ("the last time you..."), not hypotheticals ("would you like...").
- Questionnaire items: mostly closed (5-point scale, single choice, yes/no) with at most 2 open items per section. Include a "Prefer not to say" option on demographic items.
- No question may ask about attendance, payments, email/SMS, or other non-goals (`adr-004-scope`).

### Interview guide shape (per role section)

- Intro script (read aloud): purpose, voluntary, no right answers, can stop any time, recording only with permission, anonymity.
- Warm-up (2-3 questions, role, how often they are involved in events).
- Core questions (8-10 per role) with 1-3 probes each.
- Task observation prompt (optional, "show me how you do X today"), tied to the frequent task: create an event, register, approve.
- Wrap-up: "Anything we did not ask?" and thanks.
- Timing: about 30-40 minutes per interview. Show a time budget per block. [ASSUMED: typical interview length, to be confirmed by the team]
- Note-taking sheet: blank fields for session id (S-01...), role, date, accessibility needs the participant volunteers. Blank only.

### Questionnaire shape

- Short intro with consent line. Target 5-8 minutes. [ASSUMED]
- Section per role, 10-15 items. Section B (Students) must be the largest since students are the biggest user group.
- Include optional self-reported digital comfort and accessibility-needs items (for P8), with "Prefer not to say".
- Items worded at a reading level that suits low-digital-literacy respondents.
- Delivery is the team's choice (paper or online form). Do not build a form app.

### Consent, anonymity, ethics note (in README)

- Participation is voluntary and the participant may stop at any time.
- Do not collect names in the questionnaire. Use session ids (S-01) in notes. Keep any identifiable list separate from answers.
- Ask permission before audio recording. Do not record faces.
- Store data outside the git repo, or anonymised only. Do not commit raw recordings or names.
- Where the project's college requires ethics approval for student research, the team should check. [ASSUMED: unknown college rule, flag to the team]

### Sample size guidance (drafted, not evidence) [ASSUMED]

State clearly as guidance only, not a result: about 3-5 interviews per role (Coordinators, Admins), 5-8 Student interviews including at least one participant per diverse-user group the team can reach, and 20-30 questionnaire responses with Students dominating. A common usability rule of thumb is that 5 users surface most issues, but this is a heuristic, not verified in this session. The team decides the real numbers and records them in the results file.

### Results placeholder (results-placeholder.md)

Contains only empty tables and this notice:

> RESULTS: NONE RECORDED. Only the team may fill this file from real sessions. Each real result must be marked `confidence: evidence`. If no sessions have been run, leave this file empty and say so here.

Empty tables: session log (id, role, date, method) and findings by problem (P1..P10, blank). No sample rows, no example quotes. Even obvious illustrative examples are prohibited, because they read as data.

## Persona template and proto-personas

### Template fields (docs/personas/persona-template.md)

The reference persona structure is Persona / Goal / Pain point (`original.md` stage 2). The GDD wording in `src-gdd-process` adds goals, behaviours, frustrations and technology use. Template fields:

| Field | Note |
|-------|------|
| Name, role, one-line description | proto name (reuse Anita / Rohan / Sharma from `dom-personas`) |
| Primary goal | from `dom-goals-tasks` |
| Secondary goals | from `dom-goals-tasks` |
| Frequent tasks | from `dom-goals-tasks` |
| Behaviours and tech comfort | from `dom-personas` |
| Pain points (hypotheses) | from `dom-personas` |
| Accessibility and context notes | diverse-user groups (`src-evaluation-methods` B) |
| HMI problems this persona drives | P ids from the table above |
| Research to confirm | question ids from the kit that test each hypothesis |
| Status | the visible label |

### Required label and frontmatter (each persona)

```yaml
---
id: doc-persona-coordinator
type: domain
title: Proto-persona: Prof. Anita (Faculty Coordinator)
tags: [persona,coordinator,assumed]
confidence: assumed
sources: [dom-personas, dom-goals-tasks]
summary: Provisional persona. Assumed, pending research. Not based on user data.
updated: 2026-10-20
---
```

The first body line under the H1 must be literally:

> **Assumed, pending research.** This persona is a hypothesis from the design team, not based on interviews. Replace it with evidence-based content once the team has run the research kit.

Use the exact string `assumed, pending research` (case-insensitive match) in every persona file so one grep checks the visible label. Also add the string to the top of `kb/domain/personas.md`. Persona text must not contain quotes attributed to real people, ages or statistics presented as findings. Invented demographic detail (age, hometown) is not needed and is risky: omit it. Names Anita, Rohan and Sharma already appear in `dom-personas` and `dom-scenarios`, so reuse them.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Survey delivery | A custom form app or backend | The team's own paper copy or a free online form, copying questions from `questionnaire.md` | Phase scope is documentation only (`adr-004-scope`, YAGNI) |
| Ids and index for docs | A new indexer | Existing `kb/tools/build-index.mjs` for `kb/`, and one tiny node check for `docs/` | Avoid duplicating the checker |
| Research method design | New method | The method already in `src-gdd-process` and `src-evaluation-methods` | Course-aligned |
| Persona facts | Invented demographics, stats or quotes | Only `dom-personas`, `dom-goals-tasks`, `dom-scenarios` content | Honesty rules |

## Architecture Patterns (documentation)

Data flow: `dom-topic-brief` + `dom-hmi-problems` + `dom-goals-tasks` -> questions (tagged P#) -> trace matrix -> team sessions (out of scope for AI) -> results placeholder (team fills, marks `evidence`) -> a future `dom-personas-evidence` note supersedes `dom-personas` -> Phase 2 and Phase 6 consume.

Pattern: question-to-problem trace. The matrix in `question-trace.md` lists P1..P10 as rows and each question id under the interview and questionnaire columns. The tags in the instruments are the source of truth. The matrix is derived from the tags, so state in the file that the tags win. To avoid drift, either generate the matrix with the check script or keep both and let the script compare them.

Anti-patterns:
- Do not write "sample" answers or "expected findings". Put hypotheses in the personas only, labelled `assumed`.
- Do not leave a problem covered by only one role when the problem applies to several. Aim for each P covered at least once overall, and ideally P3, P4, P7, P8 in every role.
- Do not write leading questions ("Don't you find clashes annoying?").
- Do not mix roles in one section. The Admin section should not ask students about approvals.

## Common Pitfalls

### Pitfall 1: Persona label lost in edits
**What goes wrong:** the label or `confidence: assumed` is missing from one persona or from `dom-personas`.
**How to avoid:** the check script greps for both in every persona file and in `kb/domain/personas.md`.

### Pitfall 2: Unconstrained trace tags
**What goes wrong:** a question has no `[P#]` tag, a P id is out of range, or a problem (often P2, P9, P10) is covered by no question.
**How to avoid:** check script counts tags per question and requires all of P1..P10 present. Cover P2, P9 and P10 with baseline questions (see "Some metrics" note above).

### Pitfall 3: Fabricated data creeping in
**What goes wrong:** the AI writes "example response", sample quotes or fictional participant tables.
**How to avoid:** the results file is blank by construction. Scan for suspicious patterns (see Validation Architecture) and review by hand.

### Pitfall 4: Attendance wording leaking in
**What goes wrong:** tasks copied from `src-evaluation-methods` section E ("record attendance", "attendance %", "shortage") appear in the instruments.
**How to avoid:** grep the new files for `attendance` and `shortage`. They should return zero hits except where the banner names the reference as a method example (prefer no mention at all).

### Pitfall 5: kb check broken by a stray note
**What goes wrong:** a new `.md` in `kb/` without frontmatter or an INDEX mention fails the check.
**How to avoid:** only edit `kb/domain/personas.md` (existing id) unless a new id is deliberately added to `kb/INDEX.md`. Run `node kb/tools/build-index.mjs` last.

### Pitfall 6: Scope creep into Phase 2
**What goes wrong:** the personas get scenarios, flows or requirement tables (those are `dom-goals-tasks`, `dom-scenarios`, `dom-flows`).
**How to avoid:** personas only cite those notes. They do not duplicate or rewrite them.

### Pitfall 7: Manifest churn
**What goes wrong:** build-index rewrites `kb/manifest.json`, so the diff includes a manifest change. This is expected and should be included in the phase commit, not reverted.

## Code Examples

### Check script sketch (optional, ~40 lines, node:fs only) - drafted pattern, not run

```js
// docs/research/check-kit.mjs : node docs/research/check-kit.mjs
import { readFileSync, readdirSync } from 'node:fs';
const read = (f) => readFileSync(f, 'utf8');
const errors = [];
const tag = /\[(P\d+(?:\s*,\s*P\d+)*)\]\s*$/;
const seen = new Set();
for (const f of ['docs/research/interview-guide.md', 'docs/research/questionnaire.md']) {
  for (const line of read(f).split('\n')) {
    const q = line.match(/^(?:- |\d+\. )?\**(QN?-[CSA]\d+)\b/); // question lines
    if (!q) continue;
    const t = line.match(tag);
    if (!t) { errors.push(`${f}: ${q[1]} has no [P#] tag`); continue; }
    for (const p of t[1].split(/\s*,\s*/)) {
      const n = +p.slice(1);
      if (n < 1 || n > 10) errors.push(`${f}: ${q[1]} bad tag ${p}`);
      seen.add(p);
    }
  }
}
for (let i = 1; i <= 10; i++) if (!seen.has(`P${i}`)) errors.push(`no question covers P${i}`);
for (const f of readdirSync('docs/personas').filter((x) => x.startsWith('persona-') && x !== 'persona-template.md')) {
  const s = read(`docs/personas/${f}`);
  if (!/^confidence: assumed$/m.test(s)) errors.push(`${f}: confidence not assumed`);
  if (!/assumed, pending research/i.test(s)) errors.push(`${f}: missing visible label`);
}
if (!/assumed, pending research/i.test(read('kb/domain/personas.md'))) errors.push('dom-personas missing label');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('ok: kit checks passed');
```

Adjust the question-line regex to match whatever format the plan fixes. The sketch assumes a question line starts with its id.

## State of the Art

Not applicable. The method is the course's GDD process (`src-gdd-process`), not a fast-moving library.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Interview length 30-40 min and questionnaire 5-8 min are suitable | Instrument conventions | Low; the team can adjust |
| A2 | Sample sizes of 3-5 / 5-8 interviews and 20-30 questionnaire responses | Instrument conventions | Low-medium; the course may specify a minimum, the team should confirm |
| A3 | The college may require ethics or consent approval for student research | Consent note | Low; the team checks locally |
| A4 | `docs/personas/` plus an edited `dom-personas` is preferred over new `kb/domain/personas-*.md` notes | Persona location | Low; both satisfy `dom-deliverable-map`. If the user wants kb-indexed personas, switch to three kb notes and add INDEX rows |
| A5 | Organizer should be a section in the Student persona, not a fourth file | Persona location | Low; `adr-002-roles` is itself `assumed` |
| A6 | The "5 users find most issues" heuristic | Sample size | Low; stated as a heuristic only |

## Open Questions (RESOLVED)

1. **Where should the persona files live: `docs/personas/` or `kb/domain/personas-*.md`?**
   - What we know: `dom-deliverable-map` allows both.
   - Recommendation: `docs/personas/` for the full personas plus the edited `dom-personas` summary, as in A4.
   - RESOLVED: adopted as D-01 in plan 01-02 (`docs/personas/` plus an edit to `kb/domain/personas.md`).
2. **Does the course specify a minimum number of interviews or respondents?**
   - What we know: nothing in the KB says so.
   - Recommendation: keep sample sizes as team-decided guidance (A2).
   - RESOLVED: plan 01-01 writes sample sizes as drafted-not-evidence guidance for the team to set (D-03).
3. **Is the Organizer variant a persona or a flag?**
   - What we know: `adr-002-roles` says a flag; `dom-personas` lists it as a variant.
   - Recommendation: variant section inside the Student persona.
   - RESOLVED: plan 01-02 adds an Organizer variant section inside `persona-student.md`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `kb/tools/build-index.mjs`, optional check script | yes (build-index ran) | not recorded | none needed |
| git | repo | yes | n/a | n/a |

No external services. Missing dependencies: none.

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`. No test framework exists or is needed. Checks are shell and node commands. Create `docs/research/check-kit.mjs` (sketch above) in Wave 0 or as the last task so the commands below are runnable. Everything else is `grep`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none (node script + grep) |
| Config file | none |
| Quick run command | `node docs/research/check-kit.mjs` |
| Full suite command | `node docs/research/check-kit.mjs && node kb/tools/build-index.mjs` |

### Phase Requirements -> Test Map
| Req / criterion | Behavior | Test type | Automated command | File exists? |
|-----------------|----------|-----------|-------------------|--------------|
| RSCH-01 / SC1 | Interview guide and questionnaire exist, each with Coordinator, Student, Admin sections | smoke | `for f in interview-guide questionnaire; do for r in Coordinator Student Admin; do grep -q "^## .*$r" docs/research/$f.md \|\| echo "MISSING $f $r"; done; done` (empty output = pass) | Wave 0 |
| SC1 | Instruments are runnable (intro script, consent line, timing, probes) | smoke | `grep -c -i "consent\|voluntary" docs/research/*.md` and `grep -c "Probes:" docs/research/interview-guide.md` (non-zero) | Wave 0 |
| RSCH-01 / SC2 | Every question has a valid `[P1..P10]` tag | script | `node docs/research/check-kit.mjs` (fails on an untagged question or a tag out of range) | Wave 0 |
| SC2 | All ten HMI problems are covered at least once | script | same script (fails on "no question covers Pn") | Wave 0 |
| SC2 | Trace table lists all ten ids | grep | `for i in 1 2 3 4 5 6 7 8 9 10; do grep -q "P$i\b" docs/research/question-trace.md \|\| echo "MISSING P$i"; done` | Wave 0 |
| RSCH-02 / SC3 | Template and three personas exist | smoke | `ls docs/personas/persona-template.md docs/personas/persona-{coordinator,student,admin}.md` | Wave 0 |
| SC3 | Each persona has `confidence: assumed` in frontmatter | grep | `grep -L "^confidence: assumed$" docs/personas/persona-*.md` (excluding the template if it is a template; empty output = pass) | Wave 0 |
| SC3 | Each persona and `dom-personas` show the visible label | grep | `grep -Li "assumed, pending research" docs/personas/persona-*.md kb/domain/personas.md` (empty = pass) | Wave 0 |
| SC4 | No response data, quotes or findings | grep + review | `grep -rniE "participant [0-9]|respondent [0-9]|P[0-9]+ said|[Qq]uote:|findings?:|n ?= ?[0-9]+|[0-9]+ ?%" docs/research docs/personas` should return nothing outside the banner and placeholder wording; then a human reads `results-placeholder.md` to confirm it is empty | Wave 0 |
| SC4 | Placeholder states only the team may record results as `evidence` | grep | `grep -q "evidence" docs/research/results-placeholder.md && grep -qi "only the team" docs/research/results-placeholder.md` | Wave 0 |
| SC4 | No attendance features | grep | `grep -rniE "attendance|shortage" docs/research docs/personas` returns nothing | Wave 0 |
| SC4 | kb check passes | script | `node kb/tools/build-index.mjs` (exit 0; prints `ok: 25 notes ...`, or 26 if a note was added) | exists |
| honesty | No file under `docs/` claims `confidence: evidence` or `source` | grep | `grep -rlE "^confidence: (evidence|source)$" docs/` returns nothing | Wave 0 |

The `[0-9]+ ?%` pattern could flag legitimate text such as "100% anonymous". Adjust the pattern or review hits by hand. The regex check is a tripwire, not a proof, so human review of the persona and placeholder files is still required (manual-only: "reads like invented data" cannot be machine-judged).

### Sampling Rate
- **Per task commit:** `node docs/research/check-kit.mjs` once it exists, otherwise the relevant grep.
- **Per wave merge:** full suite command above.
- **Phase gate:** full suite green plus `node kb/tools/build-index.mjs`, before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `docs/research/check-kit.mjs` - covers SC2 coverage and SC3 label checks
- [ ] The kit and persona files themselves (all checks depend on them)
- Framework install: none

## Security Domain

`security_enforcement` is not set in config (treated as enabled), but this phase has no code, auth, input handling or network. The ASVS categories do not apply. The one relevant concern is privacy of research data:

| Concern | Standard control |
|---------|------------------|
| Participant privacy in future sessions | Anonymous session ids, no names in questionnaires, raw data kept out of git, consent script in the README |
| Secrets | none in this phase |

## Sources

### Primary (HIGH confidence, repo files read in this session)
- `kb/tools/build-index.mjs`, `kb/INDEX.md` - frontmatter schema and index rules; the checker was run (ok: 25 notes)
- `kb/domain/{topic-brief,hmi-problems,personas,goals-tasks,scenarios,requirements,status-vocabulary,deliverable-map}.md`
- `kb/decisions/{adr-002-roles,adr-003-kb-format}.md`
- `kb/source/attendance-reference/{gdd-process,hmi-problems-pattern,deliverables-13,evaluation-methods,universal-design}.md` and `original.md` (stage 1-2 text)
- `.planning/{ROADMAP,REQUIREMENTS,STATE,PROJECT,config}.json|md`, `CLAUDE.md`, `AGENTS.md`

### Secondary / Tertiary
- None. No web research was done, by design.

## Metadata

**Confidence breakdown:**
- File paths, schema, checker behaviour: HIGH, read directly and run
- Persona location choice: MEDIUM, a discretionary recommendation (A4)
- Sample sizes, timing, ethics: LOW, general practice from training knowledge, tagged `[ASSUMED]`
- Check script: MEDIUM, a sketch that was not executed; the plan must run it once

**Research date:** 2026-10-20
**Valid until:** stable; revisit only if `kb/tools/build-index.mjs` or the ten-problems list changes
